import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Farmer from "./models/Farmer.js";
import Customer from "./models/Customer.js";
import Agent from "./models/Agent.js";
import Crop from "./models/Crop.js";
import Order from "./models/Order.js";
import Delivery from "./models/Delivery.js";
import Review from "./models/Review.js";
import Auction from "./models/Auction.js";
import BoxSubscription from "./models/BoxSubscription.js";
import Demand from "./models/Demand.js";
import FarmTourBooking from "./models/FarmTourBooking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const CROP_IMAGES = {
  rice: "http://localhost:5000/uploads/ai_rice.jpg",
  tomato: "http://localhost:5000/uploads/ai_tomato.jpg",
  spinach: "http://localhost:5000/uploads/ai_spinach.jpg",
  red_chilli: "http://localhost:5000/uploads/ai_red_chilli.jpg",
  turmeric: "http://localhost:5000/uploads/ai_turmeric.jpg",
  onion: "http://localhost:5000/uploads/ai_onion.jpg",
  potato: "http://localhost:5000/uploads/potato.png",
  carrot: "http://localhost:5000/uploads/carrot.png",
  mango: "http://localhost:5000/uploads/ai_mango.jpg",
  banana: "http://localhost:5000/uploads/ai_banana.jpg",
  cabbage: "http://localhost:5000/uploads/ai_cabbage.jpg",
  cauliflower: "http://localhost:5000/uploads/ai_cauliflower.jpg",
  soya: "http://localhost:5000/uploads/ai_soya.jpg",
  farm_vegetables: "http://localhost:5000/uploads/farm_vegetables.png",
  
  // High quality AI & HD crop images for realistic mandi catalog
  wheat: "http://localhost:5000/uploads/ai_wheat.jpg",
  toor_dal: "http://localhost:5000/uploads/ai_pulses_dal.jpg",
  moong_dal: "http://localhost:5000/uploads/ai_pulses_dal.jpg",
  cotton: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
  sugarcane: "https://images.unsplash.com/photo-1596753392437-05c8733230c1?w=600&auto=format&fit=crop&q=80",
  groundnut: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  brinjal: "http://localhost:5000/uploads/ai_brinjal.jpg",
  ladyfinger: "http://localhost:5000/uploads/ai_bhindi.jpg",
  ghee: "http://localhost:5000/uploads/ai_honey_ghee.jpg",
  honey: "http://localhost:5000/uploads/ai_honey_ghee.jpg",
  jaggery: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  pomegranate: "http://localhost:5000/uploads/ai_pomegranate.jpg",
  green_chilli: "http://localhost:5000/uploads/ai_red_chilli.jpg",
  millet: "http://localhost:5000/uploads/ai_millets.jpg",
  sesame_oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
  coriander: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
  drumstick: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80"
};

const FARMER_PHOTOS = [
  "http://localhost:5000/uploads/ai_farmer_1.jpg",
  "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80"
];

const FARM_PHOTOS = [
  "http://localhost:5000/uploads/ai_farm_1.jpg",
  "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1592417817098-8f3d6ef23ef9?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop&q=80"
];

const REAL_FARMERS_DATA = [
  {
    name: "Srinivas Reddy",
    email: "farmer@test.com", // Keep demo account login
    phone: "9848011223",
    location: "Shamshabad, Rangareddy",
    latitude: 17.2403,
    longitude: 78.4294,
    farmName: "Green Acres Organic Estate",
    farmLocation: "Shamshabad Mandal, Rangareddy Dist, Telangana",
    farmSize: 12,
    soilType: "red_soil",
    experience: 16,
    trustScore: 96,
    trustGrade: "Platinum",
    upiId: "srinivasreddy@oksbi",
    bankAccount: "SBIN0004128912",
    bio: "Pioneer in organic paddy and heirloom vegetables cultivation with natural Jeevamrutham methods for 16+ years.",
    farmTourEnabled: true,
    farmTourPrice: 150,
    farmTourDetails: "Tour includes traditional organic farming demonstration, soil composting workshop, and fresh tender coconut refreshments."
  },
  {
    name: "Bikshapathi Reddy",
    email: "bikshapathi.reddy@gmail.com",
    phone: "9848123456",
    location: "Narsampet, Warangal",
    latitude: 17.9250,
    longitude: 79.8920,
    farmName: "Sri Laxmi Narasimha Agro Fields",
    farmLocation: "Narsampet, Warangal Rural, Telangana",
    farmSize: 18,
    soilType: "black_soil",
    experience: 22,
    trustScore: 98,
    trustGrade: "Platinum",
    upiId: "bikshapathi@ybl",
    bankAccount: "UBIN0532189012",
    bio: "Specializing in export-grade Warangal Red Chillies, Tandur Red Gram, and high-yield Cotton.",
    farmTourEnabled: true,
    farmTourPrice: 200,
    farmTourDetails: "Experience red chilli harvesting, traditional spice drying yard, and farm-to-table breakfast."
  },
  {
    name: "Thirupathi Rao",
    email: "thirupathi.rao@gmail.com",
    phone: "9440123456",
    location: "Manakondur, Karimnagar",
    latitude: 18.4050,
    longitude: 79.1820,
    farmName: "Godavari Delta Agro Ventures",
    farmLocation: "Manakondur Mandal, Karimnagar, Telangana",
    farmSize: 14,
    soilType: "alluvial_soil",
    experience: 19,
    trustScore: 94,
    trustGrade: "Gold",
    upiId: "thirupathirao@icici",
    bankAccount: "ICIC0001092834",
    bio: "Certified natural farmer cultivating single-polish Turmeric fingers and aromatic Telangana Sona Rice.",
    farmTourEnabled: true,
    farmTourPrice: 120,
    farmTourDetails: "Turmeric processing unit visit, bio-fertilizer prep, and bullock cart ride across paddy fields."
  },
  {
    name: "Gangaiah Kuruma",
    email: "gangaiah.kuruma@gmail.com",
    phone: "9440234567",
    location: "Korutla, Jagtial",
    latitude: 18.8210,
    longitude: 78.7120,
    farmName: "Jagtial Golden Spice Plantation",
    farmLocation: "Korutla, Jagtial District, Telangana",
    farmSize: 10,
    soilType: "red_soil",
    experience: 24,
    trustScore: 95,
    trustGrade: "Platinum",
    upiId: "gangaiah@paytm",
    bankAccount: "SBIN0008472910",
    bio: "Specialized in high-curcumin Jagtial Turmeric and chemical-free sweet mango orchards.",
    farmTourEnabled: false,
    farmTourPrice: 0,
    farmTourDetails: ""
  },
  {
    name: "Kishan Rao Deshmukh",
    email: "kishan.rao@gmail.com",
    phone: "9490123456",
    location: "Bodhan, Nizamabad",
    latitude: 18.6725,
    longitude: 77.8941,
    farmName: "Deshmukh Heritage Sugarcane & Paddy",
    farmLocation: "Bodhan, Nizamabad, Telangana",
    farmSize: 25,
    soilType: "black_soil",
    experience: 28,
    trustScore: 97,
    trustGrade: "Platinum",
    upiId: "kishanrao@oksbi",
    bankAccount: "SBIN0020491823",
    bio: "Organic sugarcane processing, traditional jaggery making, and non-GMO soya bean cultivation.",
    farmTourEnabled: true,
    farmTourPrice: 250,
    farmTourDetails: "Live jaggery making demonstration, sugarcane juice tasting, and traditional earthen cooking."
  },
  {
    name: "Koteswara Rao Chowdary",
    email: "koteswara.chowdary@gmail.com",
    phone: "9849123456",
    location: "Tenali, Guntur",
    latitude: 16.2430,
    longitude: 80.6400,
    farmName: "Guntur Red Gold Spice Farms",
    farmLocation: "Tenali Mandal, Guntur, Andhra Pradesh",
    farmSize: 20,
    soilType: "black_soil",
    experience: 25,
    trustScore: 99,
    trustGrade: "Platinum",
    upiId: "koteswararao@axl",
    bankAccount: "UTIB0001892019",
    bio: "Renowned grower of GI-certified Guntur Teja hot red chillies and zero-chemical country tomatoes.",
    farmTourEnabled: true,
    farmTourPrice: 180,
    farmTourDetails: "Comprehensive chilli grading workshop, spice processing insights, and farm lunch."
  },
  {
    name: "Sita Mahalakshmi",
    email: "sita.mahalakshmi@gmail.com",
    phone: "9849345678",
    location: "Rajahmundry, East Godavari",
    latitude: 17.0005,
    longitude: 81.8040,
    farmName: "Konaseema Natural Agro & Dairy",
    farmLocation: "Rajahmundry Rural, East Godavari, AP",
    farmSize: 15,
    soilType: "alluvial_soil",
    experience: 17,
    trustScore: 96,
    trustGrade: "Platinum",
    upiId: "sitamahalaxmi@oksbi",
    bankAccount: "SBIN0001928471",
    bio: "Certified woman farmer leading organic Robusta Banana, Konaseema Coconut, and Gir Cow A2 Ghee production.",
    farmTourEnabled: true,
    farmTourPrice: 200,
    farmTourDetails: "A2 dairy farm visit, bio-gas demonstration, and organic fruit sampling."
  },
  {
    name: "Ramana Murthy",
    email: "ramana.murthy@gmail.com",
    phone: "9849234567",
    location: "Gannavaram, Krishna",
    latitude: 16.5350,
    longitude: 80.8030,
    farmName: "Krishna Delta Pure Organics",
    farmLocation: "Gannavaram, Krishna District, AP",
    farmSize: 16,
    soilType: "alluvial_soil",
    experience: 21,
    trustScore: 95,
    trustGrade: "Platinum",
    upiId: "ramanamurthy@ybl",
    bankAccount: "HDFC0001829301",
    bio: "Cultivator of premium BPT 5204 Samba Masoori Rice, black gram, and country vegetables.",
    farmTourEnabled: false,
    farmTourPrice: 0,
    farmTourDetails: ""
  },
  {
    name: "Devender Chary",
    email: "devender.chary@gmail.com",
    phone: "9701123456",
    location: "Ibrahimpatnam, Rangareddy",
    latitude: 17.1850,
    longitude: 78.6420,
    farmName: "Sri Gayatri Polyhouse & Open Fields",
    farmLocation: "Ibrahimpatnam, Rangareddy Dist, Telangana",
    farmSize: 8,
    soilType: "red_soil",
    experience: 12,
    trustScore: 92,
    trustGrade: "Gold",
    upiId: "devenderchary@oksbi",
    bankAccount: "SBIN0040192837",
    bio: "Supplying daily fresh harvested native spinach, coriander, mint, and polyhouse bell peppers to Hyderabad.",
    farmTourEnabled: true,
    farmTourPrice: 100,
    farmTourDetails: "Hydroponics & polyhouse farming demo, composting session, and take-home veggie sapling."
  },
  {
    name: "Chandraiah Yadav",
    email: "chandraiah.yadav@gmail.com",
    phone: "9701234567",
    location: "Jadcherla, Mahabubnagar",
    latitude: 16.7650,
    longitude: 78.1400,
    farmName: "Palamuru Desi Millets & Pulses",
    farmLocation: "Jadcherla, Mahabubnagar Dist, Telangana",
    farmSize: 12,
    soilType: "red_soil",
    experience: 20,
    trustScore: 94,
    trustGrade: "Gold",
    upiId: "chandraiahyadav@paytm",
    bankAccount: "APGV0002918273",
    bio: "Specializing in drought-resilient organic Foxtail Millet, Ragi, Desi Bengal Gram, and Groundnut.",
    farmTourEnabled: false,
    farmTourPrice: 0,
    farmTourDetails: ""
  },
  {
    name: "Kavitha Narayana",
    email: "kavitha.narayana@gmail.com",
    phone: "9848234567",
    location: "Hasanparthy, Warangal",
    latitude: 18.0125,
    longitude: 79.5823,
    farmName: "Annapurna Women Farmers Collective",
    farmLocation: "Hasanparthy Mandal, Hanamkonda, Telangana",
    farmSize: 9,
    soilType: "loamy",
    experience: 14,
    trustScore: 97,
    trustGrade: "Platinum",
    upiId: "kavithanarayana@ybl",
    bankAccount: "CANR0001928374",
    bio: "Leading a cooperative of 30 women farmers growing zero-budget chemical-free tomatoes, okra, and native leafy greens.",
    farmTourEnabled: true,
    farmTourPrice: 150,
    farmTourDetails: "Community organic seed preservation center visit, traditional vermicompost preparation, and herbal tea."
  },
  {
    name: "Mallesh Goud",
    email: "mallesh.goud@gmail.com",
    phone: "9848345678",
    location: "Medchal, Medak",
    latitude: 17.6250,
    longitude: 78.4850,
    farmName: "Venkateshwara Agro Orchard & Dairy",
    farmLocation: "Medchal Mandal, Telangana",
    farmSize: 11,
    soilType: "loamy",
    experience: 18,
    trustScore: 93,
    trustGrade: "Gold",
    upiId: "malleshgoud@oksbi",
    bankAccount: "SBIN0010928374",
    bio: "Supplying Banganapalli mangoes, sweet custard apples, and fresh farm honey to local urban markets.",
    farmTourEnabled: true,
    farmTourPrice: 120,
    farmTourDetails: "Mango orchard walk, honey bee-keeping demonstration, and seasonal fruit tasting."
  }
];

const REAL_CUSTOMERS_DATA = [
  {
    name: "Anand Verma",
    email: "customer@test.com", // Keep demo account login
    phone: "9820011223",
    location: "Banjara Hills, Hyderabad",
    address: "Plot 42, Road No. 12, Banjara Hills, Hyderabad, Telangana",
    pincode: "500034",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4156,
    longitude: 78.4350,
    customerType: "individual",
    requiresDailyDelivery: false,
    walletBalance: 4200,
    preferences: ["Sona Masoori Rice", "Naatu Tomato", "Organic Palak", "Pure A2 Ghee"],
    dietaryRestrictions: ["Vegetarian"]
  },
  {
    name: "Dr. Sneha Reddy",
    email: "sneha.reddy@gmail.com",
    phone: "9820123456",
    location: "Gachibowli, Hyderabad",
    address: "Flat 402, My Home Bhooja, Gachibowli, Hyderabad",
    pincode: "500032",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4401,
    longitude: 78.3489,
    customerType: "individual",
    requiresDailyDelivery: true,
    walletBalance: 3500,
    preferences: ["Organic Vegetables", "Foxtail Millet", "Cold-Pressed Sesame Oil"],
    dietaryRestrictions: ["Organic Only", "Gluten-Free"]
  },
  {
    name: "Rajesh Sharma",
    email: "rajesh.sharma@gmail.com",
    phone: "9820234567",
    location: "Jubilee Hills, Hyderabad",
    address: "Villa 18, Road No. 36, Jubilee Hills, Hyderabad",
    pincode: "500033",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4319,
    longitude: 78.4073,
    customerType: "individual",
    requiresDailyDelivery: false,
    walletBalance: 6800,
    preferences: ["Banganapalli Mango", "Tandur Toor Dal", "Guntur Red Chilli"],
    dietaryRestrictions: []
  },
  {
    name: "Venkat Rao (Swagath Grand)",
    email: "venkat.swagath@gmail.com",
    phone: "9820345678",
    location: "Madhapur, Hyderabad",
    address: "Swagath Grand Kitchens, Hitec City Main Road, Madhapur, Hyderabad",
    pincode: "500081",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4483,
    longitude: 78.3915,
    customerType: "business",
    requiresDailyDelivery: true,
    walletBalance: 25000,
    preferences: ["Bulk Rice", "Bulk Onions", "Bulk Tomatoes", "Red Chilli Powder"],
    dietaryRestrictions: []
  },
  {
    name: "Priyanka Joshi",
    email: "priyanka.joshi@gmail.com",
    phone: "9820456789",
    location: "Kukatpally, Hyderabad",
    address: "Phase 3, KPHB Colony, Kukatpally, Hyderabad",
    pincode: "500072",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4938,
    longitude: 78.3996,
    customerType: "individual",
    requiresDailyDelivery: false,
    walletBalance: 2100,
    preferences: ["Spinach", "Carrots", "Potatoes", "Bananas"],
    dietaryRestrictions: ["Vegetarian"]
  },
  {
    name: "Harish Naidu (FreshMarts Retail)",
    email: "harish.naidu@freshmarts.in",
    phone: "9820567890",
    location: "Dilsukhnagar, Hyderabad",
    address: "FreshMarts Central Depot, Main Road, Dilsukhnagar, Hyderabad",
    pincode: "500060",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.3688,
    longitude: 78.5247,
    customerType: "business",
    requiresDailyDelivery: true,
    walletBalance: 45000,
    preferences: ["Fresh Produce", "Grains", "Spices", "Millets"],
    dietaryRestrictions: []
  },
  {
    name: "Karthik Sundaram",
    email: "karthik.sundaram@gmail.com",
    phone: "9820678901",
    location: "Kondapur, Hyderabad",
    address: "Tower 3, Aparna Sarovar, Kondapur, Hyderabad",
    pincode: "500084",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.4699,
    longitude: 78.3578,
    customerType: "individual",
    requiresDailyDelivery: false,
    walletBalance: 1850,
    preferences: ["A2 Milk Ghee", "Raw Forest Honey", "Organic Turmeric"],
    dietaryRestrictions: []
  },
  {
    name: "Lakshmi Prasanna",
    email: "lakshmi.prasanna@gmail.com",
    phone: "9820789012",
    location: "Secunderabad",
    address: "Marredpally Main Road, Secunderabad, Telangana",
    pincode: "500026",
    city: "Secunderabad",
    state: "Telangana",
    latitude: 17.4399,
    longitude: 78.4983,
    customerType: "individual",
    requiresDailyDelivery: false,
    walletBalance: 3200,
    preferences: ["Sona Masoori Rice", "Country Eggs", "Leafy Greens"],
    dietaryRestrictions: ["Vegetarian"]
  }
];

const REAL_AGENTS_DATA = [
  {
    name: "Raju Delivery Express",
    email: "agent@test.com", // Keep demo account login
    phone: "9618011223",
    location: "Hyderabad Central",
    latitude: 17.3850,
    longitude: 78.4867,
    agentType: "bike",
    vehicle: "Honda Shine (TS 09 EA 4128)",
    deliveryScore: 98,
    walletBalance: 3450,
    cashInHand: 420
  },
  {
    name: "Shiva Kumar",
    email: "shiva.logistics@rythusethu.in",
    phone: "9618123456",
    location: "Shamshabad - Gachibowli Corridor",
    latitude: 17.2800,
    longitude: 78.3900,
    agentType: "bike",
    vehicle: "TVS King Auto (TS 07 UA 9182)",
    deliveryScore: 96,
    walletBalance: 5120,
    cashInHand: 850
  },
  {
    name: "Suresh Goud (Agri Express)",
    email: "suresh.express@rythusethu.in",
    phone: "9618234567",
    location: "Warangal - Hyderabad Highway",
    latitude: 17.8200,
    longitude: 79.2500,
    agentType: "truck",
    vehicle: "Tata Ace 2-Tonne (TS 03 TA 5519)",
    deliveryScore: 99,
    walletBalance: 12800,
    cashInHand: 1900
  },
  {
    name: "Mahesh Yadav",
    email: "mahesh.delivery@rythusethu.in",
    phone: "9618345678",
    location: "Kukatpally - Miyapur Zone",
    latitude: 17.4950,
    longitude: 78.3800,
    agentType: "bike",
    vehicle: "Hero Splendor Plus (TS 08 FC 2910)",
    deliveryScore: 95,
    walletBalance: 2890,
    cashInHand: 310
  },
  {
    name: "Naresh Transport Logistics",
    email: "naresh.transport@rythusethu.in",
    phone: "9618456789",
    location: "Karimnagar - Siddipet Hub",
    latitude: 18.2500,
    longitude: 78.9500,
    agentType: "truck",
    vehicle: "Mahindra Bolero Maxi Truck (TS 02 GA 8831)",
    deliveryScore: 97,
    walletBalance: 18400,
    cashInHand: 2400
  }
];

const REAL_ADMINS_DATA = [
  {
    name: "System Administrator",
    email: "admin@test.com",
    phone: "7777777777",
    location: "Hyderabad",
    latitude: 17.3850,
    longitude: 78.4867,
    role: "admin"
  },
  {
    name: "Harshith Gadipelli (Platform Lead)",
    email: "harshith.admin@rythusethu.in",
    phone: "8688938604",
    location: "Hyderabad, Telangana",
    latitude: 17.3850,
    longitude: 78.4867,
    role: "admin"
  }
];

const REAL_CROPS_TEMPLATES = [
  // ── GRAINS ──
  {
    name: "Telangana Sona Rice (RNR 15048 Low GI)",
    category: "grain",
    price: 62,
    unit: "kg",
    minOrderQty: 5,
    quantity: 2400,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.rice,
    description: "Premium Low-GI diabetic friendly Telangana Sona Rice (RNR 15048), aged 12 months for soft and non-sticky cooking.",
    nutritionInfo: { calories: 345, carbs: 78, protein: 7.5, fat: 0.6, fiber: 2.2 }
  },
  {
    name: "Sona Masoori Raw Rice (Aged 1 Year)",
    category: "grain",
    price: 54,
    unit: "kg",
    minOrderQty: 10,
    quantity: 5000,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.rice,
    description: "Authentic single-origin Kurnool Sona Masoori raw rice, unpolished and naturally dried in farm sun.",
    nutritionInfo: { calories: 350, carbs: 79, protein: 6.8, fat: 0.5, fiber: 1.8 }
  },
  {
    name: "BPT 5204 Samba Masoori Rice",
    category: "grain",
    price: 58,
    unit: "kg",
    minOrderQty: 10,
    quantity: 3500,
    season: "kharif",
    isOrganic: false,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.rice,
    description: "Traditional high-aroma Andhra Samba Masoori paddy from Krishna river delta farms.",
    nutritionInfo: { calories: 348, carbs: 77, protein: 7.2, fat: 0.8, fiber: 1.9 }
  },
  {
    name: "Organic Sharbati Whole Wheat",
    category: "grain",
    price: 48,
    unit: "kg",
    minOrderQty: 5,
    quantity: 1800,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.wheat,
    description: "Golden heavy-grain Sharbati wheat, perfect for soft, fluffy rotis with rich natural sweetness.",
    nutritionInfo: { calories: 339, carbs: 71, protein: 12.5, fat: 1.8, fiber: 12.2 }
  },
  {
    name: "Desi Foxtail Millet (Korralu)",
    category: "grain",
    price: 85,
    unit: "kg",
    minOrderQty: 2,
    quantity: 950,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.millet,
    description: "Nutrient-dense native Foxtail Millet cultivated without chemical fertilizers in Mahabubnagar drylands.",
    nutritionInfo: { calories: 351, carbs: 60.1, protein: 12.3, fat: 4.3, fiber: 8.0 }
  },
  {
    name: "Sweet Yellow Maize (Corn)",
    category: "grain",
    price: 26,
    unit: "kg",
    minOrderQty: 10,
    quantity: 3200,
    season: "kharif",
    isOrganic: false,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.maize,
    description: "Crisp sun-dried yellow corn kernels from Medak, ideal for poultry feed or stone-ground cornmeal.",
    nutritionInfo: { calories: 365, carbs: 74, protein: 9.4, fat: 4.7, fiber: 7.3 }
  },

  // ── SPICES ──
  {
    name: "Guntur Teja Stemless Red Chilli",
    category: "spice",
    price: 195,
    unit: "kg",
    minOrderQty: 1,
    quantity: 1200,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.red_chilli,
    description: "Fiery hot, rich red Guntur Teja chillies, manually destemmed and dried under clean polycarbonate solar dryers.",
    nutritionInfo: { calories: 282, carbs: 32, protein: 12, fat: 14, fiber: 25 }
  },
  {
    name: "Warangal Byadagi Wrinkled Chilli",
    category: "spice",
    price: 240,
    unit: "kg",
    minOrderQty: 1,
    quantity: 850,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.red_chilli,
    description: "Deep red, low-pungency high-flavor wrinkled Byadagi chillies giving vibrant natural curry color.",
    nutritionInfo: { calories: 275, carbs: 34, protein: 11.5, fat: 13, fiber: 26 }
  },
  {
    name: "Nizamabad Organic Raw Turmeric Fingers",
    category: "spice",
    price: 135,
    unit: "kg",
    minOrderQty: 2,
    quantity: 1500,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.turmeric,
    description: "High curcumin (>4.5%) polished whole turmeric fingers grown naturally along the Godavari river basin.",
    nutritionInfo: { calories: 312, carbs: 67, protein: 9.7, fat: 3.2, fiber: 22 }
  },
  {
    name: "Karimnagar Whole Coriander Seeds (Dhania)",
    category: "spice",
    price: 110,
    unit: "kg",
    minOrderQty: 1,
    quantity: 900,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.coriander,
    description: "Aromatic greenish-gold whole coriander seeds freshly harvested and graded from Karimnagar agro belt.",
    nutritionInfo: { calories: 298, carbs: 55, protein: 12.4, fat: 17.8, fiber: 41.9 }
  },

  // ── PULSES ──
  {
    name: "Tandur GI-Tagged Red Gram (Toor Dal)",
    category: "pulse",
    price: 155,
    unit: "kg",
    minOrderQty: 2,
    quantity: 2100,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.toor_dal,
    description: "Unpolished, naturally processed GI-tagged Tandur Toor Dal with high protein and exceptional aroma when boiled.",
    nutritionInfo: { calories: 343, carbs: 62.8, protein: 22.3, fat: 1.5, fiber: 15.0 }
  },
  {
    name: "Organic Green Moong Whole Dal",
    category: "pulse",
    price: 125,
    unit: "kg",
    minOrderQty: 2,
    quantity: 1600,
    season: "zaid",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.moong_dal,
    description: "Small native green gram beans with 100% germination rate for wholesome sprouts and traditional dal.",
    nutritionInfo: { calories: 347, carbs: 62.6, protein: 24.0, fat: 1.2, fiber: 16.3 }
  },
  {
    name: "Non-GMO Organic Soya Beans",
    category: "pulse",
    price: 68,
    unit: "kg",
    minOrderQty: 5,
    quantity: 2800,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.soya,
    description: "High-protein non-GMO whole yellow soyabeans sourced directly from Armoor farmer collective.",
    nutritionInfo: { calories: 446, carbs: 30, protein: 36.5, fat: 19.9, fiber: 9.3 }
  },
  {
    name: "Kadiri-6 Roasted Groundnuts (Peanuts)",
    category: "pulse",
    price: 95,
    unit: "kg",
    minOrderQty: 2,
    quantity: 1900,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.groundnut,
    description: "Crunchy, oil-rich Kadiri-6 groundnut pods cultivated in red sandy loam soil of Jadcherla.",
    nutritionInfo: { calories: 567, carbs: 16.1, protein: 25.8, fat: 49.2, fiber: 8.5 }
  },

  // ── VEGETABLES ──
  {
    name: "Desi Country Tomatoes (Naatu Tomato)",
    category: "vegetable",
    price: 36,
    unit: "kg",
    minOrderQty: 2,
    quantity: 800,
    season: "zaid",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "harvesting",
    image: CROP_IMAGES.tomato,
    description: "Tangy, juicy native country red tomatoes harvested every dawn from Ibrahimpatnam polyhouse fields.",
    nutritionInfo: { calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, fiber: 1.2 }
  },
  {
    name: "Fresh Farm Palak (Spinach Leaves)",
    category: "vegetable",
    price: 20,
    unit: "piece",
    minOrderQty: 3,
    quantity: 600,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.spinach,
    description: "Crisp, iron-packed native tender spinach bunches washed in clean borehole water.",
    nutritionInfo: { calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, fiber: 2.2 }
  },
  {
    name: "Kurnool Sweet Red Onions",
    category: "vegetable",
    price: 32,
    unit: "kg",
    minOrderQty: 3,
    quantity: 3500,
    season: "rabi",
    isOrganic: false,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.onion,
    description: "Crisp, pungent red globe onions with excellent shelf life from Kurnool APMC mandi.",
    nutritionInfo: { calories: 40, carbs: 9.3, protein: 1.1, fat: 0.1, fiber: 1.7 }
  },
  {
    name: "Kolar Gold Fresh Potatoes",
    category: "vegetable",
    price: 28,
    unit: "kg",
    minOrderQty: 3,
    quantity: 4200,
    season: "rabi",
    isOrganic: false,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.potato,
    description: "Smooth-skinned, soil-free medium size cooking potatoes directly from cold store facility.",
    nutritionInfo: { calories: 77, carbs: 17.5, protein: 2.0, fat: 0.1, fiber: 2.1 }
  },
  {
    name: "Fresh Desi Vankaya (Brinjal / Eggplant)",
    category: "vegetable",
    price: 38,
    unit: "kg",
    minOrderQty: 1,
    quantity: 450,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.brinjal,
    description: "Glossy purple striped country brinjals, tender seedless flesh ideal for Gutti Vankaya curry.",
    nutritionInfo: { calories: 25, carbs: 5.9, protein: 1.0, fat: 0.2, fiber: 3.0 }
  },
  {
    name: "Tender Green Bhindi (Ladies Finger)",
    category: "vegetable",
    price: 42,
    unit: "kg",
    minOrderQty: 1,
    quantity: 520,
    season: "zaid",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.ladyfinger,
    description: "Slender, crisp young okra pods harvested daily without chemical synthetic sprays.",
    nutritionInfo: { calories: 33, carbs: 7.5, protein: 1.9, fat: 0.2, fiber: 3.2 }
  },
  {
    name: "Fresh Farm Cabbage",
    category: "vegetable",
    price: 30,
    unit: "kg",
    minOrderQty: 1,
    quantity: 750,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.cabbage,
    description: "Compact, heavy heads of fresh sweet green cabbage from Shamshabad farms.",
    nutritionInfo: { calories: 25, carbs: 5.8, protein: 1.3, fat: 0.1, fiber: 2.5 }
  },
  {
    name: "Fresh Green Cauliflower",
    category: "vegetable",
    price: 35,
    unit: "piece",
    minOrderQty: 1,
    quantity: 480,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.cauliflower,
    description: "Snow-white, tight-curd farm cauliflower with fresh green protective leaves.",
    nutritionInfo: { calories: 25, carbs: 5.0, protein: 1.9, fat: 0.3, fiber: 2.0 }
  },

  // ── FRUITS ──
  {
    name: "Banganapalli Sun-Ripened Mangoes",
    category: "fruit",
    price: 90,
    unit: "kg",
    minOrderQty: 3,
    quantity: 1400,
    season: "zaid",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.mango,
    description: "Naturally carbide-free grass-ripened royal Banganapalli mangoes with thin skin and fiberless pulp.",
    nutritionInfo: { calories: 60, carbs: 15, protein: 0.8, fat: 0.4, fiber: 1.6 }
  },
  {
    name: "Robusta Table Bananas",
    category: "fruit",
    price: 45,
    unit: "dozen",
    minOrderQty: 1,
    quantity: 650,
    season: "perennial",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.banana,
    description: "Plump, naturally sweet Robusta yellow bananas grown in the fertile Godavari delta soil.",
    nutritionInfo: { calories: 89, carbs: 22.8, protein: 1.1, fat: 0.3, fiber: 2.6 }
  },
  {
    name: "Fresh Bhagwa Pomegranate",
    category: "fruit",
    price: 140,
    unit: "kg",
    minOrderQty: 2,
    quantity: 800,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.pomegranate,
    description: "Ruby-red sweet Bhagwa pomegranate with soft seeds and high antioxidant juice content.",
    nutritionInfo: { calories: 83, carbs: 18.7, protein: 1.7, fat: 1.2, fiber: 4.0 }
  },

  // ── DAIRY & SPECIALTY FARM PRODUCTS ──
  {
    name: "Gir Cow Pure A2 Desi Bilona Ghee",
    category: "dairy",
    price: 1350,
    unit: "litre",
    minOrderQty: 1,
    quantity: 120,
    season: "perennial",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.ghee,
    description: "Traditional hand-churned Vedic Bilona Ghee made from curd of grass-fed indigenous Gir cows.",
    nutritionInfo: { calories: 884, carbs: 0, protein: 0, fat: 99.5, fiber: 0 }
  },
  {
    name: "Raw Natural Forest Honey",
    category: "byproduct",
    price: 450,
    unit: "kg",
    minOrderQty: 1,
    quantity: 250,
    season: "perennial",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.honey,
    description: "Unfiltered, unpasteurized multi-flora honey harvested from tribal bee-boxes in Nallamala forest fringe.",
    nutritionInfo: { calories: 304, carbs: 82.4, protein: 0.3, fat: 0, fiber: 0.2 }
  },
  {
    name: "Organic Palm Jaggery (Thaati Bellam)",
    category: "byproduct",
    price: 160,
    unit: "kg",
    minOrderQty: 2,
    quantity: 700,
    season: "rabi",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.jaggery,
    description: "Pure chemical-free traditional dark jaggery blocks prepared by slow boiling concentrated sugarcane juice.",
    nutritionInfo: { calories: 383, carbs: 98, protein: 0.4, fat: 0.1, fiber: 0 }
  },
  {
    name: "Wood-Pressed Pure Sesame Oil (Til Oil)",
    category: "byproduct",
    price: 320,
    unit: "litre",
    minOrderQty: 1,
    quantity: 350,
    season: "perennial",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.sesame_oil,
    description: "Unrefined cold-pressed sesame oil extracted in traditional wooden Ghani (Chekku) at room temperature.",
    nutritionInfo: { calories: 884, carbs: 0, protein: 0, fat: 100, fiber: 0 }
  },

  // ── COMMERCIAL CROPS ──
  {
    name: "Shankar-6 Long Staple Raw Cotton",
    category: "other",
    price: 7200,
    unit: "tonne",
    minOrderQty: 1,
    quantity: 45,
    season: "kharif",
    isOrganic: false,
    isPesticideFree: false,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.cotton,
    description: "High-grade 29mm fiber length Shankar-6 raw seed cotton with low moisture and zero contaminants.",
    nutritionInfo: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 }
  },
  {
    name: "Organic Sweet Sugarcane Stems",
    category: "other",
    price: 320,
    unit: "tonne",
    minOrderQty: 2,
    quantity: 60,
    season: "kharif",
    isOrganic: true,
    isPesticideFree: true,
    qualityGrade: "A",
    lifecycleStage: "ready",
    image: CROP_IMAGES.sugarcane,
    description: "High-sucrose juicy sugarcane variety CO-86032 directly from Nizamabad canal-irrigated farmland.",
    nutritionInfo: { calories: 269, carbs: 73, protein: 0.2, fat: 0.1, fiber: 0.6 }
  }
];

const seedRealDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rythu_sethu";
    await mongoose.connect(mongoUri);
    console.log("🟢 Connected to MongoDB:", mongoUri);

    console.log("🧹 Skipping old mock data deletion to preserve existing user data...");

    const passwordHash = await bcrypt.hash("password123", 10);
    const testPasswordHash = await bcrypt.hash("test123", 10);

    // 1. Seed Admins
    console.log("👑 Seeding Admin Users...");
    const createdAdmins = [];
    for (const a of REAL_ADMINS_DATA) {
      const user = await User.create({
        name: a.name,
        email: a.email,
        password: testPasswordHash,
        role: "admin",
        phone: a.phone,
        location: a.location,
        latitude: a.latitude,
        longitude: a.longitude,
        isVerified: true,
        acceptedTerms: true,
        trustScore: 100
      });
      createdAdmins.push(user);
      console.log(`   ↳ Admin created: ${user.name} (${user.email})`);
    }

    // 2. Seed Farmers
    console.log("👨‍🌾 Seeding Authentic Indian Farmers...");
    const createdFarmers = [];
    for (let i = 0; i < REAL_FARMERS_DATA.length; i++) {
      const f = REAL_FARMERS_DATA[i];
      const photoIdx = i % FARMER_PHOTOS.length;
      const farmIdx = i % FARM_PHOTOS.length;

      const user = await User.create({
        name: f.name,
        email: f.email,
        password: testPasswordHash,
        role: "farmer",
        phone: f.phone,
        location: f.location,
        latitude: f.latitude,
        longitude: f.longitude,
        farmName: f.farmName,
        isVerified: true,
        verificationStatus: "verified",
        acceptedTerms: true,
        trustScore: f.trustScore,
        upiId: f.upiId,
        bankAccountNumber: f.bankAccount,
        avatar: FARMER_PHOTOS[photoIdx],
        aadhaar: `5412-${(1000 + i * 37).toString().padStart(4, "0")}-${(2000 + i * 49).toString().padStart(4, "0")}`
      });

      const farmerProfile = await Farmer.create({
        user: user._id,
        farmName: f.farmName,
        farmLocation: f.farmLocation,
        latitude: f.latitude,
        longitude: f.longitude,
        farmSize: f.farmSize,
        soilType: f.soilType,
        experience: f.experience,
        rating: +(4.5 + (Math.random() * 0.5)).toFixed(1),
        totalSales: Math.floor(40000 + Math.random() * 120000),
        verified: true,
        aadhaarVerified: true,
        farmerPhoto: FARMER_PHOTOS[photoIdx],
        farmPhoto: FARM_PHOTOS[farmIdx],
        productPhoto: CROP_IMAGES.rice,
        bio: f.bio,
        profileCompleteness: 100,
        responseRate: 98,
        returnRate: 0.5,
        trustScore: f.trustScore,
        trustGrade: f.trustGrade,
        farmTourEnabled: f.farmTourEnabled,
        farmTourVerified: true,
        farmTourPrice: f.farmTourPrice,
        farmTourDetails: f.farmTourDetails,
        bankAccount: f.bankAccount,
        upiId: f.upiId
      });

      createdFarmers.push({ user, profile: farmerProfile, data: f });
      console.log(`   ↳ Farmer seeded: ${f.name} | ${f.farmName} (${f.location})`);
    }

    // 3. Seed Customers
    console.log("🛒 Seeding Real Customers & Wholesale Buyers...");
    const createdCustomers = [];
    for (let i = 0; i < REAL_CUSTOMERS_DATA.length; i++) {
      const c = REAL_CUSTOMERS_DATA[i];
      const user = await User.create({
        name: c.name,
        email: c.email,
        password: testPasswordHash,
        role: "customer",
        phone: c.phone,
        location: c.location,
        latitude: c.latitude,
        longitude: c.longitude,
        customerType: c.customerType,
        requiresDailyDelivery: c.requiresDailyDelivery,
        walletBalance: c.walletBalance,
        isVerified: true,
        acceptedTerms: true,
        trustScore: 95
      });

      const customerProfile = await Customer.create({
        user: user._id,
        address: c.address,
        pincode: c.pincode,
        city: c.city,
        state: c.state,
        latitude: c.latitude,
        longitude: c.longitude,
        preferences: c.preferences,
        dietaryRestrictions: c.dietaryRestrictions,
        totalOrders: Math.floor(4 + Math.random() * 18),
        loyaltyPoints: Math.floor(120 + Math.random() * 450)
      });

      createdCustomers.push({ user, profile: customerProfile, data: c });
      console.log(`   ↳ Customer seeded: ${c.name} (${c.location})`);
    }

    // 4. Seed Logistics / Delivery Agents
    console.log("🚚 Seeding Real Logistics & Delivery Agents...");
    const createdAgents = [];
    for (let i = 0; i < REAL_AGENTS_DATA.length; i++) {
      const a = REAL_AGENTS_DATA[i];
      const user = await User.create({
        name: a.name,
        email: a.email,
        password: testPasswordHash,
        role: "agent",
        agentType: a.agentType,
        phone: a.phone,
        location: a.location,
        latitude: a.latitude,
        longitude: a.longitude,
        deliveryScore: a.deliveryScore,
        walletBalance: a.walletBalance,
        cashInHand: a.cashInHand,
        isVerified: true,
        acceptedTerms: true,
        trustScore: 98
      });

      const agentProfile = await Agent.create({
        user: user._id,
        vehicle: a.vehicle,
        active: true,
        trustScore: {
          score: a.deliveryScore,
          rating: 4.9,
          totalRatings: 84 + i * 15,
          totalDeliveries: 120 + i * 45,
          onTimeDeliveries: 118 + i * 44,
          issuesReported: 1
        }
      });

      createdAgents.push({ user, profile: agentProfile, data: a });
      console.log(`   ↳ Delivery Agent seeded: ${a.name} [${a.vehicle}]`);
    }

    // 5. Seed Real Crops across Farmers
    console.log("🌾 Seeding High-Quality Crop Catalog...");
    const createdCrops = [];
    let cropIndex = 0;

    // Distribute crops realistically across the registered farmers
    for (const farmerObj of createdFarmers) {
      const farmerUser = farmerObj.user;
      const farmerData = farmerObj.data;

      // Assign 3 to 6 matching realistic crops per farmer based on region and soil type
      for (const tpl of REAL_CROPS_TEMPLATES) {
        // Match agricultural logic
        let shouldAdd = false;
        if (farmerData.location.includes("Warangal") && (tpl.name.includes("Chilli") || tpl.name.includes("Red Gram") || tpl.name.includes("Cotton") || tpl.name.includes("Tomato"))) shouldAdd = true;
        else if (farmerData.location.includes("Karimnagar") && (tpl.name.includes("Turmeric") || tpl.name.includes("Rice") || tpl.name.includes("Coriander") || tpl.name.includes("Maize"))) shouldAdd = true;
        else if (farmerData.location.includes("Jagtial") && (tpl.name.includes("Turmeric") || tpl.name.includes("Mango") || tpl.name.includes("Soya"))) shouldAdd = true;
        else if (farmerData.location.includes("Bodhan") && (tpl.name.includes("Sugarcane") || tpl.name.includes("Jaggery") || tpl.name.includes("Soya") || tpl.name.includes("Rice"))) shouldAdd = true;
        else if (farmerData.location.includes("Guntur") && (tpl.name.includes("Chilli") || tpl.name.includes("Tomato") || tpl.name.includes("Brinjal") || tpl.name.includes("Bhindi"))) shouldAdd = true;
        else if (farmerData.location.includes("Krishna") && (tpl.name.includes("Samba Masoori") || tpl.name.includes("Moong") || tpl.name.includes("Banana"))) shouldAdd = true;
        else if (farmerData.location.includes("Godavari") && (tpl.name.includes("Banana") || tpl.name.includes("Ghee") || tpl.name.includes("Sesame Oil") || tpl.name.includes("Honey"))) shouldAdd = true;
        else if (farmerData.location.includes("Rangareddy") || farmerData.location.includes("Shamshabad")) {
          if (tpl.category === "vegetable" || tpl.name.includes("Sona Rice") || tpl.name.includes("Honey") || tpl.name.includes("Wheat")) shouldAdd = true;
        } else if (farmerData.location.includes("Mahabubnagar") && (tpl.name.includes("Millet") || tpl.name.includes("Groundnut") || tpl.name.includes("Toor Dal") || tpl.name.includes("Custard"))) shouldAdd = true;
        else if (farmerData.location.includes("Medak") && (tpl.name.includes("Mango") || tpl.name.includes("Maize") || tpl.name.includes("Cabbage") || tpl.name.includes("Cauliflower") || tpl.name.includes("Pomegranate"))) shouldAdd = true;

        if (shouldAdd) {
          const now = new Date();
          const harvestDate = new Date(now.getTime() - Math.floor(Math.random() * 5) * 86400000);
          const expiryDate = new Date(now.getTime() + (tpl.category === "vegetable" ? 6 : 180) * 86400000);

          const crop = await Crop.create({
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            price: tpl.price,
            quantity: tpl.quantity,
            unit: tpl.unit,
            minOrderQty: tpl.minOrderQty,
            farmer: farmerUser._id,
            image: tpl.image,
            images: [tpl.image],
            location: farmerUser.location,
            farmLocation: farmerData.farmLocation,
            latitude: farmerUser.latitude,
            longitude: farmerUser.longitude,
            harvestDate: harvestDate,
            expiryDate: expiryDate,
            season: tpl.season,
            isOrganic: tpl.isOrganic,
            isPesticideFree: tpl.isPesticideFree,
            certificationStatus: tpl.isOrganic ? "approved" : "none",
            qualityGrade: tpl.qualityGrade,
            isLive: true,
            isAvailable: true,
            isPrebooking: false,
            lifecycleStage: tpl.lifecycleStage,
            lifecycleUpdates: [
              { stage: "sowing", notes: "Planted with organic heirloom seeds and enriched bio-compost.", timestamp: new Date(now.getTime() - 90 * 86400000) },
              { stage: "flowering", notes: "Healthy flowering stage, sprayed with natural neem extract.", timestamp: new Date(now.getTime() - 35 * 86400000) },
              { stage: "ready", notes: "Harvested at peak freshness, sorted and packed for delivery.", timestamp: new Date(now.getTime() - 2 * 86400000) }
            ],
            nutritionInfo: tpl.nutritionInfo,
            rating: +(4.6 + (Math.random() * 0.4)).toFixed(1),
            totalOrders: Math.floor(12 + Math.random() * 65)
          });
          createdCrops.push(crop);
          cropIndex++;
        }
      }
    }

    console.log(`   ↳ Total ${createdCrops.length} realistic crops registered across farmers.`);

    // 6. Seed Realistic Live & Delivered Orders
    console.log("📦 Seeding Realistic Orders & Delivery Tracking...");
    const sampleCustomer = createdCustomers[0].user;
    const sampleAgent = createdAgents[0].user;
    const sampleFarmer = createdFarmers[0].user;

    const orderStatuses = [
      { status: "delivered", paymentStatus: "paid", paymentMode: "upi" },
      { status: "in_transit", paymentStatus: "paid", paymentMode: "online" },
      { status: "picked_up", paymentStatus: "paid", paymentMode: "upi" },
      { status: "processing", paymentStatus: "pending", paymentMode: "cod" },
      { status: "confirmed", paymentStatus: "paid", paymentMode: "wallet" }
    ];

    for (let i = 0; i < Math.min(10, createdCrops.length); i++) {
      const targetCrop = createdCrops[i];
      const custObj = createdCustomers[i % createdCustomers.length];
      const agentObj = createdAgents[i % createdAgents.length];
      const stateConfig = orderStatuses[i % orderStatuses.length];
      
      const qty = targetCrop.minOrderQty * 2;
      const subtotal = targetCrop.price * qty;
      const deliveryCharges = 40;
      const platformFee = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + deliveryCharges + platformFee;

      const order = await Order.create({
        crop: targetCrop._id,
        customer: custObj.user._id,
        farmer: targetCrop.farmer,
        agent: agentObj.user._id,
        quantity: qty,
        subtotal: subtotal,
        deliveryCharges: deliveryCharges,
        platformFee: platformFee,
        totalAmount: totalAmount,
        status: stateConfig.status,
        paymentMode: stateConfig.paymentMode,
        paymentStatus: stateConfig.paymentStatus,
        pickupAddress: targetCrop.farmLocation,
        pickupLatitude: targetCrop.latitude,
        pickupLongitude: targetCrop.longitude,
        deliveryAddress: custObj.data.address,
        deliveryLatitude: custObj.user.latitude,
        deliveryLongitude: custObj.user.longitude,
        deliveryDistance: 12.4,
        estimatedDeliveryMinutes: 35,
        verificationCode: (100000 + i * 789).toString(),
        productSnapshot: {
          name: targetCrop.name,
          category: targetCrop.category,
          isOrganic: targetCrop.isOrganic,
          isPesticideFree: targetCrop.isPesticideFree,
          quantity: qty,
          unit: targetCrop.unit,
          price: targetCrop.price,
          image: targetCrop.image,
          location: targetCrop.location
        },
        timeline: [
          { status: "confirmed", note: "Order confirmed by farmer", timestamp: new Date(Date.now() - 3600000 * 3) },
          { status: "processing", note: "Harvested and packed in eco-friendly crates", timestamp: new Date(Date.now() - 3600000 * 2) },
          { status: stateConfig.status, note: `Status updated to ${stateConfig.status}`, timestamp: new Date(Date.now() - 1800000) }
        ],
        reviewText: i % 2 === 0 ? "Outstanding farm freshness! Quality exceeded supermarket standards by far." : "Prompt delivery and fragrant produce. Extremely satisfied.",
        sentimentScore: 0.95,
        reviewSentiment: "Positive"
      });

      // Create linked Delivery record
      await Delivery.create({
        order: order._id,
        agent: agentObj.user._id,
        pickupLocation: targetCrop.farmLocation,
        deliveryLocation: custObj.data.address,
        pickupLatitude: targetCrop.latitude,
        pickupLongitude: targetCrop.longitude,
        deliveryLatitude: custObj.user.latitude,
        deliveryLongitude: custObj.user.longitude,
        agentLatitude: custObj.user.latitude ? custObj.user.latitude + 0.005 : 17.4000,
        agentLongitude: custObj.user.longitude ? custObj.user.longitude + 0.005 : 78.4500,
        vehicleType: agentObj.data.agentType,
        agentPhone: agentObj.data.phone,
        status: stateConfig.status === "delivered" ? "delivered" : stateConfig.status === "in_transit" ? "in_transit" : "assigned",
        trackingCode: `TRK-${order._id.toString().slice(-6).toUpperCase()}`,
        estimatedTime: "25 mins",
        estimatedMinutes: 25,
        deliveredAt: stateConfig.status === "delivered" ? new Date() : null
      });

      // Create linked Review
      await Review.create({
        user: custObj.user._id,
        crop: targetCrop._id,
        farmer: targetCrop.farmer,
        rating: 5,
        comment: `Excellent genuine quality ${targetCrop.name}. Directly from ${targetCrop.location}, 100% authentic.`
      });
    }

    // 7. Seed Real Crop Auctions
    console.log("🔨 Seeding Live Bidding & Crop Auctions...");
    for (let i = 0; i < 3; i++) {
      const auctionCrop = createdCrops[i * 4];
      if (auctionCrop) {
        const startBid = Math.round(auctionCrop.price * 0.85);
        await Auction.create({
          crop: auctionCrop._id,
          farmer: auctionCrop.farmer,
          quantity: 200,
          startingBid: startBid,
          currentHighestBid: startBid + 8,
          highestBidder: createdCustomers[1].user._id,
          endTime: new Date(Date.now() + 86400000 * 2), // 2 days left
          status: "active",
          bids: [
            { bidder: createdCustomers[2].user._id, amount: startBid + 4, timestamp: new Date(Date.now() - 3600000) },
            { bidder: createdCustomers[1].user._id, amount: startBid + 8, timestamp: new Date() }
          ]
        });
      }
    }

    // 8. Seed Curated Box Subscriptions
    console.log("📦 Seeding Farm Box Subscriptions...");
    await BoxSubscription.create({
      customer: createdCustomers[0].user._id,
      boxType: "Weekly Family Organic Veggie Basket (7kg)",
      price: 499,
      frequency: "weekly",
      status: "active",
      nextDeliveryDate: new Date(Date.now() + 86400000 * 3),
      deliveryAddress: createdCustomers[0].data.address
    });

    await BoxSubscription.create({
      customer: createdCustomers[1].user._id,
      boxType: "Diabetic-Care Millet & Native Grain Box (10kg)",
      price: 899,
      frequency: "biweekly",
      status: "active",
      nextDeliveryDate: new Date(Date.now() + 86400000 * 5),
      deliveryAddress: createdCustomers[1].data.address
    });

    // 9. Seed Demand Velocity Records
    console.log("📈 Seeding Market Demand & Velocity Records...");
    const demandCrops = [
      { name: "Telangana Sona Rice (RNR 15048 Low GI)", score: 98, sold: 1840, orders: 48, rev: 114080 },
      { name: "Desi Country Tomatoes (Naatu Tomato)", score: 95, sold: 1420, orders: 72, rev: 51120 },
      { name: "Guntur Teja Stemless Red Chilli", score: 92, sold: 680, orders: 39, rev: 132600 },
      { name: "Tandur GI-Tagged Red Gram (Toor Dal)", score: 94, sold: 950, orders: 45, rev: 147250 },
      { name: "Nizamabad Organic Raw Turmeric Fingers", score: 89, sold: 540, orders: 28, rev: 72900 },
      { name: "Banganapalli Sun-Ripened Mangoes", score: 96, sold: 1200, orders: 58, rev: 108000 },
      { name: "Gir Cow Pure A2 Desi Bilona Ghee", score: 97, sold: 85, orders: 34, rev: 114750 }
    ];

    for (const d of demandCrops) {
      await Demand.findOneAndUpdate(
        { cropName: d.name },
        {
          cropName: d.name,
          velocityScore: d.score,
          totalSold: d.sold,
          orderCount: d.orders,
          revenue: d.rev,
          seasonBoostMultiplier: 1.2,
          finalScore: Math.round(d.score * 1.2),
          evaluationWindowDays: 7
        },
        { upsert: true, new: true }
      );
    }

    // 10. Seed Farm Tour Bookings
    console.log("🚜 Seeding Farm Tour Bookings...");
    await FarmTourBooking.create({
      farmer: createdFarmers[0].user._id,
      customer: createdCustomers[0].user._id,
      date: new Date(Date.now() + 86400000 * 4),
      time: "09:30 AM",
      numberOfPeople: 4,
      totalPrice: 600,
      status: "confirmed",
      paymentStatus: "paid"
    });

    console.log("\n========================================================");
    console.log("🎉 SUCCESS: Authentic Real Agricultural Database Generated!");
    console.log("========================================================");
    console.log(`👨‍🌾 Farmers:    ${createdFarmers.length} authentic profiles`);
    console.log(`🛒 Customers:  ${createdCustomers.length} genuine buyers & stores`);
    console.log(`🚚 Agents:     ${createdAgents.length} verified logistics partners`);
    console.log(`👑 Admins:     ${createdAdmins.length} administrators`);
    console.log(`🌾 Crops:      ${createdCrops.length} realistic verified products`);
    console.log("========================================================");

    process.exit(0);

  } catch (error) {
    console.error("❌ Fatal Error seeding real database:", error);
    process.exit(1);
  }
};

seedRealDatabase();
