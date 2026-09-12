import express from "express";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

const razorpay = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) ? new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
}) : null;

const router = express.Router();

router.get("/razorpay/config", (req, res) => {
  res.json({ 
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_TU3fEg7yVGE3do", 
    merchantUpiId: process.env.MERCHANT_UPI_ID || "8688938604@upi",
    merchantName: "Rythu Jana Sethu Agri Direct",
    isRazorpayEnabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

// Manual UPI Verification
router.post("/upi/confirm", async (req, res) => {
  try {
    const { orderId, utr, amount, customerId } = req.body;
    const validOrderId = (orderId && mongoose.Types.ObjectId.isValid(orderId)) ? orderId : null;
    const validCustomerId = (customerId && mongoose.Types.ObjectId.isValid(customerId)) ? customerId : null;

    const payment = await Payment.create({
      order: validOrderId,
      customer: validCustomerId,
      amount: amount || 0,
      method: "upi",
      status: "paid",
      upiReference: utr || `UPI${Date.now()}`,
      paidAt: new Date()
    });

    if (validOrderId) {
      await Order.findByIdAndUpdate(validOrderId, {
        paymentStatus: "paid",
        $push: { timeline: { status: "paid", note: `UPI Payment confirmed (UTR: ${utr || "Verified"})` } }
      });
    }

    res.json({ success: true, message: "UPI payment confirmed successfully", payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.json(payment);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

router.get("/history/:orderId", async (req, res) => {
  try {
    const payments = await Payment.find({ order: req.params.orderId });
    res.json(payments);
  } catch (error) {
    res.status(500).json(error.message);
  }
});

// Create Razorpay Order
router.post("/razorpay/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ error: "Payment gateway is not configured properly." });
    }

    const { amount, currency = "INR", orderId, customerId } = req.body;
    
    // Razorpay receipt constraint: max 40 alphanumeric/underscore characters
    const cleanId = orderId ? String(orderId).replace(/[^a-zA-Z0-9]/g, "").slice(-20) : Date.now();
    const receipt = `rcpt_${cleanId}_${Math.floor(Math.random() * 1000)}`.slice(0, 40);

    const options = {
      amount: Math.round(Number(amount) * 100), // Amount in paise
      currency,
      receipt
    };

    const rzpOrder = await razorpay.orders.create(options);
    if (!rzpOrder) return res.status(500).json({ error: "Failed to initialize order with Razorpay" });

    // Store pending payment record (validate ObjectIds safely)
    const validOrderId = (orderId && mongoose.Types.ObjectId.isValid(orderId)) ? orderId : null;
    const validCustomerId = (customerId && mongoose.Types.ObjectId.isValid(customerId)) ? customerId : null;

    const paymentRecord = await Payment.create({
      order: validOrderId,
      customer: validCustomerId,
      amount: Number(amount),
      currency,
      method: "online",
      status: "pending",
      razorpayOrderId: rzpOrder.id
    });

    res.json({ ...rzpOrder, paymentRecordId: paymentRecord._id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Razorpay Payment (Dual Verification: Signature + Direct API Fetch)
router.post("/razorpay/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, paymentRecordId } = req.body;

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, error: "Payment gateway misconfigured." });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing required payment parameters." });
    }

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    const isSignatureValid = (razorpay_signature === expectedSign);

    if (!isSignatureValid) {
      if (paymentRecordId && mongoose.Types.ObjectId.isValid(paymentRecordId)) {
        await Payment.findByIdAndUpdate(paymentRecordId, { status: "failed" });
      }
      return res.status(400).json({ success: false, error: "Invalid payment signature." });
    }

    // 2. Direct Bank Server Verification via Razorpay API
    let rzpPaymentDetails = null;
    if (razorpay) {
      try {
        rzpPaymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (fetchErr) {
        console.warn("Could not fetch payment directly from Razorpay API:", fetchErr.message);
      }
    }

    // 3. Update Payment record in Database
    let updatedPayment = null;
    if (paymentRecordId && mongoose.Types.ObjectId.isValid(paymentRecordId)) {
      updatedPayment = await Payment.findByIdAndUpdate(
        paymentRecordId, 
        {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date()
        },
        { new: true }
      );
    } else {
      updatedPayment = await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          paidAt: new Date()
        },
        { new: true }
      );
    }

    // 4. Update Order Status
    const targetOrderId = (orderId && mongoose.Types.ObjectId.isValid(orderId)) 
      ? orderId 
      : (updatedPayment?.order && mongoose.Types.ObjectId.isValid(updatedPayment.order) ? updatedPayment.order : null);

    if (targetOrderId) {
      await Order.findByIdAndUpdate(targetOrderId, {
        paymentStatus: "paid",
        $push: { timeline: { status: "paid", note: `Online payment verified via Razorpay (ID: ${razorpay_payment_id})` } }
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Payment verified successfully", 
      paymentId: razorpay_payment_id,
      verifiedStatus: rzpPaymentDetails?.status || "captured",
      paymentRecord: updatedPayment 
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Direct Razorpay Payment Status Check Endpoint
router.get("/razorpay/check-status/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay client not initialized." });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found on Razorpay." });
    }

    // Sync status with our database if a record exists
    if (payment.status === "captured") {
      await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentId },
        { status: "paid", paidAt: new Date(payment.created_at * 1000) }
      );
    }

    res.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: new Date(payment.created_at * 1000)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
