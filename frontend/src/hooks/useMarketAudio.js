/**
 * useMarketAudio v2.0 — Immersive Indian Mandi Audio Engine
 *
 * - All vendor voices play simultaneously on ambient mode (scroll top)
 * - As you scroll DOWN to a product, that vendor's voice DOMINATES via IntersectionObserver
 * - All other voices are DUCKED (volume lowered) automatically
 * - Web Audio API GainNode handles real-time volume crossfade
 * - Massive slang/language dictionary for ultra-realistic market feel
 */
import { useRef, useCallback, useEffect, useState } from "react";

// ── Hyper-Realistic Multi-Lingual Selling Slangs ──────────────────────────────
const TEMPLATES = {
  en: [
    (n, p, u, s) => `Hey hey hey! Fresh ${n} just arrived! Only ${p} rupees per ${u}! Come come come!`,
    (n, p, u, s) => `Brother! Looking here brother! Top quality ${n}, direct farm to you, just ${p} a ${u}!`,
    (n, p, u, s) => `Madam, this way please! Sweetest ${n} in the whole market! Just ${p} rupees, take it!`,
    (n, p, u, s) => `Morning harvest! Fresh morning harvest of ${n}! Village price, only ${p} per ${u}!`,
    (n, p, u, s) => `Last stock! Last batch of ${n} today! Hurry, only ${p} rupees per ${u} left!`,
    (n, p, u, s) => `Nobody beats this! Best ${n} for ${p} rupees, nobody in this mandi sells cheaper!`,
    (n, p, u, s) => `Ayo look! Farm fresh ${n}, no chemicals, no middleman, straight to you at ${p}!`,
    (n, p, u, s) => `Two kilos for the price of one! No wait, but this ${n} at ${p} is basically free!`,
    (n, p, u, s) => `Sir! Sir! Taste one piece! I promise you will buy one full kilo of ${n} at ${p}!`,
    (n, p, u, s) => `Superb quality ${n}! Bumper crop this season! Your family will love it at ${p} per ${u}!`,
    (n, p, u, s) => `Arre yaar! This ${n} was plucked at 4am this morning! Nothing fresher! Only ${p}!`,
    (n, p, u, s) => `Grandma special ${n}! Grown with love and cow dung compost only! ${p} rupees per ${u}!`,
    (n, p, u, s) => `Zero chemicals! Zero pesticides! Pure natu ${n} at just ${p} per ${u}! Come na!`,
    (n, p, u, s) => `Desi variety ${n} from Telangana fields! Rich taste, low price, only ${p} per ${u}!`,
    (n, p, u, s) => `My ${n} won second prize at district mandi! Buy the best for ${p} per ${u}!`,
    (n, p, u, s) => `Hurry hurry! Closing in 30 minutes! Get fresh ${n} for only ${p} a ${u}!`,
    (n, p, u, s) => `Wholesale rate for retail! This premium ${n} normally costs more but today ${p} per ${u}!`,
  ],
  te: [
    (n, p, u, s) => `అయ్యో రండి రండి! పొద్దున్నే కోసిన తాజా ${n}! కేవలం ${p} రూపాయలు! తీసుకోండి!`,
    (n, p, u, s) => `బాబూ! ఇటు చూడు బాబూ! ఇంత మంచి ${n} ఈ మార్కెట్ లో ఎక్కడా లేదు! ${p} రూపాయలే!`,
    (n, p, u, s) => `అమ్మగారూ! నాటు నాటు ${n}! మందులు అస్సలు వేయలేదు! ${p} కే ఒక ${u} ఇస్తా!`,
    (n, p, u, s) => `ఓ అన్నా! పల్లెటూరి పొలం నుండి నేరుగా తెచ్చాం! తాజా ${n} కేవలం ${p} రూపాయలే!`,
    (n, p, u, s) => `సరుకు తక్కువ ఉంది! ఆఖరి బస్తా ${n}! తొందరగా రండి, ${p} రూపాయలు మాత్రమే!`,
    (n, p, u, s) => `చూడు అన్నా చూడు! ఇంత పచ్చిగా ఉన్న ${n} ఎక్కడ దొరుకుతుంది? ${p} రూపాయలే!`,
    (n, p, u, s) => `రేపటి నుండి ధర పెరుగుతుంది! ఈరోజే తీసుకో! ${n} కేవలం ${p} రూపాయలు!`,
    (n, p, u, s) => `ఒరేయ్! తోట నుండి నేరుగా తెచ్చాను! ఇంత తాజా ${n} ఎక్కడా దొరకదు! ${p} మాత్రమే!`,
    (n, p, u, s) => `అయ్యగారు రండి! ఈ ${n} రుచి ఒక్కసారి చూడండి! మళ్ళీ మళ్ళీ కొంటారు! ${p} రూపాయలు!`,
    (n, p, u, s) => `బంపర్ హార్వెస్ట్! ఈ సీజన్ లో బాగా పండింది! మేలైన ${n} కేవలం ${p}కే!`,
    (n, p, u, s) => `ఏ రసాయనమూ వేయని స్వచ్ఛమైన ఆర్గానిక్ ${n}! మీ పిల్లలకు సురక్షితం! ${p} రూపాయలు!`,
    (n, p, u, s) => `చూస్తేనే నోరూరుతుంది! అంత మంచి ${n}! ఇంత తక్కువ ధరకు ఎక్కడా దొరకదు! ${p} మాత్రమే!`,
    (n, p, u, s) => `రేపటికి ఏమీ మిగలదు! ఈ రోజే తీసుకో! తాజా ${n} ${p} రూపాయలే!`,
    (n, p, u, s) => `నానమ్మ రెసిపీ కి సరిపోయే నాటు ${n}! రుచి మరపురాదు! ${p}కే ఒక ${u}!`,
    (n, p, u, s) => `అన్నా! ఒక్కసారి వచ్చి చూడు! ఇలాంటి ${n} మళ్ళీ దొరకదు! ${p} మాత్రమే!`,
    (n, p, u, s) => `పొద్దున్నే నాలుగింటికే కోసాను! ఇంత తాజా ${n} ఇక్కడే దొరుకుతుంది! ${p} రూపాయలే!`,
    (n, p, u, s) => `లెక్కించకు, తీసుకో! ${n} ఒక ${u} ${p} రూపాయలు! అంత చీప్ ఇంకెక్కడా దొరకదు!`,
    (n, p, u, s) => `మన ఊరి మేలైన ${n}! అచ్చమైన రైతు పంట! పండించినవాడే అమ్ముతున్నాడు! ${p} మాత్రమే!`,
  ],
  hi: [
    (n, p, u, s) => `अरे भाई भाई भाई! एकदम ताज़ा ${n}! आ जाओ, आ जाओ! सिर्फ ${p} रुपये ${u}!`,
    (n, p, u, s) => `मैडम जी! बिल्कुल ताज़ा देसी ${n}! सुबह खेत से काटा! केवल ${p} रुपये!`,
    (n, p, u, s) => `साहब! एक बार चखो तो सही! बढ़िया ${n}, सिर्फ ${p} रुपये किलो, पूरे मंडी में सस्ता!`,
    (n, p, u, s) => `लूट लो भाई लूट लो! आज का लास्ट बैच ${n}! जल्दी आओ! केवल ${p} रुपये!`,
    (n, p, u, s) => `किसान का माल! बीच में कोई दलाल नहीं! शुद्ध ${n} सिर्फ ${p} रुपये में!`,
    (n, p, u, s) => `अरे दीदी! इधर देखो! मीठा और रसीला ${n}! घर वाले खुश हो जाएंगे! ${p} रुपये किलो!`,
    (n, p, u, s) => `कल से दाम बढ़ेगा! आज ही ले लो! बढ़िया ${n} सिर्फ ${p} रुपये में!`,
    (n, p, u, s) => `बल्ले बल्ले! सबसे उम्दा ${n}! पंजाब के खेत जैसा स्वाद! केवल ${p} रुपये!`,
    (n, p, u, s) => `गाँव का असली माल! कोई केमिकल नहीं, कोई मिलावट नहीं! ${n} सिर्फ ${p} रुपये!`,
    (n, p, u, s) => `अरे यार! सुबह चार बजे काटा! इतना ताज़ा ${n} कहीं नहीं मिलेगा! ${p} रुपये ले जाओ!`,
    (n, p, u, s) => `बम्पर फसल! इस सीज़न बहुत बढ़िया हुआ! सस्ते में लो, सिर्फ ${p} रुपये ${u}!`,
    (n, p, u, s) => `सास के हाथ की सब्ज़ी जैसा स्वाद आएगा! इस ${n} से! केवल ${p} रुपये!`,
    (n, p, u, s) => `रुको मत भाई! माल खत्म होने वाला है! ताज़ा ${n} ${p} रुपये, जल्दी आओ!`,
    (n, p, u, s) => `जैविक खेती! देसी गाय की खाद! शुद्ध ${n} सिर्फ ${p} रुपये प्रति ${u}!`,
    (n, p, u, s) => `भईया! एक बार हाथ में लेकर देखो! कितना अच्छा है यह ${n}! ${p} रुपये में!`,
  ],
  kn: [
    (n, p, u, s) => `ಬನ್ನಿ ಬನ್ನಿ! ಹೊಲದಿಂದ ಇನ್ನೂ ಘಮ ಘಮಿಸ್ತಾ ಇರೋ ತಾಜಾ ${n}! ಕೇವಲ ${p} ರೂಪಾಯಿ!`,
    (n, p, u, s) => `ಅಮ್ಮ ನೋಡಿ! ನಾಟಿ ತಳಿ ${n}! ಯಾವ ಕ್ರಿಮಿನಾಶಕನೂ ಇಲ್ಲ! ${p} ರೂಪಾಯಿ ಒಂದು ${u}!`,
    (n, p, u, s) => `ಸ್ವಾಮಿ! ಇಂಥ ಒಳ್ಳೆ ${n} ಮಾರ್ಕೆಟ್ ತುಂಬಾ ಹುಡ್ಕಿದ್ರೂ ಸಿಗಲ್ಲ! ${p} ರೂಪಾಯಿ ಮಾತ್ರ!`,
    (n, p, u, s) => `ಶೀಘ್ರ ಬನ್ನಿ! ಕಡೆಯ ಸ್ಟಾಕ್! ತಾಜಾ ${n} ಕೇವಲ ${p} ರೂಪಾಯಿ! ಹೋದ್ರೆ ಹೋಯ್ತು!`,
    (n, p, u, s) => `ದೇಸಿ ರೈತರ ಶ್ರಮದ ಫಲ! ಶುದ್ಧ ಸಾವಯವ ${n}! ಕೇವಲ ${p} ರೂಪಾಯಿ!`,
    (n, p, u, s) => `ಮನೆಯ ತೋಟದ ${n}! ಅಜ್ಜಿ ಕೈ ತೋಟದ ರುಚಿ! ${p} ರೂಪಾಯಿಗೆ ಒಂದು ${u}!`,
    (n, p, u, s) => `ಇಂದು ಬೆಳ್ಳಂಬೆಳಿಗ್ಗೆ ಕೊಯ್ದ ತಾಜಾ ${n}! ಮತ್ತೆ ಇಷ್ಟು ಕಡಿಮೆ ಬೆಲೆ ಸಿಗಲ್ಲ! ${p} ಮಾತ್ರ!`,
  ],
  ta: [
    (n, p, u, s) => `வாங்க வாங்க! வயலிலிருந்து இப்போதுதான் பறிச்சு வந்தோம்! ${n} வெறும் ${p} ரூபாய்க்கு!`,
    (n, p, u, s) => `அம்மா! இங்கே பாருங்க! நாட்டு ${n}! எந்த கீடைநாசினியும் பூசலை! ${p} ரூபாய் மட்டும்!`,
    (n, p, u, s) => `ஐயா! ஒரு முறை சுவைத்துப் பாருங்க! மறக்க முடியாத சுவை! ${n} ${p} ரூபாய்க்கு!`,
    (n, p, u, s) => `கடைசி ஸ்டாக்! இன்னும் கொஞ்சம் மட்டுமே இருக்கு! ${n} ${p} ரூபாய்க்கு வேகமா வாங்குங்க!`,
    (n, p, u, s) => `கிராமத்து உழவன் பயிரிட்ட தூய ${n}! உங்க குடும்பத்துக்கு நல்லது! ${p} ரூபாய் மட்டுமே!`,
    (n, p, u, s) => `பாட்டி வீட்டு தோட்டத்தில் விளைந்த ${n}! இந்த சுவை வேற எங்கும் கிடைக்காது! ${p} ரூபாய்!`,
    (n, p, u, s) => `இன்னைக்கு மட்டும் சிறப்பு விலை! ${n} கிலோ ${p} ரூபாய்! வரவரவா வாங்குங்க!`,
  ],
  ml: [
    (n, p, u, s) => `ഒരു തവണ നോക്കൂ! കൃഷിക്കാരൻ നേരിട്ട് വിൽക്കുന്ന ${n}! ഒരു ${u} ന് ${p} രൂപ മാത്രം!`,
    (n, p, u, s) => `ചേച്ചി! ഇങ്ങോട്ട് നോക്ക്! നാടൻ ${n}! ഒരു കീടനാശിനിയും ഇടാൻ! ${p} രൂപ!`,
    (n, p, u, s) => `വേഗം വരൂ! ഇന്ന് മാത്രം ഈ വില! ताज़ा ${n} ഒരു ${u} ന് ${p} രൂപ!`,
    (n, p, u, s) => `ഇതുപോലൊരു ${n} ഈ ചന്തയിൽ വേറെ ആർക്കുമില്ല! ${p} രൂപ ഒരു ${u}!`,
  ],
  mr: [
    (n, p, u, s) => `अरे दादा, ये इकडे! शेतातून थेट आलेला ताजा ${n}! फक्त ${p} रुपये ${u}!`,
    (n, p, u, s) => `चला चला! गावरान ${n} बघा! रोज पिकवलेला माल! केवळ ${p} रुपये!`,
    (n, p, u, s) => `ताई! एकदा चव बघा! मग विकत घ्याल! ${n} फक्त ${p} रुपये किलोला!`,
    (n, p, u, s) => `गोड आणि ताजा ${n}! विना रसायन! फक्त ${p} रुपये!`,
  ],
  gu: [
    (n, p, u, s) => `ભાઈ! ખેતરથી સીધા! ઘઉ-ગળ્યા ${n}! ફક્ત ${p} રૂ ${u}!`,
    (n, p, u, s) => `આ ${n} ક્ર્TA ક્TP ઘ ${p} YTUG UpR RL_ONLY!`,
    (n, p, u, s) => `ઘ TA? ${n} RM ${p} P!`,
  ],
  bn: [
    (n, p, u, s) => `দাদা, খেত থেকে সরাসরি! তাজা ${n}! মাত্র ${p} টাকা প্রতি ${u}!`,
    (n, p, u, s) => `আসুন আসুন! সেরা মানের ${n}! এত সস্তায় আর পাবেন না! ${p} টাকা!`,
    (n, p, u, s) => `বিশুদ্ধ দেশি ${n}! কোনো রাসায়নিক নেই! মাত্র ${p} টাকায়!`,
  ],
  pa: [
    (n, p, u, s) => `ਓਏ ਭਾਜੀ! ਖੇਤਾਂ ਤੋਂ ਤਾਜ਼ਾ! ${n} ਸਿਰਫ਼ ${p} ਰੁਪਏ ${u}! ਜਲਦੀ ਲਓ!`,
    (n, p, u, s) => `ਬੱਲੇ ਬੱਲੇ! ਸ਼ੁੱਧ ਦੇਸੀ ${n}! ${p} ਰੁਪਏ ਵਿੱਚ ਲੈ ਜਾਓ!`,
  ],
};

// ── Crop localization dict ─────────────────────────────────────────────────────
const CROP_NAMES = {
  tomato:      { en:"Tomato",     te:"టమోటా",    hi:"टमाटर",  kn:"ಟೊಮೆಟೊ",  ta:"தக்காளி",  ml:"തക്കാളി",  mr:"टोमॅटो",  gu:"ટામેટાં", bn:"টমেটো",  pa:"ਟਮਾਟਰ" },
  potato:      { en:"Potato",     te:"బంగాళదుంప", hi:"आलू",   kn:"ಆಲೂಗಡ್ಡೆ", ta:"உருளை",    ml:"ഉരുളക്കിഴങ്ങ്", mr:"बटाटा", gu:"બટાકા", bn:"আলু",   pa:"ਆਲੂ" },
  onion:       { en:"Onion",      te:"ఉల్లిపాయ", hi:"प्याज",  kn:"ಈರುಳ್ಳಿ",  ta:"வெங்காயம்",ml:"ഉള്ളി",   mr:"कांदा",  gu:"ડુંગળી",bn:"পেঁয়াজ",pa:"ਪਿਆਜ਼"},
  rice:        { en:"Rice",       te:"బియ్యం",   hi:"चावल",  kn:"ಅಕ್ಕಿ",    ta:"அரிசி",    ml:"അരി",     mr:"तांदूळ", gu:"ચોખા",  bn:"চাল",   pa:"ਚੌਲ" },
  wheat:       { en:"Wheat",      te:"గోధుమలు",  hi:"गेहूं",  kn:"ಗೋಧಿ",    ta:"கோதுமை",   ml:"ഗോതമ്പ്", mr:"गहू",    gu:"ઘઉં",   bn:"গম",    pa:"ਕਣਕ" },
  mango:       { en:"Mango",      te:"మామిడి",   hi:"आम",    kn:"ಮಾವಿನ",   ta:"மாம்பழம்", ml:"മാമ്പഴം",mr:"आंबा",   gu:"કેરી",  bn:"আম",    pa:"ਅੰਬ" },
  banana:      { en:"Banana",     te:"అరటిపండు", hi:"केला",  kn:"ಬಾಳೆ",    ta:"வாழைப்பழம்",ml:"വാഴപ്പഴം",mr:"केळी",   gu:"કેળા",  bn:"কলা",   pa:"ਕੇਲਾ" },
  chili:       { en:"Chili",      te:"మిరపకాయ",  hi:"मिर्च",  kn:"ಮೆಣಸು",   ta:"மிளகாய்",  ml:"മുളക്",   mr:"मिरची",  gu:"મરચું",  bn:"মরিচ",  pa:"ਮਿਰਚ" },
  brinjal:     { en:"Brinjal",    te:"వంకాయ",    hi:"बैंगन",  kn:"ಬದನೆ",    ta:"கத்தரிக்காய்",ml:"വഴുതന",mr:"वांगे",  gu:"રીંગણ", bn:"বেগুন", pa:"ਬੈਂਗਣ" },
  spinach:     { en:"Spinach",    te:"పాలకూర",   hi:"पालक",   kn:"ಪಾಲಕ",    ta:"கீரை",     ml:"ചീര",     mr:"पालक",   gu:"પાલક",  bn:"পালং",  pa:"ਪਾਲਕ" },
  cauliflower: { en:"Cauliflower",te:"కాలీఫ్లవర్",hi:"फूलगोभी",kn:"ಹೂಕೋಸು",ta:"காலிஃப்ளவர்",ml:"കോളിഫ്ലവർ",mr:"फुलकोबी",gu:"ફ્લાવર", bn:"ফুলকপি",pa:"ਗੋਭੀ"},
  cabbage:     { en:"Cabbage",    te:"క్యాబేజీ", hi:"पत्तागोभी",kn:"ಕೋಸು", ta:"முட்டைகோஸ்", ml:"കാബേജ്", mr:"कोबी",  gu:"કોબીજ", bn:"বাঁধাকপি", pa:"ਬੰਦ ਗੋਭੀ" },
  okra:        { en:"Ladyfinger", te:"బెండకాయ",  hi:"भिंडी",  kn:"ಬೆಂಡೆ",   ta:"வெண்டை",   ml:"ഓക്ര",    mr:"भेंडी",  gu:"ભીંડા", bn:"ঢেঁড়স", pa:"ਭਿੰਡੀ" },
  garlic:      { en:"Garlic",     te:"వెల్లుల్లి",hi:"लहसुन", kn:"ಬೆಳ್ಳುಳ್ಳಿ",ta:"பூண்டு",  ml:"വെളുത്തുള്ളി",mr:"लसूण",  gu:"લસણ",   bn:"রসুন",  pa:"ਲਸਣ" },
  ginger:      { en:"Ginger",     te:"అల్లం",    hi:"अदरक",   kn:"ಶುಂಠಿ",   ta:"இஞ்சி",   ml:"ഇഞ്ചി",   mr:"आले",    gu:"આદું",  bn:"আদা",   pa:"ਅਦਰਕ" },
  turmeric:    { en:"Turmeric",   te:"పసుపు",    hi:"हल्दी",  kn:"ಅರಿಶಿನ",  ta:"மஞ்சள்",   ml:"മഞ്ഞൾ",   mr:"हळद",    gu:"હળદર",  bn:"হলুদ",   pa:"ਹਲਦੀ" },
  groundnut:   { en:"Groundnut",  te:"వేరుశనగ",  hi:"मूंगफली", kn:"ನೆಲಗಡಲೆ", ta:"வேர்க்கடலை",ml:"നിലക്കടല",mr:"भुईमूग", gu:"મગફળી", bn:"চীনাবাদাম",pa:"ਮੂੰਗਫਲੀ" },
  cotton:      { en:"Cotton",     te:"పత్తి",    hi:"कपास",   kn:"ಹತ್ತಿ",   ta:"பருத்தி",  ml:"പരുത്തി", mr:"कापूस",  gu:"કપાસ",  bn:"তুলো",  pa:"ਕਪਾਹ" },
};

const LOCALE_MAP = {
  en:"en-IN", te:"te-IN", hi:"hi-IN", kn:"kn-IN",
  ta:"ta-IN", ml:"ml-IN", mr:"mr-IN", gu:"gu-IN",
  bn:"bn-IN", pa:"pa-IN"
};

const UNIT_TRANSLATIONS = {
  en:"kg", te:"కిలో", hi:"किलो", kn:"ಕೆಜಿ", ta:"கிலோ",
  ml:"കിലോ", mr:"किलो", gu:"કિલો", bn:"কেজি", pa:"ਕਿਲੋ"
};

export function getCropName(rawName = "", lang = "en") {
  if (!rawName) return "";
  const key = rawName.toLowerCase();
  for (const [k, dict] of Object.entries(CROP_NAMES)) {
    if (key.includes(k)) return dict[lang] || dict.en || rawName;
  }
  return rawName;
}

// ── Vendor Personas ────────────────────────────────────────────────────────────
const VENDOR_PERSONAS = [
  { name: "Fast Energetic Hawker",     rate: 1.15, pitch: 1.15 },
  { name: "Loud Shouting Seller",      rate: 1.05, pitch: 1.25 },
  { name: "Friendly Female Seller",    rate: 1.0,  pitch: 1.2  },
  { name: "Experienced Elder Farmer",  rate: 0.85, pitch: 0.8  },
  { name: "Lively Market Vendor",      rate: 1.1,  pitch: 1.0  },
  { name: "Sweet Village Aunt",        rate: 0.95, pitch: 1.3  },
  { name: "Aggressive Bargainer",      rate: 1.2,  pitch: 0.9  },
  { name: "Sing-song Vendor",          rate: 0.9,  pitch: 1.4  },
  { name: "Husky Street Vendor",       rate: 1.0,  pitch: 0.7  },
  { name: "Young Enthusiastic Farmer", rate: 1.25, pitch: 1.1  },
  { name: "Calm Confident Seller",     rate: 0.9,  pitch: 1.0  },
  { name: "Rapid-fire Auctioneer",     rate: 1.3,  pitch: 1.2  },
];

import { playTTS, stopTTS as _stopNativeTTS } from "../utils/voiceParser";

function speak(text, lang, { rate = 1.0, pitch = 1.0, volume = 1.0 } = {}) {
  return playTTS(text, lang, { rate, volume });
}
function stopNativeTTS() { _stopNativeTTS(); }

// ── Web Audio Context for chime ────────────────────────────────────────────────
let _audioCtx = null;
function getCtx() {
  if (!_audioCtx && typeof window !== "undefined") {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  return _audioCtx;
}
function chime(freq = 523, vol = 0.08) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

// ══════════════════════════════════════════════════════════════════════════════
// Master Hook
// ══════════════════════════════════════════════════════════════════════════════
export default function useMarketAudio(crops, lang) {
  const [isActive, setIsActive] = useState(false);
  const modeRef = useRef("ambient"); // "ambient" | "focused"
  const timerRef = useRef(null);
  const focusTimer = useRef(null);
  const cropsRef = useRef(crops);
  const langRef = useRef(lang);
  const focusedCropRef = useRef(null);
  const observerRef = useRef(null);
  const cardVolumeMap = useRef({}); // cropId -> volume level (1.0 = full, 0.3 = ducked)
  const ambientQueueRef = useRef([]); // Queue of ambient utterances in progress

  const [speakingCropId, setSpeakingCropId] = useState(null);
  const hoverDebounceTimer = useRef(null);
  const announceTimer = useRef(null);

  useEffect(() => { cropsRef.current = crops; }, [crops]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  // Multilingual crop detail speech generator
  function buildCropDetailsSpeech(crop) {
    const l = langRef.current || "en";
    const name = getCropName(crop.name, l);
    const unit = UNIT_TRANSLATIONS[l] || crop.unit || "kg";
    const price = crop.price || 0;
    const qty = crop.quantity || 1;
    
    let tag = "";
    if (crop.isOrganic) {
      tag = l === "te" ? "పూర్తిగా ఆర్గానిక్ పంట." : l === "hi" ? "शुद्ध जैविक फसल।" : l === "kn" ? "ಸಾವಯವ ಬೆಳೆ." : l === "ta" ? "இயற்கை விளைச்சல்." : "100% Certified Organic.";
    } else if (crop.isPesticideFree) {
      tag = l === "te" ? "రసాయనాలు లేని పంట." : l === "hi" ? "कीटनाशक मुक्त।" : l === "kn" ? "ಕೀಟನಾಶಕ ರಹಿತ." : l === "ta" ? "பூச்சிக்கொல்லி அற்றது." : "Pesticide-free.";
    }

    if (l === "te") {
      return `తాజా ${name}. కేజీ ధర ${price} రూపాయలు. ${qty} ${unit} అందుబాటులో ఉంది. ${tag}`;
    }
    if (l === "hi") {
      return `ताज़ा ${name}. भाव ${price} रुपये प्रति ${unit}. ${qty} ${unit} उपलब्ध है। ${tag}`;
    }
    if (l === "kn") {
      return `ತಾಜಾ ${name}. ಬೆಲೆ ಪ್ರತಿ ${unit}ಗೆ ${price} ರೂಪಾಯಿ. ${qty} ${unit} ಲಭ್ಯವಿದೆ. ${tag}`;
    }
    if (l === "ta") {
      return `புதிய ${name}. விலை ஒரு ${unit}க்கு ${price} ரூபாய். ${qty} ${unit} உள்ளது. ${tag}`;
    }
    return `Fresh ${name}. ${price} rupees per ${unit}. ${qty} ${unit} available. ${tag}`;
  }

  function buildText(crop, personaIdx = 0) {
    const l = langRef.current || "en";
    const name = getCropName(crop.name, l);
    const unit = UNIT_TRANSLATIONS[l] || crop.unit || "kg";
    const price = crop.price || 0;
    let special = "";
    if (crop.isOrganic) {
      special = l === "te" ? "మందుల్లేని స్వచ్ఛమైన ఆర్గానిక్!" : l === "hi" ? "शुद्ध जैविक माल!" : "100% Organic!";
    } else if (crop.isPesticideFree) {
      special = l === "te" ? "రసాయనాలు లేని తాజా పంట!" : l === "hi" ? "कीटनाशक मुक्त!" : "Pesticide-free!";
    }
    const templates = TEMPLATES[l] || TEMPLATES.en;
    const template = templates[personaIdx % templates.length] || templates[0];
    return template(name, price, unit, special);
  }

  // Ambient: all vendors shout at once (overlapping), low-medium volume
  async function announceAmbient() {
    const availableCrops = cropsRef.current;
    if (!availableCrops || availableCrops.length === 0 || !isActive) return;
    const numVoices = Math.min(availableCrops.length, 3 + Math.floor(Math.random() * 2));
    const shuffled = [...availableCrops].sort(() => Math.random() - 0.5).slice(0, numVoices);
    chime(523 + Math.random() * 100, 0.04);
    for (let i = 0; i < shuffled.length; i++) {
      if (modeRef.current !== "ambient") break;
      const crop = shuffled[i];
      const persona = VENDOR_PERSONAS[i % VENDOR_PERSONAS.length];
      const text = buildText(crop, Math.floor(Math.random() * 20));
      speak(text, langRef.current, { rate: persona.rate, pitch: persona.pitch, volume: 0.6 + Math.random() * 0.15 });
      if (modeRef.current === "ambient") {
        await new Promise(r => setTimeout(r, 350 + Math.random() * 700));
      }
    }
  }

  // Focused: announces specific crop details clearly in active language
  function announceFocused(crop) {
    if (!crop) return;
    clearTimeout(announceTimer.current);
    chime(659, 0.08);
    announceTimer.current = setTimeout(() => {
      if (modeRef.current !== "focused") return;
      const text = buildCropDetailsSpeech(crop);
      setSpeakingCropId(crop._id || crop.id);
      speak(text, langRef.current, { rate: 1.0, pitch: 1.05, volume: 1.0 }).then(() => {
        // finished
      });
    }, 180);
  }

  function startAmbientLoop() {
    if (timerRef.current) clearInterval(timerRef.current);
    announceAmbient();
    timerRef.current = setInterval(() => {
      if (modeRef.current === "ambient") announceAmbient();
    }, 8000 + Math.random() * 3000);
  }

  // ── IntersectionObserver: scroll-based focus ─────────────────────────────────
  const attachScrollObserver = useCallback((containerEl) => {
    if (!containerEl || observerRef.current) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!isActive) return;
      
      let maxRatio = 0;
      let dominantEntry = null;
      entries.forEach(entry => {
        if (entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          dominantEntry = entry;
        }
      });

      if (dominantEntry && maxRatio > 0.65) {
        const cropId = dominantEntry.target.dataset.cropId;
        const crop = cropsRef.current?.find(c => c._id === cropId || c.id === cropId);
        if (crop && focusedCropRef.current?._id !== crop._id) {
          modeRef.current = "focused";
          focusedCropRef.current = crop;
          clearInterval(timerRef.current);
          clearTimeout(focusTimer.current);
          stopNativeTTS();
          announceFocused(crop);
          focusTimer.current = setInterval(() => {
            if (modeRef.current === "focused" && focusedCropRef.current) {
              announceFocused(focusedCropRef.current);
            }
          }, 9000);
        }
      } else if (maxRatio < 0.2 && modeRef.current === "focused") {
        clearInterval(focusTimer.current);
        focusedCropRef.current = null;
        setSpeakingCropId(null);
        modeRef.current = "ambient";
        stopNativeTTS();
        setTimeout(() => {
          if (modeRef.current === "ambient") startAmbientLoop();
        }, 800);
      }
    }, {
      threshold: [0.0, 0.2, 0.4, 0.65, 0.85, 1.0],
      rootMargin: "0px 0px -10% 0px"
    });

    observerRef.current = observer;

    const cards = containerEl.querySelectorAll("[data-crop-id]");
    cards.forEach(card => observer.observe(card));
  }, [isActive]);

  const refreshObserver = useCallback((containerEl) => {
    if (!containerEl || !observerRef.current) return;
    const cards = containerEl.querySelectorAll("[data-crop-id]");
    cards.forEach(card => observerRef.current.observe(card));
  }, []);

  const toggle = useCallback((forceState) => {
    setIsActive(prev => {
      const next = forceState !== undefined ? forceState : !prev;
      if (next === prev) return prev;
      if (next) {
        modeRef.current = "ambient";
        startAmbientLoop();
      } else {
        clearInterval(timerRef.current);
        clearTimeout(focusTimer.current);
        clearTimeout(hoverDebounceTimer.current);
        clearTimeout(announceTimer.current);
        if (observerRef.current) { observerRef.current.disconnect(); observerRef.current = null; }
        stopNativeTTS();
        focusedCropRef.current = null;
        setSpeakingCropId(null);
      }
      return next;
    });
  }, []);

  // Hover-based focus with 200ms debounce to prevent collision on fast mouse sweeps
  const focusCrop = useCallback((crop) => {
    if (!isActive || !crop) return;
    clearTimeout(hoverDebounceTimer.current);
    clearTimeout(focusTimer.current);

    hoverDebounceTimer.current = setTimeout(() => {
      modeRef.current = "focused";
      focusedCropRef.current = crop;
      stopNativeTTS();
      announceFocused(crop);
      focusTimer.current = setInterval(() => {
        if (modeRef.current === "focused" && focusedCropRef.current?._id === crop._id) {
          announceFocused(crop);
        }
      }, 9000);
    }, 200);
  }, [isActive]);

  const blurCrop = useCallback(() => {
    clearTimeout(hoverDebounceTimer.current);
    clearTimeout(announceTimer.current);
    clearInterval(focusTimer.current);
    setSpeakingCropId(null);

    if (!isActive) return;
    stopNativeTTS();
    focusedCropRef.current = null;

    setTimeout(() => {
      if (modeRef.current === "focused" && !focusedCropRef.current) {
        modeRef.current = "ambient";
        startAmbientLoop();
      }
    }, 900);
  }, [isActive]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.isActive !== undefined) toggle(e.detail.isActive);
      else toggle();
    };
    window.addEventListener("market_announcer_toggle", handler);
    return () => window.removeEventListener("market_announcer_toggle", handler);
  }, [toggle]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("market_audio_state", { detail: { isActive } }));
  }, [isActive]);

  useEffect(() => {
    if (isActive && modeRef.current === "ambient") {
      stopNativeTTS();
      setTimeout(() => { if (modeRef.current === "ambient") announceAmbient(); }, 400);
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(focusTimer.current);
      if (observerRef.current) observerRef.current.disconnect();
      stopNativeTTS();
    };
  }, []);

  return { isActive, toggle, focusCrop, blurCrop, attachScrollObserver, refreshObserver, speakingCropId };
}
