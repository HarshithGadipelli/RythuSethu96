import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";

// Models
import User from "./models/User.js";
import Farmer from "./models/Farmer.js";
import Customer from "./models/Customer.js";
import Agent from "./models/Agent.js";
import Crop from "./models/Crop.js";
import Order from "./models/Order.js";
import Delivery from "./models/Delivery.js";
import Auction from "./models/Auction.js";
import BoxSubscription from "./models/BoxSubscription.js";
import SoilTestRequest from "./models/SoilTestRequest.js";
import Review from "./models/Review.js";

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
  wheat: "http://localhost:5000/uploads/ai_wheat.jpg",
  toor_dal: "http://localhost:5000/uploads/ai_pulses_dal.jpg",
  moong_dal: "http://localhost:5000/uploads/ai_pulses_dal.jpg",
  brinjal: "http://localhost:5000/uploads/ai_brinjal.jpg",
  ladyfinger: "http://localhost:5000/uploads/ai_bhindi.jpg",
  ghee: "http://localhost:5000/uploads/ai_honey_ghee.jpg",
  honey: "http://localhost:5000/uploads/ai_honey_ghee.jpg",
  pomegranate: "http://localhost:5000/uploads/ai_pomegranate.jpg",
  millet: "http://localhost:5000/uploads/ai_millets.jpg",
  coconut: "http://localhost:5000/uploads/ai_coconut.jpg",
  apple: "http://localhost:5000/uploads/ai_apple.jpg",
  garlic_ginger: "http://localhost:5000/uploads/ai_garlic_ginger.jpg",
  orange: "http://localhost:5000/uploads/ai_orange.jpg"
};

// 42 Authentic Farmers
const REAL_FARMERS = [
  { name: "Ram Sharma", email: "ram@test.com", phone: "9876543210", loc: "Medak Mandal, Telangana", lat: 18.0478, lng: 78.2612, farm: "Shri Ram Natural Vedic Farms", size: 6.5, soil: "red_soil", exp: 14, score: 98, tour: true, tourFee: 150 },
  { name: "Srinivas Reddy", email: "farmer@test.com", phone: "9848011223", loc: "Shamshabad, Rangareddy", lat: 17.2403, lng: 78.4294, farm: "Green Acres Organic Estate", size: 12, soil: "red_soil", exp: 16, score: 96, tour: true, tourFee: 150 },
  { name: "Bikshapathi Reddy", email: "bikshapathi.reddy@gmail.com", phone: "9848123456", loc: "Narsampet, Warangal", lat: 17.9250, lng: 79.8920, farm: "Sri Laxmi Narasimha Agro Fields", size: 18, soil: "black_soil", exp: 22, score: 98, tour: true, tourFee: 200 },
  { name: "Thirupathi Rao", email: "thirupathi.rao@gmail.com", phone: "9440123456", loc: "Manakondur, Karimnagar", lat: 18.4050, lng: 79.1820, farm: "Godavari Delta Agro Ventures", size: 14, soil: "alluvial_soil", exp: 19, score: 94, tour: true, tourFee: 120 },
  { name: "Gangaiah Kuruma", email: "gangaiah.kuruma@gmail.com", phone: "9440234567", loc: "Korutla, Jagtial", lat: 18.8210, lng: 78.7120, farm: "Jagtial Golden Spice Plantation", size: 10, soil: "red_soil", exp: 24, score: 95, tour: false, tourFee: 0 },
  { name: "Kishan Rao Deshmukh", email: "kishan.rao@gmail.com", phone: "9490123456", loc: "Bodhan, Nizamabad", lat: 18.6725, lng: 77.8941, farm: "Deshmukh Heritage Sugarcane & Paddy", size: 25, soil: "black_soil", exp: 28, score: 97, tour: true, tourFee: 250 },
  { name: "Koteswara Rao Chowdary", email: "koteswara.chowdary@gmail.com", phone: "9849123456", loc: "Tenali, Guntur", lat: 16.2430, lng: 80.6400, farm: "Guntur Red Gold Spice Farms", size: 20, soil: "black_soil", exp: 25, score: 99, tour: true, tourFee: 180 },
  { name: "Sita Mahalakshmi", email: "sita.mahalakshmi@gmail.com", phone: "9849234567", loc: "Rajahmundry, East Godavari", lat: 17.0005, lng: 81.8040, farm: "Konaseema Natural Agro & Dairy", size: 15, soil: "alluvial_soil", exp: 18, score: 98, tour: true, tourFee: 150 },
  { name: "Ramana Murthy", email: "ramana.murthy@gmail.com", phone: "9441123456", loc: "Gannavaram, Krishna", lat: 16.5410, lng: 80.8010, farm: "Krishna Delta Pure Organics", size: 16, soil: "alluvial_soil", exp: 21, score: 95, tour: false, tourFee: 0 },
  { name: "Devender Chary", email: "devender.chary@gmail.com", phone: "9701123456", loc: "Ibrahimpatnam, Rangareddy", lat: 17.1850, lng: 78.6420, farm: "Sri Gayatri Polyhouse & Open Fields", size: 8, soil: "red_soil", exp: 12, score: 92, tour: true, tourFee: 100 },
  { name: "Chandraiah Yadav", email: "chandraiah.yadav@gmail.com", phone: "9701234567", loc: "Jadcherla, Mahabubnagar", lat: 16.7650, lng: 78.1400, farm: "Palamuru Desi Millets & Pulses", size: 12, soil: "red_soil", exp: 20, score: 94, tour: false, tourFee: 0 },
  { name: "Kavitha Narayana", email: "kavitha.narayana@gmail.com", phone: "9848234567", loc: "Hasanparthy, Warangal", lat: 18.0125, lng: 79.5823, farm: "Annapurna Women Farmers Collective", size: 9, soil: "loamy", exp: 11, score: 96, tour: true, tourFee: 100 },
  { name: "Mallesh Goud", email: "mallesh.goud@gmail.com", phone: "9848345678", loc: "Tupran, Medak", lat: 17.8540, lng: 78.4720, farm: "Venkateshwara Agro Orchard & Dairy", size: 14, soil: "red_soil", exp: 17, score: 95, tour: true, tourFee: 140 },
  { name: "Anjaiah Mudhiraj", email: "anjaiah.mudhiraj@gmail.com", phone: "9440345678", loc: "Gajwel, Siddipet", lat: 17.8520, lng: 78.6820, farm: "Gajwel Pragathi Polyhouse Vegetables", size: 7, soil: "red_soil", exp: 10, score: 93, tour: false, tourFee: 0 },
  { name: "Babu Rao Patil", email: "baburao.patil@gmail.com", phone: "9822123456", loc: "Dindori, Nashik, Maharashtra", lat: 20.2010, lng: 73.8320, farm: "Patil Sahyadri Grape & Onion Farms", size: 22, soil: "black_soil", exp: 26, score: 97, tour: true, tourFee: 200 },
  { name: "Gurpreet Singh Gill", email: "gurpreet.gill@gmail.com", phone: "9814123456", loc: "Samrala, Ludhiana, Punjab", lat: 30.8320, lng: 76.1920, farm: "Gill Brothers Golden Grain Agro", size: 35, soil: "alluvial_soil", exp: 30, score: 99, tour: false, tourFee: 0 },
  { name: "Manjunath Hegde", email: "manjunath.hegde@gmail.com", phone: "9448123456", loc: "Sirsi, Uttara Kannada, Karnataka", lat: 14.6190, lng: 74.8350, farm: "Western Ghats Spice & Vanilla Estate", size: 11, soil: "laterite_soil", exp: 23, score: 97, tour: true, tourFee: 220 },
  { name: "Palaniswamy Gounder", email: "palaniswamy.gounder@gmail.com", phone: "9443123456", loc: "Gobichettipalayam, Erode, Tamil Nadu", lat: 11.4520, lng: 77.4320, farm: "Bhavani River Delta Turmeric & Coconut", size: 16, soil: "alluvial_soil", exp: 27, score: 98, tour: true, tourFee: 150 },
  { name: "Satyanarayana Raju", email: "satyanarayana.raju@gmail.com", phone: "9849345678", loc: "Bhimavaram, West Godavari", lat: 16.5440, lng: 81.5210, farm: "Godavari Rice & Organic Aqua Farms", size: 20, soil: "alluvial_soil", exp: 22, score: 96, tour: false, tourFee: 0 },
  { name: "Laxman Rao Bhosle", email: "laxman.bhosle@gmail.com", phone: "9823123456", loc: "Baramati, Pune, Maharashtra", lat: 18.1520, lng: 74.5780, farm: "Bhosle Natural Sugarcane & Jaggery", size: 19, soil: "black_soil", exp: 20, score: 95, tour: true, tourFee: 180 },
  { name: "Basavaraj Patil", email: "basavaraj.patil@gmail.com", phone: "9449123456", loc: "Koppal, Karnataka", lat: 15.3450, lng: 76.1550, farm: "Tungabhadra Basin Organic Millets", size: 14, soil: "red_soil", exp: 15, score: 94, tour: false, tourFee: 0 },
  { name: "Chennaiah Naidu", email: "chennaiah.naidu@gmail.com", phone: "9848456789", loc: "Madanapalle, Annamayya Dist", lat: 13.5510, lng: 78.5020, farm: "Horsley Hills Fresh Tomato & Mango", size: 15, soil: "red_soil", exp: 21, score: 97, tour: true, tourFee: 120 },
  { name: "Harbhajan Singh", email: "harbhajan.singh@gmail.com", phone: "9815123456", loc: "Abohar, Fazilka, Punjab", lat: 30.1450, lng: 74.1950, farm: "Malwa Kinnow & Organic Mustard Fields", size: 30, soil: "alluvial_soil", exp: 32, score: 99, tour: false, tourFee: 0 },
  { name: "Muthuvel Karunanidhi", email: "muthuvel.k@gmail.com", phone: "9444123456", loc: "Kumbakonam, Thanjavur, Tamil Nadu", lat: 10.9600, lng: 79.3800, farm: "Cauvery Delta Heirloom Traditional Paddy", size: 18, soil: "alluvial_soil", exp: 25, score: 98, tour: true, tourFee: 160 },
  { name: "Venkateswarlu Somisetty", email: "venkateswarlu.s@gmail.com", phone: "9849456780", loc: "Markapur, Prakasam", lat: 15.6020, lng: 79.2700, farm: "Nallamala Border Wild Forest Honey & Millets", size: 12, soil: "red_soil", exp: 19, score: 96, tour: false, tourFee: 0 },
  { name: "Rajendra Deshmukh", email: "rajendra.deshmukh@gmail.com", phone: "9824123456", loc: "Pandharpur, Solapur, Maharashtra", lat: 17.6780, lng: 75.3250, farm: "Bhima Organic Pomegranate & Ber Orchards", size: 24, soil: "black_soil", exp: 24, score: 97, tour: true, tourFee: 200 },
  { name: "Shankarappa Gowda", email: "shankarappa.gowda@gmail.com", phone: "9448234567", loc: "Channapatna, Ramanagara, Karnataka", lat: 12.6520, lng: 77.2050, farm: "Gowda Heritage Desi Dairy & Coconut", size: 16, soil: "red_soil", exp: 26, score: 98, tour: true, tourFee: 150 },
  { name: "Narayana Swamy", email: "narayana.swamy@gmail.com", phone: "9848567890", loc: "Hindupur, Sri Sathya Sai Dist", lat: 13.8280, lng: 77.4920, farm: "Rayalaseema Silk Mulberry & Groundnut", size: 13, soil: "red_soil", exp: 17, score: 93, tour: false, tourFee: 0 },
  { name: "Baldev Singh Sandhu", email: "baldev.sandhu@gmail.com", phone: "9816123456", loc: "Nakodar, Jalandhar, Punjab", lat: 31.1250, lng: 75.4750, farm: "Doaba Green Pea & Seed Potato Hub", size: 28, soil: "alluvial_soil", exp: 29, score: 98, tour: false, tourFee: 0 },
  { name: "Suresh Kumar Patel", email: "suresh.patel@gmail.com", phone: "9825123456", loc: "Anand, Gujarat", lat: 22.5640, lng: 72.9280, farm: "Charotar Organic Banana & Turmeric Estate", size: 21, soil: "alluvial_soil", exp: 23, score: 96, tour: true, tourFee: 180 },
  { name: "Eshwar Reddy", email: "eshwar.reddy@gmail.com", phone: "9848678901", loc: "Miryalaguda, Nalgonda", lat: 16.8720, lng: 79.5620, farm: "Nagarjuna Sagar Delta BPT Rice Mills", size: 22, soil: "alluvial_soil", exp: 22, score: 97, tour: false, tourFee: 0 },
  { name: "Vasantha Kumari", email: "vasantha.kumari@gmail.com", phone: "9848789012", loc: "Khammam Rural, Telangana", lat: 17.2470, lng: 80.1510, farm: "Stambhadri Natural Spices & Chilli", size: 10, soil: "black_soil", exp: 14, score: 95, tour: true, tourFee: 120 },
  { name: "Bhoomi Reddy", email: "bhoomi.reddy@gmail.com", phone: "9848890123", loc: "Shadnagar, Rangareddy", lat: 17.0720, lng: 78.2050, farm: "Shadnagar Organic Farm Crate Hub", size: 11, soil: "red_soil", exp: 13, score: 94, tour: true, tourFee: 100 },
  { name: "Kondal Rao", email: "kondal.rao@gmail.com", phone: "9848901234", loc: "Suryapet, Telangana", lat: 17.1420, lng: 79.6230, farm: "Suryapet Golden Pulse & Oilseed Farms", size: 15, soil: "black_soil", exp: 18, score: 96, tour: false, tourFee: 0 },
  { name: "Nagender Chary", email: "nagender.chary@gmail.com", phone: "9848012345", loc: "Banswada, Kamareddy", lat: 18.3820, lng: 77.8820, farm: "Nizam Sagar Organic Sugarcane & Paddy", size: 17, soil: "black_soil", exp: 20, score: 95, tour: true, tourFee: 140 },
  { name: "Padmavati Amma", email: "padmavati.amma@gmail.com", phone: "9848123789", loc: "Tirupati Rural, Chittoor", lat: 13.6280, lng: 79.4190, farm: "Venkatadri Vedic Ghee & Natural Dairy", size: 14, soil: "red_soil", exp: 25, score: 99, tour: true, tourFee: 200 },
  { name: "Srinivasulu Chetty", email: "srinivasulu.chetty@gmail.com", phone: "9848234890", loc: "Dhone, Nandyal Dist", lat: 15.4220, lng: 77.8720, farm: "Kurnool Rock Soil Desi Bengal Gram", size: 16, soil: "black_soil", exp: 19, score: 94, tour: false, tourFee: 0 },
  { name: "Vidyasagar Rao", email: "vidyasagar.rao@gmail.com", phone: "9848345901", loc: "Vemulawada, Rajanna Sircilla", lat: 18.4720, lng: 78.8650, farm: "Sircilla Agro Textile Cotton & Pulses", size: 18, soil: "black_soil", exp: 23, score: 96, tour: true, tourFee: 130 },
  { name: "Lakshmi Bai", email: "lakshmi.bai@gmail.com", phone: "9848456012", loc: "Asifabad, Kumuram Bheem Dist", lat: 19.3550, lng: 79.2820, farm: "Gondwana Forest Organic Turmeric & Honey", size: 12, soil: "forest_soil", exp: 16, score: 97, tour: false, tourFee: 0 },
  { name: "Raja Ramanna", email: "raja.ramanna@gmail.com", phone: "9848567123", loc: "Kodangal, Vikarabad", lat: 17.1120, lng: 77.6250, farm: "Vikarabad Red Soil Tandur Dal Fields", size: 20, soil: "red_soil", exp: 22, score: 97, tour: true, tourFee: 150 },
  { name: "Krishna Murthy Bhat", email: "krishnamurthy.bhat@gmail.com", phone: "9448345678", loc: "Sringeri, Chikkamagaluru", lat: 13.4210, lng: 75.2550, farm: "Malnad Arecanut, Pepper & Cardamom", size: 13, soil: "laterite_soil", exp: 27, score: 98, tour: true, tourFee: 250 },
  { name: "Gurunanak Agro Farm", email: "gurunanak.agro@gmail.com", phone: "9817123456", loc: "Moga, Punjab", lat: 30.8120, lng: 75.1720, farm: "Shaheed Bhagat Singh Organic Grain Cooperative", size: 40, soil: "alluvial_soil", exp: 35, score: 99, tour: false, tourFee: 0 }
];

// 52 Real Customers Across Hyderabad & Tech Metros
const REAL_CUSTOMERS = [
  { name: "Rajesh Kumar (Raj)", email: "raj@test.com", phone: "9123456780", addr: "Villa 12, Jubilee Hills Road No 36, Hyderabad", lat: 17.4319, lng: 78.4073, type: "premium" },
  { name: "Anand Verma", email: "anand.verma@gmail.com", phone: "9871123456", addr: "Flat 402, Banjara Hills Road No 10, Hyderabad", lat: 17.4156, lng: 78.4350, type: "individual" },
  { name: "Dr. Sneha Reddy", email: "sneha.reddy@gmail.com", phone: "9871234567", addr: "My Home Bhooja, Block B, Hitec City, Hyderabad", lat: 17.4435, lng: 78.3772, type: "family" },
  { name: "Venkat Rao (Swagath Grand)", email: "venkat.swagath@gmail.com", phone: "9871345678", addr: "Swagath Grand Hotel, Inorbit Mall Road, Madhapur", lat: 17.4375, lng: 78.3850, type: "restaurant" },
  { name: "Priyanka Joshi", email: "priyanka.joshi@gmail.com", phone: "9871456789", addr: "House 24, KPHB Phase 4, Kukatpally, Hyderabad", lat: 17.4930, lng: 78.3980, type: "family" },
  { name: "Harish Naidu (FreshMarts Retail)", email: "harish.freshmart@gmail.com", phone: "9871567890", addr: "FreshMarts Superstore, Dilsukhnagar Main Road, Hyderabad", lat: 17.3688, lng: 78.5247, type: "supermarket" },
  { name: "Karthik Sundaram", email: "karthik.sundaram@gmail.com", phone: "9871678901", addr: "Aparna Sarovar, Nallagandla, Gachibowli, Hyderabad", lat: 17.4680, lng: 78.3120, type: "individual" },
  { name: "Lakshmi Prasanna", email: "lakshmi.prasanna@gmail.com", phone: "9871789012", addr: "Plot 88, West Marredpally, Secunderabad", lat: 17.4480, lng: 78.5020, type: "family" },
  { name: "Vikram Malhotra", email: "vikram.malhotra@gmail.com", phone: "9871890123", addr: "Jayabheri Silicon County, Kondapur, Hyderabad", lat: 17.4650, lng: 78.3620, type: "individual" },
  { name: "Sunil Narang", email: "sunil.narang@gmail.com", phone: "9871901234", addr: "Lanco Hills, Tower 8, Manikonda, Hyderabad", lat: 17.4080, lng: 78.3750, type: "family" },
  { name: "Deepa Krishnan", email: "deepa.krishnan@gmail.com", phone: "9871012345", addr: "PBEL City, Peeramcheruvu, TSPA Junction, Hyderabad", lat: 17.3450, lng: 78.3650, type: "family" },
  { name: "Abhishek Agarwal", email: "abhishek.agarwal@gmail.com", phone: "9872123456", addr: "SMR Vinay City, Miyapur, Hyderabad", lat: 17.4980, lng: 78.3550, type: "individual" },
  { name: "Kiranmai Reddy", email: "kiranmai.reddy@gmail.com", phone: "9872234567", addr: "Indu Fortune Fields, KPHB 13th Phase, Hyderabad", lat: 17.4910, lng: 78.3880, type: "family" },
  { name: "Rohit Deshpande", email: "rohit.deshpande@gmail.com", phone: "9872345678", addr: "Prestige High Fields, Financial District, Hyderabad", lat: 17.4180, lng: 78.3450, type: "individual" },
  { name: "Meenakshi Sundaram", email: "meenakshi.sundaram@gmail.com", phone: "9872456789", addr: "Aditya Empress Heights, Shaikpet, Tolichowki", lat: 17.4050, lng: 78.4020, type: "family" },
  { name: "Manoj Kumar", email: "manoj.kumar@gmail.com", phone: "9872567890", addr: "Rainbow Vistas, Green Hills Road, Moosapet", lat: 17.4720, lng: 78.4280, type: "family" },
  { name: "Swathi Bharadwaj", email: "swathi.bharadwaj@gmail.com", phone: "9872678901", addr: "Lodha Bellezza, Eden Square, KPHB, Hyderabad", lat: 17.4880, lng: 78.3950, type: "premium" },
  { name: "Praveen Varma", email: "praveen.varma@gmail.com", phone: "9872789012", addr: "NCC Urban Gardenia, Gachibowli Outer Ring Road", lat: 17.4410, lng: 78.3520, type: "individual" },
  { name: "Nandini Rao", email: "nandini.rao@gmail.com", phone: "9872890123", addr: "DivyaSree Republic of Whitefield, EPIP Zone, Bengaluru", lat: 12.9780, lng: 77.7280, type: "family" },
  { name: "Sanjay Singhania", email: "sanjay.singhania@gmail.com", phone: "9872901234", addr: "Singhania Caterers & Banquet, Begumpet, Hyderabad", lat: 17.4420, lng: 78.4680, type: "restaurant" },
  { name: "Bhavana Chawla", email: "bhavana.chawla@gmail.com", phone: "9873012345", addr: "Somajiguda Raj Bhavan Road, Hyderabad", lat: 17.4250, lng: 78.4550, type: "individual" },
  { name: "Gautam Gambhir", email: "gautam.g@gmail.com", phone: "9873123456", addr: "Sainikpuri Main Road, Secunderabad", lat: 17.4920, lng: 78.5450, type: "family" },
  { name: "Lavanya Tripuraneni", email: "lavanya.t@gmail.com", phone: "9873234567", addr: "Executive Enclave, Attapur, Hyderabad", lat: 17.3750, lng: 78.4280, type: "family" },
  { name: "Suresh Babu K", email: "suresh.babu.k@gmail.com", phone: "9873345678", addr: "Vanasthalipuram Red Tank Colony, Hyderabad", lat: 17.3320, lng: 78.5680, type: "individual" },
  { name: "Arunachalam Murthy", email: "arun.murthy@gmail.com", phone: "9873456789", addr: "HSR Layout Sector 2, Bengaluru", lat: 12.9120, lng: 77.6450, type: "individual" },
  { name: "Sudhakar Chennupati", email: "sudhakar.c@gmail.com", phone: "9873567890", addr: "Benz Circle, MG Road, Vijayawada", lat: 16.5050, lng: 80.6480, type: "family" },
  { name: "Radhika Merchant", email: "radhika.m@gmail.com", phone: "9873678901", addr: "Waltair Uplands, Siripuram, Visakhapatnam", lat: 17.7250, lng: 83.3180, type: "premium" },
  { name: "Chaitanya Jonnalagadda", email: "chaitanya.j@gmail.com", phone: "9873789012", addr: "Kompally Cine Planet Road, Hyderabad", lat: 17.5380, lng: 78.4850, type: "family" },
  { name: "Mounika Pasupuleti", email: "mounika.p@gmail.com", phone: "9873890123", addr: "Alwal Temple Alwal Road, Secunderabad", lat: 17.5050, lng: 78.5080, type: "individual" },
  { name: "Raghavendra Hegde", email: "raghav.hegde@gmail.com", phone: "9873901234", addr: "Indiranagar 100ft Road, Bengaluru", lat: 12.9720, lng: 77.6420, type: "individual" },
  { name: "Ananya Iyer", email: "ananya.iyer@gmail.com", phone: "9874012345", addr: "Adyar Gandhi Nagar, Chennai", lat: 13.0080, lng: 80.2550, type: "family" },
  { name: "Siddharth Kaul", email: "siddharth.kaul@gmail.com", phone: "9874123456", addr: "Aundh IT Park Road, Pune", lat: 18.5620, lng: 73.8050, type: "individual" },
  { name: "Naveen Polisetty", email: "naveen.p@gmail.com", phone: "9874234567", addr: "Pragathi Nagar, JNTU Road, Hyderabad", lat: 17.5120, lng: 78.3850, type: "individual" },
  { name: "Aparna Balamani", email: "aparna.b@gmail.com", phone: "9874345678", addr: "Tarnaka Street No 1, Secunderabad", lat: 17.4280, lng: 78.5350, type: "family" },
  { name: "Satish Kilaru", email: "satish.kilaru@gmail.com", phone: "9874456789", addr: "Uppal Ring Road, Hyderabad", lat: 17.4020, lng: 78.5600, type: "individual" },
  { name: "Geetha Govindam Mess", email: "geetha.govindam@gmail.com", phone: "9874567890", addr: "SR Nagar Main Road, Hyderabad", lat: 17.4450, lng: 78.4420, type: "restaurant" },
  { name: "Vamsi Krishna", email: "vamsi.krishna@gmail.com", phone: "9874678901", addr: "Nallakunta Vegetable Market Road, Hyderabad", lat: 17.3980, lng: 78.5080, type: "family" },
  { name: "Himabindu Talluri", email: "himabindu.t@gmail.com", phone: "9874789012", addr: "Habsiguda Street 8, Hyderabad", lat: 17.4150, lng: 78.5480, type: "family" },
  { name: "Sohail Ahmed", email: "sohail.ahmed@gmail.com", phone: "9874890123", addr: "Mehdipatnam Pillar 45, Hyderabad", lat: 17.3920, lng: 78.4400, type: "individual" },
  { name: "Srinivasa Kalyana Mandapam", email: "srinivasa.mandapam@gmail.com", phone: "9874901234", addr: "Nagole X Roads, Hyderabad", lat: 17.3750, lng: 78.5650, type: "restaurant" },
  { name: "Vandana Kulkarni", email: "vandana.k@gmail.com", phone: "9875012345", addr: "Koramangala 4th Block, Bengaluru", lat: 12.9320, lng: 77.6280, type: "family" },
  { name: "Kalyan Chakravarthy", email: "kalyan.c@gmail.com", phone: "9875123456", addr: "Guntur Brodiepet 4th Line", lat: 16.3050, lng: 80.4420, type: "individual" },
  { name: "Varun Tej", email: "varun.tej@gmail.com", phone: "9875234567", addr: "Madhura Nagar, Yousufguda, Hyderabad", lat: 17.4380, lng: 78.4350, type: "individual" },
  { name: "Madhavi Latha", email: "madhavi.latha@gmail.com", phone: "9875345678", addr: "Chintal Main Road, Quthbullapur, Hyderabad", lat: 17.5150, lng: 78.4520, type: "family" },
  { name: "Sai Dharam", email: "sai.dharam@gmail.com", phone: "9875456789", addr: "ECIL X Roads, Kushaiguda, Hyderabad", lat: 17.4850, lng: 78.5720, type: "individual" },
  { name: "Keerthi Suresh", email: "keerthi.suresh@gmail.com", phone: "9875567890", addr: "Film Nagar Site 2, Jubilee Hills, Hyderabad", lat: 17.4180, lng: 78.4120, type: "premium" },
  { name: "Ram Pothineni", email: "ram.pothineni@gmail.com", phone: "9875678901", addr: "Puppalguda Golden Mile, Narsingi, Hyderabad", lat: 17.3950, lng: 78.3620, type: "premium" },
  { name: "Shriya Saran", email: "shriya.saran@gmail.com", phone: "9875789012", addr: "Kokapet Neopolis Sector 1, Hyderabad", lat: 17.3820, lng: 78.3350, type: "premium" },
  { name: "Nani Ghanta", email: "nani.ghanta@gmail.com", phone: "9875890123", addr: "Gopanpally Gated Villa 9, Hyderabad", lat: 17.4480, lng: 78.2980, type: "premium" },
  { name: "Naga Chaitanya", email: "naga.chaitanya@gmail.com", phone: "9875901234", addr: "Tellapur Green Valley, Hyderabad", lat: 17.4720, lng: 78.2850, type: "premium" },
  { name: "Sharwanand Myneni", email: "sharwanand.m@gmail.com", phone: "9876012345", addr: "Gandipet Lake Breeze Villas, Hyderabad", lat: 17.3850, lng: 78.3150, type: "premium" },
  { name: "Anupama Parameswaran", email: "anupama.p@gmail.com", phone: "9876123456", addr: "Khajaguda Hills Road, Hyderabad", lat: 17.4220, lng: 78.3650, type: "premium" }
];

// 26 Logistics & Delivery Agents
const REAL_AGENTS = [
  { name: "Raju Delivery Express", email: "raju.agent@gmail.com", phone: "9848098765", type: "bike", vehicle: "Honda Shine (TS 09 EA 4128)", lat: 17.4350, lng: 78.4120, score: 98, pts: 320, tips: 480 },
  { name: "Shiva Kumar", email: "shiva.kumar@gmail.com", phone: "9848198765", type: "auto", vehicle: "TVS King Cargo (TS 07 UA 9182)", lat: 17.4420, lng: 78.3850, score: 96, pts: 280, tips: 360 },
  { name: "Suresh Goud (Agri Express)", email: "suresh.agri@gmail.com", phone: "9848298765", type: "truck", vehicle: "Tata Ace 2-Tonne (TS 03 TA 5519)", lat: 17.4120, lng: 78.4350, score: 99, pts: 540, tips: 820 },
  { name: "Mahesh Yadav", email: "mahesh.yadav@gmail.com", phone: "9848398765", type: "bike", vehicle: "Hero Splendor Plus (TS 08 FC 2910)", lat: 17.4850, lng: 78.3980, score: 95, pts: 210, tips: 290 },
  { name: "Naresh Transport Logistics", email: "naresh.transport@gmail.com", phone: "9848498765", type: "truck", vehicle: "Mahindra Bolero Maxi Truck (TS 02 GA 8831)", lat: 17.3850, lng: 78.4950, score: 97, pts: 490, tips: 750 },
  { name: "Kiran Goud", email: "kiran.goud@gmail.com", phone: "9848598765", type: "bike", vehicle: "TVS Raider 125 (TS 09 FH 1829)", lat: 17.4550, lng: 78.3650, score: 94, pts: 180, tips: 240 },
  { name: "Satish Kumar Varma", email: "satish.varma@gmail.com", phone: "9848698765", type: "auto", vehicle: "Piaggio Ape Cargo (TS 07 UB 4412)", lat: 17.4280, lng: 78.4480, score: 96, pts: 260, tips: 340 },
  { name: "Prasad Rao", email: "prasad.rao@gmail.com", phone: "9848798765", type: "bike", vehicle: "Bajaj Pulsar 150 (TS 08 GA 9012)", lat: 17.4680, lng: 78.3450, score: 93, pts: 150, tips: 200 },
  { name: "Gopal Krishna", email: "gopal.krishna@gmail.com", phone: "9848898765", type: "truck", vehicle: "Eicher Pro 14ft Cold Truck (TS 09 CT 7711)", lat: 17.3650, lng: 78.5350, score: 98, pts: 620, tips: 950 },
  { name: "Anji Reddy", email: "anji.reddy@gmail.com", phone: "9848998765", type: "bike", vehicle: "Honda Activa 6G (TS 10 HK 3321)", lat: 17.4080, lng: 78.4120, score: 95, pts: 190, tips: 270 },
  { name: "Bhanu Prakash", email: "bhanu.prakash@gmail.com", phone: "9848019876", type: "auto", vehicle: "Bajaj Maxima Z (TS 07 UC 6623)", lat: 17.4980, lng: 78.3680, score: 95, pts: 230, tips: 310 },
  { name: "Venu Madhav", email: "venu.madhav@gmail.com", phone: "9848129876", type: "bike", vehicle: "Hero Glamour (TS 08 FD 5514)", lat: 17.3950, lng: 78.4280, score: 92, pts: 140, tips: 180 },
  { name: "Mallesh Yadav", email: "mallesh.yadav@gmail.com", phone: "9848239876", type: "truck", vehicle: "Ashok Leyland Dost (TS 03 TB 9920)", lat: 17.4420, lng: 78.4720, score: 97, pts: 450, tips: 680 },
  { name: "Sai Teja", email: "sai.teja@gmail.com", phone: "9848349876", type: "bike", vehicle: "Yamaha FZ-S (TS 09 FJ 7812)", lat: 17.4650, lng: 78.3820, score: 97, pts: 310, tips: 420 },
  { name: "Rameshwar Rao", email: "rameshwar.rao@gmail.com", phone: "9848459876", type: "auto", vehicle: "Mahindra Alfa Cargo (TS 07 UD 8819)", lat: 17.4150, lng: 78.5020, score: 94, pts: 220, tips: 290 },
  { name: "Pawan Kalyan G", email: "pawan.kalyan.g@gmail.com", phone: "9848569876", type: "bike", vehicle: "Hero Passion Pro (TS 10 HM 1092)", lat: 17.4820, lng: 78.5450, score: 96, pts: 270, tips: 380 },
  { name: "Ravinder Reddy", email: "ravinder.reddy@gmail.com", phone: "9848679876", type: "truck", vehicle: "Tata Ace EV Electric (TS 09 EV 0045)", lat: 17.4320, lng: 78.3680, score: 99, pts: 580, tips: 890 },
  { name: "Govind Raj", email: "govind.raj@gmail.com", phone: "9848789876", type: "bike", vehicle: "TVS Apache RTR (TS 08 FE 4432)", lat: 17.4520, lng: 78.4250, score: 95, pts: 240, tips: 330 },
  { name: "Nagaraju P", email: "nagaraju.p@gmail.com", phone: "9848899876", type: "auto", vehicle: "TVS King Deluxe (TS 07 UE 1290)", lat: 17.3750, lng: 78.4650, score: 93, pts: 170, tips: 220 },
  { name: "Santosh Kumar M", email: "santosh.m@gmail.com", phone: "9848909876", type: "bike", vehicle: "Honda CB Shine (TS 09 FL 6721)", lat: 17.5120, lng: 78.3950, score: 97, pts: 330, tips: 460 },
  { name: "Vijay Simha", email: "vijay.simha@gmail.com", phone: "9848019877", type: "truck", vehicle: "Mahindra Bolero Maxi Truck Plus (AP 16 TX 7731)", lat: 16.5120, lng: 80.6420, score: 98, pts: 510, tips: 790 },
  { name: "Kishore Babu", email: "kishore.babu@gmail.com", phone: "9848129877", type: "bike", vehicle: "Hero Splendor (AP 16 AB 4519)", lat: 16.5250, lng: 80.6280, score: 95, pts: 220, tips: 300 },
  { name: "Lokesh Naidu", email: "lokesh.naidu@gmail.com", phone: "9848239877", type: "truck", vehicle: "Tata 407 Agri Transporter (AP 39 V 8820)", lat: 17.7150, lng: 83.2980, score: 97, pts: 480, tips: 720 },
  { name: "Manikanta S", email: "manikanta.s@gmail.com", phone: "9848349877", type: "bike", vehicle: "Honda Unicorn (AP 39 Z 1190)", lat: 17.7320, lng: 83.3120, score: 94, pts: 190, tips: 260 },
  { name: "Hariprasad K", email: "hariprasad.k@gmail.com", phone: "9848459877", type: "bike", vehicle: "TVS Star City (KA 04 EL 9912)", lat: 12.9650, lng: 77.6320, score: 96, pts: 290, tips: 390 },
  { name: "Devaraj Gowda", email: "devaraj.gowda@gmail.com", phone: "9848569877", type: "truck", vehicle: "Tata Ace Zip (KA 04 AB 3310)", lat: 12.9820, lng: 77.7120, score: 98, pts: 530, tips: 810 }
];

async function seedMassiveRealisticData() {
  await connectDB();
  console.log("🌾 ============================================================");
  console.log("🚀 COMMENCING SCALE DATA SEED: 120+ REALISTIC USERS & CROPS");
  console.log("🌾 ============================================================");

  const passwordHash = await bcrypt.hash("password123", 10);

  // Clear existing collections
  console.log("🧹 Skipping old mock data deletion to preserve existing user data...");

  // 1. Seed Admins
  console.log("👑 1. Seeding Platform Admins...");
  const adminUsers = await User.create([
    {
      name: "System Administrator",
      email: "admin@test.com",
      phone: "9999900000",
      password: passwordHash,
      role: "admin",
      location: "Hyderabad Central Operations",
      latitude: 17.3850,
      longitude: 78.4867,
      isVerified: true
    },
    {
      name: "Harshith Gadipelli (Platform Lead)",
      email: "harshith.admin@rythusethu.in",
      phone: "8688938604",
      password: passwordHash,
      role: "admin",
      location: "Rythu Sethu Agri Tech HQ, Hyderabad",
      latitude: 17.4399,
      longitude: 78.3809,
      isVerified: true
    }
  ]);

  // 2. Seed 42 Real Farmers
  console.log(`👨‍🌾 2. Seeding ${REAL_FARMERS.length} Authentic Indian Farmers...`);
  const seededFarmers = [];
  for (const f of REAL_FARMERS) {
    const u = await User.create({
      name: f.name,
      email: f.email,
      phone: f.phone,
      password: passwordHash,
      role: "farmer",
      location: f.loc,
      latitude: f.lat,
      longitude: f.lng,
      isVerified: true,
      trustScore: f.score,
      rewardPoints: Math.floor(Math.random() * 400) + 150,
      walletBalance: Math.floor(Math.random() * 8000) + 2000,
      avatar: "http://localhost:5000/uploads/ai_farmer_1.jpg",
      farmerProfile: {
        farmName: f.farm,
        farmLocation: f.loc,
        farmSize: f.size.toString(),
        soilType: f.soil,
        experience: f.exp.toString(),
        trustGrade: f.score > 96 ? "Platinum" : "Gold",
        farmerPhoto: "http://localhost:5000/uploads/ai_farmer_1.jpg",
        farmPhoto: "http://localhost:5000/uploads/ai_farm_1.jpg"
      }
    });

    await Farmer.create({
      user: u._id,
      farmName: f.farm,
      location: f.loc,
      farmSize: f.size,
      soilType: f.soil,
      experience: f.exp,
      trustScore: f.score,
      trustGrade: f.score > 96 ? "Platinum" : "Gold",
      farmTourEnabled: f.tour,
      farmTourPrice: f.tourFee,
      farmTourDetails: f.tour ? "Guided farm walkthrough, traditional bio-composting demo, and fresh refreshments." : ""
    });

    seededFarmers.push(u);
  }

  // 3. Seed 52 Real Customers
  console.log(`🛒 3. Seeding ${REAL_CUSTOMERS.length} Genuine Buyers & Restaurants...`);
  const seededCustomers = [];
  for (const c of REAL_CUSTOMERS) {
    const isSpecial = c.email === "raj@test.com";
    const u = await User.create({
      name: c.name,
      email: c.email,
      phone: c.phone,
      password: passwordHash,
      role: isSpecial ? "admin" : "customer",
      location: c.addr,
      latitude: c.lat,
      longitude: c.lng,
      isVerified: true,
      rewardPoints: Math.floor(Math.random() * 500) + 100,
      walletBalance: Math.floor(Math.random() * 6000) + 1500,
      customerProfile: {
        address: c.addr,
        customerType: c.type,
        requiresDailyDelivery: c.type === "family" || c.type === "restaurant"
      }
    });

    await Customer.create({
      user: u._id,
      address: c.addr,
      pincode: "500081",
      city: "Hyderabad",
      state: "Telangana",
      customerType: c.type,
      requiresDailyDelivery: c.type === "family" || c.type === "restaurant"
    });

    seededCustomers.push(u);
  }

  // 4. Seed 26 Delivery Fleet Agents
  console.log(`🚚 4. Seeding ${REAL_AGENTS.length} Logistics Fleet & Agents...`);
  const seededAgents = [];
  for (const a of REAL_AGENTS) {
    const u = await User.create({
      name: a.name,
      email: a.email,
      phone: a.phone,
      password: passwordHash,
      role: "agent",
      location: a.vehicle,
      latitude: a.lat,
      longitude: a.lng,
      isVerified: true,
      agentType: a.type,
      deliveryScore: a.score,
      rewardPoints: a.pts,
      walletBalance: a.tips + 1200,
      experiencePoints: a.pts * 2
    });

    await Agent.create({
      user: u._id,
      vehicle: a.vehicle,
      agentType: a.type,
      active: true,
      rating: 4.85,
      completedDeliveries: Math.floor(a.pts / 15) + 12
    });

    seededAgents.push({ user: u, meta: a });
  }

  // 5. Seed 100+ Realistic Crop Listings
  console.log("🌾 5. Seeding 100+ Authentic Crop Catalog...");
  const cropCatalogDefinitions = [
    // Grains
    { name: "Telangana Sona Rice (RNR 15048)", cat: "grain", price: 65, qty: 1500, unit: "kg", img: CROP_IMAGES.rice, org: true, desc: "Low Glycemic Index (GI 51.5) diabetic-friendly slender grain rice." },
    { name: "BPT 5204 Samba Masoori Rice", cat: "grain", price: 58, qty: 2200, unit: "kg", img: CROP_IMAGES.rice, org: false, desc: "Aromatic premium single-polish cooking rice from Krishna delta." },
    { name: "Sharbati MP Wheat (Kanak)", cat: "grain", price: 46, qty: 1800, unit: "kg", img: CROP_IMAGES.wheat, org: true, desc: "Golden heavy-grain Sharbati wheat, stone-ground quality." },
    { name: "Basmati 1121 Extra Long Grain", cat: "grain", price: 110, qty: 850, unit: "kg", img: CROP_IMAGES.rice, org: false, desc: "Aged royal Basmati with 8.4mm slender grain elongation." },
    { name: "Navara Ayurvedic Red Rice", cat: "grain", price: 135, qty: 400, unit: "kg", img: CROP_IMAGES.rice, org: true, desc: "Heirloom medicinal Kerala red rice with high antioxidant content." },
    
    // Vegetables
    { name: "Country Tomatoes (Naatu)", cat: "vegetable", price: 32, qty: 650, unit: "kg", img: CROP_IMAGES.tomato, org: true, desc: "Sun-ripened tangy desi country tomatoes with thin skin." },
    { name: "Fresh Baby Spinach (Palak)", cat: "vegetable", price: 24, qty: 280, unit: "kg", img: CROP_IMAGES.spinach, org: true, desc: "Iron-rich, tender leafy greens plucked at dawn." },
    { name: "Gutta Vankaya Brinjals", cat: "vegetable", price: 38, qty: 350, unit: "kg", img: CROP_IMAGES.brinjal, org: true, desc: "Small glossy purple stuffed curry brinjals." },
    { name: "Fresh Tender Bhindi (Okra)", cat: "vegetable", price: 42, qty: 310, unit: "kg", img: CROP_IMAGES.ladyfinger, org: true, desc: "Crisp green ladyfinger, zero fiber sting, organic crate." },
    { name: "Nashik Red Onions (Ghati)", cat: "vegetable", price: 28, qty: 1200, unit: "kg", img: CROP_IMAGES.onion, org: false, desc: "Pungent, long shelf-life dark pink onions from Nashik." },
    { name: "Agra Golden Potatoes", cat: "vegetable", price: 26, qty: 1400, unit: "kg", img: CROP_IMAGES.potato, org: false, desc: "Smooth skin, high starch cooking potatoes." },
    { name: "Ooty Sweet Baby Carrots", cat: "vegetable", price: 45, qty: 320, unit: "kg", img: CROP_IMAGES.carrot, org: true, desc: "Crunchy sweet mountain carrots rich in beta-carotene." },
    { name: "Fresh Snowball Cauliflower", cat: "vegetable", price: 34, qty: 260, unit: "kg", img: CROP_IMAGES.cauliflower, org: true, desc: "Dense white pesticide-free florets." },
    { name: "Crisp Green Cabbage", cat: "vegetable", price: 22, qty: 450, unit: "kg", img: CROP_IMAGES.cabbage, org: false, desc: "Tight-head fresh farm cabbage." },
    { name: "Organic Garlic & Ginger Roots", cat: "spice", price: 180, qty: 220, unit: "kg", img: CROP_IMAGES.garlic_ginger, org: true, desc: "Earthy high-pungency native garlic pods and fresh ginger rhizomes." },
    
    // Fruits
    { name: "Banganapalli Sweet Mangoes", cat: "fruit", price: 140, qty: 750, unit: "kg", img: CROP_IMAGES.mango, org: true, desc: "Naturally carbide-free tree-ripened royal Andhra mangoes." },
    { name: "Bhagwa Ruby Pomegranates", cat: "fruit", price: 160, qty: 420, unit: "kg", img: CROP_IMAGES.pomegranate, org: true, desc: "Deep red juicy sweet arils from Solapur organic orchards." },
    { name: "Yelakki Sweet Bananas", cat: "fruit", price: 55, qty: 600, unit: "kg", img: CROP_IMAGES.banana, org: true, desc: "Small fragrant honey-sweet bananas from Konaseema." },
    { name: "Fresh Tender Green Coconuts", cat: "fruit", price: 40, qty: 800, unit: "kg", img: CROP_IMAGES.coconut, org: true, desc: "Sweet electrolyte-rich tender coconut water and soft malai." },
    { name: "Shimla Royal Delicious Apples", cat: "fruit", price: 180, qty: 380, unit: "kg", img: CROP_IMAGES.apple, org: true, desc: "Crisp mountain harvest red apples with natural fruit wax." },
    { name: "Nagpur Sweet Oranges (Santra)", cat: "fruit", price: 75, qty: 520, unit: "kg", img: CROP_IMAGES.orange, org: true, desc: "Juicy high Vitamin-C sweet citrus oranges." },
    
    // Spices, Pulses & Millets
    { name: "Guntur Teja Red Chillies", cat: "spice", price: 195, qty: 500, unit: "kg", img: CROP_IMAGES.red_chilli, org: true, desc: "High SHU pungency sun-dried bright red chillies." },
    { name: "Salem Turmeric Fingers (Curcumin 4.8%)", cat: "spice", price: 175, qty: 620, unit: "kg", img: CROP_IMAGES.turmeric, org: true, desc: "Golden yellow unpolished turmeric rhizomes." },
    { name: "Tandur Desi Red Gram (Toor Dal)", cat: "pulse", price: 145, qty: 900, unit: "kg", img: CROP_IMAGES.toor_dal, org: true, desc: "GI-tagged GI-registered Tandur Toor Dal, quick cooking." },
    { name: "Unpolished Organic Moong Dal", cat: "pulse", price: 130, qty: 650, unit: "kg", img: CROP_IMAGES.moong_dal, org: true, desc: "Chemical-free split yellow lentils." },
    { name: "Foxtail Millet (Korra Biyyam)", cat: "grain", price: 82, qty: 450, unit: "kg", img: CROP_IMAGES.millet, org: true, desc: "Ancient superfood grain with low GI and high dietary fiber." },
    { name: "Ragi (Finger Millet Grain)", cat: "grain", price: 52, qty: 700, unit: "kg", img: CROP_IMAGES.millet, org: true, desc: "Calcium-rich traditional ragi grains for health porridge." },
    
    // Farm Organics & Dairy
    { name: "Vedic A2 Desi Cow Bilona Ghee", cat: "dairy", price: 1650, qty: 120, unit: "kg", img: CROP_IMAGES.ghee, org: true, desc: "Hand-churned wooden bilona ghee from grass-fed Gir cows." },
    { name: "Nallamala Wild Forest Raw Honey", cat: "other", price: 580, qty: 160, unit: "kg", img: CROP_IMAGES.honey, org: true, desc: "Unpasteurized, unprocessed multifloral raw forest honey." },
    { name: "Non-GMO Soya Bean", cat: "grain", price: 55, qty: 950, unit: "kg", img: CROP_IMAGES.soya, org: true, desc: "High protein organic soya beans for milk and tofu." }
  ];

  const createdCrops = [];
  for (let i = 0; i < seededFarmers.length; i++) {
    const farmer = seededFarmers[i];
    const cropDef1 = cropCatalogDefinitions[i % cropCatalogDefinitions.length];
    const cropDef2 = cropCatalogDefinitions[(i + 7) % cropCatalogDefinitions.length];

    for (const cDef of [cropDef1, cropDef2]) {
      const crop = await Crop.create({
        name: cDef.name,
        category: cDef.cat,
        price: cDef.price,
        quantity: cDef.qty,
        unit: cDef.unit,
        farmer: farmer._id,
        isOrganic: cDef.org,
        isPesticideFree: true,
        image: cDef.img,
        location: farmer.location,
        description: cDef.desc,
        shelfLife: cDef.cat === "grain" || cDef.cat === "pulse" ? "12 months" : "6-8 days",
        harvestDate: new Date(Date.now() - 86400000 * (i % 5)),
        farmTourUrl: farmer.farmerProfile?.farmTourPrice ? "http://localhost:5000/uploads/ai_farm_1.jpg" : ""
      });
      createdCrops.push(crop);
    }
  }
  console.log(`   ↳ Total ${createdCrops.length} verified crops registered across farmers.`);

  // 6. Seed 35 Realistic Multi-Crop Orders & Delivery Performance
  console.log("📦 6. Seeding Realistic Orders & Fast-Track SLA Deliveries...");
  for (let i = 0; i < 35; i++) {
    const crop = createdCrops[i % createdCrops.length];
    const cust = seededCustomers[i % seededCustomers.length];
    const agentObj = seededAgents[i % seededAgents.length];

    const qty = (i % 4 + 1) * 3;
    const subtotal = crop.price * qty;
    const isDelivered = i < 22;
    const isInTransit = i >= 22 && i < 29;
    const status = isDelivered ? "delivered" : isInTransit ? "in_transit" : "assigned";

    const deadline = new Date(Date.now() + 1800000);
    const deliveredAt = isDelivered ? new Date(Date.now() - 3600000 * 2) : null;

    const order = await Order.create({
      crop: crop._id,
      customer: cust._id,
      farmer: crop.farmer,
      agent: agentObj.user._id,
      quantity: qty,
      subtotal: subtotal,
      deliveryCharges: 40,
      platformFee: Math.round(subtotal * 0.05),
      totalAmount: subtotal + 40 + Math.round(subtotal * 0.05),
      status: status,
      paymentMode: i % 2 === 0 ? "upi" : "cod",
      paymentStatus: isDelivered ? "paid" : "paid",
      pickupAddress: crop.location,
      deliveryAddress: cust.location,
      deliveryLatitude: cust.latitude,
      deliveryLongitude: cust.longitude,
      verificationCode: (100000 + i * 456).toString(),
      estimatedDeliveryDeadline: deadline,
      deliveryPerformance: isDelivered ? {
        deliveredAt: deliveredAt,
        deadline: deadline,
        diffMinutes: 14,
        isEarly: true,
        isLate: false,
        speedBonusPoints: 35,
        speedBonusCash: 20,
        deliveryScoreChange: 4
      } : {},
      productSnapshot: {
        name: crop.name,
        category: crop.category,
        isOrganic: crop.isOrganic,
        isPesticideFree: crop.isPesticideFree,
        quantity: qty,
        unit: crop.unit,
        price: crop.price,
        image: crop.image,
        location: crop.location
      },
      timeline: [
        { status: "confirmed", note: "Order accepted by farmer", timestamp: new Date(Date.now() - 3600000 * 4) },
        { status: "processing", note: "Freshly harvested and packed", timestamp: new Date(Date.now() - 3600000 * 3) },
        { status: status, note: `Status updated to ${status}`, timestamp: new Date(Date.now() - 3600000) }
      ]
    });

    await Delivery.create({
      order: order._id,
      agent: agentObj.user._id,
      pickupLocation: crop.location,
      deliveryLocation: cust.location,
      pickupLatitude: 17.4000,
      pickupLongitude: 78.4500,
      deliveryLatitude: cust.latitude,
      deliveryLongitude: cust.longitude,
      agentLatitude: cust.latitude ? cust.latitude + 0.005 : 17.4000,
      agentLongitude: cust.longitude ? cust.longitude + 0.005 : 78.4500,
      vehicleType: agentObj.meta.type,
      agentPhone: agentObj.meta.phone,
      status: status,
      trackingCode: `TRK-${order._id.toString().slice(-6).toUpperCase()}`,
      estimatedTime: "20 mins",
      estimatedMinutes: 20,
      estimatedDeliveryDeadline: deadline,
      deliveredAt: deliveredAt,
      deliveryPerformance: order.deliveryPerformance
    });

    if (isDelivered) {
      await Review.create({
        user: cust._id,
        crop: crop._id,
        farmer: crop.farmer,
        rating: 5,
        comment: `Excellent genuine farm quality ${crop.name}. Received fresh and on-time.`
      });
    }
  }

  // 7. Seed Live Crop Auctions
  console.log("🔨 7. Seeding Live Bidding Auctions...");
  for (let i = 0; i < 8; i++) {
    const aCrop = createdCrops[i * 4];
    if (aCrop) {
      await Auction.create({
        crop: aCrop._id,
        farmer: aCrop.farmer,
        quantity: 250,
        startingBid: Math.round(aCrop.price * 0.85),
        currentHighestBid: Math.round(aCrop.price * 0.85) + 12,
        highestBidder: seededCustomers[1]._id,
        endTime: new Date(Date.now() + 86400000 * 3),
        status: "active",
        bids: [
          { bidder: seededCustomers[1]._id, amount: Math.round(aCrop.price * 0.85) + 12, time: new Date() }
        ]
      });
    }
  }

  // 8. Seed Curated Farm Boxes
  console.log("📦 8. Seeding Farm Box Subscriptions...");
  for (let i = 0; i < 6; i++) {
    const cust = seededCustomers[i * 2];
    await BoxSubscription.create({
      customer: cust._id,
      boxType: i % 2 === 0 ? "Organic Weekly Green Basket" : "Diabetic Health Grain & Veggie Box",
      price: 699,
      frequency: "weekly",
      status: "active",
      nextDeliveryDate: new Date(Date.now() + 86400000 * 3),
      deliveryAddress: cust.location
    });
  }

  // 9. Seed Soil Testing Appointments
  console.log("🧪 9. Seeding Certified Soil Lab Appointments...");
  for (let i = 0; i < 8; i++) {
    const f = seededFarmers[i];
    const isReady = i < 4;
    await SoilTestRequest.create({
      farmer: f._id,
      farmerName: f.name,
      phone: f.phone,
      farmLocation: f.location,
      latitude: f.latitude,
      longitude: f.longitude,
      farmSizeAcres: Number(f.farmerProfile?.farmSize) || 5,
      soilPhoto: "/uploads/ai_farm_1.jpg",
      aiPreliminaryClassification: {
        soilType: i % 2 === 0 ? "Red Sandy Loam Soil" : "Black Cotton Soil (Regur)",
        confidence: 94,
        texture: "Porous crumbly structure with optimal water permeability and rich mineral nutrients",
        colorProfile: i % 2 === 0 ? "Terracotta Reddish Loam" : "Dark Carbon Black",
        organicMatterEstimate: "Medium to High (0.72%)",
        suitableCrops: ["Organic Paddy", "Tomatoes", "Millets", "Cotton", "Pulses"]
      },
      appointmentDetails: {
        preferredDate: new Date(Date.now() + 86400000 * (i + 1)),
        preferredTimeSlot: "Morning (8:00 AM - 12:00 PM)",
        samplingSpotsCount: 3,
        advanceAmount: 299,
        totalEstimatedFee: 799,
        balanceAmount: 500,
        paymentMode: "upi",
        paymentStatus: "paid",
        paymentTxnId: `SOIL-ADV-${f.name.slice(0, 3).toUpperCase()}-${i}`
      },
      status: isReady ? "report_published" : "team_assigned",
      assignedTeam: {
        scientistName: i % 2 === 0 ? "Dr. Arvind Swamy (Soil Chemist - Unit 04)" : "Dr. P. Sunita (Agronomy Lab Lead - Unit 02)",
        teamVehicleNumber: i % 2 === 0 ? "TS-09-LAB-1029" : "TS-07-AG-8812",
        contactPhone: "9848099881",
        assignedAt: new Date(Date.now() - 86400000 * 2),
        scheduledVisitDate: new Date(Date.now() + 86400000),
        adminNotes: "Mobile spectrometer unit assigned for on-field soil sampling."
      },
      soilHealthReport: isReady ? {
        phLevel: 6.8 + (i * 0.1),
        phCategory: "Optimal / Neutral",
        nitrogenN: "275 kg/ha (Medium)",
        phosphorusP: "26 kg/ha (Adequate)",
        potassiumK: "340 kg/ha (High)",
        organicCarbonPercent: 0.74,
        electricalConductivityEC: "0.36 dS/m (Normal)",
        micronutrients: {
          zinc: "1.45 ppm (Sufficient)",
          iron: "6.8 ppm (Adequate)",
          boron: "0.62 ppm (Moderate)"
        },
        recommendedManure: "Apply 2 tonnes/acre Farm Yard Manure + 250kg Vermicompost + 5kg PSB biofertilizer.",
        publishedAt: new Date()
      } : {}
    });
  }

  console.log("============================================================");
  console.log("🎉 MASSIVE REALISTIC DATABASE SEED COMPLETED SUCCESSFULLY!");
  console.log(`👨‍🌾 Farmers:    ${seededFarmers.length}`);
  console.log(`🛒 Customers:  ${seededCustomers.length}`);
  console.log(`🚚 Agents:     ${seededAgents.length}`);
  console.log(`👑 Admins:     ${adminUsers.length}`);
  console.log(`🌾 Crops:      ${createdCrops.length}`);
  console.log(`📦 Orders:     35`);
  console.log(`🧪 Soil Tests: 8`);
  console.log("============================================================");
  process.exit(0);
}

seedMassiveRealisticData();
