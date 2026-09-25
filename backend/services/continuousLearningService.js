import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import MLTrainingLog from "../models/MLTrainingLog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurable threshold triggers
const RETRAIN_CONFIG = {
  ORDER_THRESHOLD: parseInt(process.env.ML_RETRAIN_ORDER_THRESHOLD || "5", 10),
  CROP_THRESHOLD: parseInt(process.env.ML_RETRAIN_CROP_THRESHOLD || "3", 10),
  SEARCH_THRESHOLD: parseInt(process.env.ML_RETRAIN_SEARCH_THRESHOLD || "25", 10),
  FASTAPI_URL: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"
};

// In-memory telemetry state
let learningState = {
  ordersAccumulated: 0,
  cropsAccumulated: 0,
  searchesAccumulated: 0,
  totalEventsProcessed: 0,
  isRetraining: false,
  lastRetrainTimestamp: null,
  lastMetrics: null
};

/**
 * Executes ML model retraining either via FastAPI or direct Python subprocess fallback
 */
export async function executeRetrainingPipeline(triggerReason = "manual_admin", io = null) {
  if (learningState.isRetraining) {
    console.log("[Continuous ML] Retraining is already executing. Skipping redundant trigger.");
    return { status: "already_running" };
  }

  learningState.isRetraining = true;
  const startTime = Date.now();
  console.log(`[Continuous ML] Initiating model retraining pipeline (Trigger: ${triggerReason})...`);

  if (io) {
    io.emit("ml_retrain_progress", {
      stage: "Compiling fresh marketplace ground-truth from MongoDB...",
      progress: 15,
      triggerReason
    });
  }

  let trainingResult = null;
  let logEntry = null;

  try {
    logEntry = await MLTrainingLog.create({
      triggerReason,
      status: "initiated"
    });
  } catch (dbErr) {
    console.warn("[Continuous ML] Failed to create initial MLTrainingLog:", dbErr.message);
  }

  try {
    // 1. Attempt FastAPI Microservice Retraining First
    console.log(`[Continuous ML] Querying FastAPI at ${RETRAIN_CONFIG.FASTAPI_URL}/train/ensemble...`);
    const response = await fetch(`${RETRAIN_CONFIG.FASTAPI_URL}/train/ensemble`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_rows: 30000,
        trigger_source: triggerReason,
        mongo_uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rythu_sethu"
      }),
      signal: AbortSignal.timeout(60000) // 60s timeout for heavy training
    });

    if (response.ok) {
      trainingResult = await response.json();
      console.log("[Continuous ML] FastAPI completed retraining successfully.");
    } else {
      throw new Error(`FastAPI returned HTTP ${response.status}: ${await response.text()}`);
    }
  } catch (fastApiErr) {
    console.warn(`[Continuous ML] FastAPI retraining unavailable (${fastApiErr.message}). Spawning standalone Python pipeline fallback...`);

    if (io) {
      io.emit("ml_retrain_progress", {
        stage: "Executing local Python Scikit-Learn/XGBoost training pipeline...",
        progress: 40,
        triggerReason
      });
    }

    // 2. Fallback: Direct Subprocess Invocation of retrain_service.py
    trainingResult = await new Promise((resolve, reject) => {
      const scriptPath = path.resolve(__dirname, "../../ml_models/training/retrain_service.py");
      const pythonProcess = spawn("python", [scriptPath], {
        cwd: path.resolve(__dirname, "../../ml_models")
      });

      let stdoutData = "";
      let stderrData = "";

      pythonProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          console.log("[Continuous ML] Subprocess retraining completed successfully.");
          resolve({
            success: true,
            method: "python_subprocess_fallback",
            output: stdoutData
          });
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderrData}`));
        }
      });
    });
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  learningState.isRetraining = false;
  learningState.lastRetrainTimestamp = new Date().toISOString();
  learningState.lastMetrics = trainingResult;

  // Reset event counters
  learningState.ordersAccumulated = 0;
  learningState.cropsAccumulated = 0;
  learningState.searchesAccumulated = 0;

  // Update audit log
  if (logEntry) {
    try {
      await MLTrainingLog.findByIdAndUpdate(logEntry._id, {
        status: "completed",
        durationSeconds: durationSec,
        modelMetrics: trainingResult?.models || trainingResult
      });
    } catch (e) {
      console.error("[Continuous ML] Error updating MLTrainingLog:", e.message);
    }
  }

  if (io) {
    io.emit("ml_retrain_progress", {
      stage: "All 4 models successfully updated with live MongoDB marketplace transactions!",
      progress: 100,
      triggerReason
    });

    io.emit("ml_retrain_complete", {
      success: true,
      triggerReason,
      durationSeconds: durationSec,
      timestamp: learningState.lastRetrainTimestamp,
      metrics: trainingResult
    });
  }

  console.log(`[Continuous ML] Retraining pipeline finalized in ${durationSec}s.`);
  return trainingResult;
}

/**
 * Checks whether accumulated real events exceed continuous learning thresholds
 */
function evaluateContinuousLearningThreshold(io = null) {
  if (learningState.isRetraining) return;

  let shouldTrigger = false;
  let triggerReason = "";

  if (learningState.ordersAccumulated >= RETRAIN_CONFIG.ORDER_THRESHOLD) {
    shouldTrigger = true;
    triggerReason = "auto_order_threshold";
  } else if (learningState.cropsAccumulated >= RETRAIN_CONFIG.CROP_THRESHOLD) {
    shouldTrigger = true;
    triggerReason = "auto_crop_threshold";
  } else if (learningState.searchesAccumulated >= RETRAIN_CONFIG.SEARCH_THRESHOLD) {
    shouldTrigger = true;
    triggerReason = "auto_search_threshold";
  }

  if (shouldTrigger) {
    console.log(`[Continuous ML] Threshold reached (${triggerReason}): Orders=${learningState.ordersAccumulated}, Crops=${learningState.cropsAccumulated}, Searches=${learningState.searchesAccumulated}`);
    // Execute non-blocking in background
    setTimeout(() => {
      executeRetrainingPipeline(triggerReason, io).catch((err) => {
        console.error("[Continuous ML] Auto-retraining error:", err);
      });
    }, 500);
  }
}

/**
 * Hook: Ingest upcoming real order event
 */
export function recordOrderEvent(order, io = null) {
  learningState.ordersAccumulated += 1;
  learningState.totalEventsProcessed += 1;
  console.log(`[Continuous ML] New order event logged. Accumulated orders: ${learningState.ordersAccumulated}/${RETRAIN_CONFIG.ORDER_THRESHOLD}`);
  evaluateContinuousLearningThreshold(io);
}

/**
 * Hook: Ingest upcoming real crop listing event
 */
export function recordCropEvent(crop, io = null) {
  learningState.cropsAccumulated += 1;
  learningState.totalEventsProcessed += 1;
  console.log(`[Continuous ML] New crop event logged. Accumulated crops: ${learningState.cropsAccumulated}/${RETRAIN_CONFIG.CROP_THRESHOLD}`);
  evaluateContinuousLearningThreshold(io);
}

/**
 * Hook: Ingest upcoming real search inquiry event
 */
export function recordSearchEvent(search, io = null) {
  learningState.searchesAccumulated += 1;
  learningState.totalEventsProcessed += 1;
  evaluateContinuousLearningThreshold(io);
}

/**
 * Status query for Admin Dashboard & API inspection
 */
export async function getContinuousLearningStatus() {
  let recentAuditLogs = [];
  try {
    recentAuditLogs = await MLTrainingLog.find().sort({ createdAt: -1 }).limit(5).lean();
  } catch (e) {}

  return {
    config: RETRAIN_CONFIG,
    state: { ...learningState },
    recentAuditLogs
  };
}
