import mongoose from "mongoose";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000/api";

const results = [];
function recordResult(testName, passed, details = "") {
  results.push({ testName, passed, details });
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${testName} ${details ? `(${details})` : ""}`);
}

async function runComprehensiveAudit() {
  console.log("\n=======================================================");
  console.log("   🌾 RYTHU SETHU COMPREHENSIVE WORKFLOW AUDIT 🌾   ");
  console.log("=======================================================\n");

  let farmerToken = "";
  let farmerId = "";
  let customerToken = "";
  let customerId = "";
  let adminToken = "";
  let createdCropId = "";
  let createdOrderId = "";

  // ── 1. AUTHENTICATION & ROLES AUDIT ──
  console.log("\n--- 1. Testing Authentication & User Logins ---");
  try {
    // 1.1 Farmer Login (ram)
    const resFarmer = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "ram", password: "password123" })
    });
    const dataFarmer = await resFarmer.json();
    if (resFarmer.status === 200 && dataFarmer.token) {
      farmerToken = dataFarmer.token;
      farmerId = dataFarmer.user?._id;
      recordResult("Farmer Login ('ram')", true, `Role: ${dataFarmer.user?.role}`);
    } else {
      recordResult("Farmer Login ('ram')", false, `Status ${resFarmer.status}: ${dataFarmer.error || "No token"}`);
    }

    // 1.2 Customer Login (raj)
    const resCustomer = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "raj", password: "password123" })
    });
    const dataCustomer = await resCustomer.json();
    if (resCustomer.status === 200 && dataCustomer.token) {
      customerToken = dataCustomer.token;
      customerId = dataCustomer.user?._id;
      recordResult("Customer Login ('raj')", true, `Role: ${dataCustomer.user?.role}`);
    } else {
      recordResult("Customer Login ('raj')", false, `Status ${resCustomer.status}: ${dataCustomer.error || "No token"}`);
    }

    // 1.3 Admin Login (admin)
    const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "admin", password: "password123" })
    });
    const dataAdmin = await resAdmin.json();
    if (resAdmin.status === 200 && dataAdmin.token) {
      adminToken = dataAdmin.token;
      recordResult("Admin Login ('admin')", true, `Role: ${dataAdmin.user?.role}`);
    } else {
      recordResult("Admin Login ('admin')", false, `Status ${resAdmin.status}: ${dataAdmin.error || "No token"}`);
    }
  } catch (err) {
    recordResult("Authentication Suite", false, err.message);
  }

  // ── 2. FARMER WORKFLOW AUDIT ──
  console.log("\n--- 2. Testing Farmer Listing & Inventory ---");
  try {
    // 2.1 Fetch Farmer Profile
    if (farmerToken) {
      const resProf = await fetch(`${BASE_URL}/farmers/profile`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      recordResult("Farmer Profile Fetch", resProf.status === 200, `Status ${resProf.status}`);
    }

    // 2.2 Add New Crop Listing
    if (farmerToken) {
      const resAddCrop = await fetch(`${BASE_URL}/crops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${farmerToken}`
        },
        body: JSON.stringify({
          name: "Organic Red Hybrid Onions",
          category: "vegetable",
          price: 38,
          quantity: 250,
          unit: "kg",
          location: "Hyderabad Rural Hub",
          latitude: 17.3850,
          longitude: 78.4867,
          isOrganic: true,
          isPesticideFree: true,
          description: "Freshly harvested organic red onions directly from farm"
        })
      });
      const dataCrop = await resAddCrop.json();
      if (resAddCrop.status === 201 || resAddCrop.status === 200) {
        createdCropId = dataCrop._id || dataCrop.crop?._id;
        recordResult("Farmer Add Crop Listing", true, `Crop ID: ${createdCropId}`);
      } else {
        recordResult("Farmer Add Crop Listing", false, `Status ${resAddCrop.status}: ${dataCrop.error}`);
      }
    }

    // 2.3 Fetch Farmer Crops
    if (farmerToken) {
      const resMyCrops = await fetch(`${BASE_URL}/crops/farmer/my-crops`, {
        headers: { Authorization: `Bearer ${farmerToken}` }
      });
      const dataMyCrops = await resMyCrops.json();
      recordResult("Fetch Farmer My-Crops", resMyCrops.status === 200, `Count: ${Array.isArray(dataMyCrops) ? dataMyCrops.length : 0}`);
    }
  } catch (err) {
    recordResult("Farmer Listing Suite", false, err.message);
  }

  // ── 3. MARKETPLACE & AI SERVICES AUDIT ──
  console.log("\n--- 3. Testing Marketplace & AI Intelligence ---");
  try {
    // 3.1 Public Marketplace Crops Listing
    const resMarket = await fetch(`${BASE_URL}/crops`);
    const dataMarket = await resMarket.json();
    recordResult("Marketplace Public Catalog", resMarket.status === 200, `Available listings: ${Array.isArray(dataMarket) ? dataMarket.length : 0}`);

    // 3.2 AI Shopping List Parser
    const resListParser = await fetch(`${BASE_URL}/ai/parse-shopping-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rawInput: "5kg rice, 2kg onions, 1kg tomatoes, 500g ginger",
        filters: { organicOnly: false, farmerPreference: "best_price" }
      })
    });
    const dataParser = await resListParser.json();
    recordResult("AI Shopping List Parser", resListParser.status === 200 && dataParser.matchedCount > 0, `Matched: ${dataParser.matchedCount} crops, Total: ₹${dataParser.estimatedTotal}`);

    // 3.3 AI Bulk Event Catering Estimator
    const resCatering = await fetch(`${BASE_URL}/ai/event-catering-estimator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "wedding",
        guestCount: 200,
        mealType: "south_indian_thali"
      })
    });
    const dataCatering = await resCatering.json();
    recordResult("AI Event Catering Estimator", resCatering.status === 200 && dataCatering.ingredientsCount > 0, `Guests: ${dataCatering.guests}, Cost/Guest: ₹${dataCatering.costPerGuest}, Savings: ₹${dataCatering.totalSavings}`);
  } catch (err) {
    recordResult("Marketplace & AI Suite", false, err.message);
  }

  // ── 4. CUSTOMER CART & CHECKOUT AUDIT ──
  console.log("\n--- 4. Testing Multi-Crop Checkout & Orders ---");
  try {
    if (customerToken && customerId && createdCropId) {
      // 4.1 Multi-item checkout
      const resCheckout = await fetch(`${BASE_URL}/orders/checkout-multi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          items: [{
            cropId: createdCropId,
            quantity: 5,
            subtotal: 190,
            deliveryCharges: 35,
            totalAmount: 225,
            deliveryAddress: "H.No 4-21, Madhapur, Hyderabad",
            deliveryDistance: 8
          }],
          customer: customerId,
          paymentMode: "cod"
        })
      });
      const dataCheckout = await resCheckout.json();
      if (resCheckout.status === 200 || resCheckout.status === 201) {
        const order = dataCheckout.orders?.[0] || dataCheckout.order;
        createdOrderId = order?._id;
        recordResult("Customer Multi-Item Checkout (COD)", true, `Order ID: ${createdOrderId}, Total: ₹${order?.totalAmount}`);
      } else {
        recordResult("Customer Multi-Item Checkout (COD)", false, `Status ${resCheckout.status}: ${dataCheckout.error}`);
      }
    }

    // 4.2 Fetch Customer Orders
    if (customerToken) {
      const resCustOrders = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const dataCustOrders = await resCustOrders.json();
      recordResult("Fetch Customer Orders", resCustOrders.status === 200, `Orders Count: ${Array.isArray(dataCustOrders) ? dataCustOrders.length : 0}`);
    }
  } catch (err) {
    recordResult("Checkout & Orders Suite", false, err.message);
  }

  // ── 5. PAYMENT GATEWAY & UPI VERIFICATION ──
  console.log("\n--- 5. Testing Payment Gateways & Merchant UPI ---");
  try {
    // 5.1 Razorpay & Merchant UPI Config Endpoint
    const resPayConfig = await fetch(`${BASE_URL}/payment/razorpay/config`);
    const dataPayConfig = await resPayConfig.json();
    recordResult("Payment Gateway Config", resPayConfig.status === 200 && !!dataPayConfig.merchantUpiId, `UPI ID: ${dataPayConfig.merchantUpiId}, Key: ${dataPayConfig.key_id}`);

    // 5.2 Manual UPI Confirmation Endpoint
    const resUpiConfirm = await fetch(`${BASE_URL}/payment/upi/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utr: "UTR-TEST-998877", amount: 225 })
    });
    const dataUpiConfirm = await resUpiConfirm.json();
    recordResult("UPI Manual Confirmation / UTR Verification", resUpiConfirm.status === 200 && dataUpiConfirm.success, `Message: ${dataUpiConfirm.message}`);
  } catch (err) {
    recordResult("Payment Suite", false, err.message);
  }

  // ── 6. ADMIN DATA CENTER & USER INSPECTOR ──
  console.log("\n--- 6. Testing Admin User Inspector & Moderation ---");
  try {
    if (adminToken) {
      // 6.1 Admin Full Users & MongoDB Inspection
      const resAdminUsers = await fetch(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataAdminUsers = await resAdminUsers.json();
      recordResult("Admin MongoDB Users Data Center", resAdminUsers.status === 200 && Array.isArray(dataAdminUsers), `Total Enriched Users: ${dataAdminUsers?.length}`);

      // 6.2 Admin Crops Catalog Moderation
      const resAdminCrops = await fetch(`${BASE_URL}/admin/crops`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const dataAdminCrops = await resAdminCrops.json();
      recordResult("Admin Crops Catalog & Moderation", resAdminCrops.status === 200 && Array.isArray(dataAdminCrops), `Total Moderated Crops: ${dataAdminCrops?.length}`);
    }
  } catch (err) {
    recordResult("Admin Suite", false, err.message);
  }

  // ── AUDIT SUMMARY ──
  console.log("\n=======================================================");
  console.log("                AUDIT SUMMARY RESULTS                  ");
  console.log("=======================================================");
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  if (failed === 0) {
    console.log("🎉 ALL WORKFLOWS, CONNECTIONS, AND APIS ARE 100% OPERATIONAL! 🎉\n");
  } else {
    console.log(`⚠️ ${failed} tests reported issues. Please review detailed logs above.\n`);
  }
}

runComprehensiveAudit();
