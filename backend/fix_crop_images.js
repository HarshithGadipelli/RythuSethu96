import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Crop from "./models/Crop.js";

const CROP_IMAGE_DICTIONARY = [
  // ── RICE & GRAINS ──
  { match: ["sona", "bpt", "rnr", "samba", "paddy", "rice", "biyyam", "chawal"], url: "http://localhost:5000/uploads/ai_rice.jpg" },
  { match: ["wheat", "sharbati", "gehun", "atta"], url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80" },
  { match: ["maize", "corn", "makka", "makkajonna"], url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80" },
  { match: ["millet", "foxtail", "korralu", "ragi", "jowar", "bajra"], url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80" },

  // ── VEGETABLES ──
  { match: ["tomato", "tamota", "tamatar", "tamatam"], url: "http://localhost:5000/uploads/ai_tomato.jpg" },
  { match: ["onion", "ullipaya", "ulli", "pyaaz", "kanda"], url: "http://localhost:5000/uploads/ai_onion.jpg" },
  { match: ["potato", "aalu", "alu", "bangaladumpa", "aloo", "batata"], url: "http://localhost:5000/uploads/potato.png" },
  { match: ["spinach", "palak", "palakura", "greens", "saag"], url: "http://localhost:5000/uploads/ai_spinach.jpg" },
  { match: ["cabbage", "patta gobhi", "kosa"], url: "http://localhost:5000/uploads/ai_cabbage.jpg" },
  { match: ["cauliflower", "phool gobhi", "gobi"], url: "http://localhost:5000/uploads/ai_cauliflower.jpg" },
  { match: ["brinjal", "vankaya", "baingan", "eggplant", "aubergine"], url: "https://images.unsplash.com/photo-1628773822503-930a84d0ef9a?w=600&auto=format&fit=crop&q=80" },
  { match: ["bhindi", "bhendi", "ladyfinger", "ladies finger", "okra", "bendakaya"], url: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80" },
  { match: ["carrot", "gajar"], url: "http://localhost:5000/uploads/carrot.png" },
  { match: ["ginger", "allam", "adrak"], url: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80" },
  { match: ["garlic", "vellulli", "lahsun"], url: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80" },

  // ── FRUITS ──
  { match: ["mango", "alphonso", "banganapalli", "mamidi", "aam"], url: "http://localhost:5000/uploads/ai_mango.jpg" },
  { match: ["banana", "robusta", "arati", "kela"], url: "http://localhost:5000/uploads/ai_banana.jpg" },
  { match: ["pomegranate", "bhagwa", "danimma", "anar"], url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80" },
  { match: ["apple", "seb"], url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80" },
  { match: ["watermelon", "tarbooz", "puchakaya"], url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80" },

  // ── SPICES ──
  { match: ["chilli", "chillies", "mirchi", "mirch", "teja", "byadagi"], url: "http://localhost:5000/uploads/ai_red_chilli.jpg" },
  { match: ["turmeric", "pasupu", "haldi"], url: "http://localhost:5000/uploads/ai_turmeric.jpg" },
  { match: ["coriander", "dhania", "kothimeera"], url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80" },

  // ── PULSES ──
  { match: ["toor", "red gram", "kandi pappu", "arhar"], url: "https://images.unsplash.com/photo-1585994192704-561b2cb38a08?w=600&auto=format&fit=crop&q=80" },
  { match: ["moong", "green gram", "pesara pappu"], url: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80" },
  { match: ["soya", "soybean", "soyabean"], url: "http://localhost:5000/uploads/ai_soya.jpg" },
  { match: ["groundnut", "peanut", "pallilu", "moongphali"], url: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80" },

  // ── DAIRY, BYPRODUCTS & OTHER ──
  { match: ["ghee", "butter", "milk", "dairy"], url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80" },
  { match: ["honey", "thene", "madhu"], url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80" },
  { match: ["jaggery", "bellam", "gur"], url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80" },
  { match: ["oil", "sesame", "til oil", "nune"], url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80" },
  { match: ["cotton", "kapas", "prathi"], url: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80" },
  { match: ["sugarcane", "cheraku", "ganna"], url: "https://images.unsplash.com/photo-1596753392437-05c8733230c1?w=600&auto=format&fit=crop&q=80" },
];

function getAccurateImage(name = "", category = "") {
  const clean = (name + " " + category).toLowerCase();
  for (const entry of CROP_IMAGE_DICTIONARY) {
    if (entry.match.some(keyword => clean.includes(keyword))) {
      return entry.url;
    }
  }
  // Category defaults
  if (category === "vegetable") return "http://localhost:5000/uploads/ai_tomato.jpg";
  if (category === "fruit") return "http://localhost:5000/uploads/ai_mango.jpg";
  if (category === "grain") return "http://localhost:5000/uploads/ai_rice.jpg";
  if (category === "pulse") return "http://localhost:5000/uploads/ai_soya.jpg";
  if (category === "spice") return "http://localhost:5000/uploads/ai_turmeric.jpg";
  return "http://localhost:5000/uploads/ai_rice.jpg";
}

async function fixAllCropImages() {
  await connectDB();
  const crops = await Crop.find({});
  console.log(`Checking and repairing images for ${crops.length} crops...`);

  let updatedCount = 0;
  for (const crop of crops) {
    const accurateUrl = getAccurateImage(crop.name, crop.category);

    // If empty or if we have an exact dictionary match that is better than broken placeholder
    const isLocalUpload = crop.image && crop.image.includes("/uploads/image-");
    const isEmpty = !crop.image || crop.image.trim() === "" || crop.image === "EMPTY";

    // Re-verify if current image is an exact match for the crop
    const currentImg = crop.image || "";
    let shouldUpdate = isEmpty;

    if (!isEmpty) {
      // Check if current image matches the crop name
      const cleanName = crop.name.toLowerCase();
      if (cleanName.includes("onion") && !currentImg.includes("onion")) shouldUpdate = true;
      if (cleanName.includes("tomato") && !currentImg.includes("tomato")) shouldUpdate = true;
      if (cleanName.includes("potato") && !currentImg.includes("potato")) shouldUpdate = true;
      if (cleanName.includes("mango") && !currentImg.includes("mango")) shouldUpdate = true;
      if (cleanName.includes("banana") && !currentImg.includes("banana")) shouldUpdate = true;
      if (cleanName.includes("rice") && !currentImg.includes("rice")) shouldUpdate = true;
      if (cleanName.includes("spinach") && !currentImg.includes("spinach")) shouldUpdate = true;
      if (cleanName.includes("cabbage") && !currentImg.includes("cabbage")) shouldUpdate = true;
      if (cleanName.includes("cauliflower") && !currentImg.includes("cauliflower")) shouldUpdate = true;
      if (cleanName.includes("turmeric") && !currentImg.includes("turmeric")) shouldUpdate = true;
      if (cleanName.includes("chilli") && !currentImg.includes("chilli")) shouldUpdate = true;
      if (cleanName.includes("soya") && !currentImg.includes("soya")) shouldUpdate = true;
    }

    if (shouldUpdate) {
      crop.image = accurateUrl;
      await crop.save();
      updatedCount++;
      console.log(`✅ Fixed [${crop.name}] ➡️ ${accurateUrl}`);
    }
  }

  console.log(`\n🎉 Image Repair Complete! Updated ${updatedCount} crops.`);
  process.exit(0);
}

fixAllCropImages();
