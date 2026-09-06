import dotenv from 'dotenv';
dotenv.config();

console.log('==================================================');
console.log('   RYTHU SETHU: COMPREHENSIVE SERVICE HEALTH CHECK');
console.log('==================================================');

// 1. Check Gemini API
async function checkGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return console.log('❌ Gemini: No GEMINI_API_KEY set');
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: 'Say: OK'
    });
    console.log('✅ Google GenAI SDK (gemini-3.5-flash-lite): WORKING! Response:', (res.text || '').trim());
  } catch(e) {
    console.log('❌ Google GenAI API Error:', e.message);
  }
}

// 2. Check Razorpay
async function checkRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return console.log('❌ Razorpay: Keys not set');
  try {
    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await instance.orders.create({
      amount: 1000,
      currency: 'INR',
      receipt: 'test_receipt_1'
    });
    console.log('✅ Razorpay Payment Gateway: WORKING! Created Test Order ID:', order.id);
  } catch(e) {
    console.log('❌ Razorpay API Error:', e.message || e);
  }
}

// 3. Check Open-Meteo Weather API
async function checkWeather() {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.3850&longitude=78.4867&current=temperature_2m,relative_humidity_2m,precipitation');
    const data = await res.json();
    console.log('✅ Open-Meteo Weather API: WORKING! Hyderabad Temp:', data.current?.temperature_2m + '°C, Humidity:', data.current?.relative_humidity_2m + '%');
  } catch(e) {
    console.log('❌ Open-Meteo Weather API Error:', e.message);
  }
}

// 4. Check OSRM Routing Engine
async function checkOSRM() {
  try {
    const res = await fetch('http://router.project-osrm.org/table/v1/driving/78.4867,17.3850;78.4500,17.4000?annotations=distance');
    const data = await res.json();
    if (data.code === 'Ok') {
      console.log('✅ OSRM Table Routing API: WORKING! Driving Distance:', Math.round(data.distances[0][1]) + ' meters');
    } else {
      console.log('❌ OSRM API Response:', data.code);
    }
  } catch(e) {
    console.log('❌ OSRM API Error:', e.message);
  }
}

// 5. Check Google Translate Free Bridge
async function checkTranslate() {
  try {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=te&tl=en&dt=t&q=' + encodeURIComponent('టమోటా');
    const res = await fetch(url);
    const data = await res.json();
    console.log('✅ Google Translate Bridge: WORKING! Translation:', data[0][0][0]);
  } catch(e) {
    console.log('❌ Google Translate Error:', e.message);
  }
}

async function runAll() {
  await checkGemini();
  await checkRazorpay();
  await checkWeather();
  await checkOSRM();
  await checkTranslate();
  console.log('==================================================');
}
runAll();
