import { useState, useEffect, useRef, useCallback } from "react";

// Common Indian crop names for auto-suggest
const CROP_SUGGESTIONS = [
  "Rice", "Wheat", "Maize", "Tomato", "Onion", "Potato", "Brinjal", "Okra", "Spinach",
  "Cauliflower", "Cabbage", "Carrot", "Radish", "Cucumber", "Bitter Gourd", "Bottle Gourd",
  "Ridge Gourd", "Pumpkin", "Watermelon", "Mango", "Banana", "Papaya", "Guava", "Pomegranate",
  "Apple", "Grapes", "Orange", "Lemon", "Coconut", "Sugarcane", "Cotton", "Groundnut",
  "Soybean", "Mustard", "Sunflower", "Turmeric", "Chilli", "Ginger", "Garlic", "Coriander",
  "Cumin", "Black Pepper", "Cardamom", "Cloves", "Fenugreek", "Mint", "Curry Leaves",
  "Drumstick", "Sweet Potato", "Green Peas", "Bengal Gram", "Red Gram", "Black Gram",
  "Jowar", "Bajra", "Ragi", "Millets", "Sesame", "Cashew", "Arecanut", "Tea", "Coffee"
];

// Indian cities for auto-suggest (Comprehensive list covering all major states & agricultural districts)
const CITY_SUGGESTIONS = [
  // Telangana
  "Hyderabad", "Secunderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", "Mahbubnagar",
  "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Siddipet", "Jagtial", "Mancherial", "Nirmal",
  "Kamareddy", "Kothagudem", "Bodhan", "Sangareddy", "Wanaparthy", "Gadwal", "Medak", "Vikarabad",
  "Jangaon", "Bhongir", "Sircilla", "Bellampalli", "Tandur", "Korutla", "Yellandu", "Bhadrachalam",

  // Andhra Pradesh
  "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Kadapa",
  "Tirupati", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni",
  "Tenali", "Proddatur", "Chittoor", "Hindupur", "Bhimavaram", "Madanapalle", "Guntakal", "Srikakulam",
  "Dharmavaram", "Gudivada", "Narasaraopet", "Tadipatri", "Tadepalligudem", "Chilakaluripet", "Amalapuram",
  "Bapatla", "Palakollu", "Kavali", "Mangalagiri", "Sattenapalle", "Vinukonda", "Markapur",

  // Karnataka
  "Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Kalaburagi", "Davanagere", "Ballari",
  "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Hosapete", "Gadag", "Hassan", "Udupi",
  "Bhadravati", "Chitradurga", "Kolar", "Mandya", "Chikkamagaluru", "Gangavathi", "Ranebennur", "Bagalkote",
  "Sirsi", "Karwar", "Chamarajanagar", "Yadgir", "Koppal", "Haveri",

  // Tamil Nadu
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Tirunelveli",
  "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Ooty", "Hosur",
  "Nagercoil", "Kanchipuram", "Karaikkudi", "Neyveli", "Cuddalore", "Kumbakonam", "Tiruvannamalai",
  "Pollachi", "Rajapalayam", "Gudiyatham", "Pudukkottai", "Vaniyambadi", "Ambur", "Nagapattinam", "Namakkal",

  // Maharashtra
  "Mumbai", "Pune", "Nagpur", "Thane", "Pimpri-Chinchwad", "Nashik", "Kalyan-Dombivli", "Vasai-Virar",
  "Aurangabad", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded", "Kolhapur",
  "Ulhasnagar", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur", "Dhule", "Ahmednagar", "Chandrapur",
  "Parbhani", "Ichalkaranji", "Jalna", "Ambarnath", "Bhusawal", "Panvel", "Badlapur", "Beed", "Gondia",
  "Satara", "Barshi", "Yavatmal", "Achalpur", "Osmanabad", "Nandurbar", "Wardha", "Udgir", "Ratnagiri",

  // Kerala
  "Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur", "Alappuzha", "Kottayam",
  "Palakkad", "Manjeri", "Thalassery", "Ponnani", "Vatakara", "Kanhangad", "Payyanur", "Malappuram", "Kayamkulam",

  // Gujarat
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhidham", "Nadiad",
  "Gandhinagar", "Anand", "Morbi", "Mehsana", "Surendranagar", "Bharuch", "Vapi", "Navsari", "Veraval",
  "Porbandar", "Godhra", "Bhuj", "Ankleshwar", "Botad", "Palanpur", "Patan", "Dahod", "Jetpur",

  // Rajasthan
  "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
  "Pali", "Sri Ganganagar", "Beawar", "Hanumangarh", "Chittorgarh", "Kishangarh", "Tonk", "Jhunjhunu", "Baran",

  // Uttar Pradesh
  "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Bareilly", "Aligarh",
  "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura",
  "Badaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Ayodhya", "Hapur", "Etawah", "Mirzapur", "Bulandshahr",
  "Sambhal", "Amroha", "Hardoi", "Fatehpur", "Raebareli", "Orai", "Sitapur", "Bahraich", "Modinagar", "Unnao",

  // Madhya Pradesh
  "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
  "Katni", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha",

  // Bihar & Jharkhand
  "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai",
  "Katihar", "Munger", "Chhapra", "Danapur", "Bettiah", "Saharsa", "Hajipur", "Sasaram", "Dehri",
  "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh",

  // West Bengal & Odisha
  "Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Kharagpur", "Haldia",
  "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada",

  // Punjab, Haryana & North
  "Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Hoshiarpur", "Mohali",
  "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
  "Delhi", "New Delhi", "Dehradun", "Haridwar", "Roorkee", "Shimla", "Srinagar", "Jammu", "Guwahati", "Raipur", "Bilaspur", "Panaji"
];

const STATE_SUGGESTIONS = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Kerala",
  "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh", "Madhya Pradesh",
  "West Bengal", "Bihar", "Jharkhand", "Odisha", "Chhattisgarh",
  "Punjab", "Haryana", "Himachal Pradesh", "Uttarakhand", "Assam",
  "Goa", "Jammu & Kashmir", "Delhi", "Tripura", "Meghalaya", "Manipur", "Nagaland", "Goa", "Puducherry"
];

const SUGGESTION_MAP = {
  crop: CROP_SUGGESTIONS,
  city: CITY_SUGGESTIONS,
  state: STATE_SUGGESTIONS,
  name: [],
  default: []
};

export function useAutoSuggest(fieldType = "default") {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load user's previous inputs from localStorage
  const getUserHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(`rs_suggest_${fieldType}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  }, [fieldType]);

  const saveToHistory = useCallback((value) => {
    if (!value || value.length < 2) return;
    try {
      const history = getUserHistory();
      const updated = [value, ...history.filter(h => h !== value)].slice(0, 20);
      localStorage.setItem(`rs_suggest_${fieldType}`, JSON.stringify(updated));
    } catch { }
  }, [fieldType, getUserHistory]);

  const updateSuggestions = useCallback((text) => {
    setQuery(text);
    if (!text || text.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const baseSuggestions = SUGGESTION_MAP[fieldType] || [];
    const history = getUserHistory();
    const allSuggestions = [...new Set([...history, ...baseSuggestions])];

    const lower = text.toLowerCase();
    // Prioritize starts-with matches first, then contains matches
    const startsWithMatches = allSuggestions.filter(s => s.toLowerCase().startsWith(lower) && s.toLowerCase() !== lower);
    const containsMatches = allSuggestions.filter(s => !s.toLowerCase().startsWith(lower) && s.toLowerCase().includes(lower) && s.toLowerCase() !== lower);
    const filtered = [...startsWithMatches, ...containsMatches].slice(0, 10);

    setSuggestions(filtered);
    setSelectedIndex(-1);
    setShowSuggestions(filtered.length > 0);
  }, [fieldType, getUserHistory]);

  const handleKeyDown = useCallback((e, onSelect) => {
    if (!showSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      onSelect(selected);
      saveToHistory(selected);
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, selectedIndex, saveToHistory]);

  const selectSuggestion = useCallback((value, onSelect) => {
    onSelect(value);
    saveToHistory(value);
    setShowSuggestions(false);
  }, [saveToHistory]);

  const closeSuggestions = useCallback(() => {
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  return {
    suggestions,
    selectedIndex,
    showSuggestions,
    updateSuggestions,
    handleKeyDown,
    selectSuggestion,
    closeSuggestions,
    saveToHistory
  };
}
