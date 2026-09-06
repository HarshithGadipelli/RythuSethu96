import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function testSoilTestingWorkflow() {
  console.log("==================================================");
  console.log("🧪 TESTING SOIL TESTING & LAB DISPATCH WORKFLOW");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  // 1. Test Login as Farmer & Admin
  let farmerToken = "";
  let farmerId = "";
  let adminToken = "";
  try {
    const fRes = await axios.post(`${BASE_URL}/auth/login`, { email: "ram@test.com", password: "password123" });
    farmerToken = fRes.data.token;
    farmerId = fRes.data.user._id;
    console.log("✅ 1. Farmer Login Successful (Ram Sharma)");
    passed++;
  } catch (e) {
    console.error("❌ 1. Farmer Login Failed:", e.message);
    failed++;
  }

  try {
    const aRes = await axios.post(`${BASE_URL}/auth/login`, { email: "admin@test.com", password: "password123" });
    adminToken = aRes.data.token;
    console.log("✅ 2. Admin Login Successful");
    passed++;
  } catch (e) {
    console.error("❌ 2. Admin Login Failed:", e.message);
    failed++;
  }

  // 2. Test AI Photo Scan Endpoint
  let scanAnalysis = null;
  try {
    const scanRes = await axios.post(`${BASE_URL}/soil-test/scan-photo`, {
      sampleNotes: "Black cotton heavy clay soil from Nizamabad farm plot"
    });
    if (scanRes.data.success && scanRes.data.analysis) {
      scanAnalysis = scanRes.data.analysis;
      console.log(`✅ 3. AI Soil Scanner: Identified '${scanAnalysis.soilType}' (Confidence: ${scanAnalysis.confidence}%)`);
      console.log(`      Suitable Crops: ${scanAnalysis.suitableCrops?.slice(0, 3).join(", ")}`);
      passed++;
    } else {
      throw new Error("Invalid scan response format");
    }
  } catch (e) {
    console.error("❌ 3. AI Soil Scanner Failed:", e.message);
    failed++;
  }

  // 3. Test Booking Appointment with Advance Payment
  let createdRequestId = "";
  try {
    const bookRes = await axios.post(`${BASE_URL}/soil-test/book-appointment`, {
      farmerId: farmerId,
      farmerName: "Ram Sharma",
      phone: "9876543210",
      farmLocation: "North Organic Acre, Medak, Telangana",
      latitude: 18.0478,
      longitude: 78.2612,
      farmSizeAcres: 4.5,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiAnalysis: scanAnalysis,
      preferredDate: new Date(Date.now() + 86400000 * 2),
      preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
      samplingSpotsCount: 3,
      advanceAmount: 299,
      paymentMode: "upi"
    });

    if (bookRes.data.success && bookRes.data.request?._id) {
      createdRequestId = bookRes.data.request._id;
      console.log(`✅ 4. Booked Soil Test Appointment: ID ${createdRequestId} (Advance Paid: ₹299, Status: ${bookRes.data.request.status})`);
      passed++;
    } else {
      throw new Error("Booking failed");
    }
  } catch (e) {
    console.error("❌ 4. Book Soil Test Appointment Failed:", e.message);
    failed++;
  }

  // 4. Test Farmer Fetching My Requests
  try {
    const myRes = await axios.get(`${BASE_URL}/soil-test/my-requests/${farmerId}`);
    if (Array.isArray(myRes.data) && myRes.data.length > 0) {
      console.log(`✅ 5. Farmer My-Requests: Fetched ${myRes.data.length} appointments`);
      passed++;
    } else {
      throw new Error("No requests found");
    }
  } catch (e) {
    console.error("❌ 5. Farmer My-Requests Failed:", e.message);
    failed++;
  }

  // 5. Test Admin Fetching All Requests
  try {
    const adminAllRes = await axios.get(`${BASE_URL}/soil-test/admin-all`);
    if (Array.isArray(adminAllRes.data) && adminAllRes.data.length > 0) {
      console.log(`✅ 6. Admin All Soil Requests: Fetched ${adminAllRes.data.length} total platform requests`);
      passed++;
    } else {
      throw new Error("No admin requests found");
    }
  } catch (e) {
    console.error("❌ 6. Admin All Requests Failed:", e.message);
    failed++;
  }

  // 6. Test Admin Assigns Soil Testing Team
  try {
    const assignRes = await axios.put(`${BASE_URL}/soil-test/${createdRequestId}/assign-team`, {
      scientistName: "Dr. Arvind Swamy, M.Sc (Soil Chemistry)",
      teamVehicleNumber: "TS-09-LAB-1029 (Mobile Testing Unit 04)",
      contactPhone: "9848099881",
      scheduledVisitDate: new Date(Date.now() + 86400000),
      adminNotes: "Mobile spectrometer unit dispatched for 3-spot soil sampling."
    });

    if (assignRes.data.success && assignRes.data.request.status === "team_assigned") {
      console.log(`✅ 7. Admin Team Assignment: Status '${assignRes.data.request.status}', Scientist: ${assignRes.data.request.assignedTeam.scientistName}`);
      passed++;
    } else {
      throw new Error("Assignment failed");
    }
  } catch (e) {
    console.error("❌ 7. Admin Team Assignment Failed:", e.message);
    failed++;
  }

  // 7. Test Admin / Lab Publishes Certified Report
  try {
    const reportRes = await axios.put(`${BASE_URL}/soil-test/${createdRequestId}/publish-report`, {
      phLevel: 6.9,
      nitrogenN: "280 kg/ha (Medium-High)",
      phosphorusP: "25 kg/ha (Adequate)",
      potassiumK: "350 kg/ha (High)",
      organicCarbonPercent: 0.78,
      electricalConductivityEC: "0.34 dS/m (Normal)",
      recommendedManure: "Apply 2.5 tonnes/acre Farm Yard Manure + 300kg Vermicompost + 5kg PSB biofertilizer."
    });

    if (reportRes.data.success && reportRes.data.request.status === "report_published") {
      console.log(`✅ 8. Publish Soil Health Card: Status '${reportRes.data.request.status}', pH ${reportRes.data.request.soilHealthReport.phLevel} (${reportRes.data.request.soilHealthReport.phCategory})`);
      passed++;
    } else {
      throw new Error("Report publishing failed");
    }
  } catch (e) {
    console.error("❌ 8. Publish Soil Report Failed:", e.message);
    failed++;
  }

  console.log("==================================================");
  console.log(`RESULTS: ${passed} Passed | ${failed} Failed`);
  console.log("==================================================");
  process.exit(failed === 0 ? 0 : 1);
}

testSoilTestingWorkflow();
