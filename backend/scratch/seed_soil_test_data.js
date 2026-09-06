import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import SoilTestRequest from "../models/SoilTestRequest.js";

async function seedSoilTestData() {
  await connectDB();
  console.log("🌱 Seeding Realistic Soil Testing Appointments...");

  const ram = await User.findOne({ email: "ram@test.com" });
  const srinivas = await User.findOne({ email: "farmer@test.com" });
  const bikshapathi = await User.findOne({ email: "bikshapathi.reddy@gmail.com" });

  await SoilTestRequest.deleteMany({});

  if (ram) {
    // 1. Ram's Completed & Certified Soil Health Card
    await SoilTestRequest.create({
      farmer: ram._id,
      farmerName: ram.name,
      phone: ram.phone,
      farmLocation: "Medak Mandal, Telangana",
      latitude: 18.0478,
      longitude: 78.2612,
      farmSizeAcres: 6.5,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: {
        soilType: "Red Sandy Loam Soil",
        confidence: 94,
        texture: "Porous, crumbly structure with high permeability and rich iron oxide content",
        colorProfile: "Terracotta Reddish Loam",
        organicMatterEstimate: "Medium (0.68%)",
        suitableCrops: ["Organic Paddy (RNR 15048)", "Tomatoes", "Millets (Foxtail)", "Groundnut", "Pulses"],
        suggestedOrganicFertilizers: [
          "Apply 2 tonnes/acre Well-rotted Farm Yard Manure",
          "Drench soil with Jeevamrutham (200L/acre) every 15 days",
          "Incorporate Green Manure (Dhaincha) before kharif sowing"
        ],
        recommendations: "Excellent drainage; maintain organic mulching between crop rows to preserve root zone moisture."
      },
      appointmentDetails: {
        preferredDate: new Date(Date.now() - 86400000 * 5),
        preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
        samplingSpotsCount: 3,
        advanceAmount: 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode: "upi",
        paymentStatus: "paid",
        paymentTxnId: "SOIL-ADV-RAM-01"
      },
      status: "report_published",
      assignedTeam: {
        scientistName: "Dr. Arvind Swamy (Soil Chemist - Unit 04)",
        teamVehicleNumber: "TS-09-LAB-1029",
        contactPhone: "9848099881",
        assignedAt: new Date(Date.now() - 86400000 * 4),
        scheduledVisitDate: new Date(Date.now() - 86400000 * 3),
        adminNotes: "Mobile spectrometer unit completed 3-spot soil sampling across North and South plots."
      },
      soilHealthReport: {
        phLevel: 6.8,
        phCategory: "Optimal / Neutral",
        nitrogenN: "275 kg/ha (Medium)",
        phosphorusP: "26 kg/ha (Adequate)",
        potassiumK: "340 kg/ha (High)",
        organicCarbonPercent: 0.74,
        electricalConductivityEC: "0.36 dS/m (Safe/Normal)",
        micronutrients: {
          zinc: "1.45 ppm (Sufficient)",
          iron: "6.8 ppm (Adequate)",
          boron: "0.62 ppm (Moderate)"
        },
        recommendedManure: "Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer. Ideal for organic Telangana Sona rice & tomato cultivation.",
        publishedAt: new Date(Date.now() - 86400000 * 2)
      }
    });

    // 2. Ram's New Active Pending Request for West Plot
    await SoilTestRequest.create({
      farmer: ram._id,
      farmerName: ram.name,
      phone: ram.phone,
      farmLocation: "West Orchard Plot, Medak, Telangana",
      latitude: 18.0512,
      longitude: 78.2580,
      farmSizeAcres: 3.0,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: {
        soilType: "Clay Loam Soil",
        confidence: 91,
        texture: "Dense, nutrient-dense fine clay loam with excellent moisture holding capacity",
        colorProfile: "Dark Greyish Clay",
        organicMatterEstimate: "High (0.82%)",
        suitableCrops: ["Brinjal", "Leafy Greens (Palak)", "Ladyfinger (Bhindi)", "Cabbage"],
        suggestedOrganicFertilizers: [
          "Apply Gypsum (100kg/acre) to improve crumb porosity",
          "Panchagavya foliar spray (3%)",
          "Neem cake powder (150kg/acre)"
        ]
      },
      appointmentDetails: {
        preferredDate: new Date(Date.now() + 86400000 * 2),
        preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
        samplingSpotsCount: 3,
        advanceAmount: 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode: "upi",
        paymentStatus: "paid",
        paymentTxnId: "SOIL-ADV-RAM-02"
      },
      status: "pending_assignment"
    });
  }

  if (srinivas) {
    // 3. Srinivas Reddy - Team Dispatched
    await SoilTestRequest.create({
      farmer: srinivas._id,
      farmerName: srinivas.name,
      phone: srinivas.phone,
      farmLocation: "Green Acres Estate, Shamshabad, Rangareddy",
      latitude: 17.2403,
      longitude: 78.4294,
      farmSizeAcres: 12,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: {
        soilType: "Red Sandy Loam Soil",
        confidence: 93,
        texture: "Well-aerated sandy loam with moderate organic humus",
        colorProfile: "Reddish Terracotta",
        organicMatterEstimate: "Medium (0.62%)",
        suitableCrops: ["Vegetables", "Pomegranate", "Mango Orchards", "Millets"]
      },
      appointmentDetails: {
        preferredDate: new Date(Date.now() + 86400000),
        preferredTimeSlot: "Afternoon (1:00 PM - 5:00 PM)",
        samplingSpotsCount: 5,
        advanceAmount: 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode: "upi",
        paymentStatus: "paid",
        paymentTxnId: "SOIL-ADV-SRINIVAS-01"
      },
      status: "team_assigned",
      assignedTeam: {
        scientistName: "Dr. P. Sunita (Agronomy Lab Lead - Unit 02)",
        teamVehicleNumber: "TS-07-AG-8812",
        contactPhone: "9440192834",
        assignedAt: new Date(Date.now() - 3600000 * 6),
        scheduledVisitDate: new Date(Date.now() + 86400000),
        adminNotes: "Mobile unit scheduled for 5-point zigzag soil sampling for fruit orchard zone."
      }
    });
  }

  if (bikshapathi) {
    // 4. Bikshapathi Reddy - Pending Assignment
    await SoilTestRequest.create({
      farmer: bikshapathi._id,
      farmerName: bikshapathi.name,
      phone: bikshapathi.phone,
      farmLocation: "Narsampet, Warangal Rural, Telangana",
      latitude: 17.9250,
      longitude: 79.8920,
      farmSizeAcres: 18,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: {
        soilType: "Black Cotton Soil (Regur)",
        confidence: 96,
        texture: "Heavy clayey, high calcium/magnesium, deep self-aerating cracks",
        colorProfile: "Deep Black Carbon",
        organicMatterEstimate: "High (0.85%)",
        suitableCrops: ["Warangal Red Chilli", "Cotton", "Tandur Red Gram", "Soybean"]
      },
      appointmentDetails: {
        preferredDate: new Date(Date.now() + 86400000 * 3),
        preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
        samplingSpotsCount: 5,
        advanceAmount: 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode: "upi",
        paymentStatus: "paid",
        paymentTxnId: "SOIL-ADV-BIKSHA-01"
      },
      status: "pending_assignment"
    });
  }

  console.log("🎉 Soil Testing Appointments Seeded Successfully!");
  process.exit(0);
}

seedSoilTestData();
