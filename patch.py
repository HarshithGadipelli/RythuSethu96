import os

file_path = r"c:\Users\Harshith Gadipelli\Documents\Projectlu\RythuJanaSethu\frontend\src\views\Farmer\AddCrop.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# --- 1. UI Enhancements (Banner, Animations, Glassmorphism, Input Styles) ---
content = content.replace(
'''      <div 
        style={{
          background: wizardStep === 'IDLE' 
            ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" 
            : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          border: "2px solid #86efac",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 8px 25px rgba(34, 197, 94, 0.15)",
          display: "flex", flexDirection: "column", gap: "1.2rem",
          transition: "all 0.3s ease"
        }}
      >''',
'''      <div 
        className="glass-card"
        style={{
          background: wizardStep === 'IDLE' 
            ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" 
            : "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          border: wizardStep === 'IDLE' ? "2px solid #d97706" : "2px solid #86efac",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: wizardStep === 'IDLE' ? "0 8px 25px rgba(217, 119, 6, 0.15)" : "0 8px 25px rgba(34, 197, 94, 0.15)",
          display: "flex", flexDirection: "column", gap: "1.2rem",
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >'''
)

content = content.replace(
'''            <h3 style={{ margin: 0, color: "#166534", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem" }}>
              <Mic size={26} color="#16a34a" /> Guided Voice Assistant (స్మార్ట్ వాయిస్ అసిస్టెంట్)
            </h3>''',
'''            <h3 style={{ margin: 0, color: wizardStep === 'IDLE' ? "#92400e" : "#166534", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem", transition: "color 0.3s" }}>
              <Mic size={26} color={wizardStep === 'IDLE' ? "#d97706" : "#16a34a"} style={{ transition: "all 0.3s" }} /> 
              Guided Voice Assistant (స్మార్ట్ వాయిస్ అసిస్టెంట్)
            </h3>'''
)

content = content.replace(
'''            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .lucide-spin { animation: spin 1.5s linear infinite; }
              @keyframes ping {
                75%, 100% { transform: scale(2); opacity: 0; }
              }
            `}</style>''',
'''            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              .lucide-spin { animation: spin 1.5s linear infinite; }
              @keyframes ping {
                75%, 100% { transform: scale(2); opacity: 0; }
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(15px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .fade-in { animation: fadeIn 0.5s ease-out forwards; }
              .glass-card {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0,0,0,0.03);
                border-radius: 20px;
                padding: 1.8rem;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .glass-card:hover {
                box-shadow: 0 15px 50px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0,0,0,0.05);
                transform: translateY(-3px);
              }
              .input-wrap {
                 transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .input-wrap:focus-within {
                 transform: scale(1.01);
              }
              .form-input {
                 transition: all 0.3s ease;
              }
              .form-input:focus {
                 box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.15);
                 border-color: #d97706;
              }
            `}</style>'''
)

# Input Wrapping Colors
content = content.replace(
'''          <div style={{
            transition: "all 0.3s",
            background: wizardStep === 'NAME' ? "rgba(34, 197, 94, 0.08)" : "transparent",
            border: wizardStep === 'NAME' ? "2px solid #22c55e" : filledFields.name ? "1px solid #86efac" : "1px solid transparent",
            borderRadius: "10px", padding: wizardStep === 'NAME' || filledFields.name ? "0.8rem" : "0"
          }}>''',
'''          <div className="input-wrap" style={{
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            background: wizardStep === 'NAME' ? "rgba(217, 119, 6, 0.08)" : "transparent",
            border: wizardStep === 'NAME' ? "2px solid #d97706" : filledFields.name ? "1px solid #86efac" : "1px solid transparent",
            borderRadius: "10px", padding: wizardStep === 'NAME' || filledFields.name ? "0.8rem" : "0"
          }}>'''
)

content = content.replace(
'''            <div style={{
              transition: "all 0.3s",
              background: wizardStep === 'QUANTITY' ? "rgba(34, 197, 94, 0.08)" : "transparent",
              border: wizardStep === 'QUANTITY' ? "2px solid #22c55e" : filledFields.quantity ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'QUANTITY' || filledFields.quantity ? "0.8rem" : "0"
            }}>''',
'''            <div className="input-wrap" style={{
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              background: wizardStep === 'QUANTITY' ? "rgba(217, 119, 6, 0.08)" : "transparent",
              border: wizardStep === 'QUANTITY' ? "2px solid #d97706" : filledFields.quantity ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'QUANTITY' || filledFields.quantity ? "0.8rem" : "0"
            }}>'''
)

content = content.replace(
'''            <div style={{
              transition: "all 0.3s",
              background: wizardStep === 'PRICE' ? "rgba(34, 197, 94, 0.08)" : "transparent",
              border: wizardStep === 'PRICE' ? "2px solid #22c55e" : filledFields.price ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'PRICE' || filledFields.price ? "0.8rem" : "0"
            }}>''',
'''            <div className="input-wrap" style={{
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              background: wizardStep === 'PRICE' ? "rgba(217, 119, 6, 0.08)" : "transparent",
              border: wizardStep === 'PRICE' ? "2px solid #d97706" : filledFields.price ? "1px solid #86efac" : "1px solid transparent",
              borderRadius: "10px", padding: wizardStep === 'PRICE' || filledFields.price ? "0.8rem" : "0"
            }}>'''
)

content = content.replace(
'''          {/* Description */}
          <div>''',
'''          {/* Description */}
          <div className="input-wrap" style={{
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            background: wizardStep === 'DESCRIPTION' ? "rgba(217, 119, 6, 0.08)" : "transparent",
            border: wizardStep === 'DESCRIPTION' ? "2px solid #d97706" : filledFields.description ? "1px solid #86efac" : "1px solid transparent",
            borderRadius: "10px", padding: wizardStep === 'DESCRIPTION' || filledFields.description ? "0.8rem" : "0"
          }}>'''
)

content = content.replace(
'''            {(assistantMode === 'step' ? [
              { id: 'NAME', label: '1. Crop Name 🌾' },
              { id: 'QUANTITY', label: '2. Quantity ⚖️' },
              { id: 'PRICE', label: '3. Price 💰' },
              { id: 'CONFIRM_SUBMIT', label: '4. Ready ?' }
            ] : [
              { id: 'SINGLE_PROMPT', label: '1. Speak Details 🎙️' },
              { id: 'CONFIRM_SUBMIT', label: '2. Ready ?' }
            ]).map((s) => {
              const isCurrent = wizardStep === s.id;
              const isDone = assistantMode === 'step' ? (
                (s.id === 'NAME' && (wizardStep === 'QUANTITY' || wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'QUANTITY' && (wizardStep === 'PRICE' || wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'PRICE' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED')
              ) : (
                (s.id === 'SINGLE_PROMPT' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) ||
                (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED')
              );

              return (
                <div 
                  key={s.id} 
                  style={{ 
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#15803d" : isDone ? "#059669" : "#9ca3af",
                    fontSize: "0.85rem",
                    background: isCurrent ? "rgba(34, 197, 94, 0.2)" : isDone ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    padding: "0.3rem 0.6rem", borderRadius: "8px"
                  }}
                >
                  {isDone ? <Check size={16} /> : null}
                  <span>{s.label}</span>
                </div>
              );
            })}''',
'''            {(assistantMode === 'step' ? [
              { id: 'NAME', label: '1. Crop 🌾' },
              { id: 'QUANTITY', label: '2. Qty ⚖️' },
              { id: 'PRICE', label: '3. Price 💰' },
              { id: 'LOCATION', label: '4. Location 📍' },
              { id: 'DESCRIPTION', label: '5. Details 📝' },
              { id: 'CONFIRM_SUBMIT', label: '6. Ready?' }
            ] : [
              { id: 'SINGLE_PROMPT', label: '1. Speak Details 🎙️' },
              { id: 'CONFIRM_SUBMIT', label: '2. Ready?' }
            ]).map((s) => {
              const isCurrent = wizardStep === s.id;
              const stepOrder = ['NAME', 'QUANTITY', 'PRICE', 'LOCATION', 'DESCRIPTION', 'CONFIRM_SUBMIT', 'COMPLETED'];
              const currentIndex = stepOrder.indexOf(wizardStep);
              const sIndex = stepOrder.indexOf(s.id);
              
              const isDone = assistantMode === 'step' 
                ? (currentIndex > sIndex)
                : ((s.id === 'SINGLE_PROMPT' && (wizardStep === 'CONFIRM_SUBMIT' || wizardStep === 'COMPLETED')) || (s.id === 'CONFIRM_SUBMIT' && wizardStep === 'COMPLETED'));

              return (
                <div 
                  key={s.id} 
                  style={{ 
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? "#15803d" : isDone ? "#059669" : "#9ca3af",
                    fontSize: "0.85rem",
                    background: isCurrent ? "rgba(34, 197, 94, 0.2)" : isDone ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    padding: "0.4rem 0.7rem", borderRadius: "8px",
                    transition: "all 0.3s ease",
                    transform: isCurrent ? "scale(1.05)" : "scale(1)"
                  }}
                >
                  {isDone ? <Check size={16} /> : null}
                  <span>{s.label}</span>
                </div>
              );
            })}'''
)

# --- 2. Prompts & Acknowledgment for Corrections ---
content = content.replace(
'''      CONFIRM_SUBMIT: {
        en: "Would you like me to submit this crop now? Say Yes to submit, or No to start over.",
        te: "ఈ పంట వివరాలను ఇప్పుడు సమర్పించమంటారా? సమర్పించడానికి అవును అని, మళ్లీ ప్రారంభించడానికి కాదు అని చెప్పండి.",
        hi: "क्या आप इस फसल को अभी सबमिट करना चाहते हैं? सबमिट के लिए हाँ कहें, या फिर से शुरू करने के लिए ना कहें।",
        ta: "இந்த பயிர் விவரங்களை இப்போது சமர்ப்பிக்கலாமா? ஆம் அல்லது இல்லை என்று சொல்லுங்கள்.",
        kn: "ಈ ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಈಗ ಸಲ್ಲಿಸಬೇಕೇ? ಸಲ್ಲಿಸಲು ಹೌದು ಅಥವಾ ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ."
      },''',
'''      CONFIRM_SUBMIT: {
        en: "Are these details correct? Say 'Yes' to submit, or 'Change [field]' to correct any wrong info.",
        te: "ఈ వివరాలు సరైనవేనా? సమర్పించడానికి 'అవును' అనండి, తప్పు ఉంటే 'పేరు మార్చు' లేదా 'ధర మార్చు' అని చెప్పండి.",
        hi: "क्या ये विवरण सही हैं? सबमिट करने के लिए 'हाँ' कहें, या गलत जानकारी ठीक करने के लिए 'बदलें' कहें।",
        ta: "இந்த விவரங்கள் சரியானவையா? சமர்ப்பிக்க 'ஆம்' என்று கூறவும், தவறாக இருந்தால் திருத்த 'மாற்று' என்று கூறவும்.",
        kn: "ಈ ವಿವರಗಳು ಸರಿಯಾಗಿವೆಯೇ? ಸಲ್ಲಿಸಲು 'ಹೌದು' ಎಂದು ಹೇಳಿ, ತಪ್ಪಿದ್ದರೆ ಸರಿಪಡಿಸಲು 'ಬದಲಾಯಿಸಿ' ಎಂದು ಹೇಳಿ."
      },'''
)


# --- 3. Update Heuristics Logic to Handle Corrections ---
# In processStepInput, when extracted values exist, apply them. If it's a correction in CONFIRM_SUBMIT step, stay there.
old_logic = '''      // D. Update form state & refs live with all extracted fields
      let hasUpdates = false;
      const formUpdates = {};
      const filledUpdates = {};

      if (extractedName) {
        formUpdates.name = extractedName;
        formUpdates.category = extractedCategory || formDataRef.current.category || "vegetable";
        formDataRef.current.name = extractedName;
        formDataRef.current.category = formUpdates.category;
        filledUpdates.name = true;
        filledUpdates.category = true;
        hasUpdates = true;
      }

      if (extractedQty !== null && !isNaN(extractedQty)) {
        formUpdates.quantity = extractedQty;
        formUpdates.unit = extractedUnit;
        formDataRef.current.quantity = extractedQty;
        formDataRef.current.unit = extractedUnit;
        filledUpdates.quantity = true;
        filledUpdates.unit = true;
        hasUpdates = true;
      }

      if (extractedPrice !== null && !isNaN(extractedPrice)) {
        formUpdates.price = extractedPrice;
        formDataRef.current.price = extractedPrice;
        filledUpdates.price = true;
        hasUpdates = true;
      }

      if (hasUpdates) {
        setFormData(prev => ({ ...prev, ...formUpdates }));
        setFilledFields(prev => ({ ...prev, ...filledUpdates }));
        playChime("success");
      }

      // E. Check current status across all 3 core fields
      const curName = formDataRef.current.name;
      const curQty = formDataRef.current.quantity;
      const curUnit = formDataRef.current.unit || "kg";
      const curPrice = formDataRef.current.price;

      // If nothing could be recognized at all, gently ask again
      if (!hasUpdates && !curName && !curQty && !curPrice) {
        playChime("retry");
        const retryMsg = getUnrecognizedAck(step, cleanTranscript, activeLang);
        if (step === "SINGLE_PROMPT") {
           setAssistantMode("step");
           askStep("NAME", retryMsg, activeLang);
        } else {
           askStep(step, retryMsg, activeLang);
        }
        return;
      }

      // ── SMART FLOW TRANSITIONS ──
      // Scenario 1: ALL 3 CORE FIELDS ARE PRESENT! (Complete sentence or accumulated step)
      if (curName && curQty && curPrice) {
        const fullAcks = {
          en: `All details collected: ${curName}, ${curQty} ${curUnit} at ₹${curPrice}.`,
          te: `వివరాలు నమోదు చేశాను: ${curName}, ${curQty} ${curUnit}, ధర ₹${curPrice}.`,
          hi: `विवरण दर्ज किया गया: ${curName}, ${curQty} ${curUnit}, ₹${curPrice} प्रति यूनिट।`,
          ta: `விவரங்கள் பெறப்பட்டன: ${curName}, ${curQty} ${curUnit}, விலை ₹${curPrice}.`,
          kn: `ವಿವರಗಳನ್ನು ನಮೂದಿಸಲಾಗಿದೆ: ${curName}, ${curQty} ${curUnit}, ಬೆಲೆ ₹${curPrice}.`
        };
        const ack = fullAcks[activeLang] || fullAcks.en;
        askStep("CONFIRM_SUBMIT", ack, activeLang);
        return;
      }
      
      // Handle SINGLE_PROMPT fallback to step-by-step if missing info
      if (step === "SINGLE_PROMPT" && (!curName || !curQty || !curPrice)) {
         setAssistantMode('step');
         if (!curName) {
            askStep("NAME", "Could not catch the crop name. What crop is this?", activeLang);
         } else if (!curQty) {
            askStep("QUANTITY", `Got ${curName}. How much quantity?`, activeLang);
         } else if (!curPrice) {
            askStep("PRICE", `Got ${curQty} ${curUnit} of ${curName}. What is the price?`, activeLang);
         }
         return;
      }

      // Scenario 2: Crop Name is known, Quantity is known, Price is MISSING
      if (curName && curQty && !curPrice) {
        const ack = getSuccessAck("QUANTITY", curQty, curUnit, activeLang);
        askStep("PRICE", ack, activeLang);
        return;
      }

      // Scenario 3: Crop Name is known, Quantity is MISSING
      if (curName && !curQty) {
        const ack = getSuccessAck("NAME", curName, "", activeLang);
        askStep("QUANTITY", ack, activeLang);
        return;
      }

      // Scenario 4: Quantity or Price is known, Crop Name is MISSING
      if (!curName) {
        const partialAck = {
          en: curQty ? `Got quantity ${curQty} ${curUnit}. What crop is this?` : `Got price ₹${curPrice}. What crop is this?`,
          te: curQty ? `${curQty} ${curUnit} తీసుకున్నాను. పంట పేరు ఏమిటి?` : `ధర ₹${curPrice} తీసుకున్నాను. పంట పేరు ఏమిటి?`,
          hi: curQty ? `${curQty} ${curUnit} दर्ज किया। फसल का नाम क्या है?` : `कीमत ₹${curPrice} दर्ज की। फसल का नाम क्या है?`,
          ta: curQty ? `${curQty} ${curUnit} சேர்க்கப்பட்டது. பயிர் பெயர் என்ன?` : `விலை ₹${curPrice} சேர்க்கப்பட்டது. பயிர் பெயர் என்ன?`,
          kn: curQty ? `${curQty} ${curUnit} ಸೇರಿಸಲಾಗಿದೆ. ಬೆಳೆಯ ಹೆಸರು ಏನು?` : `ಬೆಲೆ ₹${curPrice} ಸೇರಿಸಲಾಗಿದೆ. ಬೆಳೆಯ ಹೆಸರು ಏನು?`
        };
        askStep("NAME", partialAck[activeLang] || partialAck.en, activeLang);
        return;
      }'''

new_logic = '''      // D. Update form state & refs live with all extracted fields
      let hasUpdates = false;
      const formUpdates = {};
      const filledUpdates = {};
      
      let extractedLocation = localParsed.location || null;
      let extractedDescription = localParsed.description || null;

      if (step === "LOCATION" && !extractedLocation) {
        if (cleanTranscript.length > 2 && !isNegative(cleanTranscript)) {
          extractedLocation = cleanTranscript;
        }
      }
      if (step === "DESCRIPTION" && !extractedDescription) {
        if (!isNegative(cleanTranscript) && !/skip|వదిలేయండి|छोड़ें|தவிர்|ಬಿಟ್ಟುಬಿಡಿ/i.test(cleanTranscript)) {
          extractedDescription = cleanTranscript;
        } else {
          extractedDescription = " ";
        }
      }

      if (extractedName) {
        formUpdates.name = extractedName;
        formUpdates.category = extractedCategory || formDataRef.current.category || "vegetable";
        formDataRef.current.name = extractedName;
        formDataRef.current.category = formUpdates.category;
        filledUpdates.name = true;
        filledUpdates.category = true;
        hasUpdates = true;
      }

      if (extractedQty !== null && !isNaN(extractedQty)) {
        formUpdates.quantity = extractedQty;
        formUpdates.unit = extractedUnit;
        formDataRef.current.quantity = extractedQty;
        formDataRef.current.unit = extractedUnit;
        filledUpdates.quantity = true;
        filledUpdates.unit = true;
        hasUpdates = true;
      }

      if (extractedPrice !== null && !isNaN(extractedPrice)) {
        formUpdates.price = extractedPrice;
        formDataRef.current.price = extractedPrice;
        filledUpdates.price = true;
        hasUpdates = true;
      }
      
      if (extractedLocation) {
        formUpdates.location = extractedLocation;
        formUpdates.farmLocation = extractedLocation;
        formDataRef.current.location = extractedLocation;
        formDataRef.current.farmLocation = extractedLocation;
        filledUpdates.location = true;
        filledUpdates.farmLocation = true;
        hasUpdates = true;
      }
      
      if (extractedDescription) {
        const descText = extractedDescription === " " ? "" : extractedDescription;
        formUpdates.description = descText;
        formDataRef.current.description = descText;
        filledUpdates.description = true;
        hasUpdates = true;
      }

      if (hasUpdates) {
        setFormData(prev => ({ ...prev, ...formUpdates }));
        setFilledFields(prev => ({ ...prev, ...filledUpdates }));
        playChime("success");
      }

      // E. Check current status across all fields
      const curName = formDataRef.current.name;
      const curQty = formDataRef.current.quantity;
      const curUnit = formDataRef.current.unit || "kg";
      const curPrice = formDataRef.current.price;
      const curLocation = formDataRef.current.location;
      const curDescription = formDataRef.current.description;

      // Check if it's a correction in CONFIRM_SUBMIT step
      if (step === "CONFIRM_SUBMIT" && hasUpdates) {
        const ackMsgs = {
           en: "Updated! Say 'Yes' if all details are correct now.",
           te: "సవరించబడింది! ఇప్పుడు వివరాలు సరైనవే అయితే 'అవును' అనండి.",
           hi: "अपडेट किया गया! अगर अब सभी विवरण सही हैं तो 'हाँ' कहें।"
        };
        askStep("CONFIRM_SUBMIT", ackMsgs[activeLang] || ackMsgs.en, activeLang);
        return;
      }

      // If nothing could be recognized at all, gently ask again
      if (!hasUpdates && !curName && !curQty && !curPrice && step !== "LOCATION" && step !== "DESCRIPTION") {
        playChime("retry");
        const retryMsg = getUnrecognizedAck(step, cleanTranscript, activeLang);
        if (step === "SINGLE_PROMPT") {
           setAssistantMode("step");
           askStep("NAME", retryMsg, activeLang);
        } else {
           askStep(step, retryMsg, activeLang);
        }
        return;
      }

      // ── SMART FLOW TRANSITIONS ──
      
      if (assistantMode === 'single') {
        if (curName && curQty && curPrice) {
          askStep("CONFIRM_SUBMIT", `All details collected: ${curName}, ${curQty} ${curUnit} at ₹${curPrice}.`, activeLang);
          return;
        } else {
          setAssistantMode('step');
          if (!curName) { askStep("NAME", "Could not catch the crop name.", activeLang); return; }
          if (!curQty) { askStep("QUANTITY", `Got ${curName}. How much?`, activeLang); return; }
          if (!curPrice) { askStep("PRICE", `What is the price?`, activeLang); return; }
        }
      } else {
        if (!curName) { askStep("NAME", "", activeLang); return; }
        if (!curQty) { askStep("QUANTITY", getSuccessAck("NAME", curName, "", activeLang), activeLang); return; }
        if (!curPrice) { askStep("PRICE", getSuccessAck("QUANTITY", curQty, curUnit, activeLang), activeLang); return; }
        
        // After Price -> Location
        if (!curLocation && step !== 'DESCRIPTION' && step !== 'CONFIRM_SUBMIT' && step !== 'COMPLETED') {
           askStep("LOCATION", step === 'PRICE' ? getSuccessAck("PRICE", curPrice, curUnit, activeLang) : "", activeLang);
           return;
        }
        
        // After Location -> Description
        if (curLocation !== undefined && !filledUpdates.description && step !== 'CONFIRM_SUBMIT' && step !== 'COMPLETED' && step !== 'DESCRIPTION') {
           askStep("DESCRIPTION", step === 'LOCATION' ? getSuccessAck("LOCATION", curLocation, "", activeLang) : "", activeLang);
           return;
        }
        
        // After Description -> Confirm
        if (step === 'DESCRIPTION' || (curName && curQty && curPrice && curLocation && filledUpdates.description)) {
           askStep("CONFIRM_SUBMIT", `All details set.`, activeLang);
           return;
        }
      }'''

content = content.replace(old_logic, new_logic)


# Skip handle update
content = content.replace(
'''    const activeLang = wizardLangRef.current || lang || "te";
    if (wizardStep === "SINGLE_PROMPT") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "NAME") askStep("QUANTITY", "", activeLang);
    else if (wizardStep === "QUANTITY") askStep("PRICE", "", activeLang);
    else if (wizardStep === "PRICE") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "CONFIRM_SUBMIT") askStep("COMPLETED", "", activeLang);''',
'''    const activeLang = wizardLangRef.current || lang || "te";
    if (wizardStep === "SINGLE_PROMPT") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "NAME") askStep("QUANTITY", "", activeLang);
    else if (wizardStep === "QUANTITY") askStep("PRICE", "", activeLang);
    else if (wizardStep === "PRICE") askStep("LOCATION", "", activeLang);
    else if (wizardStep === "LOCATION") askStep("DESCRIPTION", "", activeLang);
    else if (wizardStep === "DESCRIPTION") askStep("CONFIRM_SUBMIT", "", activeLang);
    else if (wizardStep === "CONFIRM_SUBMIT") askStep("COMPLETED", "", activeLang);'''
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated successfully")
