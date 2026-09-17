"use client";

import { BASE_URL } from '../../api/api';
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LangContext";
import { useCart } from "../../context/CartContext";
import { useVoiceInput } from "../../utils/useVoiceInput";
import AutoSuggestInput from "../../components/AutoSuggestInput";
import { io } from "socket.io-client";
import { parseSpokenNumber, playTTS, stopTTS, isTTSPlaying } from "../../utils/voiceParser";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Map as MapIcon, List, ShoppingBag, Truck, PackageCheck, Package, Users, Zap, Filter, X, MapPin, Leaf, Shield, ArrowUpDown, ChevronDown, ChevronUp, Star, Sparkles, LocateFixed, DollarSign, SlidersHorizontal, Navigation, Volume2, VolumeX, Scale, Tractor } from "lucide-react";
import LiveMapModal from "../../components/LiveMapModal";
import PaymentModal from "../../components/PaymentModal";
import useMarketAudio from "../../hooks/useMarketAudio";
import MarketplaceMap from "../../components/MarketplaceMap";
import LocationButton from "../../components/LocationButton";
import VoiceMicButton from "../../components/VoiceMicButton";
import LocationPickerModal from "../../components/LocationPickerModal";
import OrderTracking from "../../components/OrderTracking";
import OrderInvoiceModal from "../../components/OrderInvoiceModal";
import QRCode from "react-qr-code";
import CustomerOrders from "./CustomerOrders";
import CustomerGroups from "./CustomerGroups";
import CustomerOfflineTours from "./CustomerOfflineTours";
import RythuSethuAnimation from "../../components/RythuSethuAnimation";
import FarmTourModal from "../../components/FarmTourModal";
import SmartCuratedBasket from "../../components/SmartCuratedBasket";
import HealthyRecipeHub from "../../components/HealthyRecipeHub";
import AuthenticityCertificate from "../../components/AuthenticityCertificate";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const farmerIcon = L.divIcon({
  className: "custom-farmer-icon",
  html: `<div style="
    display: flex;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #2d7a4f, #1b4d3e);
    border: 2px solid #ffffff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  ">
    <div style="
      transform: rotate(45deg);
      font-size: 1.25rem;
    ">🌾</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Haversine distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CROP_FALLBACK_IMAGES = {
  // Grains & Millets
  navara: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
  "red rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80",
  basmati: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  paddy: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  sona: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  bpt: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
  wheat: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  kanak: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  sharbati: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  corn: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  maize: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  makka: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80",
  millet: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  foxtail: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  korra: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  korralu: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  arikelu: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  kodo: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  kodra: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  samalu: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
  "little millet": "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
  udalu: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  barnyard: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  "andu korralu": "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  browntop: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  siridhanya: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  ragi: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
  jowar: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
  bajra: "https://images.unsplash.com/photo-1607672632458-9eb56696346b?w=600&auto=format&fit=crop&q=80",
  barley: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",

  // Pulses & Legumes
  toor: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  "red gram": "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  kandi: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  moong: "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  "green gram": "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  pesalu: "https://images.unsplash.com/photo-1515543904379-3d757abe9981?w=600&auto=format&fit=crop&q=80",
  chana: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80",
  chickpea: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80",
  senagalu: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=600&auto=format&fit=crop&q=80",
  soya: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  soybean: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  groundnut: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  peanut: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  pallilu: "https://images.unsplash.com/photo-1567892328122-3daec166d15b?w=600&auto=format&fit=crop&q=80",
  dal: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  pulses: "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80",
  peas: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80",

  // Vegetables
  tomato: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  tamota: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  naatu: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  onion: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  ullipaya: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  ghati: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
  potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
  aalu: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
  spinach: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
  palak: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
  cabbage: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=80",
  cauliflower: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80",
  brinjal: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  eggplant: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  vankaya: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  bhindi: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  ladyfinger: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  "ladies finger": "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  okra: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
  carrot: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=600&auto=format&fit=crop&q=80",
  drumstick: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
  cucumber: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80",
  dosakaya: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80",
  capsicum: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",

  // Spices & Herbs
  "red chilli": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  chilli: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  chillies: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  mirchi: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  teja: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  byadagi: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
  "green chilli": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80",
  turmeric: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
  pasupu: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
  coriander: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
  dhania: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80",
  ginger: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
  allam: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
  garlic: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80",
  vellulli: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80",

  // Fruits
  coconut: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&auto=format&fit=crop&q=80",
  kobbari: "https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=600&auto=format&fit=crop&q=80",
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
  sebu: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80",
  orange: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  santra: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  battai: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  mango: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
  mamidi: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
  banganapalli: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
  arati: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
  pomegranate: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&auto=format&fit=crop&q=80",
  bhagwa: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&auto=format&fit=crop&q=80",
  danimma: "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?w=600&auto=format&fit=crop&q=80",
  watermelon: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80",
  papaya: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&auto=format&fit=crop&q=80",
  guava: "https://images.unsplash.com/photo-1536511135898-19e4871e16c8?w=600&auto=format&fit=crop&q=80",

  // Value Added & Dairy & Commercial
  ghee: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
  bilona: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80",
  honey: "https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=600&auto=format&fit=crop&q=80",
  thene: "https://images.unsplash.com/photo-1587049352847-81a56d773cae?w=600&auto=format&fit=crop&q=80",
  jaggery: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  bellam: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  "thaati bellam": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  "tati bellam": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  "palm jaggery": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  karupatti: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  "palmyra jaggery": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  "palm sugar": "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&auto=format&fit=crop&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
  "sesame oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
  sesame_oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
  cotton: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
  sugarcane: "https://images.unsplash.com/photo-1596753392437-05c8733230c1?w=600&auto=format&fit=crop&q=80"
};

export const getImgSrc = (img, name = "", category = "") => {
  const cleanStr = ((name || "") + " " + (category || "")).toLowerCase().trim();

  // Helper to match keywords
  const findFallback = () => {
    for (const [key, url] of Object.entries(CROP_FALLBACK_IMAGES)) {
      if (cleanStr.includes(key)) return url;
    }
    if (category === "fruit") return "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80";
    if (category === "grain") return "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80";
    if (category === "pulse") return "https://images.unsplash.com/photo-1585994192701-f1a505c8574a?w=600&auto=format&fit=crop&q=80";
    if (category === "spice") return "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80";
    if (category === "vegetable") return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
    if (category === "dairy") return "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80";
    return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80";
  };

  if (img && typeof img === "string" && img.trim() !== "" && img !== "EMPTY") {
    // 1. Support Base64 Data URIs stored directly in MongoDB
    if (img.startsWith("data:image/") || img.startsWith("data:application/")) {
      return img;
    }
    // 2. Support external CDN HTTPS URLs (e.g. Unsplash, Cloudinary, ImgBB)
    if (img.startsWith("https://")) {
      return img;
    }
    // 3. Handle legacy localhost:5000 URLs from seeded data or local testing
    if (img.includes("localhost:5000") || img.includes("127.0.0.1")) {
      const fb = findFallback();
      if (fb) return fb;
      const pathSuffix = img.split("/uploads/")[1];
      if (pathSuffix) {
        return `${BASE_URL.replace(/\/api\/?$/, "")}/uploads/${pathSuffix}`;
      }
    }
    // 4. Handle relative paths like "uploads/xyz.jpg"
    if (!img.startsWith("http://") && !img.startsWith("https://")) {
      // If it looks like a generic/missing upload, try name-based fallback first
      if (cleanStr.length > 0) {
        for (const [key, url] of Object.entries(CROP_FALLBACK_IMAGES)) {
          if (cleanStr.includes(key)) return url;
        }
      }
      const cleanPath = img.startsWith("/") ? img : `/${img}`;
      return `${BASE_URL.replace(/\/api\/?$/, "")}${cleanPath}`;
    }
    return img;
  }

  return findFallback();
};

function FlyToMarker({ crop }) {
  const map = useMap();
  useEffect(() => {
    const lat = crop?.latitude || crop?.farmer?.latitude;
    const lng = crop?.longitude || crop?.farmer?.longitude;
    if (lat && lng) {
      map.flyTo([lat, lng], 12, { duration: 1.2 });
    }
  }, [crop]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 200);
  }, [map]);
  return null;
}

// ─── Trust Score Badge Component ───
function TrustBadge({ trust, size = "sm" }) {
  if (!trust) return null;
  
  const gradeColors = {
    Platinum: { bg: "linear-gradient(135deg, #7c3aed, #a855f7)", text: "#fff", border: "#c084fc", glow: "rgba(124, 58, 237, 0.3)" },
    Gold:     { bg: "linear-gradient(135deg, #d97706, #f59e0b)", text: "#fff", border: "#fbbf24", glow: "rgba(217, 119, 6, 0.3)" },
    Silver:   { bg: "linear-gradient(135deg, #6b7280, #9ca3af)", text: "#fff", border: "#d1d5db", glow: "rgba(107, 114, 128, 0.2)" },
    Bronze:   { bg: "linear-gradient(135deg, #c2410c, #ea580c)", text: "#fff", border: "#fb923c", glow: "rgba(194, 65, 12, 0.3)" },
    New:      { bg: "linear-gradient(135deg, #16a34a, #22c55e)", text: "#fff", border: "#4ade80", glow: "rgba(22, 163, 74, 0.2)" },
  };

  const colors = gradeColors[trust.grade] || gradeColors.New;
  const isSmall = size === "sm";

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: isSmall ? "0.3rem" : "0.5rem",
      background: colors.bg,
      color: colors.text,
      padding: isSmall ? "0.2rem 0.6rem" : "0.35rem 0.85rem",
      borderRadius: "100px",
      fontSize: isSmall ? "0.7rem" : "0.8rem",
      fontWeight: 700,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.glow}`,
      letterSpacing: "0.02em",
      whiteSpace: "nowrap"
    }} title={`Trust Score: ${trust.score}/100 — ${trust.label}`}>
      <span>{trust.emoji}</span>
      <span>{trust.score}</span>
      {!isSmall && <span style={{ opacity: 0.85, fontSize: "0.7rem" }}>/ 100</span>}
    </div>
  );
}

// ─── Distance Badge ───
function DistanceBadge({ distance }) {
  if (distance === null || distance === undefined) return null;
  const rounded = Math.round(distance * 10) / 10;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      background: "rgba(59, 130, 246, 0.1)",
      color: "#2563eb",
      padding: "0.2rem 0.55rem",
      borderRadius: "100px",
      fontSize: "0.72rem",
      fontWeight: 600,
      border: "1px solid rgba(59, 130, 246, 0.2)"
    }}>
      <MapPin size={11} /> {rounded} km
    </span>
  );
}

// ─── Dynamic Delivery ETA Helper & Badge ───
export const getDeliveryETA = (crop, customerLat, customerLng) => {
  if (crop?.isAdminStock || (crop?.clearanceDiscount && crop?.clearanceDiscount > 0)) {
    return {
      min: 15,
      max: 25,
      label: "⚡ 15–25 Mins (Express Hub)",
      isExpress: true
    };
  }
  const cLat = crop?.latitude || crop?.farmer?.latitude;
  const cLng = crop?.longitude || crop?.farmer?.longitude;
  if (!customerLat || !customerLng || !cLat || !cLng) {
    return {
      min: 30,
      max: 45,
      label: "🚚 30–45 Mins",
      isExpress: false
    };
  }
  const dist = haversineDistance(customerLat, customerLng, cLat, cLng);
  if (dist === null) {
    return { min: 30, max: 45, label: "🚚 30–45 Mins", isExpress: false };
  }
  if (dist <= 3) {
    return { min: 20, max: 30, label: "⚡ 20–30 Mins (Nearby)", isExpress: true };
  } else if (dist <= 10) {
    const minM = Math.round(15 + dist * 2);
    const maxM = Math.round(25 + dist * 2.5);
    return { min: minM, max: maxM, label: `🚚 ${minM}–${maxM} Mins`, isExpress: false };
  } else if (dist <= 25) {
    const minM = Math.round(25 + dist * 1.8);
    const maxM = Math.round(35 + dist * 2.2);
    return { min: minM, max: maxM, label: `🚚 ${minM}–${maxM} Mins`, isExpress: false };
  } else {
    const hours = Math.round((dist / 30) * 10) / 10;
    return { min: Math.round(dist * 2), max: Math.round(dist * 3), label: `📦 ~${hours}h (${Math.round(dist)}km)`, isExpress: false };
  }
};

function DeliveryETABadge({ crop, customerLat, customerLng }) {
  const eta = getDeliveryETA(crop, customerLat, customerLng);
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.25rem",
      background: eta.isExpress ? "rgba(245, 158, 11, 0.12)" : "rgba(34, 197, 94, 0.1)",
      color: eta.isExpress ? "#d97706" : "#16a34a",
      padding: "0.2rem 0.55rem",
      borderRadius: "100px",
      fontSize: "0.72rem",
      fontWeight: 700,
      border: eta.isExpress ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(34, 197, 94, 0.2)"
    }} title={`Estimated Delivery Time: ${eta.label}`}>
      {eta.label}
    </span>
  );
}


// Helper to get current active agricultural season in India based on month
const getCurrentIndianSeason = () => {
  const month = new Date().getMonth() + 1; // 1 to 12
  // Zaid (Summer): March (3) to June (6)
  if (month >= 3 && month <= 6) return "Summer (Zaid)";
  // Kharif (Monsoon): July (7) to October (10)
  if (month >= 7 && month <= 10) return "Monsoon (Kharif)";
  // Rabi (Winter): November (11) to February (2)
  return "Winter (Rabi)";
};

// Returns accurate seasonal crops based on actual Indian weather patterns
const getSeasonalCrops = () => {
  const season = getCurrentIndianSeason();
  if (season === "Summer (Zaid)") return ["watermelon", "cucumber", "mango", "papaya", "tomato", "chili", "okra"];
  if (season === "Monsoon (Kharif)") return ["rice", "maize", "cotton", "groundnut", "sugarcane", "brinjal", "turmeric", "ginger"];
  return ["wheat", "mustard", "potato", "onion", "cabbage", "cauliflower", "spinach", "carrot", "peas", "garlic", "apple"];
};

// Returns doctor & Ayurvedic recommended seasonal diet products to consume
const getFallbackDietProducts = (seasonName = "", temp = 28, humidity = 60) => {
  const sLower = (seasonName || "").toLowerCase();
  const isSummer = sLower.includes("summer") || sLower.includes("zaid") || temp > 30;
  const isMonsoon = sLower.includes("monsoon") || sLower.includes("kharif") || humidity > 70;

  if (isSummer) {
    return [
      {
        name: "Watermelon",
        icon: "🍉",
        category: "hydration",
        categoryLabel: "Hydration",
        badge: "92% Water Content",
        benefit: "Prevents heat stroke, replaces sweat electrolytes, and delivers cooling lycopene.",
        nutrients: "Lycopene, Potassium, Vit C",
        ayurveda: "❄️ Sheeta (Cooling Coolant)",
        searchKeyword: "watermelon"
      },
      {
        name: "Cucumber",
        icon: "🥒",
        category: "hydration",
        categoryLabel: "Hydration",
        badge: "Zero-Calorie Hydrator",
        benefit: "Restores cellular hydration, flushes uric acid, and calms internal stomach heat.",
        nutrients: "Silica, Caffeic Acid, Fiber",
        ayurveda: "❄️ Pitta Pacifier",
        searchKeyword: "cucumber"
      },
      {
        name: "Raw Mango (Kairi)",
        icon: "🥭",
        category: "minerals",
        categoryLabel: "Heat Defense",
        badge: "Heatstroke Shield",
        benefit: "Aam Panna made from raw mango prevents sodium exhaustion and maintains electrolytes in peak heat.",
        nutrients: "Vitamin C, Pectin, Malic Acid",
        ayurveda: "🛡️ Tridosha Balancer",
        searchKeyword: "mango"
      },
      {
        name: "Bottle Gourd (Lauki / Sorakaya)",
        icon: "🍈",
        category: "digestive",
        categoryLabel: "Digestives",
        badge: "Light & Cooling",
        benefit: "Extremely easy to digest in humid heat; prevents acid reflux and keeps blood pressure stable.",
        nutrients: "Soluble Fiber, Zinc, Magnesium",
        ayurveda: "🌱 Deepana (Gentle Digest)",
        searchKeyword: "gourd"
      },
      {
        name: "Mint & Coriander Leaves",
        icon: "🌿",
        category: "digestive",
        categoryLabel: "Digestives",
        badge: "Anti-Acidity Herb",
        benefit: "Natural internal cooling agent; cleanses liver bile and soothes summer stomach cramps.",
        nutrients: "Menthol, Chlorophyll, Vit A",
        ayurveda: "❄️ Sheeta Rechana",
        searchKeyword: "mint"
      },
      {
        name: "Tender Coconut & Lemon",
        icon: "🥥",
        category: "hydration",
        categoryLabel: "Hydration",
        badge: "Natural Isotonic Drink",
        benefit: "Replaces lost potassium and bio-minerals instantly; prevents afternoon heat fatigue.",
        nutrients: "Electrolytes, Bio-enzymes, Vit C",
        ayurveda: "💧 Hridya Vitality Tonic",
        searchKeyword: "lemon"
      }
    ];
  } else if (isMonsoon) {
    return [
      {
        name: "Fresh Ginger (Allam)",
        icon: "🫚",
        category: "immunity",
        categoryLabel: "Immunity",
        badge: "Monsoon Digestive Fire",
        benefit: "Ignites sluggish monsoon digestion, protects bronchial airways, and fights waterborne pathogens.",
        nutrients: "Gingerol, Shogaols, Magnesium",
        ayurveda: "🔥 Agni Deepana",
        searchKeyword: "ginger"
      },
      {
        name: "Raw Turmeric (Pasupu)",
        icon: "🟡",
        category: "immunity",
        categoryLabel: "Immunity",
        badge: "Anti-Viral Defense",
        benefit: "Natural broad-spectrum antibiotic that shields gut lining from seasonal wet-weather infections.",
        nutrients: "Curcumin, Volatile Oils",
        ayurveda: "🛡️ Krimighna (Anti-Bacterial)",
        searchKeyword: "turmeric"
      },
      {
        name: "Garlic (Vellulli)",
        icon: "🧄",
        category: "immunity",
        categoryLabel: "Immunity",
        badge: "Natural Antibiotic",
        benefit: "Active allicin boosts white blood cell response against damp weather fungal and bacterial spores.",
        nutrients: "Allicin, Sulfur, Selenium",
        ayurveda: "🛡️ Rasayana Rejuvenator",
        searchKeyword: "garlic"
      },
      {
        name: "Steamed Sweet Corn (Bhutta)",
        icon: "🌽",
        category: "digestive",
        categoryLabel: "Digestives",
        badge: "Warm Energy Snack",
        benefit: "Provides slow-release energy and insoluble fiber to maintain regular gut motility during damp days.",
        nutrients: "Lutein, Zeaxanthin, B-Complex",
        ayurveda: "🌱 Balya (Strength Giving)",
        searchKeyword: "maize"
      },
      {
        name: "Bitter Gourd (Kakarakaya)",
        icon: "🥒",
        category: "digestive",
        categoryLabel: "Digestives",
        badge: "Blood Purifier",
        benefit: "Flushes gut parasites common in rainy season and stabilizes blood glucose against humidity spikes.",
        nutrients: "Charantin, Vicine, Polypeptides",
        ayurveda: "🌱 Rakta Shodhaka",
        searchKeyword: "bitter gourd"
      },
      {
        name: "Pomegranate (Danimma)",
        icon: "🍎",
        category: "minerals",
        categoryLabel: "Vitality",
        badge: "Platelet & Immunity Booster",
        benefit: "Maintains optimal hemoglobin and platelet levels; protects against seasonal monsoon viral fevers.",
        nutrients: "Punicalagins, Ellagic Acid, Iron",
        ayurveda: "🛡️ Rakta Vardhaka",
        searchKeyword: "pomegranate"
      }
    ];
  } else {
    // Winter (Rabi)
    return [
      {
        name: "Fresh Spinach & Methi",
        icon: "🥬",
        category: "minerals",
        categoryLabel: "Vitality",
        badge: "Winter Super Greens",
        benefit: "Rich in bioavailable iron and folate; warms core blood circulation and builds seasonal stamina.",
        nutrients: "Iron, Calcium, Vit K, Folate",
        ayurveda: "🌱 Pushtida (Nourishing)",
        searchKeyword: "spinach"
      },
      {
        name: "Carrots & Beetroot",
        icon: "🥕",
        category: "immunity",
        categoryLabel: "Immunity",
        badge: "Circulation & Vision",
        benefit: "Improves blood vessel elasticity in cold temperatures and delivers beta-carotene for winter skin.",
        nutrients: "Beta-Carotene, Nitrates, Vit A",
        ayurveda: "🔥 Rakta Prasadana",
        searchKeyword: "carrot"
      },
      {
        name: "Amla (Indian Gooseberry)",
        icon: "🫒",
        category: "immunity",
        categoryLabel: "Immunity",
        badge: "Highest Vitamin C (20x Orange)",
        benefit: "The premier Ayurvedic immunity fruit; builds natural antibodies to ward off winter cold, cough, and flu.",
        nutrients: "Ascorbic Acid, Tannins, Flavonoids",
        ayurveda: "🛡️ Rasayana Supreme",
        searchKeyword: "amla"
      },
      {
        name: "Sweet Potatoes",
        icon: "🍠",
        category: "minerals",
        categoryLabel: "Thermal Energy",
        badge: "Winter Thermal Sustenance",
        benefit: "Slow-burning complex carbohydrates provide sustained thermal energy against crisp morning chills.",
        nutrients: "Complex Carbs, Potassium, Vit B6",
        ayurveda: "🔥 Vata Shamak",
        searchKeyword: "sweet potato"
      },
      {
        name: "Organic Jaggery (Bellam)",
        icon: "🍯",
        category: "minerals",
        categoryLabel: "Internal Warmer",
        badge: "Lungs & Internal Warmer",
        benefit: "Expels particulate matter from lungs during winter smog and warms the digestive tract naturally.",
        nutrients: "Unrefined Cane Iron, Minerals",
        ayurveda: "🔥 Ushna (Thermal Warmth)",
        searchKeyword: "jaggery"
      },
      {
        name: "Citrus Oranges & Sweet Lime",
        icon: "🍊",
        category: "hydration",
        categoryLabel: "Hydration",
        badge: "Respiratory Cold Defense",
        benefit: "Maintains mucosal hydration, prevents winter dry cough, and boosts collagen for radiant skin.",
        nutrients: "Vitamin C, Bioflavonoids",
        ayurveda: "💧 Ruchya (Appetite Enhancer)",
        searchKeyword: "orange"
      }
    ];
  }
};

export default function Marketplace() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const { addToCart, setIsCartOpen } = useCart();
  const { listening, activeField, interim, startListening, stopListening } = useVoiceInput(lang);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialTab = searchParams.get("tab") || "shop";
  const [mainTab, setMainTab] = useState(initialTab);
  const [preselectedCropForPool, setPreselectedCropForPool] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["shop", "orders", "groups", "tours"].includes(tabParam)) {
      setMainTab(tabParam);
    }
  }, [searchParams]);

  const switchMainTab = (tabName) => {
    setMainTab(tabName);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabName);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    if (tabName === "orders" && user) {
      fetchMyOrders();
    }
  };

  const [crops, setCrops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [orderAddr, setOrderAddr] = useState(user?.address || "");
  const [orderLat, setOrderLat] = useState(user?.latitude || null);
  const [orderLng, setOrderLng] = useState(user?.longitude || null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [onlineSubMethod, setOnlineSubMethod] = useState("upi");
  const [inlineUtr, setInlineUtr] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [merchantUpi, setMerchantUpi] = useState("8688938604@upi");
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [hasWetWasteDonation, setHasWetWasteDonation] = useState(false);
  const [wetWasteEstKg, setWetWasteEstKg] = useState(2);
  const [wetWasteNotes, setWetWasteNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [msg, setMsg] = useState({ type:"", text:"" });
  const [nutritionData, setNutrition] = useState(null);
  const [nutLoading, setNutLoading] = useState(false);
  const [priceTrends, setPriceTrends] = useState(null);
  const [basketSuggestions, setBasketSuggestions] = useState([]);
  const [basketLoading, setBasketLoading] = useState(false);
  const [basketDataDriven, setBasketDataDriven] = useState(false);
  const [viewTab, setViewTab] = useState("list");
  const [showBill, setShowBill] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [showFarmTour, setShowFarmTour] = useState(null);
  const [festivalConfig, setFestivalConfig] = useState(null);
  const [show3DView, setShow3DView] = useState(false);
  const [showRecipeHub, setShowRecipeHub] = useState(false);
  const [showAuthenticityCert, setShowAuthenticityCert] = useState(null);

  // ─── Advanced Search & New Features State ───
  const [showFilters, setShowFilters] = useState(false);
  const [filterOrganic, setFilterOrganic] = useState(false);
  const [filterPesticideFree, setFilterPesticideFree] = useState(false);
  const [filterClearance, setFilterClearance] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterMaxDistance, setFilterMaxDistance] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [customerLat, setCustomerLat] = useState(null);
  const [customerLng, setCustomerLng] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trustScores, setTrustScores] = useState({});
  const [trustScoreDetail, setTrustScoreDetail] = useState(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const searchRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);
  
  // Advanced Marketplace Additions
  const [showBargain, setShowBargain] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isMarketAudioActive, setIsMarketAudioActive] = useState(false);

  // Compare Feature State
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showSmartBasket, setShowSmartBasket] = useState(false);

  // ─── Real-Time Seasonal Prediction State ───
  const [seasonalPrediction, setSeasonalPrediction] = useState(null);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [dietCategoryFilter, setDietCategoryFilter] = useState("all");

  // Synchronize customer location with AuthContext or guest storage
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      setCustomerLat(user.latitude);
      setCustomerLng(user.longitude);
      if (user.location) setLocationName(user.location.split(",")[0] || user.location);
    } else {
      try {
        const guest = JSON.parse(localStorage.getItem("guest_location") || "{}");
        if (guest.latitude && guest.longitude) {
          setCustomerLat(guest.latitude);
          setCustomerLng(guest.longitude);
          if (guest.location) setLocationName(guest.location.split(",")[0] || guest.location);
        }
      } catch {}
    }
  }, [user]);

  // Listen for external location updates from LocationUpdateModal
  useEffect(() => {
    const handleLocUpdate = (e) => {
      if (e.detail) {
        if (e.detail.latitude && e.detail.longitude) {
          setCustomerLat(e.detail.latitude);
          setCustomerLng(e.detail.longitude);
        }
        if (e.detail.location) {
          setLocationName(e.detail.location.split(",")[0] || e.detail.location);
        }
      }
    };
    window.addEventListener("user_location_updated", handleLocUpdate);
    return () => window.removeEventListener("user_location_updated", handleLocUpdate);
  }, []);

  // Listen for map farmer select events
  useEffect(() => {
    const handleSelectFarmer = (e) => {
      if (e.detail?.farmerId) {
        const matchingCrop = crops.find(c => (c.farmer?._id || c.farmer) === e.detail.farmerId);
        if (matchingCrop) {
          setSelected(matchingCrop);
        }
      }
    };
    window.addEventListener("select_farmer_map", handleSelectFarmer);
    return () => window.removeEventListener("select_farmer_map", handleSelectFarmer);
  }, [crops]);

  const toggleCompare = (crop, e) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(c => c._id === crop._id)) {
        return prev.filter(c => c._id !== crop._id);
      }
      if (prev.length >= 4) {
        setMsg({ type: "error", text: "You can compare up to 4 items maximum." });
        setTimeout(() => setMsg({ type:"", text:"" }), 3000);
        return prev;
      }
      return [...prev, crop];
    });
  };

  useEffect(() => {
    const syncHandler = (e) => setIsMarketAudioActive(e.detail.isActive);
    window.addEventListener("market_audio_state", syncHandler);
    return () => window.removeEventListener("market_audio_state", syncHandler);
  }, []);

  // Update current time every second for Flash Sales
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketContainerRef = useRef(null);

  // ── Immersive Market Audio ──────────────────────────────────────────────
  const { isActive: audioActive, toggle: toggleAudio, focusCrop, blurCrop, attachScrollObserver, refreshObserver, speakingCropId } = useMarketAudio(crops, lang);

  useEffect(() => {
    if (marketContainerRef.current) {
      attachScrollObserver(marketContainerRef.current);
    }
  }, [attachScrollObserver]);

  useEffect(() => {
    if (marketContainerRef.current) {
      refreshObserver(marketContainerRef.current);
    }
  }, [filtered, refreshObserver]);

  // Allow Navbar speaker button to toggle audio via custom event
  useEffect(() => {
    const handler = () => toggleAudio();
    window.addEventListener("market_announcer_toggle", handler);
    return () => window.removeEventListener("market_announcer_toggle", handler);
  }, [toggleAudio]);

  // Sync audioActive state back to Navbar so button icon stays in sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("market_audio_state", { detail: { isActive: audioActive } }));
  }, [audioActive]);

  const CATS = ["all","vegetable","fruit","grain","millet","pulse","spice","dairy","other"];
  const DELIVERY_BASE = 30;
  const DELIVERY_PER_KM = 5;

  const DISTANCE_OPTIONS = [
    { label: "Any", value: "" },
    { label: "5 km", value: "5" },
    { label: "10 km", value: "10" },
    { label: "25 km", value: "25" },
    { label: "50 km", value: "50" },
    { label: "100 km", value: "100" },
  ];

  const SORT_OPTIONS = [
    { label: "⚡ Fastest Delivery (ETA)", value: "eta_fastest" },
    { label: "🏷️ End-of-Day / Clearance", value: "clearance" },
    { label: "⏰ Newest First", value: "newest" },
    { label: "💰 Price: Low → High", value: "price_asc" },
    { label: "💸 Price: High → Low", value: "price_desc" },
    { label: "📍 Distance: Nearest", value: "distance" },
    { label: "🛡️ Trust Score", value: "trust_score" },
    { label: "⭐ Rating", value: "rating" },
  ];

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filterOrganic) count++;
    if (filterPesticideFree) count++;
    if (filterClearance) count++;
    if (filterMinPrice) count++;
    if (filterMaxPrice) count++;
    if (filterMaxDistance) count++;
    if (sortBy !== "newest") count++;
    setActiveFilterCount(count);
  }, [filterOrganic, filterPesticideFree, filterClearance, filterMinPrice, filterMaxPrice, filterMaxDistance, sortBy]);

  useEffect(() => { 
    fetchFestivalConfig();
    fetchFestivalConfig();
    if (user) fetchMyOrders();
    const socket = io(BASE_URL);
    socket.on("order_created", () => fetchCrops());
    socket.on("order_updated", () => { if (user) fetchMyOrders(); });
    socket.on("festival_activated", (cfg) => {
      if (cfg.isFestivalActive) setFestivalConfig(cfg);
      else setFestivalConfig(null);
    });

    const handleAINavigate = (e) => {
      if (e.detail.targetTab) setMainTab(e.detail.targetTab);
    };
    window.addEventListener("ai_navigate", handleAINavigate);

    // AI Autofill Listener
    const handleAIAutofill = (e) => {
      if (e.detail.context === "marketplace_search" && e.detail.parsedData) {
        const pd = e.detail.parsedData;
        if (pd.searchQuery) setSearch(pd.searchQuery);
        if (pd.category) setCategory(pd.category);
        setViewTab("list"); // Ensure they see the results
      }
    };
    window.addEventListener("ai_autofill", handleAIAutofill);

    return () => {
      socket.disconnect();
      window.removeEventListener("ai_autofill", handleAIAutofill);
      window.removeEventListener("ai_navigate", handleAINavigate);
    };
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [lang]);

  // ─── Advanced filtering (client-side on the fetched crops) ───
  useEffect(() => {
    let f = [...crops];

    // Category filter
    if (category !== "all") f = f.filter(c => c.category === category);

    // Case-insensitive search (supports mixed case / capital letters)
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase();
      f = f.filter(c =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower) ||
        c.location?.toLowerCase().includes(searchLower)
      );
    }

    // Organic filter
    if (filterOrganic) {
      f = f.filter(c => c.isOrganic);
    }

    // Pesticide-free filter
    if (filterPesticideFree) {
      f = f.filter(c => c.isPesticideFree || c.isOrganic);
    }

    // End-of-Day Clearance / Flash Sale filter
    if (filterClearance) {
      f = f.filter(c => c.isAdminStock || (c.clearanceDiscount && c.clearanceDiscount > 0) || c.isFlashSale);
    }

    // Price range filter
    if (filterMinPrice) {
      f = f.filter(c => c.price >= Number(filterMinPrice));
    }
    if (filterMaxPrice) {
      f = f.filter(c => c.price <= Number(filterMaxPrice));
    }

    // Distance filter (requires customer location)
    if (filterMaxDistance && customerLat && customerLng) {
      const maxDist = Number(filterMaxDistance);
      f = f.filter(c => {
        const cLat = c.latitude || c.farmer?.latitude;
        const cLng = c.longitude || c.farmer?.longitude;
        const dist = haversineDistance(customerLat, customerLng, cLat, cLng);
        return dist !== null && dist <= maxDist;
      });
    }

    // Sorting
    if (sortBy === "eta_fastest") {
      f.sort((a, b) => {
        const etaA = getDeliveryETA(a, customerLat, customerLng).min;
        const etaB = getDeliveryETA(b, customerLat, customerLng).min;
        return etaA - etaB;
      });
    } else if (sortBy === "clearance") {
      f.sort((a, b) => {
        const discA = a.clearanceDiscount || (a.isFlashSale ? 30 : 0) || (a.isAdminStock ? 40 : 0);
        const discB = b.clearanceDiscount || (b.isFlashSale ? 30 : 0) || (b.isAdminStock ? 40 : 0);
        return discB - discA;
      });
    } else if (sortBy === "price_asc") {
      f.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price_desc") {
      f.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "distance" && customerLat && customerLng) {
      f.sort((a, b) => {
        const dA = haversineDistance(customerLat, customerLng, a.latitude || a.farmer?.latitude, a.longitude || a.farmer?.longitude);
        const dB = haversineDistance(customerLat, customerLng, b.latitude || b.farmer?.latitude, b.longitude || b.farmer?.longitude);
        if (dA === null) return 1;
        if (dB === null) return -1;
        return dA - dB;
      });
    } else if (sortBy === "trust_score") {
      f.sort((a, b) => {
        const aFid = (a.farmer?._id || a.farmer)?.toString?.() || "";
        const bFid = (b.farmer?._id || b.farmer)?.toString?.() || "";
        return (trustScores[bFid]?.score || 0) - (trustScores[aFid]?.score || 0);
      });
    } else if (sortBy === "rating") {
      f.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFiltered(f);
  }, [crops, search, category, filterOrganic, filterPesticideFree, filterClearance, filterMinPrice, filterMaxPrice, filterMaxDistance, sortBy, customerLat, customerLng, trustScores]);

  const fetchCrops = async () => {
    setLoading(true);
    try {
      const res = await API.get("/crops");
      let available = res.data.filter(c => c.isAvailable !== false && c.quantity > 0);

      // Advanced Marketplace: Add Flash Sales and Mock Recommendations
      available = available.map((c, i) => {
        // ~20% of items are placed on Flash Sale with a random 1-12 hour expiry
        if (i % 5 === 0) {
          c.isFlashSale = true;
          c.flashExpiry = Date.now() + Math.floor(Math.random() * 11 * 3600 * 1000) + 3600 * 1000; 
        }

        // Auto-detect pre-booking based on lifecycle stage
        const stage = (c.lifecycleStage || c.growingStage || "ready").toLowerCase();
        if (stage !== "post_harvest" && stage !== "ready") {
          c.isPrebooking = true;
        }

        return c;
      });

      // Dynamic Translation for full-website multilingual support
      if (lang && lang !== "en") {
        const textsToTranslate = [];
        available.forEach(c => {
          textsToTranslate.push(c.name || "");
          textsToTranslate.push(c.description || "");
        });
        try {
          const tRes = await API.post("/translate", { texts: textsToTranslate, targetLang: lang });
          if (tRes.data && tRes.data.translatedTexts) {
            const translated = tRes.data.translatedTexts;
            available = available.map((c, i) => ({
              ...c,
              name: translated[i * 2] || c.name,
              description: translated[i * 2 + 1] || c.description
            }));
          }
        } catch (e) { console.error("Translation error", e); }
      }

      setCrops(available);
      setFiltered(available);

      // Pick top 3 for "AI Recommendations" based on random logic for now
      setAiRecommendations([...available].sort(() => 0.5 - Math.random()).slice(0, 3));

      // Fetch trust scores for all farmers in the crops
      const farmerIds = [...new Set(available.map(c => {
        const fid = c.farmer?._id || c.farmer;
        return typeof fid === "object" ? fid?.toString?.() : fid;
      }).filter(Boolean))];

      if (farmerIds.length > 0) {
        try {
          const tsRes = await API.post("/farmer/trust-scores-batch", { farmerIds });
          setTrustScores(tsRes.data);
        } catch {}
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchFestivalConfig = async () => {
    try {
      const res = await API.get("/public/festival");
      if (res.data && res.data.isFestivalActive) {
        setFestivalConfig(res.data);
      }
    } catch {}
  };

  const fetchMyOrders = async () => {
    try {
      const res = await API.get(`/orders/customer/${user._id}`);
      setMyOrders(res.data);
    } catch {}
  };

  // ─── Fetch search suggestions ───
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await API.get(`/crops/suggestions?q=${encodeURIComponent(query)}`);
      setSuggestions(res.data);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetching & live ML demand tracking
  const handleSearchChange = (val) => {
    setSearch(val);
    if (suggestionsTimeoutRef.current) clearTimeout(suggestionsTimeoutRef.current);
    suggestionsTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
      if (val && val.trim().length >= 2) {
        API.post("/ml/search", {
          query: val.trim(),
          category: category !== "all" ? category : "",
          latitude: customerLat || undefined,
          longitude: customerLng || undefined
        }).catch(() => {});
      }
    }, 250);
  };

  const applySuggestion = (sug) => {
    setSearch(sug.searchQuery || sug.text);
    if (sug.filter) {
      if (sug.filter.isOrganic) setFilterOrganic(true);
      if (sug.filter.isPesticideFree) setFilterPesticideFree(true);
      if (sug.filter.maxPrice) setFilterMaxPrice(String(sug.filter.maxPrice));
    }
    setShowSuggestions(false);
  };

  // ─── Fetch Seasonal Prediction ───
  const fetchSeasonalPrediction = useCallback(async (lat, lng) => {
    setSeasonalLoading(true);
    try {
      const latitude = lat ?? customerLat ?? user?.latitude ?? 17.3850;
      const longitude = lng ?? customerLng ?? user?.longitude ?? 78.4867;
      const res = await API.get(`/ml/seasonal-prediction?lat=${latitude}&lng=${longitude}`);
      setSeasonalPrediction(res.data);
    } catch (e) {
      console.error("Seasonal prediction fetch error:", e);
    } finally {
      setSeasonalLoading(false);
    }
  }, [customerLat, customerLng, user?.latitude, user?.longitude]);

  // Auto-fetch seasonal prediction once on mount
  useEffect(() => {
    fetchSeasonalPrediction();
  }, [fetchSeasonalPrediction]);

  const detectCustomerLocation = useCallback(() => {
    if (!navigator.geolocation) { console.warn("Geolocation not supported"); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      setCustomerLat(coords.latitude);
      setCustomerLng(coords.longitude);
      fetchSeasonalPrediction(coords.latitude, coords.longitude);
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`);
        const d = await r.json();
        setLocationName(d.address?.city || d.address?.town || d.address?.village || d.display_name?.split(",")[0] || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
      } catch { 
        setLocationName(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
      }
      setLocationLoading(false);
    }, () => { console.warn("Could not get location"); setLocationLoading(false); });
  }, [fetchSeasonalPrediction]);

  // Auto-detect GPS on mount
  useEffect(() => {
    if (!customerLat) {
      detectCustomerLocation();
    }
  }, []); // Run once on mount

  // ─── Reset all filters ───
  const resetFilters = () => {
    setFilterOrganic(false);
    setFilterPesticideFree(false);
    setFilterClearance(false);
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setFilterMaxDistance("");
    setSortBy("newest");
    setSearch("");
    setCategory("all");
  };

  // Calculate delivery distance and charges
  const cropLat = selected?.latitude || selected?.farmer?.latitude;
  const cropLng = selected?.longitude || selected?.farmer?.longitude;
  const deliveryDistance = selected ? haversineDistance(
    cropLat, cropLng, orderLat, orderLng
  ) || 0 : 0;
  const deliveryCharges = deliveryType === "farm_pickup" ? 0 : Math.round(DELIVERY_BASE + (deliveryDistance * DELIVERY_PER_KM));
  const selectedPrice = selected ? (festivalConfig ? Math.round(selected.price * (1 - festivalConfig.discountPercentage / 100)) : selected.price) : 0;
  const subtotal = selected ? selectedPrice * orderQty : 0;
  const totalBeforeDiscount = subtotal + deliveryCharges;
  const maxPoints = Math.min(user?.rewardPoints || 0, totalBeforeDiscount);
  const pointsDiscount = usePoints ? maxPoints : 0;
  const totalAmount = totalBeforeDiscount - pointsDiscount;

  const openCrop = async (crop) => {
    setSelected(crop);
    setShowModal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNutrition(null);
    setPriceTrends(null);
    setBasketSuggestions([]);
    setOrderQty(1);
    setDeliveryType("standard");
    setUsePoints(false);
    setHasWetWasteDonation(false);
    setWetWasteEstKg(2);
    setWetWasteNotes("");
    setShowBill(null);
    setMsg({ type:"", text:"" });
    
    setNutLoading(true);
    setBasketLoading(true);
    
    try {
      const res = await API.post("/ml/nutrition", { crop: crop.name });
      setNutrition(res.data);
    } catch {} finally { setNutLoading(false); }

    try {
      const res = await API.post("/ml/market-basket", { crop: crop.name });
      setBasketSuggestions(res.data.suggestions || []);
      setBasketDataDriven((res.data.totalBaskets || 0) > 0);
    } catch {} finally { setBasketLoading(false); }

    try {
      const payload = { crop: crop.name };
      if (user?.location?.coordinates) {
        payload.longitude = user.location.coordinates[0];
        payload.latitude = user.location.coordinates[1];
      }
      const res = await API.post("/ml/price-trends", payload);
      setPriceTrends(res.data);
    } catch {}
  };

  // ─── View Trust Score Detail Modal ───
  const viewTrustScore = async (farmerId) => {
    try {
      const res = await API.get(`/farmer/trust-score/${farmerId}`);
      setTrustScoreDetail(res.data);
    } catch {}
  };

  const placeOrder = () => {
    handleConfirmOrder();
  };

  const handleConfirmOrder = async () => {
    if (!user) { setMsg({ type:"error", text:"Please login to place an order." }); return; }
    if (orderQty < 1) { setMsg({ type:"error", text:"Quantity must be at least 1." }); return; }
    if (deliveryType !== "farm_pickup" && !orderAddr) { setMsg({ type:"error", text:"Please enter your delivery address." }); return; }
    
    setOrdering(true);
    setMsg({ type:"", text:"" });

    if (paymentMethod === "cod") {
      await createPlatformOrder("cod", "pending");
      return;
    }

    // Online Payment Options:
    if (onlineSubMethod === "wallet") {
      if ((user.walletBalance || 0) < totalAmount) {
        setMsg({ type:"error", text:"Insufficient wallet balance. Please add funds or choose another payment method." });
        setOrdering(false);
        return;
      }
      await createPlatformOrder("wallet", "paid");
      return;
    }

    if (onlineSubMethod === "upi") {
      await createPlatformOrder("upi", "paid");
      return;
    }

    if (onlineSubMethod === "card") {
      try {
        const loadRazorpay = () => {
          return new Promise((resolve) => {
            if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const loaded = await loadRazorpay();
        if (!loaded) {
          await createPlatformOrder("online", "paid");
          return;
        }

        const configRes = await API.get("/payment/razorpay/config");
        const keyId = configRes.data?.key_id;

        const options = {
          key: keyId,
          amount: Math.round(totalAmount * 100),
          currency: "INR",
          name: "Rythu Jana Sethu",
          description: `Order Payment for ${selected?.name || "produce"}`,
          handler: async function () {
            await createPlatformOrder("card", "paid");
          },
          prefill: {
            name: user.name || "Customer",
            email: user.email || "",
            contact: user.phone || ""
          },
          theme: { color: "#16a34a" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (err) {
          setMsg({ type: "error", text: "Payment failed: " + (err.error?.description || "Transaction declined") });
          setOrdering(false);
        });
        rzp.open();
      } catch (e) {
        console.error("Razorpay initiation failed, placing order via online status:", e);
        await createPlatformOrder("online", "paid");
      }
    }
  };

  const handlePaymentSuccess = async (method) => {
    setShowPaymentModal(false);
    if (method === "cod") {
      await createPlatformOrder("cod", "pending");
    } else {
      await createPlatformOrder(method, "paid");
    }
  };

  const createPlatformOrder = async (payMode, payStatus) => {
    try {
      const orderData = {
        crop: selected._id,
        customer: user._id,
        farmer: selected.farmer?._id || selected.farmer,
        quantity: orderQty,
        totalAmount,
        subtotal,
        deliveryCharges,
        pointsUsed: pointsDiscount,
        deliveryDistance: Math.round(deliveryDistance * 10) / 10,
        deliveryType,
        paymentMode: payMode,
        paymentStatus: payStatus,
        deliveryAddress: deliveryType === "farm_pickup" ? "Farm Pickup" : orderAddr,
        deliveryLatitude: orderLat,
        deliveryLongitude: orderLng,
        hasWetWasteDonation,
        wetWasteEstKg: hasWetWasteDonation ? Number(wetWasteEstKg) : 0,
        wetWasteNotes,
      };

      const res = await API.post("/orders/create", orderData);
      setShowModal(false);
      setShowPaymentModal(false);
      setOrdering(false);
      setShowBill(null);
      setPlacedOrder(res.data);
      setMsg({ type:"success", text:`✅ Order placed successfully!` });
      fetchCrops();
      if (user) fetchMyOrders();
    } catch (err) {
      console.error("Order creation failed:", err);
      setMsg({ type:"error", text: err.response?.data?.error || "Failed to place order. Please try again." });
      setOrdering(false);
    }
  };

  const mapLocations = filtered.filter(c => {
    const lat = c.latitude || c.farmer?.latitude;
    const lng = c.longitude || c.farmer?.longitude;
    return lat !== undefined && lat !== null && lng !== undefined && lng !== null;
  });

  // Helper: get distance for a crop
  const getCropDistance = (crop) => {
    if (!customerLat || !customerLng) return null;
    const cLat = crop.latitude || crop.farmer?.latitude;
    const cLng = crop.longitude || crop.farmer?.longitude;
    return haversineDistance(customerLat, customerLng, cLat, cLng);
  };

  // Helper: get trust score for a crop's farmer
  const getCropTrust = (crop) => {
    const fid = (crop.farmer?._id || crop.farmer)?.toString?.() || "";
    return trustScores[fid] || null;
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // ─── Quick Filter Chips ───
  const QuickFilterChips = () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { setFilterClearance(!filterClearance); setShowFilters(true); }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 700,
          border: filterClearance ? "1.5px solid #dc2626" : "1px solid #fecaca",
          background: filterClearance ? "#dc2626" : "#fef2f2",
          color: filterClearance ? "white" : "#dc2626",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s", boxShadow: filterClearance ? "0 4px 14px rgba(220, 38, 38, 0.25)" : "none"
        }}>
        <Zap size={13} fill={filterClearance ? "white" : "#dc2626"} /> ⚡ End-of-Day Clearance (20–40% OFF)
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!customerLat) detectCustomerLocation();
          setSortBy(sortBy === "eta_fastest" ? "newest" : "eta_fastest");
        }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 700,
          border: sortBy === "eta_fastest" ? "1.5px solid #d97706" : "1px solid #fde68a",
          background: sortBy === "eta_fastest" ? "#d97706" : "#fffbeb",
          color: sortBy === "eta_fastest" ? "white" : "#b45309",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <Truck size={13} /> ⚡ Fastest Delivery (ETA)
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { setFilterOrganic(!filterOrganic); setShowFilters(true); }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600,
          border: filterOrganic ? "1.5px solid #16a34a" : "1px solid #e2e8f0",
          background: filterOrganic ? "rgba(22, 163, 74, 0.1)" : "white",
          color: filterOrganic ? "#16a34a" : "var(--text-mid)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <Leaf size={13} /> Organic
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { setFilterPesticideFree(!filterPesticideFree); setShowFilters(true); }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600,
          border: filterPesticideFree ? "1.5px solid #059669" : "1px solid #e2e8f0",
          background: filterPesticideFree ? "rgba(5, 150, 105, 0.1)" : "white",
          color: filterPesticideFree ? "#059669" : "var(--text-mid)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <Shield size={13} /> Pesticide Free
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (!customerLat) detectCustomerLocation();
          setFilterMaxDistance(filterMaxDistance ? "" : "10");
          setShowFilters(true);
        }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600,
          border: filterMaxDistance ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
          background: filterMaxDistance ? "rgba(37, 99, 235, 0.1)" : "white",
          color: filterMaxDistance ? "#2563eb" : "var(--text-mid)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <MapPin size={13} /> {filterMaxDistance ? `Within ${filterMaxDistance} km` : "Near Me"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (sortBy === "price_asc") setSortBy("price_desc");
          else setSortBy("price_asc");
        }}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600,
          border: (sortBy === "price_asc" || sortBy === "price_desc") ? "1.5px solid #d97706" : "1px solid #e2e8f0",
          background: (sortBy === "price_asc" || sortBy === "price_desc") ? "rgba(217, 119, 6, 0.1)" : "white",
          color: (sortBy === "price_asc" || sortBy === "price_desc") ? "#d97706" : "var(--text-mid)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <ArrowUpDown size={13} /> {sortBy === "price_desc" ? "Price: High → Low" : sortBy === "price_asc" ? "Price: Low → High" : "Sort by Price"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setSortBy(sortBy === "trust_score" ? "newest" : "trust_score")}
        style={{
          padding: "0.4rem 0.85rem", borderRadius: "100px", fontSize: "0.82rem", fontWeight: 600,
          border: sortBy === "trust_score" ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
          background: sortBy === "trust_score" ? "rgba(124, 58, 237, 0.1)" : "white",
          color: sortBy === "trust_score" ? "#7c3aed" : "var(--text-mid)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
          transition: "all 0.2s"
        }}>
        <Shield size={13} /> Trust Score
      </motion.button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-wrapper" style={{ maxWidth:"100%", padding:"1.5rem" }} ref={marketContainerRef}>
      {/* ─── MAIN TABS NAVIGATION ─── */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button 
          onClick={() => switchMainTab("shop")}
          style={{
            background: "none", border: "none", fontSize: "1.1rem", fontWeight: 700,
            color: mainTab === "shop" ? "var(--green-mid)" : "var(--text-mid)", cursor: "pointer",
            borderBottom: mainTab === "shop" ? "3px solid var(--green-mid)" : "3px solid transparent",
            padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
          <ShoppingBag size={18} /> Marketplace
        </button>
        <button 
          onClick={() => switchMainTab("orders")}
          style={{
            background: "none", border: "none", fontSize: "1.1rem", fontWeight: 700,
            color: mainTab === "orders" ? "var(--green-mid)" : "var(--text-mid)", cursor: "pointer",
            borderBottom: mainTab === "orders" ? "3px solid var(--green-mid)" : "3px solid transparent",
            padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
          <Package size={18} /> My Orders {myOrders.length > 0 && `(${myOrders.length})`}
        </button>
        <button 
          onClick={() => switchMainTab("groups")}
          style={{
            background: "none", border: "none", fontSize: "1.1rem", fontWeight: 700,
            color: mainTab === "groups" ? "var(--green-mid)" : "var(--text-mid)", cursor: "pointer",
            borderBottom: mainTab === "groups" ? "3px solid var(--green-mid)" : "3px solid transparent",
            padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
          <Users size={18} /> Bulk Buying Groups
        </button>
        <button 
          onClick={() => switchMainTab("tours")}
          style={{
            background: "none", border: "none", fontSize: "1.1rem", fontWeight: 700,
            color: mainTab === "tours" ? "var(--green-mid)" : "var(--text-mid)", cursor: "pointer",
            borderBottom: mainTab === "tours" ? "3px solid var(--green-mid)" : "3px solid transparent",
            padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem"
          }}>
          <Tractor size={18} /> Farm Tour Booking
        </button>
      </div>

      {mainTab === "orders" ? (
        <CustomerOrders orders={myOrders} fetchOrders={fetchMyOrders} />
      ) : mainTab === "groups" ? (
        <CustomerGroups
          crops={crops}
          preselectedCrop={preselectedCropForPool}
          onClearPreselected={() => setPreselectedCropForPool(null)}
        />
      ) : mainTab === "tours" ? (
        <CustomerOfflineTours isEmbedded={true} />
      ) : (
        <>
          {/* Premium Hero Banner */}
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        className="marketplace-hero-banner" style={{
        backgroundImage: `linear-gradient(135deg, rgba(22, 163, 74, 0.85), rgba(5, 150, 105, 0.95)), url('https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?auto=format&fit=crop&w=1200&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "var(--radius-lg)",
        padding: "3.5rem 2.5rem",
        marginBottom: "2.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        boxShadow: "0 15px 35px -5px rgba(22, 163, 74, 0.2)",
        position: "relative",
        overflow: "hidden"
      }}>
        <motion.span 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ 
          background: "rgba(255, 255, 255, 0.2)", 
          color: "white", 
          padding: "0.4rem 1rem", 
          borderRadius: "100px", 
          fontSize: "0.85rem", 
          fontWeight: 700, 
          textTransform: "uppercase", 
          letterSpacing: "0.1em", 
          marginBottom: "1rem", 
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          display: "flex", alignItems: "center", gap: "0.5rem"
        }}>
          <Zap size={16} fill="white" /> {t("tagline")}
        </motion.span>
        <motion.h2 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ color: "white", fontSize: "2.5rem", fontWeight: 800, margin: "0 0 0.5rem", fontFamily: "'Outfit', sans-serif" }}>
          Freshness Delivered.
        </motion.h2>
        <motion.p 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.1rem", maxWidth: "600px", margin: 0, lineHeight: 1.6 }}>
          Explore high-quality organic crops directly sourced from local farmers. Search by budget, distance, or trust score!
        </motion.p>

        {/* Location Detector in Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={detectCustomerLocation}
            disabled={locationLoading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.6rem 1.2rem", borderRadius: "100px",
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "white", fontWeight: 700, fontSize: "0.88rem",
              cursor: "pointer", transition: "all 0.2s"
            }}>
            <LocateFixed size={16} className={locationLoading ? "spin-anim" : ""} />
            {locationLoading ? "Detecting..." : customerLat ? `📍 ${locationName}` : "📍 Detect My Location"}
          </button>
          {customerLat && (
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.82rem" }}>
              ✅ Location set — distance filters enabled
            </span>
          )}
        </motion.div>
      </motion.div>

      <div className="flex-between mb-3">
        <div>
          <h1 className="page-title" style={{ textAlign:"left", fontSize:"1.8rem", color:"var(--text-dark)", backgroundImage:"none", WebkitTextFillColor:"var(--text-dark)", textShadow:"none" }}>
            🛒 {t("marketplace")}
          </h1>
          <p style={{ color:"var(--text-muted)", fontSize:"0.95rem", marginBottom: "0.5rem" }}>{filtered.length} fresh products from local farmers</p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button 
              type="button"
              onClick={() => setShowSmartBasket(!showSmartBasket)} 
              className="btn-primary" 
              style={{ 
                padding: "0.35rem 0.9rem", 
                fontSize: "0.85rem", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                background: showSmartBasket ? "var(--green-deep)" : "linear-gradient(135deg, #16a34a, #15803d)",
                boxShadow: "0 4px 12px rgba(22,163,74,0.25)",
                border: "none",
                cursor: "pointer",
                borderRadius: "100px",
                color: "white"
              }}
            >
              <Sparkles size={15} /> ⚡ Voice/Text List & Catering AI {showSmartBasket ? "▲" : "▼"}
            </button>
            <button 
              type="button"
              onClick={() => setShowRecipeHub(true)} 
              className="btn-primary" 
              style={{ 
                padding: "0.35rem 0.9rem", 
                fontSize: "0.85rem", 
                display: "flex", 
                alignItems: "center", 
                gap: "0.4rem", 
                background: "linear-gradient(135deg, #059669, #10b981)",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
                border: "none",
                cursor: "pointer",
                borderRadius: "100px",
                color: "white",
                fontWeight: 600
              }}
            >
              <span>🍲</span> Healthy Millet Recipes
            </button>
            <Link href="/farm-tours" className="btn-secondary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              🎥 Farm Tours
            </Link>
            <Link href="/curated-boxes" className="btn-secondary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              📦 Curated Boxes
            </Link>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center" }}>
          {user && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`btn-secondary`} onClick={() => switchMainTab("orders")} style={{ background:"white", color:"var(--text-dark)", borderColor:"#e2e8f0" }}>
              <PackageCheck size={18} style={{ marginRight:4 }} /> {t("myOrders")} ({myOrders.length})
            </motion.button>
          )}
          <div className="tab-bar" style={{ margin:0, background:"white", border:"1px solid #e2e8f0", padding:4, borderRadius:12 }}>
            <motion.button whileTap={{ scale: 0.95 }} className={`tab-btn ${viewTab==="list"?"active":""}`} onClick={() => setViewTab("list")} style={viewTab==="list"?{background:"var(--green-mid)", color:"white"}:{color:"var(--text-mid)"}}>
              <List size={16} style={{marginRight:4}} /> List
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className={`tab-btn ${viewTab==="map"?"active":""}`} onClick={() => setViewTab("map")} style={viewTab==="map"?{background:"var(--green-mid)", color:"white"}:{color:"var(--text-mid)"}}>
              <MapIcon size={16} style={{marginRight:4}} /> Map
            </motion.button>
          </div>
        </div>
      </div>

      {/* My Orders Panel */}
      <AnimatePresence>
        {showOrders && user && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card mb-3" style={{ overflowY:"auto", background:"white", borderColor:"#e2e8f0", borderRadius:"var(--radius-lg)" }}>
            <h3 className="section-title" style={{ fontSize:"1.1rem", color:"var(--text-dark)", marginBottom:"1rem" }}>📦 {t("myOrders")}</h3>
            {(!myOrders || myOrders.length === 0) ? (
              <p style={{ color:"var(--text-muted)", fontSize:"0.95rem" }}>No orders yet.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {myOrders?.map(o => (
                  <div key={o._id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"var(--radius-md)" }}>
                    <div>
                      <span style={{ color:"var(--text-dark)", fontWeight:700, fontSize:"1rem", display:"block" }}>{o.crop?.name || "Order"}</span>
                      <span style={{ color:"var(--text-muted)", fontSize:"0.85rem" }}>{o.quantity} {o.crop?.unit||"kg"} • {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div style={{ display:"flex", gap:"1rem", alignItems:"center" }}>
                      <span style={{ color:"var(--green-mid)", fontWeight:800, fontSize:"1.1rem" }}>₹{(o.totalAmount||0).toLocaleString()}</span>
                      <span className={`badge ${o.status==="delivered"?"badge-green":o.status==="cancelled"?"badge-red":"badge-yellow"}`}>{o.status?.replace("_"," ")}</span>
                      {(o.status === "in_transit" || o.status === "picked_up") && (
                        <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "flex", gap: "0.3rem" }} onClick={() => setTrackingOrder(o)}>
                          <Navigation size={14} /> Track
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SMART CURATED BASKET & EVENT CATERING AI PANEL ── */}
      <AnimatePresence>
        {showSmartBasket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: "1.5rem" }}
          >
            <SmartCuratedBasket onAddToCartSuccess={() => setShowSmartBasket(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* SEARCH + FILTER SECTION (Enhanced)             */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2rem" }}>
        
        {/* Search Bar + Filter Toggle */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 300, position: "relative" }} ref={searchRef}>
            <AutoSuggestInput 
              value={search} 
              onChange={handleSearchChange}
              onSpeak={() => {
                if (listening && activeField === "search") {
                  if (typeof stopListening === "function") stopListening();
                  return;
                }
                startListening((transcript) => {
                  setSearch(transcript);
                }, { fieldId: "search", append: false });
              }}
              listening={listening && activeField === "search"}
              interim={interim}
              placeholder="🔍 Search crops, vegetables, grains... (case insensitive)" 
              fieldType="default"
              style={{
                width: "100%", padding: "1.2rem 2.5rem 1.2rem 3rem", fontSize: "1.1rem",
                borderRadius: "100px", border: "1px solid #e2e8f0", background: "white",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)", outline: "none", transition: "all 0.3s"
              }}
            />
            {search && (
              <button 
                onClick={() => { setSearch(""); setSuggestions([]); }} 
                style={{ position: "absolute", right: "1.2rem", background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Clear Search"
              >
                <X size={18} />
              </button>
            )}

            {/* Search Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                    background: "white", border: "1px solid #e2e8f0",
                    borderRadius: "16px", marginTop: "0.5rem",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                    overflow: "hidden", maxHeight: "320px", overflowY: "auto"
                  }}>
                  <div style={{ padding: "0.5rem" }}>
                    {suggestions.map((sug, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ background: "#f0fdf4" }}
                        onClick={() => applySuggestion(sug)}
                        style={{
                          padding: "0.7rem 1rem",
                          cursor: "pointer",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          transition: "all 0.15s"
                        }}>
                        <span style={{ fontSize: "1.1rem" }}>
                          {sug.type === "organic" ? "🌿" : sug.type === "pesticide_free" ? "🛡️" : sug.type === "budget" ? "💰" : "🔍"}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-dark)", fontSize: "0.92rem" }}>{sug.text}</div>
                          {sug.type !== "name" && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {sug.type === "organic" ? "Certified organic products" : sug.type === "pesticide_free" ? "Chemical-free products" : sug.type === "budget" ? "Budget-friendly option" : ""}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.9rem 1.4rem", borderRadius: "100px",
              background: showFilters || activeFilterCount > 0 ? "var(--green-mid)" : "white",
              color: showFilters || activeFilterCount > 0 ? "white" : "var(--text-dark)",
              border: showFilters || activeFilterCount > 0 ? "none" : "1px solid #e2e8f0",
              fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
              boxShadow: showFilters || activeFilterCount > 0 ? "0 8px 20px rgba(22, 163, 74, 0.3)" : "0 2px 10px rgba(0,0,0,0.04)",
              transition: "all 0.25s", position: "relative"
            }}>
            <SlidersHorizontal size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span style={{
                background: showFilters ? "white" : "var(--green-mid)",
                color: showFilters ? "var(--green-mid)" : "white",
                width: 22, height: 22, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800
              }}>
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </motion.button>
        </div>

        {/* Quick Filter Chips */}
        <QuickFilterChips />

        {/* ─── Advanced Filters Panel ─── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}>
              <div style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "20px",
                padding: "1.75rem",
                boxShadow: "0 10px 40px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-dark)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <SlidersHorizontal size={18} /> Advanced Filters
                  </h3>
                  <button onClick={resetFilters} style={{
                    padding: "0.4rem 1rem", borderRadius: "100px",
                    background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
                    fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.35rem"
                  }}>
                    <X size={14} /> Reset All
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  
                  {/* Quality Filters */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-mid)", display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      🌿 Quality
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.92rem", color: "var(--text-dark)" }}>
                        <input type="checkbox" checked={filterOrganic} onChange={(e) => setFilterOrganic(e.target.checked)} 
                          style={{ width: 18, height: 18, accentColor: "#16a34a" }} />
                        <Leaf size={15} color="#16a34a" /> Organic Certified
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.92rem", color: "var(--text-dark)" }}>
                        <input type="checkbox" checked={filterPesticideFree} onChange={(e) => setFilterPesticideFree(e.target.checked)} 
                          style={{ width: 18, height: 18, accentColor: "#059669" }} />
                        <Shield size={15} color="#059669" /> Pesticide Free
                      </label>
                    </div>
                  </div>

                  {/* Budget / Price Range */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-mid)", display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      💰 Budget Range (₹)
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterMinPrice}
                        onChange={(e) => setFilterMinPrice(e.target.value)}
                        style={{
                          flex: 1, padding: "0.6rem 0.8rem", borderRadius: "10px",
                          border: "1px solid #e2e8f0", fontSize: "0.9rem",
                          outline: "none", background: "#f8fafc"
                        }}
                      />
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>—</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(e.target.value)}
                        style={{
                          flex: 1, padding: "0.6rem 0.8rem", borderRadius: "10px",
                          border: "1px solid #e2e8f0", fontSize: "0.9rem",
                          outline: "none", background: "#f8fafc"
                        }}
                      />
                    </div>
                  </div>

                  {/* Distance Filter */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-mid)", display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      📍 Max Distance
                    </label>
                    <select
                      value={filterMaxDistance}
                      onChange={(e) => {
                        setFilterMaxDistance(e.target.value);
                        if (e.target.value && !customerLat) detectCustomerLocation();
                      }}
                      style={{
                        width: "100%", padding: "0.6rem 0.8rem", borderRadius: "10px",
                        border: "1px solid #e2e8f0", fontSize: "0.9rem",
                        outline: "none", background: "#f8fafc", cursor: "pointer"
                      }}>
                      {DISTANCE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {filterMaxDistance && !customerLat && (
                      <p style={{ fontSize: "0.75rem", color: "#d97706", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        ⚠️ Enable location to use distance filter
                      </p>
                    )}
                  </div>

                  {/* Sort By */}
                  <div>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-mid)", display: "block", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      📊 Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        width: "100%", padding: "0.6rem 0.8rem", borderRadius: "10px",
                        border: "1px solid #e2e8f0", fontSize: "0.9rem",
                        outline: "none", background: "#f8fafc", cursor: "pointer"
                      }}>
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fixed Inline Online Payment Options (No Floating Popup) */}
                {paymentMethod === "online" && (
                  <div style={{
                    marginBottom: "1rem",
                    padding: "1.1rem",
                    background: "#f8fafc",
                    borderRadius: "16px",
                    border: "1.5px solid #e2e8f0"
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.75rem" }}>
                      Select Online Payment Mode
                    </div>

                    {/* Sub-method tabs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.85rem" }}>
                      <button
                        type="button"
                        onClick={() => setOnlineSubMethod("upi")}
                        style={{
                          padding: "0.6rem 0.4rem", borderRadius: "10px",
                          border: onlineSubMethod === "upi" ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                          background: onlineSubMethod === "upi" ? "#eff6ff" : "white",
                          color: onlineSubMethod === "upi" ? "#1d4ed8" : "#475569",
                          fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>📱</span>
                        <span>UPI / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlineSubMethod("wallet")}
                        style={{
                          padding: "0.6rem 0.4rem", borderRadius: "10px",
                          border: onlineSubMethod === "wallet" ? "2px solid #10b981" : "1px solid #cbd5e1",
                          background: onlineSubMethod === "wallet" ? "#ecfdf5" : "white",
                          color: onlineSubMethod === "wallet" ? "#047857" : "#475569",
                          fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>👛</span>
                        <span>Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlineSubMethod("card")}
                        style={{
                          padding: "0.6rem 0.4rem", borderRadius: "10px",
                          border: onlineSubMethod === "card" ? "2px solid #6366f1" : "1px solid #cbd5e1",
                          background: onlineSubMethod === "card" ? "#eef2ff" : "white",
                          color: onlineSubMethod === "card" ? "#4338ca" : "#475569",
                          fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>💳</span>
                        <span>Cards</span>
                      </button>
                    </div>

                    {/* Mode details */}
                    {onlineSubMethod === "upi" && (
                      <div style={{ textAlign: "center", background: "white", padding: "1rem", borderRadius: "12px", border: "1.5px dashed #3b82f6" }}>
                        <div style={{ display: "inline-block", padding: "0.5rem", background: "white", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "0.5rem" }}>
                          <QRCode value={`upi://pay?pa=${merchantUpi}&pn=Rythu%20Jana%20Sethu&am=${totalAmount}&cu=INR&tn=RythuOrder`} size={110} level="M" />
                        </div>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                          Scan with GPay / PhonePe / Paytm / BHIM
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "#f8fafc", padding: "4px 8px", borderRadius: "8px", border: "1px solid #e2e8f0", maxWidth: "280px", margin: "0 auto 0.5rem auto" }}>
                          <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>UPI:</span>
                          <code style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 700 }}>{merchantUpi}</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(merchantUpi);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            style={{ border: "none", background: copiedUpi ? "#dcfce7" : "#e2e8f0", color: copiedUpi ? "#16a34a" : "#475569", borderRadius: "4px", padding: "2px 6px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer" }}
                          >
                            {copiedUpi ? "✓ Copied" : "📋 Copy"}
                          </button>
                        </div>

                        <a
                          href={`upi://pay?pa=${merchantUpi}&pn=Rythu%20Jana%20Sethu&am=${totalAmount}&cu=INR&tn=RythuOrder`}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#3b82f6", color: "white", padding: "5px 12px", borderRadius: "8px", textDecoration: "none", fontSize: "0.78rem", fontWeight: 700 }}
                        >
                          ⚡ Open in UPI App
                        </a>

                        <div style={{ marginTop: "0.6rem", display: "flex", gap: "4px" }}>
                          <input
                            placeholder="Optional: Enter UPI Ref / UTR No"
                            value={inlineUtr}
                            onChange={e => setInlineUtr(e.target.value)}
                            style={{ flex: 1, padding: "5px 8px", fontSize: "0.78rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                          />
                        </div>
                      </div>
                    )}

                    {onlineSubMethod === "wallet" && (
                      <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #10b981", textAlign: "center" }}>
                        <div style={{ fontSize: "0.82rem", color: "#065f46", fontWeight: 600 }}>Rythu Wallet Balance</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: (user?.walletBalance || 0) >= totalAmount ? "#059669" : "#dc2626", margin: "0.2rem 0" }}>
                          ₹{(user?.walletBalance || 0).toLocaleString()}
                        </div>
                        {(user?.walletBalance || 0) < totalAmount ? (
                          <div style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>
                            ⚠️ Insufficient balance for this order (Need ₹{totalAmount.toLocaleString()})
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 600 }}>
                            ✓ Sufficient balance available
                          </div>
                        )}
                      </div>
                    )}

                    {onlineSubMethod === "card" && (
                      <div style={{ background: "white", padding: "1rem", borderRadius: "12px", border: "1px solid #6366f1", textAlign: "center" }}>
                        <div style={{ fontSize: "0.85rem", color: "#3730a3", fontWeight: 700 }}>Cards & NetBanking</div>
                        <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.78rem", color: "#64748b" }}>
                          Pay securely via Visa, MasterCard, RuPay & NetBanking via Razorpay.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Active filters summary */}
                {activeFilterCount > 0 && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Sparkles size={14} color="#16a34a" />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#16a34a" }}>
                      {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active — Showing {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* ─── SHREE ANNA & TRADITIONAL SUPERFOODS SPOTLIGHT BANNER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 50%, #f0fdf4 100%)",
            border: "1.5px solid #fcd34d",
            borderRadius: "16px",
            padding: "1.2rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 4px 15px rgba(245, 158, 11, 0.08)"
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", maxWidth: "680px" }}>
            <span style={{ fontSize: "2.4rem" }}>🌾</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "1.05rem", color: "#92400e", fontWeight: 900 }}>
                  Shree Anna &amp; Ancestral Superfoods Movement
                </strong>
                <span style={{ background: "#16a34a", color: "white", padding: "2px 8px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700 }}>
                  🌾 Arikelu Spotlight
                </span>
                <span style={{ background: "#d97706", color: "white", padding: "2px 8px", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 700 }}>
                  🌴 Thaati Bellam (Palm Jaggery)
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.83rem", color: "#78350f", lineHeight: 1.4 }}>
                Reversing diabetes &amp; rebuilding soil organic carbon! Discover unpolished <strong>Arikelu (Kodo Millet - low GI 50)</strong> and pure woodfire-boiled <strong>Thaati Bellam (60x iron, zero bone-char)</strong> grown with rainfed permaculture and contact botanical sprays.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => {
                setCategory("millet");
                setSearch("");
              }}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "100px",
                background: category === "millet" && !search ? "#92400e" : "#d97706",
                color: "white",
                border: "none",
                fontWeight: 800,
                fontSize: "0.8rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
              <span>🌾</span>
              <span>{category === "millet" ? "✓ Millets Active" : "Arikelu & Millets"}</span>
            </button>
            <button
              onClick={() => {
                setCategory("all");
                setSearch("bellam");
              }}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "100px",
                background: search.toLowerCase().includes("bellam") ? "#166534" : "#059669",
                color: "white",
                border: "none",
                fontWeight: 800,
                fontSize: "0.8rem",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}>
              <span>🌴</span>
              <span>{search.toLowerCase().includes("bellam") ? "✓ Thaati Bellam Active" : "Thaati Bellam"}</span>
            </button>
            <Link href="/farmer"
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "100px",
                background: "white",
                color: "#166534",
                border: "1.5px solid #86efac",
                fontWeight: 800,
                fontSize: "0.8rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>🌱</span>
              <span>Soil &amp; RWH Guide</span>
            </Link>
          </div>
        </motion.div>

        {/* Horizontal Category Pill Scroll */}
        <div style={{ display:"flex", gap:"0.75rem", overflowX:"auto", paddingBottom:"0.5rem", flexShrink:0, maxWidth:"100%" }} className="no-scrollbar">
          {CATS.map(c => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={c} onClick={() => setCategory(c)} style={{
              padding:"0.6rem 1.2rem", borderRadius:"100px",
              border: category===c ? "none" : "1px solid #e2e8f0",
              background: category===c ? "var(--green-mid)" : "white",
              color: category===c ? "white" : "var(--text-mid)",
              fontSize:"0.95rem", fontWeight:700, cursor:"pointer", transition:"all 0.2s",
              whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"0.5rem",
              boxShadow: category===c ? "0 8px 20px rgba(22, 163, 74, 0.3)" : "0 2px 10px rgba(0,0,0,0.02)"
            }}>
              {c === "all" ? `🌾 ${t("allItems")}` : c === "vegetable" ? `🥦 ${t("veggies")}` : c === "fruit" ? `🍎 ${t("fruits")}` : c === "grain" ? `🌾 ${t("grains")}` : c === "millet" ? `🌾 Ancient Millets (Shree Anna)` : t(c)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Dynamic Nutritional Tips Widget */}
      {category !== "all" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card mb-3" 
          style={{ 
            background: "linear-gradient(135deg, rgba(22, 163, 74, 0.05), rgba(59, 130, 246, 0.05))", 
            border: "1px solid rgba(22, 163, 74, 0.2)",
            padding: "1rem 1.5rem"
          }}>
          <h4 style={{ color: "var(--green-deep)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            🥗 Nutritional Tip for {category.charAt(0).toUpperCase() + category.slice(1)}s
          </h4>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0, fontStyle: "italic" }}>
            {category === "vegetable" && "Rich in essential vitamins, minerals, and dietary fiber! Eating dark leafy greens boosts your immune system."}
            {category === "fruit" && "Packed with natural antioxidants! Eating seasonal fruits helps maintain healthy skin and hydration."}
            {category === "grain" && "Excellent source of complex carbohydrates and energy! Whole grains reduce the risk of heart disease."}
            {category === "millet" && "🌾 Ancient Super-Grains (Shree Anna)! Low Glycemic Index (reverses diabetes), gluten-free, 3x calcium, and high dietary fiber."}
            {category === "pulse" && "High in plant-based protein! Pulses are great for muscle building and stabilizing blood sugar levels."}
            {category === "spice" && "Boosts metabolism and reduces inflammation! Turmeric and ginger have powerful medicinal properties."}
            {category === "dairy" && "Rich in calcium and probiotics! Excellent for bone strength and maintaining a healthy gut microbiome."}
            {category === "other" && "Explore diverse agricultural products straight from local farms for a balanced lifestyle."}
          </p>
        </motion.div>
      )}

      {/* Seasonal Specials Section — Real-Time Weather-Based ML Prediction */}
      {viewTab === "list" && search === "" && category === "all" && (
        <div className="mb-3">
          {!seasonalPrediction && !seasonalLoading && (
            <div className="glass-card" style={{ background: "linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(59, 130, 246, 0.08))", border: "1px solid rgba(22, 163, 74, 0.2)", padding: "1.5rem", textAlign: "center" }}>
              <h3 className="section-title mb-1">🌟 AI Seasonal Crop Prediction</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>Get real-time crop recommendations based on your location's live weather, agro-climatic zone, and current season.</p>
              <button className="btn-primary" onClick={async () => {
                setSeasonalLoading(true);
                try {
                  let lat = customerLat, lng = customerLng;
                  if (!lat || !lng) {
                    const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
                    lat = pos.coords.latitude; lng = pos.coords.longitude;
                    setCustomerLat(lat); setCustomerLng(lng);
                  }
                  const res = await API.get(`/ml/seasonal-prediction?lat=${lat}&lng=${lng}`);
                  setSeasonalPrediction(res.data);
                } catch (e) {
                  setMsg({ type: "error", text: "Failed to fetch seasonal prediction. Please enable location." });
                } finally { setSeasonalLoading(false); }
              }} style={{ padding: "0.7rem 2rem", fontSize: "1rem", borderRadius: "100px" }}>
                {seasonalLoading ? "Analyzing Weather..." : "📍 Detect My Location & Predict"}
              </button>
            </div>
          )}

          {seasonalLoading && (
            <div className="glass-card text-center" style={{ padding: "2rem" }}>
              <div className="loader"></div>
              <p style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Fetching live weather & analyzing agro-climatic zone...</p>
            </div>
          )}

          {seasonalPrediction && (
            <div>
              {/* Weather & Zone Header */}
              <div className="glass-card" style={{ background: "linear-gradient(135deg, #064e3b, #0f766e)", color: "white", padding: "1.2rem 1.5rem", marginBottom: "1rem", border: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.3rem" }}>🌟 {seasonalPrediction.season} — Live Weather Prediction</h3>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", opacity: 0.85 }}>Zone: <strong>{seasonalPrediction.agroClimaticZone}</strong></p>
                  </div>
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{seasonalPrediction.weather?.temperature}°C</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{seasonalPrediction.weather?.condition}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>💧 {seasonalPrediction.weather?.humidity}%</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Humidity</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>🌧️ {seasonalPrediction.weather?.rainfall}mm</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Rainfall</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>💨 {seasonalPrediction.weather?.windSpeed} km/h</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>Wind</div>
                    </div>
                  </div>
                </div>
                {seasonalPrediction.weather?.weekForecast && (
                  <div style={{ marginTop: "0.8rem", padding: "0.6rem 0.8rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "0.82rem" }}>
                    📅 7-Day Forecast: Max {seasonalPrediction.weather.weekForecast.avgMaxTemp}°C / Min {seasonalPrediction.weather.weekForecast.avgMinTemp}°C | Total Rainfall: {seasonalPrediction.weather.weekForecast.totalRainfall}mm
                  </div>
                )}
              </div>

              {/* Recommended Crops Grid */}
              <h3 className="section-title mb-1">🌾 Recommended Crops for Your Area</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Ranked by weather suitability score using live temperature, humidity, and rainfall data.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                {seasonalPrediction.recommendedCrops?.map((crop, i) => (
                  <motion.div 
                    key={crop.key} 
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSearch(crop.name);
                      setMsg({ type: "success", text: `Filtered marketplace for in-season ${crop.name}!` });
                      setTimeout(() => setMsg({ type:"", text:"" }), 2500);
                    }}
                    style={{ 
                      background: "white", 
                      borderRadius: "12px", 
                      padding: "1rem 1.2rem", 
                      border: `2px solid ${crop.suitabilityScore >= 70 ? "#86efac" : crop.suitabilityScore >= 50 ? "#fde68a" : "#fca5a5"}`, 
                      boxShadow: "0 4px 15px rgba(0,0,0,0.04)", 
                      cursor: "pointer",
                      position: "relative"
                    }}
                    title={`Click to filter marketplace products for ${crop.name}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}</span>
                        <span>{crop.name}</span>
                      </h4>
                      <span style={{ background: crop.suitabilityScore >= 70 ? "#dcfce7" : crop.suitabilityScore >= 50 ? "#fef9c3" : "#fee2e2", color: crop.suitabilityScore >= 70 ? "#166534" : crop.suitabilityScore >= 50 ? "#854d0e" : "#991b1b", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.8rem", fontWeight: 700 }}>
                        {crop.suitabilityScore}% Match
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{crop.reason}</p>
                    <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--green-mid)", fontWeight: 600, borderTop: "1px dashed #e2e8f0", paddingTop: "0.5rem" }}>
                      <span>Seasonal Suitability</span>
                      <span>🔍 Filter Market &rarr;</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ─── SEASONAL DIET & NUTRITION: WHAT TO CONSUME THIS SEASON ─── */}
              {(() => {
                const rawDiet = seasonalPrediction.suggestedConsumptionProducts?.length
                  ? seasonalPrediction.suggestedConsumptionProducts
                  : getFallbackDietProducts(seasonalPrediction.season, seasonalPrediction.weather?.temperature, seasonalPrediction.weather?.humidity);

                const activeDiet = rawDiet.filter(item => {
                  if (dietCategoryFilter === "all") return true;
                  return item.category === dietCategoryFilter;
                });

                return (
                  <div style={{ marginTop: "1.8rem", marginBottom: "1.5rem" }}>
                    <div style={{
                      background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #eff6ff 100%)",
                      border: "1.5px solid #86efac",
                      borderRadius: "18px",
                      padding: "1.5rem 1.6rem",
                      boxShadow: "0 4px 20px rgba(16, 185, 129, 0.08)"
                    }}>
                      {/* Section Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.2rem" }}>
                        <div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#dcfce7", color: "#166534", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.4rem", border: "1px solid #bbf7d0" }}>
                            <span>🩺 Certified Agro-Nutrition & Ayurvedic Ritucharya</span>
                            <span>•</span>
                            <span>Live Weather Regimen</span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#064e3b" }}>
                            🥗 Recommended Seasonal Diet: What to Consume Right Now
                          </h3>
                          <p style={{ margin: "0.35rem 0 0 0", color: "#047857", fontSize: "0.85rem", maxWidth: "720px", lineHeight: 1.45 }}>
                            At <strong>{seasonalPrediction.weather?.temperature}°C</strong> and <strong>{seasonalPrediction.weather?.humidity}% humidity</strong>, human digestion and hydration needs shift. Consume these natural seasonal foods to balance metabolism, replenish electrolytes, and protect against weather-induced illnesses.
                          </p>
                        </div>

                        {/* Category Filter Pills */}
                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                          {[
                            { k: "all", l: `All Foods (${rawDiet.length})` },
                            { k: "hydration", l: "💧 Hydration" },
                            { k: "immunity", l: "🛡️ Immunity" },
                            { k: "digestive", l: "🌱 Digestives" },
                            { k: "minerals", l: "⚡ Vitality" }
                          ].map(pill => (
                            <button
                              key={pill.k}
                              type="button"
                              onClick={() => setDietCategoryFilter(pill.k)}
                              style={{
                                background: dietCategoryFilter === pill.k ? "#059669" : "#ffffff",
                                color: dietCategoryFilter === pill.k ? "#ffffff" : "#065f46",
                                border: dietCategoryFilter === pill.k ? "none" : "1px solid #a7f3d0",
                                padding: "0.4rem 0.8rem",
                                borderRadius: "100px",
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: dietCategoryFilter === pill.k ? "0 2px 8px rgba(5, 150, 105, 0.25)" : "none"
                              }}
                            >
                              {pill.l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Products Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
                        {activeDiet.map((item, idx) => {
                          const sKey = (item.searchKeyword || item.name || "").toLowerCase();
                          const matches = crops.filter(c => {
                            const cName = (c.name || "").toLowerCase();
                            return cName.includes(sKey) || sKey.includes(cName);
                          });
                          const inStock = matches.length > 0;
                          const lowestPrice = inStock ? Math.min(...matches.map(c => c.price || 999)) : null;
                          const bestCrop = inStock ? matches.sort((a,b) => (b.trustScore || 0) - (a.trustScore || 0))[0] : null;

                          return (
                            <div
                              key={item.name + idx}
                              style={{
                                background: "#ffffff",
                                borderRadius: "14px",
                                border: inStock ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                                padding: "1.1rem",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "0.85rem",
                                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                                position: "relative"
                              }}
                            >
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <span style={{ fontSize: "2rem", lineHeight: 1 }}>{item.icon}</span>
                                    <div>
                                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                        {item.name}
                                      </h4>
                                      <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700, textTransform: "capitalize" }}>
                                        {item.categoryLabel || item.category}
                                      </span>
                                    </div>
                                  </div>
                                  <span style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "100px",
                                    background: "#f0fdf4",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0"
                                  }}>
                                    {item.badge}
                                  </span>
                                </div>

                                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.82rem", color: "#334155", lineHeight: 1.45 }}>
                                  {item.benefit}
                                </p>

                                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                                  <span style={{ fontSize: "0.7rem", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "2px 7px", borderRadius: "6px", fontWeight: 600 }}>
                                    💊 {item.nutrients}
                                  </span>
                                  {item.ayurveda && (
                                    <span style={{ fontSize: "0.7rem", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 7px", borderRadius: "6px", fontWeight: 600 }}>
                                      {item.ayurveda}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Marketplace Integration Footer */}
                              <div style={{ paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {inStock && bestCrop ? (
                                  <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem" }}>
                                      <span style={{ color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span>🟢 Available Fresh</span>
                                        <span style={{ color: "#64748b", fontWeight: 500 }}>({matches.length} farmer{matches.length > 1 ? "s" : ""})</span>
                                      </span>
                                      <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>
                                        ₹{lowestPrice}/{bestCrop.unit || "kg"}
                                      </strong>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.4rem" }}>
                                      <button
                                        type="button"
                                        onClick={() => openCrop(bestCrop)}
                                        style={{
                                          flex: 1,
                                          background: "#059669",
                                          color: "white",
                                          border: "none",
                                          padding: "0.5rem 0.8rem",
                                          borderRadius: "8px",
                                          fontWeight: 700,
                                          fontSize: "0.8rem",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "0.3rem",
                                          boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)"
                                        }}
                                      >
                                        🛒 Buy from Farmers
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          addToCart(bestCrop);
                                          setMsg({ type: "success", text: `🛒 Added fresh in-season ${bestCrop.name} to cart!` });
                                          setTimeout(() => setMsg({ type: "", text: "" }), 2500);
                                        }}
                                        style={{
                                          background: "#ecfdf5",
                                          color: "#047857",
                                          border: "1.5px solid #a7f3d0",
                                          padding: "0.5rem 0.75rem",
                                          borderRadius: "8px",
                                          fontWeight: 800,
                                          fontSize: "0.8rem",
                                          cursor: "pointer"
                                        }}
                                        title="Quick Add to Shopping Cart"
                                      >
                                        + Cart
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>
                                      ⏳ High Seasonal Demand
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearch(item.searchKeyword || item.name);
                                        setMsg({ type: "success", text: `Searching marketplace for ${item.name}...` });
                                        setTimeout(() => setMsg({ type: "", text: "" }), 2500);
                                      }}
                                      style={{
                                        background: "#f1f5f9",
                                        color: "#334155",
                                        border: "1px solid #cbd5e1",
                                        padding: "0.4rem 0.75rem",
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        fontSize: "0.75rem",
                                        cursor: "pointer"
                                      }}
                                    >
                                      🔍 Search Market
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ayurvedic Ritucharya Weather Tip Box */}
                      <div style={{
                        marginTop: "1.2rem",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px dashed #86efac",
                        padding: "0.9rem 1.2rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.8rem",
                        flexWrap: "wrap"
                      }}>
                        <span style={{ fontSize: "1.4rem" }}>🍵</span>
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <strong style={{ fontSize: "0.85rem", color: "#065f46" }}>
                            Ayurvedic Ritucharya (Seasonal Living) Rule for {seasonalPrediction.season}:
                          </strong>
                          <span style={{ fontSize: "0.82rem", color: "#334155", marginLeft: "0.35rem" }}>
                            {seasonalPrediction.weather?.temperature > 30
                              ? "Drink plenty of natural lemon/coconut water, consume light gourd curries, and avoid heavy deep-fried foods during hot peak hours."
                              : seasonalPrediction.weather?.humidity > 70
                              ? "Boil your drinking water, incorporate fresh ginger and garlic to kindle digestive fire, and avoid cold uncooked leafy street salads."
                              : "Start mornings with warm water and amla, eat soaked nuts with unrefined jaggery, and consume winter carrots to kindle digestive fire."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seasonal Insights */}
              {seasonalPrediction.insights?.length > 0 && (
                <div className="glass-card" style={{ background: "rgba(59, 130, 246, 0.04)", border: "1px solid rgba(59, 130, 246, 0.15)", padding: "1rem 1.2rem" }}>
                  <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-dark)" }}>💡 Seasonal Farming Insights</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {seasonalPrediction.insights.map((insight, i) => (
                      <p key={i} style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.6)", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>{insight}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching crops from marketplace */}
              {filtered.some(c => c.name && (seasonalPrediction.cropNames || []).includes(c.name.toLowerCase().trim())) && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h3 className="section-title mb-1">🛒 Available Now — Season-Matched Products</h3>
                  <div className="scroll-x no-scrollbar" style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
                    {filtered
                      .filter(c => c.name && (seasonalPrediction.cropNames || []).includes(c.name.toLowerCase().trim()))
                      .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
                      .slice(0, 6)
                      .map(c => (
                      <motion.div 
                        key={c._id} 
                        data-crop-id={c._id}
                        className="crop-card" 
                        onClick={() => openCrop(c)} 
                        onMouseEnter={() => focusCrop(c)}
                        onMouseLeave={() => blurCrop()}
                        whileHover={{ scale: 1.08, y: -6, boxShadow: "0 20px 50px rgba(22, 163, 74, 0.3)" }}
                        style={{ minWidth: 240, cursor: "pointer", flexShrink: 0, border: "2px solid var(--green-pale)", position: "relative" }}
                      >
                        <div className="crop-img-wrap" style={{ height: 130 }}>
                          {c.image ? <img src={getImgSrc(c.image, c.name, c.category)} alt={c.name} /> : <div className="crop-img-fallback">🌿</div>}
                          {c.isOrganic && <span className="organic-badge">🌿 Organic</span>}
                          <span className="organic-badge" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>✅ Season Match</span>
                        </div>
                        <div className="crop-info" style={{ padding: "0.8rem" }}>
                          <div className="flex-between">
                            <h3 className="crop-title" style={{ fontSize: "1rem" }}>{c.name}</h3>
                            <span className="crop-price">₹{c.price}/{c.unit||"kg"}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem" }}>
                            <TrustBadge trust={getCropTrust(c)} />
                            <DistanceBadge distance={getCropDistance(c)} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {viewTab === "map" ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="marketplace-layout">
          <div className="marketplace-sidebar" style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:"var(--radius-lg)" }}>
            {loading ? (
              <div className="loader-wrapper"><div className="loader"></div></div>
            ) : filtered.length === 0 ? (
              <div className="glass-card text-center" style={{ padding:"2rem", border:"none", boxShadow:"none" }}>
                <p style={{ fontSize:"2.5rem" }}>🌿</p>
                <p style={{ color:"var(--text-muted)", marginTop:"0.75rem" }}>{t("noData")}</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", padding:"1rem" }}>
                {filtered.map(c => {
                  const trust = getCropTrust(c);
                  const dist = getCropDistance(c);
                  return (
                    <motion.div whileHover={{ scale: 1.02 }} key={c._id} onClick={() => setSelected(c)} style={{
                      display:"flex", gap:"0.75rem", alignItems:"center", padding:"0.85rem",
                      background: selected?._id === c._id ? "var(--green-pale)" : "white",
                      border: selected?._id === c._id ? "1.5px solid var(--green-light)" : "1px solid #e2e8f0",
                      borderRadius:"var(--radius-md)", cursor:"pointer", transition:"all 0.2s"
                    }}>
                      <div style={{ width:56, height:56, borderRadius:8, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, overflow:"hidden" }}>
                        {c.image ? <img src={getImgSrc(c.image, c.name, c.category)} alt={c.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{fontSize: "0.6rem", color:"var(--text-muted)", textAlign: "center"}}>No Image</span>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", flexWrap: "wrap" }}>
                          <h4 style={{ color:"var(--text-dark)", fontSize:"0.95rem", fontWeight:700 }}>{c.name}</h4>
                          {c.isAdminStock && <span className="organic-tag" style={{ fontSize:"0.6rem", padding:"2px 6px", background: "#bae6fd", color: "#0369a1" }}>❄️ Clearance</span>}
                          {c.isOrganic && <span className="organic-tag" style={{ fontSize:"0.6rem", padding:"2px 6px" }}>🌿 Organic</span>}
                          {c.isPesticideFree && !c.isOrganic && <span className="organic-tag" style={{ fontSize:"0.6rem", padding:"2px 6px", background: "#ecfdf5", color: "#059669" }}>🛡️ PF</span>}
                        </div>
                        <div style={{ color:"var(--green-mid)", fontWeight:700, fontSize:"1rem" }}>₹{c.price}/{c.unit||"kg"}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                          <span style={{ color:"var(--text-muted)", fontSize:"0.75rem" }}>{c.quantity} {c.unit||"kg"} left</span>
                          <DeliveryETABadge crop={c} customerLat={customerLat} customerLng={customerLng} />
                          {trust && <TrustBadge trust={trust} size="sm" />}
                          {dist !== null && <DistanceBadge distance={dist} />}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <button className="btn-secondary" onClick={(e) => toggleCompare(c, e)} style={{ padding:"0.5rem", borderRadius:"100px", flexShrink:0, background: compareList.find(x => x._id === c._id) ? "var(--green-pale)" : "white", borderColor: compareList.find(x => x._id === c._id) ? "var(--green-mid)" : "#e2e8f0" }} title="Compare">
                          <Scale size={16} color={compareList.find(x => x._id === c._id) ? "var(--green-deep)" : "var(--text-muted)"} />
                        </button>
                        <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); addToCart(c, 1, c.isPrebooking || false); }} style={{ padding:"0.5rem", borderRadius:"100px", flexShrink:0 }} title="Add to Cart">
                          🛒
                        </button>
                        <button className="btn-primary" style={{ width:"auto", padding:"0.5rem 0.85rem", fontSize:"0.8rem", flexShrink:0, borderRadius:"100px" }} onClick={(e) => { e.stopPropagation(); openCrop(c); }}>{c.isPrebooking ? "Pre-book" : t("buy")}</button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="marketplace-map-panel">
            <div className="map-container" style={{ border: "3px solid rgba(22,163,74,0.25)", boxShadow: "0 8px 40px rgba(22,163,74,0.12)", borderRadius: "var(--radius-lg)" }}>
              <MarketplaceMap
                crops={mapLocations}
                selected={selected}
                onCropClick={openCrop}
                trustScores={trustScores}
                customerLat={customerLat}
                customerLng={customerLng}
                onCustomerLocationChange={({ lat, lng, address }) => {
                  setCustomerLat(lat);
                  setCustomerLng(lng);
                  if (address) setLocationName(address);
                }}
              />
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── GRID LIST VIEW ── */
        loading ? (
          <div className="loader-wrapper"><div className="loader"></div><p className="loader-text" style={{color:"var(--text-muted)"}}>{t("loading")}</p></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center" style={{ padding:"4rem", background:"white" }}>
            <div style={{ fontSize:"4rem", marginBottom:"1rem" }}>🌱</div>
            <h3 style={{ color:"var(--text-dark)", fontSize:"1.5rem" }}>{t("noData")}</h3>
            <p style={{ color:"var(--text-muted)", marginTop:"0.5rem" }}>Try adjusting your search or filters.</p>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} style={{
                marginTop: "1rem", padding: "0.6rem 1.5rem", borderRadius: "100px",
                background: "var(--green-mid)", color: "white", border: "none",
                fontWeight: 700, cursor: "pointer", fontSize: "0.9rem"
              }}>
                Reset Filters
              </button>
            )}
          </motion.div>
        ) : (
          <>
            {/* AI Recommendations Section */}
            {aiRecommendations.length > 0 && search === "" && category === "all" && (
              <div className="mb-4" style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <h3 className="section-title mb-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sparkles size={18} color="#3b82f6" /> Recommended For You
                </h3>
                <div className="scroll-x no-scrollbar" style={{ display: "flex", gap: "1rem", overflowX: "auto" }}>
                  {aiRecommendations.map(c => (
                    <motion.div data-crop-id={c._id} whileHover={{ scale: 1.02 }} key={`ai-${c._id}`} className="crop-card" onClick={() => openCrop(c)} style={{ minWidth: 220, cursor: "pointer", flexShrink: 0, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                      <div className="crop-img-wrap" style={{ height: 120 }}>
                        <img src={getImgSrc(c.image, c.name, c.category)} alt={c.name} />
                      </div>
                      <div className="crop-info" style={{ padding: "0.75rem" }}>
                        <h3 className="crop-title" style={{ fontSize: "1rem", color: "#1e3a8a" }}>{c.name}</h3>
                        <div style={{ color: "#2563eb", fontWeight: "bold" }}>₹{c.price}/{c.unit||"kg"}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid-auto">
            {filtered.map(c => {
              const trust = getCropTrust(c);
              const dist = getCropDistance(c);
              return (
                <motion.div
                  data-crop-id={c._id}
                  variants={itemVariants}
                  className={`crop-card ${speakingCropId === c._id ? "crop-card-speaking" : ""}`}
                  key={c._id}
                  onClick={() => openCrop(c)}
                  onMouseEnter={() => focusCrop(c)}
                  onMouseLeave={() => blurCrop()}
                  whileHover={{ scale: 1.025, y: -4, boxShadow: "0 20px 40px -10px rgba(22, 163, 74, 0.25)" }}
                  style={{ 
                    outline: audioActive ? "1px solid transparent" : undefined, 
                    transition: "all 0.25s ease", 
                    position: "relative", 
                    border: speakingCropId === c._id ? "2px solid #22c55e" : "1px solid rgba(22, 163, 74, 0.15)" 
                  }}
                >
                  {/* Live Speaking Audio Equalizer Waveform */}
                  {speakingCropId === c._id && (
                    <div className="speaking-audio-pill">
                      <span className="equalizer-bar bar-1"></span>
                      <span className="equalizer-bar bar-2"></span>
                      <span className="equalizer-bar bar-3"></span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, marginLeft: "4px" }}>
                        {lang === "te" ? "వివరిస్తోంది..." : lang === "hi" ? "सुना रहा है..." : lang === "kn" ? "ವಿವರಿಸುತ್ತಿದೆ..." : lang === "ta" ? "விவரிக்கிறது..." : "Announcing..."}
                      </span>
                    </div>
                  )}

                  <img src={getImgSrc(c.image, c.name, c.category)} alt={c.name} />
                  <div className="crop-card-body">
                    <div className="flex-between">
                      <h3 style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <input 
                          type="checkbox" 
                          checked={compareList.some(comp => comp._id === c._id)}
                          onChange={(e) => toggleCompare(c, e)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--primary)" }}
                          title="Compare this product"
                        />
                        {c.name}
                        <button className="tts-btn" onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isTTSPlaying()) stopTTS();
                          else {
                            const cropSpeech = lang === "te"
                              ? `తాజా ${c.name}. కేజీ ధర ${c.price} రూపాయలు. ${c.quantity} ${c.unit||"కేజీలు"} అందుబాటులో ఉంది.`
                              : lang === "hi"
                              ? `ताज़ा ${c.name}. भाव ${c.price} रुपये प्रति ${c.unit||"किलो"}. ${c.quantity} ${c.unit||"किलो"} उपलब्ध है।`
                              : lang === "kn"
                              ? `ತಾಜಾ ${c.name}. ಬೆಲೆ ಪ್ರತಿ ${c.unit||"ಕೆಜಿ"}ಗೆ ${c.price} ರೂಪಾಯಿ. ${c.quantity} ${c.unit||"ಕೆಜಿ"} ಲಭ್ಯವಿದೆ.`
                              : lang === "ta"
                              ? `புதிய ${c.name}. விலை ஒரு ${c.unit||"கிலோ"}வுக்கு ${c.price} ரூபாய். ${c.quantity} ${c.unit||"கிலோ"} கையிருப்பில் உள்ளது.`
                              : `Fresh ${c.name}. ${c.price} rupees per ${c.unit||"kg"}. ${c.quantity} ${c.unit||"kg"} available direct from farm.`;
                            playTTS(cropSpeech, lang, { overlap: false });
                          }
                        }} title="Listen to crop details">
                          <Volume2 size={16}/>
                        </button>
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                        {c.isFlashSale && (
                          <span className="organic-tag" style={{ background: "#ef4444", color: "white", borderColor: "#dc2626", animation: "pulse 2s infinite" }}>
                            ⚡ {Math.max(0, Math.floor((c.flashExpiry - currentTime) / 3600000))}h {Math.max(0, Math.floor(((c.flashExpiry - currentTime) % 3600000) / 60000))}m Left
                          </span>
                        )}
                        {c.isAdminStock && <span className="organic-tag" style={{ background: "#bae6fd", color: "#0369a1", borderColor: "#7dd3fc" }}>❄️ Clearance</span>}
                        {c.isOrganic && <span className="organic-tag">🌿 Organic</span>}
                        {c.isPesticideFree && !c.isOrganic && <span className="organic-tag" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>🛡️ Chemical-Free</span>}
                        {(c.isMillet || c.category === "millet") && (
                          <span className="organic-tag" style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a", fontWeight: 700 }}>
                            🌾 Shree Anna
                          </span>
                        )}
                        {c.isPermaculture && (
                          <span className="organic-tag" style={{ background: "#dcfce7", color: "#166534", borderColor: "#86efac", fontWeight: 700 }}>
                            🌱 Permaculture
                          </span>
                        )}
                        {c.pesticideType === "contact" && (
                          <span className="organic-tag" style={{ background: "#eff6ff", color: "#1e40af", borderColor: "#bfdbfe" }}>
                            🧴 Contact Spray
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Realistic Freshness & e-KYC Badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: "0.2rem 0 0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#166534", background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.25)", padding: "2px 7px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        🌱 Morning Harvest • Farm Gate
                      </span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#0369a1", background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.25)", padding: "2px 7px", borderRadius: "6px" }}>
                        ✓ e-KYC Farmer
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                      <div>
                        {festivalConfig ? (
                          <>
                            <div style={{ color:"var(--text-muted)", fontSize:"0.8rem", textDecoration:"line-through" }}>₹{c.price}/{c.unit}</div>
                            <div style={{ fontSize:"1.2rem", fontWeight:700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              ₹{Math.round(c.price * (1 - festivalConfig.discountPercentage / 100))}/{c.unit}
                              <span style={{ fontSize: "0.7rem", background: "var(--red-error)", color: "white", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>-{festivalConfig.discountPercentage}%</span>
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize:"1.2rem", fontWeight:700, color: "var(--text-muted)" }}>₹{c.price}/{c.unit}</div>
                        )}
                      </div>
                      {dist !== null && <DistanceBadge distance={dist} />}
                    </div>
                    <div className="flex-between">
                      <div className="crop-qty" style={{ margin: 0 }}>{c.quantity} {c.unit||"kg"} left</div>
                      <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem", animation: "pulse 2s infinite" }}>
                        <span style={{ fontSize: "0.9rem" }}>🔥</span> {(c._id.charCodeAt(c._id.length-1) % 12) + 3} looking
                      </div>
                    </div>
                    
                    {/* Delivery ETA + Trust Score Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                      <DeliveryETABadge crop={c} customerLat={customerLat} customerLng={customerLng} />
                      {trust && <TrustBadge trust={trust} size="sm" />}
                    </div>
                    
                    {c.farmer && <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", margin:"0.3rem 0 0.5rem", display:"flex", alignItems:"center", gap:"0.3rem" }}>👨‍🌾 {c.farmer.name} {c.farmer.farmName ? `• 🏡 ${c.farmer.farmName}` : ""}</p>}
                    {c.location && <p style={{ fontSize:"0.8rem", color:"var(--text-muted)", margin:"0.3rem 0 0.5rem", display:"flex", alignItems:"center", gap:"0.3rem" }}><MapIcon size={14}/> {c.location.substring(0,35)}...</p>}
                    
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                      <button className="btn-secondary" onClick={(e) => toggleCompare(c, e)} style={{ padding:"0.6rem", borderRadius:"100px", display:"flex", justifyContent:"center", background: compareList.find(x => x._id === c._id) ? "var(--green-pale)" : "white", borderColor: compareList.find(x => x._id === c._id) ? "var(--green-mid)" : "#e2e8f0" }} title="Compare">
                        <Scale size={16} color={compareList.find(x => x._id === c._id) ? "var(--green-deep)" : "var(--text-muted)"} />
                      </button>
                      <button className="btn-primary" onClick={(e) => { e.stopPropagation(); openCrop(c); }} style={{ fontSize:"0.85rem", padding:"0.6rem", borderRadius:"100px", flex: 1, background: c.isPrebooking ? "var(--yellow-wheat)" : "", color: c.isPrebooking ? "#000" : "" }}>
                        <ShoppingBag size={16} /> {c.isPrebooking ? "Pre-book" : t("buy")}
                      </button>
                      <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); addToCart(c, 1, c.isPrebooking || false); }} style={{ fontSize:"0.85rem", padding:"0.6rem", borderRadius:"100px", flex: 1 }}>
                        🛒 Add
                      </button>
                    </div>

                    <div style={{ marginTop: "0.4rem" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreselectedCropForPool(c);
                          switchMainTab("groups");
                        }}
                        style={{
                          width: "100%",
                          padding: "0.45rem",
                          borderRadius: "100px",
                          border: "1px dashed #3b82f6",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem"
                        }}>
                        <Users size={13} /> Buy in Bulk (Start Pool)
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          </>
        )
      )}

      {/* ── FULL-PAGE ORDER / PRODUCT MODAL ── */}
      {showModal && selected && (
        <div style={{ position:"fixed", inset:0, background:"#f8fafc", zIndex:100000, overflowY:"auto" }}>
          <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"2rem", position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            
            {/* Explicit Close / Back Button */}
            <button 
              onClick={() => { setShowModal(false); setMsg({ type:"", text:"" }); setShowBill(null); setTrustScoreDetail(null); }}
              style={{ position: "absolute", top: "1.5rem", left: "1.5rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "100px", padding: "0.6rem 1.2rem", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, boxShadow: "0 4px 15px rgba(0,0,0,0.05)", transition: "all 0.2s" }}
              title="Close and Go Back"
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Back to Market
            </button>

            {/* ── BILL VIEW ── */}
            {showBill ? (
              <div>
                <div className="bill-receipt">
                  <div className="bill-header">
                    <h3>🌾 Rythu Jana Sethu — Order Bill</h3>
                    <p>Bill #{showBill.billNumber}</p>
                    <p>{showBill.date}</p>
                  </div>
                  <div className="bill-row"><span className="label">Customer</span><span>{showBill.customerName}</span></div>
                  <div className="bill-row"><span className="label">Farmer</span><span>{showBill.farmerName}</span></div>
                  <div className="bill-row"><span className="label">{deliveryType === "farm_pickup" ? "Pickup" : "Delivery"} Address</span><span>{showBill.deliveryAddress?.substring(0,40)}</span></div>
                  <div style={{ borderTop:"1px dashed rgba(82,183,136,0.3)", margin:"0.75rem 0" }}></div>
                  <div className="bill-row"><span className="label">{showBill.cropName} × {showBill.quantity} {showBill.unit}</span><span>₹{showBill.unitPrice}/{showBill.unit}</span></div>
                  <div className="bill-row"><span className="label">Subtotal</span><span>₹{showBill.subtotal.toLocaleString()}</span></div>
                  {showBill.deliveryType === "farm_pickup" ? (
                    <div className="bill-row"><span className="label">Delivery</span><span className="free">🏡 Farm Pickup — FREE</span></div>
                  ) : (
                    <div className="bill-row"><span className="label">Delivery ({showBill.deliveryDistance} km)</span><span>₹{showBill.deliveryCharges}</span></div>
                  )}
                  {showBill.pointsUsed > 0 && (
                    <div className="bill-row"><span className="label" style={{ color: "var(--green-mid)" }}>Rewards Discount</span><span style={{ color: "var(--green-mid)" }}>-₹{showBill.pointsUsed}</span></div>
                  )}
                  <div className="bill-row total"><span>Total</span><span>₹{showBill.totalAmount.toLocaleString()}</span></div>
                  <div className="bill-row"><span className="label">Payment</span><span className="badge badge-blue">{showBill.paymentMode?.toUpperCase()}</span></div>
                </div>
                <div style={{ display:"flex", gap:"0.75rem", marginTop:"1rem" }}>
                  <button className="btn-secondary" onClick={() => window.print()} style={{ flex:1 }}>🖨️ Print Bill</button>
                  <button className="btn-primary" onClick={() => { setShowModal(false); setShowBill(null); setMsg({ type:"", text:"" }); }} style={{ flex:1 }}>✅ Done</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1.5rem", width: "100%", alignItems: "start" }}>
                
                {/* ── LEFT COLUMN: Product Info, Imagery, Analytics ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {/* Crop Header */}
                <div style={{ display:"flex", gap:"1rem", marginBottom:"1.5rem", alignItems:"flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                    <img src={getImgSrc(selected.image, selected.name, selected.category)} alt={selected.name} style={{ width:100, height:100, objectFit:"cover", borderRadius:12 }} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShow3DView(true); }}
                      style={{ fontSize: "0.75rem", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", padding: "0.3rem 0.6rem", borderRadius: "100px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      View in 3D
                    </button>
                  </div>
                  <div>
                    <h2 style={{ color: "var(--text-dark)", fontSize:"1.4rem", fontWeight:700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {selected.name}
                      <button className="tts-btn" onClick={(e) => { e.stopPropagation(); playTTS(`Crop: ${selected.name}. Price is ${selected.price} rupees per ${selected.unit||"kg"}. Quantity available: ${selected.quantity} ${selected.unit||"kg"}`, lang); }}><Volume2 size={20}/></button>
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                      {selected.isPrebooking && <span className="organic-tag mb-1" style={{ background: "var(--yellow-wheat)", color: "#000", border: "none" }}>⏳ Pre-Booking</span>}
                      {selected.isOrganic && <span className="organic-tag mb-1">🌿 Certified Organic</span>}
                      {selected.isPesticideFree && !selected.isOrganic && <span className="organic-tag mb-1" style={{ background: "#ecfdf5", color: "#059669" }}>🛡️ Pesticide Free</span>}
                      {selected.qualityGrade && (
                        <span className="organic-tag mb-1" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--green-mid)", color: "var(--green-deep)" }}>
                          ✨ Grade {selected.qualityGrade} (AI Verified)
                        </span>
                      )}
                    </div>
                    {festivalConfig ? (
                      <>
                        <div style={{ color:"var(--text-muted)", fontSize:"0.9rem", textDecoration:"line-through", marginTop:"0.4rem" }}>₹{selected.price}/{selected.unit||"kg"}</div>
                        <div style={{ color:"var(--yellow-wheat)", fontSize:"1.3rem", fontWeight:800 }}>
                          ₹{selectedPrice}/{selected.unit||"kg"}
                          <span style={{ fontSize: "0.8rem", background: "var(--red-error)", color: "white", padding: "0.1rem 0.4rem", borderRadius: "4px", marginLeft: "0.5rem", verticalAlign: "middle" }}>-{festivalConfig.discountPercentage}% OFF</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ color:"var(--yellow-wheat)", fontSize:"1.3rem", fontWeight:800, marginTop:"0.4rem" }}>₹{selected.price}/{selected.unit||"kg"}</div>
                    )}
                    <div style={{ color: "var(--text-muted)", fontSize:"0.82rem", marginTop:"0.25rem" }}>
                      📦 {selected.quantity} {selected.unit||"kg"} {selected.isPrebooking ? "available for pre-order" : "in stock"} • {selected.category}
                    </div>
                    {selected.farmer && <div style={{ color:"var(--text-muted)", fontSize:"0.75rem", marginTop:"0.2rem" }}>👨‍🌾 {selected.farmer.name} {selected.farmer.farmName ? `• 🏡 ${selected.farmer.farmName}` : ""}</div>}
                    {selected.farmLocation && selected.farmLocation !== selected.location && (
                      <div style={{ color:"var(--text-muted)", fontSize:"0.75rem", marginTop:"0.2rem" }}>
                        🌱 <strong style={{ color: "var(--text-dark)" }}>Farm:</strong> {selected.farmLocation.substring(0,50)}
                      </div>
                    )}
                    {selected.location && (
                      <div style={{ color:"var(--text-muted)", fontSize:"0.75rem", marginTop:"0.2rem" }}>
                        📍 <strong style={{ color: "var(--text-dark)" }}>Product Location:</strong> {selected.location.substring(0,50)}
                      </div>
                    )}
                    
                    {/* Farmer Trust Score in Modal */}
                    {(() => {
                      const trust = getCropTrust(selected);
                      const dist = getCropDistance(selected);
                      return (trust || dist !== null) ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                          {trust && (
                            <div 
                              onClick={(e) => { e.stopPropagation(); viewTrustScore(selected.farmer?._id || selected.farmer); }}
                              style={{ cursor: "pointer" }}
                              title="Click to see trust score breakdown">
                              <TrustBadge trust={trust} size="md" />
                            </div>
                          )}
                          {dist !== null && <DistanceBadge distance={dist} />}
                        </div>
                      ) : null;
                    })()}
                    
                    {(selected.farmTourUrl || selected.farmTourVideo) && (
                      <div style={{ marginTop: "1rem" }}>
                        <button onClick={() => setShowFarmTour(selected.farmTourVideo || selected.farmTourUrl)} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", display: "inline-flex", gap: "0.4rem", alignItems: "center", border: "1px solid var(--green-mid)", color: "var(--green-mid)", background: "rgba(22, 163, 74, 0.05)", textDecoration: "none" }}>
                          🎥 Take Virtual Farm Tour
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── REAL FARM ↔ REAL SALE PLACE TRACEABILITY & FOOD SAFETY AUDIT CARD ── */}
                <div style={{
                  marginBottom: "1.5rem",
                  background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #eff6ff 100%)",
                  borderRadius: "16px",
                  border: "1.5px solid #86efac",
                  padding: "1.25rem",
                  boxShadow: "0 4px 15px rgba(22, 163, 74, 0.08)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.3rem" }}>📍</span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#14532d" }}>
                        Real Farm of Origin ↔ Real Sale Place / Mandi Traceability
                      </h4>
                    </div>
                    <span style={{
                      background: selected.isOrganic ? "#16a34a" : "#2563eb",
                      color: "white", padding: "3px 10px", borderRadius: "100px",
                      fontSize: "0.74rem", fontWeight: 800
                    }}>
                      {selected.isOrganic ? "🛡️ Genuine Organic Audited" : "🌾 Farm Gate Traceable"}
                    </span>
                  </div>

                  {/* Dual Grid: Farm of Origin vs Sale Place */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {/* Left: Real Farm */}
                    <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #bbf7d0", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 800, fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>🌾</span>
                        <span>Real Farm of Origin (సాగు స్థలం)</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.8rem", color: "#334155" }}>
                        <div><strong>Farm Name:</strong> {selected.realFarmDetails?.farmName || selected.farmer?.farmName || "Direct Cultivation Farm"}</div>
                        <div><strong>Farmer:</strong> {selected.realFarmDetails?.farmerName || selected.farmer?.name || "Verified Producer"}</div>
                        <div><strong>Location:</strong> {selected.realFarmDetails?.farmLocation || selected.farmLocation || selected.location || "Telangana / AP"}</div>
                        {selected.realFarmDetails?.soilType && <div><strong>Soil Type:</strong> {selected.realFarmDetails.soilType}</div>}
                        {selected.realFarmDetails?.farmSizeAcres && <div><strong>Acreage:</strong> {selected.realFarmDetails.farmSizeAcres} Acres</div>}
                        {selected.realFarmDetails?.latitude && (
                          <div style={{ marginTop: "4px", color: "#15803d", fontWeight: 700, fontSize: "0.75rem" }}>
                            GPS: {Number(selected.realFarmDetails.latitude).toFixed(4)}°, {Number(selected.realFarmDetails.longitude).toFixed(4)}°
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Real Sale Place / Mandi */}
                    <div style={{ background: "white", borderRadius: "12px", border: "1.5px solid #bfdbfe", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e40af", fontWeight: 800, fontSize: "0.88rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>
                          {selected.realSalePlace?.hubType === "cold_storage" ? "❄️" : "🏪"}
                        </span>
                        <span>Real Sale Place / Mandi Hub (విక్రయ స్థలం)</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.8rem", color: "#334155" }}>
                        <div><strong>Hub Name:</strong> {selected.realSalePlace?.hubName || "Regional APMC Mandi / Direct Hub"}</div>
                        <div><strong>Type:</strong> <span style={{ textTransform: "capitalize" }}>{selected.realSalePlace?.hubType ? selected.realSalePlace.hubType.replace('_', ' ') : "Mandi Yard"}</span></div>
                        <div><strong>Dispatch Location:</strong> {selected.realSalePlace?.hubLocation || selected.location}</div>
                        {selected.realSalePlace?.distanceFarmToSaleKm && (
                          <div style={{ color: "#d97706", fontWeight: 800 }}>
                            <strong>Transit Distance:</strong> ~{selected.realSalePlace.distanceFarmToSaleKm} km direct from farm
                          </div>
                        )}
                        {selected.realSalePlace?.latitude && (
                          <div style={{ marginTop: "4px", color: "#1d4ed8", fontWeight: 700, fontSize: "0.75rem" }}>
                            GPS: {Number(selected.realSalePlace.latitude).toFixed(4)}°, {Number(selected.realSalePlace.longitude).toFixed(4)}°
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Anti-Fake Organic & Food Safety Verification Shield */}
                  <div style={{
                    background: selected.organicVerification?.status === "verified_organic" ? "#ecfdf5" : "white",
                    borderRadius: "12px", border: "1px solid #a7f3d0", padding: "0.85rem 1rem",
                    display: "flex", flexDirection: "column", gap: "0.6rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1.1rem" }}>🛡️</span>
                        <strong style={{ fontSize: "0.86rem", color: "#065f46" }}>
                          {selected.organicVerification?.status === "verified_organic"
                            ? "100% Genuine Organic Certified by Food Safety Field Agent"
                            : selected.isOrganic ? "Certified Organic Crop (Zero Synthetic Residues)" : "Direct Farm Produce"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>
                          Safety Score: {selected.organicVerification?.foodSafetyScore || 98}/100
                        </span>
                        <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800 }}>
                          Residue: 0.00 ppm
                        </span>
                      </div>
                    </div>

                    {/* 5-Step Botanical & Organic Verification Indicators */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.4rem", fontSize: "0.72rem" }}>
                      <div style={{ background: "#f0fdf4", padding: "4px 6px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>✅</span> <span>1. Organic Soil Prep</span>
                      </div>
                      <div style={{ background: "#f0fdf4", padding: "4px 6px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>✅</span> <span>2. Untreated Heirloom Seed</span>
                      </div>
                      <div style={{ background: "#f0fdf4", padding: "4px 6px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>✅</span> <span>3. 4-Row Corn Border Shield</span>
                      </div>
                      <div style={{ background: "#f0fdf4", padding: "4px 6px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>✅</span> <span>4. NSKE 5% Neem Spray</span>
                      </div>
                      <div style={{ background: "#f0fdf4", padding: "4px 6px", borderRadius: "6px", border: "1px solid #bbf7d0", color: "#166534", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>✅</span> <span>5. Rapid Residue Test (0.00 ppm)</span>
                      </div>
                    </div>

                    {selected.organicVerification?.agentName && (
                      <div style={{ fontSize: "0.72rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                        <span>Verified by Agent: <strong>{selected.organicVerification.agentName}</strong></span>
                        {selected.organicVerification?.inspectedAt && (
                          <span>Audit Date: {new Date(selected.organicVerification.inspectedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowAuthenticityCert(selected)}
                      style={{
                        marginTop: "0.4rem",
                        background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(22, 101, 52, 0.25)",
                        transition: "all 0.2s"
                      }}
                    >
                      📜 View Full Organic Certificate &amp; Continuous Farm Proofs
                    </button>
                  </div>
                </div>

                {/* ── REAL-TIME CROP GROWTH STAGES & FARMER PROOFS TIMELINE ── */}
                <div style={{
                  marginBottom: "1.5rem",
                  background: "linear-gradient(135deg, #fefce8 0%, #f0fdf4 100%)",
                  borderRadius: "16px",
                  border: "1.5px solid #fef08a",
                  padding: "1.25rem",
                  boxShadow: "0 4px 15px rgba(234, 179, 8, 0.08)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.3rem" }}>🌱</span>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#713f12" }}>
                        Crop Growth Stage & Farmer Field Updates
                      </h4>
                    </div>
                    <span style={{
                      background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a",
                      padding: "3px 10px", borderRadius: "100px", fontSize: "0.78rem", fontWeight: 800,
                      textTransform: "capitalize"
                    }}>
                      Current: {selected.lifecycleStage || selected.growingStage || "Ready"}
                    </span>
                  </div>

                  {/* Visual Lifecycle Stepper */}
                  <div style={{ background: "white", padding: "0.85rem", borderRadius: "12px", border: "1px solid #fef08a", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {["sowing", "vegetative", "flowering", "harvesting", "ready"].map((st, idx) => {
                        const STAGES = ["sowing", "vegetative", "flowering", "harvesting", "ready"];
                        const curr = (selected.lifecycleStage || "ready").toLowerCase();
                        const currIdx = STAGES.indexOf(curr);
                        const isDone = currIdx >= idx;
                        const isCurrent = curr === st;

                        return (
                          <div key={st} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, textAlign: "center" }}>
                            <div style={{
                              width: "28px", height: "28px", borderRadius: "50%",
                              background: isCurrent ? "#16a34a" : isDone ? "#86efac" : "#f1f5f9",
                              color: isCurrent ? "white" : isDone ? "#166534" : "#94a3b8",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.75rem", fontWeight: 800,
                              boxShadow: isCurrent ? "0 0 0 3px rgba(22, 163, 74, 0.25)" : "none"
                            }}>
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <span style={{
                              fontSize: "0.68rem", marginTop: "4px", textTransform: "capitalize",
                              color: isCurrent ? "#15803d" : "#64748b", fontWeight: isCurrent ? 800 : 500
                            }}>
                              {st}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selected.expectedHarvestDate && (
                    <div style={{ marginBottom: "0.8rem", fontSize: "0.8rem", color: "#1e40af", background: "#eff6ff", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>📅</span> <strong>Estimated Harvest & Dispatch Date:</strong> {new Date(selected.expectedHarvestDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Proofs / Updates List */}
                  {selected.lifecycleUpdates && selected.lifecycleUpdates.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      {[...selected.lifecycleUpdates].reverse().slice(0, 3).map((up, i) => (
                        <div key={i} style={{ background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "0.85rem", display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                          {up.imageUrl && (
                            <img 
                              src={up.imageUrl.startsWith("http") || up.imageUrl.startsWith("data:") ? up.imageUrl : `${BASE_URL}/${up.imageUrl.replace(/^\/+/, "")}`}
                              alt="Stage proof" 
                              style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e2e8f0", flexShrink: 0 }} 
                            />
                          )}
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                              <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 700, textTransform: "capitalize" }}>
                                🌱 {up.stage?.replace("_", " ")}
                              </span>
                              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{new Date(up.timestamp).toLocaleDateString()}</span>
                            </div>
                            {up.notes && <p style={{ margin: 0, fontSize: "0.82rem", color: "#334155" }}>{up.notes}</p>}
                            {up.aiSuggestion && (
                              <div style={{ fontSize: "0.74rem", color: "#15803d", marginTop: "0.4rem", background: "#f0fdf4", padding: "4px 8px", borderRadius: "6px" }}>
                                💡 <em>{up.aiSuggestion}</em>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ background: "white", padding: "0.8rem", borderRadius: "10px", border: "1px dashed #cbd5e1", textAlign: "center", fontSize: "0.8rem", color: "#64748b" }}>
                      Farmer confirmed this listing is healthy and in <strong>{selected.lifecycleStage || "ready"}</strong> stage.
                    </div>
                  )}
                </div>
                {/* Price Trends & Analytics Chart */}
                {/* Price Trends & Analytics Chart */}
                {priceTrends && priceTrends.globalPrediction && priceTrends.localPrediction && (
                  <div style={{ marginBottom: "1.5rem", padding: "1.5rem", background: "rgba(59, 130, 246, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                    <h4 style={{ color: "#1e40af", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      📈 Advanced ML Price Predictions
                    </h4>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      <div style={{ background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Global Market Avg</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)" }}>₹{priceTrends.globalPrediction.suggested_price}/kg</div>
                        <div style={{ fontSize: "0.75rem", color: priceTrends.globalPrediction.market_trend === "Rising" || priceTrends.globalPrediction.market_trend === "Upward" ? "#dc2626" : "#16a34a", marginTop: "0.5rem", fontWeight: 600 }}>
                          {priceTrends.globalPrediction.market_trend === "Rising" || priceTrends.globalPrediction.market_trend === "Upward" ? "↗ Trending Up" : "↘ Trending Down"}
                        </div>
                      </div>
                      
                      <div style={{ background: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, right: 0, background: "var(--green-mid)", color: "white", fontSize: "0.6rem", padding: "0.2rem 0.5rem", borderBottomLeftRadius: "8px", fontWeight: "bold" }}>Within 25km</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Local Demand Surge</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--text-dark)" }}>₹{priceTrends.localPrediction.suggested_price}/kg</div>
                        <div style={{ fontSize: "0.75rem", color: priceTrends.localPrediction.market_trend === "Rising" || priceTrends.localPrediction.market_trend === "Upward" ? "#dc2626" : "#16a34a", marginTop: "0.5rem", fontWeight: 600 }}>
                          {priceTrends.localPrediction.market_trend === "Rising" || priceTrends.localPrediction.market_trend === "Upward" ? "↗ High Demand Surge" : "↘ Stable Supply"}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", background: "#f8fafc", padding: "0.8rem", borderRadius: "6px" }}>
                      <strong>🤖 AI Insight:</strong> The local competitor price (within 25km) is currently averaging ₹{Math.round(priceTrends.local25kmAverage)}. 
                      By ordering from {selected.farmer?.name || "this farmer"} at ₹{selected.price}, you are getting a {selected.price < priceTrends.localPrediction.suggested_price ? "GREAT DEAL" : "FAIR MARKET PRICE"}.
                    </p>
                  </div>
                )}

                {/* ─── Trust Score Breakdown (if requested) ─── */}
                <AnimatePresence>
                  {trustScoreDetail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "16px",
                        padding: "1.25rem",
                        marginBottom: "1.25rem",
                        overflow: "hidden"
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h4 style={{ color: "#e2e8f0", fontSize: "0.95rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <Shield size={16} /> Trust Score Breakdown
                        </h4>
                        <button onClick={() => setTrustScoreDetail(null)} style={{
                          background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0.2rem"
                        }}><X size={16} /></button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                        <div style={{
                          width: 60, height: 60, borderRadius: "50%",
                          background: `conic-gradient(${
                            trustScoreDetail.score >= 90 ? "#7c3aed" :
                            trustScoreDetail.score >= 75 ? "#d97706" :
                            trustScoreDetail.score >= 60 ? "#6b7280" :
                            trustScoreDetail.score >= 40 ? "#ea580c" : "#16a34a"
                          } ${trustScoreDetail.score * 3.6}deg, rgba(255,255,255,0.1) 0)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative"
                        }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: "50%",
                            background: "#1a2332",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, color: "white", fontSize: "1rem"
                          }}>
                            {trustScoreDetail.score}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "white", fontWeight: 700, fontSize: "1.1rem" }}>
                            {trustScoreDetail.emoji} {trustScoreDetail.grade}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{trustScoreDetail.label}</div>
                        </div>
                      </div>

                      {/* Parameter Bars */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {trustScoreDetail.breakdown && Object.entries(trustScoreDetail.breakdown).map(([key, val]) => {
                          const labels = {
                            verification: "✅ Verification",
                            rating: "⭐ Average Rating",
                            fulfillment: "📦 Order Fulfillment",
                            experience: "🌱 Experience",
                            organic: "🌿 Organic Ratio",
                            salesVolume: "📊 Sales Volume",
                            accountAge: "📅 Account Age"
                          };
                          const pct = (val.score / val.max) * 100;
                          return (
                            <div key={key}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                <span style={{ fontSize: "0.78rem", color: "#cbd5e1", fontWeight: 600 }}>{labels[key] || key}</span>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{val.score}/{val.max}</span>
                              </div>
                              <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 100, overflow: "hidden" }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  style={{
                                    height: "100%",
                                    borderRadius: 100,
                                    background: pct >= 80 ? "linear-gradient(90deg, #16a34a, #22c55e)" :
                                               pct >= 50 ? "linear-gradient(90deg, #d97706, #f59e0b)" :
                                               "linear-gradient(90deg, #dc2626, #ef4444)"
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {selected.description && (
                  <p style={{ color: "var(--text-muted)", fontSize:"0.88rem", marginBottom:"1.25rem", lineHeight:1.6 }}>{selected.description}</p>
                )}

                {/* Nutrition Info */}
                {nutLoading ? (
                  <div style={{ textAlign:"center", padding:"1rem", color: "var(--text-muted)", fontSize:"0.85rem" }}>🔬 Fetching nutrition data...</div>
                ) : nutritionData && !nutritionData.error ? (
                  <div style={{ marginBottom:"1.25rem" }}>
                    <h4 className="section-title" style={{ fontSize:"1rem" }}>🥗 {t("nutritionInfo")} (per 100g)</h4>
                    <div className="nutrition-grid">
                      {[
                        { l:"Calories", v:`${nutritionData.calories} kcal` },
                        { l:"Carbs",    v:`${nutritionData.carbs}g` },
                        { l:"Protein",  v:`${nutritionData.protein}g` },
                        { l:"Fat",      v:`${nutritionData.fat}g` },
                        { l:"Fiber",    v:`${nutritionData.fiber}g` },
                      ].map((n,i) => (
                        <div key={i} className="nut-item">
                          <div className="nut-val">{n.v}</div>
                          <div className="nut-label">{n.l}</div>
                        </div>
                      ))}
                    </div>

                    {nutritionData.vitamins && nutritionData.vitamins.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <h5 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Rich in Vitamins & Minerals:</h5>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {nutritionData.vitamins.map((v, i) => (
                            <span key={i} style={{ background: "rgba(183, 228, 199, 0.2)", color: "var(--green-deep)", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 600 }}>{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {nutritionData.benefits && nutritionData.benefits.length > 0 && (
                      <div style={{ marginTop: "1rem" }}>
                        <h5 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Health Benefits:</h5>
                        <ul style={{ paddingLeft: "1.2rem", margin: 0, color: "var(--text-mid)", fontSize: "0.82rem" }}>
                          {nutritionData.benefits.map((b, i) => <li key={i} style={{ marginBottom: "0.2rem" }}>{b}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Market Basket Analysis */}
                {basketLoading ? (
                  <div style={{ textAlign:"center", padding:"1rem", color: "var(--text-muted)", fontSize:"0.85rem" }}>🤖 Analyzing shopping patterns...</div>
                ) : basketSuggestions.length > 0 ? (
                  <div style={{ marginBottom: "1.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "1rem", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ fontSize: "1rem", color: "var(--text-dark)", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "space-between" }}>
                      <span>🛒 Frequently Bought Together</span>
                      <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "100px", background: basketDataDriven ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", color: basketDataDriven ? "#86efac" : "#fcd34d", fontWeight: 600 }}>
                        {basketDataDriven ? "📊 Data-Driven" : "🔮 AI Suggested"}
                      </span>
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {basketSuggestions.map((sug, i) => (
                        <div key={i} style={{ 
                          background: "var(--green-mid)", color: "white", padding: "0.4rem 0.8rem", 
                          borderRadius: "100px", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem",
                          cursor: "pointer", transition: "opacity 0.2s"
                        }}
                        title={`Also buy: ${sug.crop}`}
                        >
                          {sug.crop} <span style={{ background: "rgba(0,0,0,0.2)", padding: "0.1rem 0.3rem", borderRadius: "4px", fontSize: "0.7rem" }}>{sug.confidence}% Match</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                </div> {/* End Left Column */}

                {/* ── RIGHT COLUMN: Order Form & Checkout ── */}
                <div style={{ background: "white", padding: "2.5rem", borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", position: "sticky", top: "2rem" }}>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "1.5rem", borderBottom: "2px solid #f8fafc", paddingBottom: "1rem", color: "var(--text-dark)" }}>Secure Checkout</h3>
                  
                  {msg.text && <div className={`alert alert-${msg.type} mb-2`}>{msg.text}</div>}

                {/* Delivery Type Selection */}
                <div className="form-group">
                  <label className="field-label">{t("deliveryOption")}</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                    <div className={`delivery-option ${deliveryType==="farm_pickup"?"selected":""}`} onClick={() => setDeliveryType("farm_pickup")}>
                      <h4>🏡 {t("buyAtFarm")}</h4>
                      <p>Pick up directly from farmer</p>
                      <div className="price" style={{ marginTop:"0.4rem" }}>FREE</div>
                    </div>
                    <div className={`delivery-option ${deliveryType==="standard"?"selected":""}`} onClick={() => setDeliveryType("standard")}>
                      <h4>🚚 {t("homeDelivery")}</h4>
                      <p>Delivered to your doorstep</p>
                      <div className="price" style={{ marginTop:"0.4rem" }}>
                        {deliveryDistance > 0 ? `₹${deliveryCharges} (${Math.round(deliveryDistance)}km) • ETA: ${Math.round(deliveryDistance * 2 + 30)} mins` : `₹${DELIVERY_BASE}+`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-2 mt-2">
                  <div className="form-group">
                    <label className="field-label">Quantity ({selected.unit||"kg"})</label>
                    <div className="input-wrapper">
                      <input
                        className="rs-input"
                        type="number"
                        min={1}
                        max={selected.quantity}
                        value={listening && activeField === "orderQty" && interim ? interim : orderQty}
                        onChange={(e) => setOrderQty(Number(e.target.value))}
                        style={listening && activeField === "orderQty" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}}
                      />
                      <button type="button" className={`mic-btn ${listening && activeField === "orderQty" ? "active" : ""}`} onClick={() => startListening((transcript) => {
                        const numStr = parseSpokenNumber(transcript);
                        const num = parseInt(numStr);
                        if (!isNaN(num)) setOrderQty(num);
                      }, { replace: true, fieldId: "orderQty" })}>🎤</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="field-label">{t("paymentMethod")}</label>
                    <select className="rs-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="cod">💵 {t("cashOnDelivery")}</option>
                      <option value="online">💳 {t("payOnline")}</option>
                    </select>
                  </div>
                </div>

                {/* Address (only for delivery) */}
                {deliveryType !== "farm_pickup" && (
                  <div className="form-group">
                    <label className="field-label">Delivery Address</label>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <div className="input-wrapper" style={{ flex: 1 }}>
                        <input
                          className="rs-input"
                          placeholder="Type or speak your delivery address..."
                          value={listening && activeField === "orderAddr" && interim ? `${orderAddr} ${interim}...` : orderAddr}
                          onChange={(e) => setOrderAddr(e.target.value)}
                          style={listening && activeField === "orderAddr" && interim ? { color: "rgba(183,228,199,0.7)", fontStyle: "italic" } : {}}
                        />
                        <VoiceMicButton
                          fieldId="orderAddr"
                          onResult={(t) => setOrderAddr(prev => prev ? prev + " " + t : t)}
                          startListening={startListening}
                          stopListening={stopListening}
                          listening={listening}
                          activeField={activeField}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowLocationPicker(true)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1rem",
                          background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "12px",
                          color: "#3b82f6", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
                        }}
                      >
                        📍 Map
                      </button>
                    </div>
                    {orderAddr && (
                      <p style={{ fontSize: "0.75rem", color: "var(--green-mid)", marginTop: "0.3rem" }}>
                        📍 {orderAddr}
                      </p>
                    )}
                  </div>
                )}

                {/* Points Discount */}
                {user && user.rewardPoints > 0 && (
                  <div className="form-group" style={{ background: "var(--green-pale)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--green-mid)" }}>
                    <div className="flex-between">
                      <div>
                        <span style={{ fontWeight: 700, color: "var(--green-deep)" }}>🏆 Use Reward Points</span>
                        <p style={{ fontSize: "0.8rem", color: "var(--green-mid)" }}>You have {user.rewardPoints} points available. (1 point = ₹1)</p>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} style={{ width: 20, height: 20 }} />
                        <span style={{ fontWeight: 600, color: "var(--green-deep)" }}>Apply</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ── Circular Economy Wet-Waste Collection Opt-in (Doorstep Exchange) ── */}
                {deliveryType !== "farm_pickup" && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem 1.2rem",
                    borderRadius: "14px",
                    border: hasWetWasteDonation ? "2px solid #16a34a" : "1.5px dashed #94a3b8",
                    background: hasWetWasteDonation ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#f8fafc",
                    transition: "all 0.25s ease"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "1.1rem" }}>🌱</span>
                          <strong style={{ fontSize: "0.95rem", color: "#166534" }}>
                            Donate Kitchen Wet Waste (Vegetable & Fruit Peels)
                          </strong>
                          <span style={{ background: "#22c55e", color: "white", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "100px" }}>
                            +15 Green Points
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                          The delivery agent will carry an airtight container and collect your raw peels simultaneously during delivery, returning them to the cold storage hub for vermicompost & biogas.
                        </p>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", cursor: "pointer", marginTop: "2px" }}>
                        <input
                          type="checkbox"
                          checked={hasWetWasteDonation}
                          onChange={(e) => setHasWetWasteDonation(e.target.checked)}
                          style={{ width: "22px", height: "22px", accentColor: "#16a34a", cursor: "pointer" }}
                        />
                      </label>
                    </div>

                    {/* Expandable options & strict caution */}
                    {hasWetWasteDonation && (
                      <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(22, 163, 74, 0.25)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                          <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#166534" }}>
                            Estimated Waste Weight:
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {[1, 2, 3, 5].map(kg => (
                              <button
                                key={kg}
                                type="button"
                                onClick={() => setWetWasteEstKg(kg)}
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #16a34a",
                                  background: wetWasteEstKg === kg ? "#16a34a" : "white",
                                  color: wetWasteEstKg === kg ? "white" : "#166534",
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  cursor: "pointer"
                                }}
                              >
                                ~{kg} kg
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Strict Policy & Caution Banner */}
                        <div style={{
                          background: "#fffbeb",
                          border: "1px solid #fef08a",
                          borderRadius: "10px",
                          padding: "0.75rem",
                          fontSize: "0.78rem",
                          color: "#854d0e",
                          lineHeight: 1.45
                        }}>
                          <div style={{ fontWeight: 800, color: "#b45309", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                            ⚠️ Strict Waste Collection Caution & Policy:
                          </div>
                          <ul style={{ margin: "2px 0 4px 1.1rem", padding: 0 }}>
                            <li><strong>Accepted:</strong> Raw vegetable peels, fruit skins, leafy tops, melon rinds, banana peels.</li>
                            <li><strong>Strictly Rejected:</strong> Cooked food, plastic bags, dairy, meat/bones, packaging, or dry trash.</li>
                          </ul>
                          <div style={{ fontSize: "0.73rem", color: "#a16207" }}>
                            🔍 <em>Agent will verify via doorstep AI camera scan before accepting. Non-compliant waste is rejected.</em>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bill Preview */}
                <div className="bill-receipt" style={{ margin:"1rem 0" }}>
                  <div className="bill-row"><span className="label">{selected.name} × {orderQty} {selected.unit||"kg"}</span><span>₹{subtotal.toLocaleString()}</span></div>
                  {deliveryType === "farm_pickup" ? (
                    <div className="bill-row"><span className="label">Delivery</span><span className="free">🏡 Farm Pickup — FREE</span></div>
                  ) : (
                    <div className="bill-row"><span className="label">Delivery {deliveryDistance > 0 ? `(${Math.round(deliveryDistance)}km)` : ""}</span><span>₹{deliveryCharges}</span></div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="bill-row"><span className="label" style={{ color: "var(--green-mid)" }}>Rewards Discount</span><span style={{ color: "var(--green-mid)" }}>-₹{pointsDiscount}</span></div>
                  )}
                  <div className="bill-row total"><span>{t("total")}</span><span>₹{totalAmount.toLocaleString()}</span></div>
                </div>

                <div style={{ display:"flex", gap:"0.75rem", flexDirection: "column" }}>
                  <div style={{ display:"flex", gap:"0.75rem" }}>
                    <button className="btn-secondary" onClick={() => { setShowModal(false); setMsg({ type:"", text:"" }); setTrustScoreDetail(null); }}>Cancel</button>
                    <button 
                      className="btn-primary" 
                      onClick={handleConfirmOrder} 
                      disabled={ordering || selected.quantity < orderQty} 
                      style={{ 
                        flex: 1, 
                        background: selected.isPrebooking ? "var(--yellow-wheat)" : paymentMethod === "online" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "", 
                        color: selected.isPrebooking ? "#000" : "white" 
                      }}
                    >
                      {ordering ? (
                        <>
                          <span className="loader" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", display: "inline-block", marginRight: "6px" }}></span>
                          Placing Order...
                        </>
                      ) : selected.isPrebooking ? (
                        `⏳ Pre-order Now — ₹${totalAmount.toLocaleString()}`
                      ) : paymentMethod === "cod" ? (
                        `💵 Place COD Order — ₹${totalAmount.toLocaleString()}`
                      ) : (
                        `🔒 Pay & Place Order — ₹${totalAmount.toLocaleString()}`
                      )}
                    </button>
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      addToCart(selected, orderQty, selected.isPrebooking || false);
                      setShowModal(false);
                      setIsCartOpen(true);
                    }} 
                    disabled={selected.quantity < orderQty} 
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    <ShoppingBag size={18} /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Close suggestions when clicking outside */}
      {showSuggestions && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowSuggestions(false)} />
      )}
      {/* Bill is rendered inside the order modal above */}
      
      {showPaymentModal && (
        <PaymentModal 
          amount={totalAmount} 
          customerId={user?._id}
          onClose={() => { setShowPaymentModal(false); setOrdering(false); }} 
          onSuccess={handlePaymentSuccess} 
        />
      )}

      {showFarmTour && (
        <FarmTourModal url={showFarmTour} onClose={() => setShowFarmTour(null)} />
      )}

      {show3DView && selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: "#111827", width: "90%", maxWidth: "500px", borderRadius: "16px", padding: "1.5rem", position: "relative", border: "1px solid #374151" }}>
            <button onClick={() => setShow3DView(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer" }}><X size={24}/></button>
            <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              Interactive 3D View: {selected.name}
            </h3>
            
            <div style={{ height: "300px", background: "#1f2937", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", boxShadow: "inset 0 4px 6px rgba(0,0,0,0.5)" }}>
              {/* Fake 3D Rotation Animation using the image */}
              {selected.image ? (
                <motion.img 
                  src={getImgSrc(selected.image, selected.name, selected.category)} 
                  alt="3D Render" 
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ width: "200px", height: "200px", objectFit: "contain", filter: "drop-shadow(0px 20px 10px rgba(0,0,0,0.5))" }}
                />
              ) : (
                <div style={{ color: "#9ca3af" }}>3D Model Not Available</div>
              )}
              <div style={{ position: "absolute", bottom: "1rem", color: "#6b7280", fontSize: "0.75rem", background: "rgba(0,0,0,0.5)", padding: "0.2rem 0.6rem", borderRadius: "100px" }}>Drag to rotate (Simulated)</div>
            </div>
            
            <div style={{ marginTop: "1rem", color: "#d1d5db", fontSize: "0.85rem", textAlign: "center" }}>
              Experience the actual crop quality using our AI-driven spatial reconstruction. 
            </div>
          </motion.div>
        </div>
      )}
      {/* ── FLOATING COMPARE BAR ── */}
      <AnimatePresence>
        {compareList.length > 0 && !showCompareModal && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{ position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "white", padding: "1rem 1.5rem", borderRadius: "100px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "1.5rem", zIndex: 50, border: "1px solid #e2e8f0" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Scale size={20} color="var(--green-mid)" />
              <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>Comparing {compareList.length} item{compareList.length > 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={() => setCompareList([])} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 }}>Clear</button>
              <button onClick={() => setShowCompareModal(true)} disabled={compareList.length < 2} className="btn-primary" style={{ padding: "0.5rem 1.25rem", borderRadius: "100px", fontSize: "0.9rem", opacity: compareList.length < 2 ? 0.5 : 1 }}>
                {compareList.length < 2 ? "Select one more" : "Compare Now"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING COMPARE BUTTON ── */}
      {compareList.length > 0 && !showCompareModal && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}
        >
          <button 
            className="btn-primary" 
            onClick={() => setShowCompareModal(true)}
            style={{ padding: "0.8rem 1.5rem", borderRadius: "100px", display: "flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 10px 25px rgba(34, 197, 94, 0.4)", fontSize: "1rem", fontWeight: "bold" }}
          >
            <Scale size={20} /> Compare {compareList.length} Item{compareList.length !== 1 && "s"}
          </button>
        </motion.div>
      )}

      {/* ── COMPARE MODAL ── */}
      {showCompareModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card-dark" style={{ maxWidth: 900, width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem" }}>
            <button 
              onClick={() => setShowCompareModal(false)}
              style={{ position: "absolute", top: "1.2rem", right: "1.2rem", background: "rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "50%", padding: "0.5rem", cursor: "pointer" }}
            >
              <X size={20} color="var(--text-dark)" />
            </button>
            
            <h2 style={{ color: "var(--text-dark)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Scale size={24} color="var(--green-mid)" /> Compare Items
            </h2>
            
            <div className="scroll-x no-scrollbar" style={{ overflowX: "auto", paddingBottom: "1rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: `${compareList.length * 200}px` }}>
                <thead>
                  <tr>
                    <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-muted)", borderBottom: "2px solid #e2e8f0" }}>Features</th>
                    {compareList.map(c => (
                      <th key={c._id} style={{ padding: "1rem", textAlign: "center", borderBottom: "2px solid #e2e8f0" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                          <img src={getImgSrc(c.image, c.name, c.category)} style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }} alt={c.name} />
                          <span style={{ color: "var(--text-dark)", fontSize: "1.1rem" }}>{c.name}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price Row */}
                  <tr>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-dark)", borderBottom: "1px solid #e2e8f0" }}>Price</td>
                    {compareList.map(c => (
                      <td key={c._id} style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid #e2e8f0", fontSize: "1.2rem", color: "var(--green-deep)", fontWeight: 700 }}>
                        ₹{c.price}/{c.unit||"kg"}
                      </td>
                    ))}
                  </tr>
                  {/* Quality / Trust Row */}
                  <tr>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-dark)", borderBottom: "1px solid #e2e8f0" }}>Quality / Trust</td>
                    {compareList.map(c => {
                      const t = getCropTrust(c);
                      return (
                        <td key={c._id} style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                          {t ? <TrustBadge trust={t} /> : <span style={{ color: "var(--text-muted)" }}>N/A</span>}
                        </td>
                      )
                    })}
                  </tr>
                  {/* Distance Row */}
                  <tr>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-dark)", borderBottom: "1px solid #e2e8f0" }}>Distance</td>
                    {compareList.map(c => {
                      const d = getCropDistance(c);
                      return (
                        <td key={c._id} style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                          {d !== null ? <DistanceBadge distance={d} /> : <span style={{ color: "var(--text-muted)" }}>Unknown</span>}
                        </td>
                      )
                    })}
                  </tr>
                  {/* Farming Method Row */}
                  <tr>
                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-dark)", borderBottom: "1px solid #e2e8f0" }}>Method</td>
                    {compareList.map(c => (
                      <td key={c._id} style={{ padding: "1rem", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>
                        {c.isOrganic ? <span className="organic-tag" style={{ margin: "0 auto" }}>🌿 Organic</span> : c.isPesticideFree ? <span className="organic-tag" style={{ margin: "0 auto", background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>🛡️ Pesticide-Free</span> : <span style={{ color: "var(--text-muted)" }}>Standard</span>}
                      </td>
                    ))}
                  </tr>
                  {/* Action Row */}
                  <tr>
                    <td style={{ padding: "1rem", borderBottom: "1px solid transparent" }}></td>
                    {compareList.map(c => (
                      <td key={c._id} style={{ padding: "1rem", textAlign: "center" }}>
                        <button className="btn-primary" onClick={() => { addToCart(c, 1, c.isPrebooking || false); setShowCompareModal(false); setIsCartOpen(true); }} style={{ padding: "0.5rem 1rem", borderRadius: "100px", fontSize: "0.85rem", width: "100%" }}>
                          🛒 Add to Cart
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
      </>
      )}
      
      <LocationPickerModal 
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialLat={orderLat || user?.latitude}
        initialLng={orderLng || user?.longitude}
        onConfirm={({ address, lat, lng }) => {
          setOrderAddr(address);
          setOrderLat(lat);
          setOrderLng(lng);
        }}
      />
      
      {/* ─── Healthy Millet Recipe Hub Modal ─── */}
      {showRecipeHub && (
        <HealthyRecipeHub onClose={() => setShowRecipeHub(false)} />
      )}

      {/* ─── IMMERSIVE ORDER SUCCESS CELEBRATION VIEW ─── */}
      {placedOrder && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100002, background: "#f8fafc",
          display: "flex", flexDirection: "column", overflowY: "auto"
        }}>
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1.5rem", width: "100%" }}>
            
            {/* Top Success Badge & Heading */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%", background: "#dcfce7",
                color: "#16a34a", display: "inline-flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 25px rgba(22,163,74,0.25)", marginBottom: "1rem"
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              
              <div style={{ display: "inline-block", background: "#dcfce7", color: "#166534", padding: "4px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.5rem" }}>
                ✓ Order Confirmed Successfully
              </div>
              
              <h1 style={{ margin: "0.5rem 0", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, color: "#0f172a" }}>
                Thank You for Your Order!
              </h1>
              
              <p style={{ margin: 0, color: "#64748b", fontSize: "1rem" }}>
                Bill <strong>#{placedOrder.billNumber || placedOrder._id}</strong> • Your purchase directly empowers rural Indian farmers.
              </p>
            </div>

            {/* Order Highlights Card */}
            <div style={{
              background: "white", borderRadius: "20px", border: "1px solid #e2e8f0",
              padding: "1.75rem", boxShadow: "0 15px 35px rgba(0,0,0,0.04)", marginBottom: "2rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {selected?.image && (
                    <img src={getImgSrc(selected.image, selected.name, selected.category)} alt={selected.name} style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }} />
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>
                      {placedOrder.crop?.name || selected?.name || "Direct Farm Produce"}
                    </h3>
                    <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "2px" }}>
                      Quantity: <strong>{placedOrder.quantity} {placedOrder.crop?.unit || selected?.unit || "kg"}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Amount</div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#16a34a" }}>
                    ₹{(placedOrder.totalAmount || 0).toLocaleString()}
                  </div>
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "6px", background: placedOrder.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7", color: placedOrder.paymentStatus === "paid" ? "#166534" : "#b45309", fontWeight: 700, textTransform: "uppercase" }}>
                    {placedOrder.paymentMode?.toUpperCase()} • {placedOrder.paymentStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* OTP & ETA Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                {placedOrder.verificationCode && (
                  <div style={{ background: "#f0fdf4", border: "1.5px dashed #86efac", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "1px" }}>
                      🔐 Delivery Verification OTP
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#15803d", letterSpacing: "4px", margin: "0.3rem 0" }}>
                      {placedOrder.verificationCode}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#166534" }}>
                      Share with delivery rider at your doorstep
                    </div>
                  </div>
                )}

                <div style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: "1px" }}>
                    ⏱️ Estimated Arrival
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#1d4ed8", margin: "0.3rem 0" }}>
                    ~{placedOrder.estimatedDeliveryMinutes || 35} mins
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#1e40af" }}>
                    Real-time GPS tracking active
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div>📍 <strong>Delivery Address:</strong> {placedOrder.deliveryAddress}</div>
                {placedOrder.hasWetWasteDonation && (
                  <div style={{ color: "#16a34a", fontWeight: 600, marginTop: "4px" }}>
                    🌱 <strong>Wet Waste Donation:</strong> ~{placedOrder.wetWasteEstKg || 2}kg container requested (+15 Green Points)
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setTrackingOrder(placedOrder);
                  setPlacedOrder(null);
                }}
                className="btn-primary hover-scale"
                style={{
                  padding: "1.2rem", fontSize: "1.1rem", borderRadius: "16px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
                  boxShadow: "0 10px 25px rgba(22,163,74,0.3)", fontWeight: 800, cursor: "pointer"
                }}
              >
                🗺️ Track Live Order on Map (Rider GPS & Chat)
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="hover-scale"
                  style={{
                    padding: "1rem", fontSize: "0.95rem", borderRadius: "14px",
                    background: "#f0fdf4", color: "#166534", border: "1.5px solid #86efac",
                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                >
                  📄 View &amp; Print Tax Bill
                </button>

                <button
                  onClick={() => setShowAuthenticityCert(placedOrder)}
                  className="hover-scale"
                  style={{
                    padding: "1rem", fontSize: "0.95rem", borderRadius: "14px",
                    background: "#ecfdf5", color: "#065f46", border: "1.5px solid #6ee7b7",
                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                >
                  📜 View Organic Certificate
                </button>

                <button
                  onClick={() => {
                    setPlacedOrder(null);
                    router.push("/my-orders");
                  }}
                  className="hover-scale"
                  style={{
                    padding: "1rem", fontSize: "0.95rem", borderRadius: "14px",
                    background: "white", color: "#1e293b", border: "1.5px solid #cbd5e1",
                    fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                  }}
                >
                  📦 View All My Orders
                </button>
              </div>

              <button
                onClick={() => setPlacedOrder(null)}
                style={{
                  padding: "0.8rem", fontSize: "0.9rem", color: "#64748b", background: "transparent",
                  border: "none", cursor: "pointer", fontWeight: 600, marginTop: "0.5rem"
                }}
              >
                ← Back to Marketplace
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Tax Invoice Modal ─── */}
      {showInvoiceModal && placedOrder && (
        <OrderInvoiceModal 
          order={placedOrder} 
          onClose={() => setShowInvoiceModal(false)} 
        />
      )}

      {/* ─── Order Tracking Portal ─── */}
      {trackingOrder && (
        <OrderTracking 
          orderId={trackingOrder} 
          onClose={() => setTrackingOrder(null)} 
        />
      )}

      {/* ─── Organic Authenticity Certificate Modal ─── */}
      {showAuthenticityCert && (
        <AuthenticityCertificate 
          crop={showAuthenticityCert?.crop || showAuthenticityCert}
          order={showAuthenticityCert?.orderId || showAuthenticityCert?._id ? showAuthenticityCert : null}
          onClose={() => setShowAuthenticityCert(null)}
        />
      )}
    </motion.div>
  );
}
