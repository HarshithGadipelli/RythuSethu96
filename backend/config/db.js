import mongoose from "mongoose";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to start local MongoDB Windows Service if stopped
const tryStartLocalMongoService = () => {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      return resolve(false);
    }
    console.log("⚡ Attempting to automatically start Windows MongoDB Service...");
    exec("net start MongoDB", (err, stdout, stderr) => {
      if (err) {
        // Try fallback sc start
        exec("sc start MongoDB", (scErr, scStdout) => {
          if (scErr) {
            console.warn("⚠️ Could not automatically start MongoDB service. (Requires admin or not installed as service).");
            return resolve(false);
          }
          console.log("🟢 MongoDB Windows Service started via sc.");
          return resolve(true);
        });
        return;
      }
      console.log("🟢 MongoDB Windows Service started successfully.");
      resolve(true);
    });
  });
};

// Helper to convert stringified ObjectIds and Dates back to proper BSON types for seeding
const restoreBsonTypes = (obj) => {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string" && /^[0-9a-fA-F]{24}$/.test(obj)) {
      return new mongoose.Types.ObjectId(obj);
    }
    if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(restoreBsonTypes);
  }

  const restored = {};
  for (const key of Object.keys(obj)) {
    restored[key] = restoreBsonTypes(obj[key]);
  }
  return restored;
};

// Automatically seed database if empty
export const autoSeedIfEmpty = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    const collections = await db.listCollections().toArray();
    let totalDocs = 0;
    const userCol = collections.find((c) => c.name === "users");
    if (userCol) {
      totalDocs = await db.collection("users").countDocuments();
    }

    if (totalDocs === 0) {
      const seedFile = path.join(__dirname, "../data/seed_data.json");
      if (fs.existsSync(seedFile)) {
        console.log("🌱 Database is empty. Auto-seeding initial data from seed_data.json...");
        const fileContent = fs.readFileSync(seedFile, "utf-8");
        const exportData = JSON.parse(fileContent);

        for (const [colName, data] of Object.entries(exportData)) {
          if (Array.isArray(data) && data.length > 0) {
            const restored = restoreBsonTypes(data);
            await db.collection(colName).insertMany(restored);
            console.log(`   ↳ Seeded ${restored.length} records into '${colName}'`);
          }
        }
        console.log("✅ Auto-seeding completed successfully!");
      }
    }
  } catch (seedErr) {
    console.warn("⚠️ Auto-seeding notice:", seedErr.message);
  }
};

let isConnected = false;

const connectDB = async (retries = 5, delay = 2000) => {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/rythu_sethu";

  const isLocal =
    mongoUri.includes("localhost") ||
    mongoUri.includes("127.0.0.1") ||
    mongoUri.includes("::1");

  mongoose.connection.on("connected", () => {
    isConnected = true;
  });

  mongoose.connection.on("error", (err) => {
    console.error("🔴 MongoDB Connection Error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("⚠️ MongoDB Disconnected. Will attempt to reconnect when available...");
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Connecting to MongoDB (Attempt ${attempt}/${retries})...`);
      await mongoose.connect(mongoUri, {
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 50
      });

      console.log(`🟢 MongoDB Connected Successfully: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);
      isConnected = true;

      // Check if DB needs auto-seeding
      await autoSeedIfEmpty();
      return mongoose.connection;
    } catch (error) {
      console.warn(`⚠️ Connection attempt ${attempt} failed: ${error.message}`);

      // If local connection failed on first attempt, try auto-starting Windows service
      if (attempt === 1 && isLocal) {
        const started = await tryStartLocalMongoService();
        if (started) {
          await new Promise((r) => setTimeout(r, 1500)); // Wait for daemon to ready
        }
      }

      if (attempt === retries) {
        console.error("❌ Could not connect to MongoDB after multiple attempts.");
        console.info(`
💡 TIP: If you do not have MongoDB running locally, you can:
   1. Add your MongoDB Atlas Cloud URI in backend/.env:
      MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rythu_sethu?retryWrites=true&w=majority
   2. Or start the MongoDB service manually:
      net start MongoDB
        `);
        // We do NOT call process.exit(1) here so the server can remain online and retry in background
        scheduleBackgroundReconnect(mongoUri);
        return null;
      }

      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

const scheduleBackgroundReconnect = (uri) => {
  const timer = setInterval(async () => {
    if (isConnected) {
      clearInterval(timer);
      return;
    }
    try {
      console.log("🔄 Background reconnecting to MongoDB...");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log("🟢 MongoDB Reconnected Successfully!");
      isConnected = true;
      await autoSeedIfEmpty();
      clearInterval(timer);
    } catch (e) {
      // Keep background retry silent
    }
  }, 10000);
};

export default connectDB;
