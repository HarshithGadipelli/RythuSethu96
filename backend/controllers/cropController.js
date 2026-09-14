import Crop from "../models/Crop.js";

const REAL_CROP_IMAGE_MAP = {
  coconut: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&auto=format&fit=crop&q=80",
  kobbari: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&auto=format&fit=crop&q=80",
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
  sebu: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
  orange: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  santra: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  battai: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  navara: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
  "red rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
  basmati: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  sona: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  bpt: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  paddy: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  kanak: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  sharbati: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  corn: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  makka: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  ragi: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
  "finger millet": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
  foxtail: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  korra: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  korralu: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  millet: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  toor: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  "red gram": "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  kandi: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  moong: "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  "green gram": "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  pesalu: "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  soya: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  soybean: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  groundnut: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  peanut: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  dal: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  naatu: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  onion: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  ghati: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
  spinach: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
  palak: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
  cabbage: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=80",
  cauliflower: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80",
  vankaya: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  brinjal: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  eggplant: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  bhindi: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  okra: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  ladyfinger: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  "ladies finger": "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  carrot: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=600&auto=format&fit=crop&q=80",
  garlic: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80",
  ginger: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
  turmeric: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
  pasupu: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
  chilli: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  chillies: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  mirchi: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  coriander: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
  dhania: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
  pomegranate: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&auto=format&fit=crop&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
  ghee: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
  honey: "https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=600&auto=format&fit=crop&q=80",
  jaggery: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  bellam: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  sugarcane: "https://images.unsplash.com/photo-1596753392437-05c8733230c1?w=600&auto=format&fit=crop&q=80",
  cotton: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
  "sesame oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80"
};

export const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find().populate("farmer").lean();
    
    // Ensure every crop has a valid, accurate photo
    const sanitized = crops.map(c => {
      if (!c.image || c.image.includes("localhost") || c.image.includes("127.0.0.1") || c.image.includes("/uploads/")) {
        const clean = ((c.name || "") + " " + (c.category || "")).toLowerCase();
        for (const [k, url] of Object.entries(REAL_CROP_IMAGE_MAP)) {
          if (clean.includes(k)) {
            c.image = url;
            break;
          }
        }
        if (!c.image || c.image.includes("localhost")) {
          c.image = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
        }
      }
      return c;
    });

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch crops", error: error.message });
  }
};
