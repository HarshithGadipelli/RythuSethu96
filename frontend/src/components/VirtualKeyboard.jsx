import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Keyboard, X, ChevronDown, ChevronUp, Mic, MicOff, Delete, CornerDownLeft, Volume2, Sparkles } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useVoiceInput } from '../utils/useVoiceInput';

// Character grids for each language
const KEYBOARDS = {
  en: {
    label: "English",
    micLabel: "Speak in English",
    rows: [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l'],
      ['z','x','c','v','b','n','m'],
      ['1','2','3','4','5','6','7','8','9','0'],
      ['@','.','_','-','/','#','!','?','₹']
    ]
  },
  te: {
    label: "తెలుగు",
    micLabel: "తెలుగులో మాట్లాడండి",
    rows: [
      ['అ','ఆ','ఇ','ఈ','ఉ','ఊ','ఎ','ఏ','ఐ','ఒ','ఓ','ఔ'],
      ['క','ఖ','గ','ఘ','ఙ','చ','ఛ','జ','ఝ','ఞ'],
      ['ట','ఠ','డ','ఢ','ణ','త','థ','ద','ధ','న'],
      ['ప','ఫ','బ','భ','మ','య','ర','ల','వ'],
      ['శ','ష','స','హ','ళ','క్ష','ఱ','ం','ః','ఁ'],
      ['ా','ి','ీ','ు','ూ','ె','ే','ై','ొ','ో','ౌ','్'],
      ['1','2','3','4','5','6','7','8','9','0']
    ]
  },
  hi: {
    label: "हिंदी",
    micLabel: "हिंदी में बोलें",
    rows: [
      ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','अं','अः'],
      ['क','ख','ग','घ','ङ','च','छ','జ','झ','ञ'],
      ['ट','ठ','ड','ढ','ण','त','थ','द','ध','न'],
      ['प','ఫ','బ','भ','म','य','र','ल','व'],
      ['श','ष','स','ह','क्ष','त्र','ज्ञ','श्र'],
      ['ा','ि','ी','ु','ू','े','ै','ो','ौ','्','ं','ः'],
      ['1','2','3','4','5','6','7','8','9','0']
    ]
  },
  kn: {
    label: "ಕನ್ನಡ",
    micLabel: "ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ",
    rows: [
      ['ಅ','ಆ','ಇ','ಈ','ಉ','ಊ','ಎ','ಏ','ಐ','ಒ','ಓ','ಔ'],
      ['ಕ','ಖ','ಗ','ಘ','ಙ','ಚ','ಛ','ಜ','ಝ','ಞ'],
      ['ಟ','ಠ','ಡ','ಢ','ಣ','ತ','ಥ','ದ','ಧ','ನ'],
      ['ಪ','ಫ','ಬ','ಭ','ಮ','ಯ','ರ','ಲ','ವ'],
      ['ಶ','ಷ','ಸ','ಹ','ಳ','ಕ್ಷ','ಂ','ಃ'],
      ['ಾ','ಿ','ೀ','ು','ೂ','ೆ','ೇ','ೈ','ೊ','ೋ','ೌ','್'],
      ['1','2','3','4','5','6','7','8','9','0']
    ]
  },
  ta: {
    label: "தமிழ்",
    micLabel: "தமிழில் பேசுங்கள்",
    rows: [
      ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','ஔ'],
      ['க','ங','ச','ஞ','ட','ண','த','ந','ப','ம'],
      ['ய','ர','ல','வ','ழ','ள','ற','ன','ஜ','ஷ','ஸ','ஹ'],
      ['ா','ி','ீ','ு','ூ','ெ','ே','ை','ொ','ோ','ௌ','்'],
      ['1','2','3','4','5','6','7','8','9','0']
    ]
  }
};

export default function VirtualKeyboard() {
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [kbLang, setKbLang] = useState(lang && KEYBOARDS[lang] ? lang : 'te');
  const [buffer, setBuffer] = useState('');
  const [lastFocusedInput, setLastFocusedInput] = useState(null);
  const [directFillStatus, setDirectFillStatus] = useState('');
  const panelRef = useRef(null);

  // Sync keyboard language when main language changes
  useEffect(() => {
    if (lang && KEYBOARDS[lang]) {
      setKbLang(lang);
    }
  }, [lang]);

  // Hook voice input with the currently selected keyboard language
  const { listening, interim, startListening, stopListening } = useVoiceInput(kbLang);

  // Track the last focused input field globally
  useEffect(() => {
    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Don't track our own buffer input
        if (e.target.dataset.vkbBuffer) return;
        setLastFocusedInput(e.target);
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  // Safe setter that works with React 16+ controlled inputs
  const dispatchValueToInput = useCallback((inputEl, textToInsert) => {
    if (!inputEl) return false;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set || Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (nativeInputValueSetter) {
      const currentValue = inputEl.value || '';
      const cursorPos = inputEl.selectionStart || currentValue.length;
      const newValue = currentValue.slice(0, cursorPos) + textToInsert + currentValue.slice(cursorPos);
      nativeInputValueSetter.call(inputEl, newValue);
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      inputEl.focus();
      const newCursorPos = cursorPos + textToInsert.length;
      setTimeout(() => {
        try {
          inputEl.setSelectionRange(newCursorPos, newCursorPos);
        } catch (e) {}
      }, 0);
      return true;
    }
    return false;
  }, []);

  const handleKeyPress = useCallback((char) => {
    setBuffer(prev => prev + char);
  }, []);

  const handleBackspace = useCallback(() => {
    setBuffer(prev => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setBuffer('');
  }, []);

  const handleSpace = useCallback(() => {
    setBuffer(prev => prev + ' ');
  }, []);

  const handleInsert = useCallback(() => {
    if (!buffer.trim()) return;
    if (lastFocusedInput) {
      dispatchValueToInput(lastFocusedInput, buffer);
    }
    setBuffer('');
  }, [buffer, lastFocusedInput, dispatchValueToInput]);

  // Toggle voice input inside keyboard buffer
  const handleToggleVoice = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening((spokenText) => {
        if (spokenText) {
          setBuffer(prev => (prev ? prev + ' ' : '') + spokenText.trim());
        }
      }, {
        lang: kbLang,
        fieldId: 'vkb_buffer',
        continuous: false,
        initialWaitDelay: 7000,
        silenceDelay: 2000
      });
    }
  }, [listening, kbLang, startListening, stopListening]);

  // Quick Direct Mic (floating without opening entire keyboard)
  const handleQuickDirectMic = useCallback(() => {
    if (listening) {
      stopListening();
      setDirectFillStatus('');
      return;
    }

    if (lastFocusedInput) {
      setDirectFillStatus(`Listening for ${lastFocusedInput.placeholder || lastFocusedInput.name || 'field'}...`);
      startListening((spokenText) => {
        if (spokenText) {
          dispatchValueToInput(lastFocusedInput, spokenText.trim());
          setDirectFillStatus(`✅ Added: "${spokenText.trim()}"`);
          setTimeout(() => setDirectFillStatus(''), 2500);
        } else {
          setDirectFillStatus('');
        }
      }, {
        lang: kbLang,
        fieldId: 'quick_field',
        continuous: false,
        initialWaitDelay: 7000,
        silenceDelay: 2000
      });
    } else {
      // If no input focused yet, open keyboard and start listening to buffer
      setIsOpen(true);
      setTimeout(() => {
        handleToggleVoice();
      }, 100);
    }
  }, [listening, lastFocusedInput, kbLang, startListening, stopListening, dispatchValueToInput, handleToggleVoice]);

  const currentKeyboard = KEYBOARDS[kbLang] || KEYBOARDS.en;

  if (!isOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '18px',
          zIndex: 9990,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}
      >
        {/* Status Toast when direct speaking into active field */}
        {directFillStatus && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '0.76rem',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
            maxWidth: '220px',
            textAlign: 'right'
          }}>
            {directFillStatus}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Mic Action Button */}
          <button
            onClick={handleQuickDirectMic}
            title={listening ? "Stop Mic" : `Quick Mic (${currentKeyboard.label})`}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: listening
                ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                : 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: 'white',
              border: listening ? '2px solid #f87171' : '2px solid #38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: listening
                ? '0 0 18px rgba(239, 68, 68, 0.8)'
                : '0 4px 14px rgba(2, 132, 199, 0.4)',
              transition: 'all 0.25s ease'
            }}
          >
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Virtual Keyboard Launcher Button */}
          <button
            onClick={() => setIsOpen(true)}
            title="Open Multilingual Keyboard & Mic"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white',
              border: '2px solid #22c55e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(22, 163, 74, 0.45)',
              transition: 'all 0.3s ease'
            }}
          >
            <Keyboard size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9990,
        width: isMinimized ? '300px' : '440px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'linear-gradient(145deg, #0b1329, #172554)',
        border: '2px solid rgba(34, 197, 94, 0.5)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 25px rgba(34, 197, 94, 0.2)',
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0.8rem',
        background: 'rgba(22, 163, 74, 0.2)',
        borderBottom: '1px solid rgba(34, 197, 94, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Keyboard size={16} color="#4ade80" />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f1f5f9' }}>
            Rythu Key & Mic
          </span>
          <span style={{
            fontSize: '0.68rem',
            background: 'rgba(34, 197, 94, 0.25)',
            color: '#86efac',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600
          }}>
            {currentKeyboard.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px', display: 'flex'
            }}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => {
              if (listening) stopListening();
              setIsOpen(false);
              setBuffer('');
            }}
            title="Close Keyboard"
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px', display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Language Tabs */}
          <div style={{
            display: 'flex',
            gap: '2px',
            padding: '0.4rem 0.5rem',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.2)'
          }}>
            {Object.entries(KEYBOARDS).map(([code, kb]) => (
              <button
                key={code}
                onClick={() => setKbLang(code)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: kbLang === code ? 800 : 500,
                  background: kbLang === code ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                  color: kbLang === code ? '#4ade80' : '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {kb.label}
              </button>
            ))}
          </div>

          {/* Buffer Display */}
          <div style={{ padding: '0.4rem 0.6rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: listening ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '0.4rem 0.6rem',
              border: listening ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
              minHeight: '38px',
              transition: 'all 0.2s ease'
            }}>
              <span
                data-vkb-buffer="true"
                style={{
                  flex: 1,
                  fontSize: '0.95rem',
                  color: listening ? '#f87171' : (buffer ? '#e2e8f0' : '#64748b'),
                  fontFamily: kbLang === 'en' ? 'inherit' : 'Noto Sans, sans-serif',
                  wordBreak: 'break-all',
                  lineHeight: 1.4
                }}
              >
                {listening ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="animate-pulse">🔴</span>
                    {interim || currentKeyboard.micLabel || 'Listening...'}
                  </span>
                ) : (
                  buffer || 'Type or tap 🎙️ to speak...'
                )}
              </span>

              {/* Mic toggle inside buffer */}
              <button
                onClick={handleToggleVoice}
                title={listening ? "Stop recording" : currentKeyboard.micLabel}
                style={{
                  background: listening
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'rgba(34, 197, 94, 0.2)',
                  color: listening ? '#ffffff' : '#4ade80',
                  border: listening ? '1px solid #ef4444' : '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {listening ? <MicOff size={13} /> : <Mic size={13} />}
                {listening ? "Stop" : "Mic"}
              </button>

              {buffer && !listening && (
                <button
                  onClick={handleInsert}
                  title="Insert into active input field"
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #059669)',
                    color: 'white',
                    border: 'none',
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <CornerDownLeft size={12} /> Insert
                </button>
              )}
            </div>
            {lastFocusedInput && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: '#64748b' }}>
                → Will insert into: <span style={{ color: '#4ade80' }}>
                  {lastFocusedInput.placeholder || lastFocusedInput.name || 'selected field'}
                </span>
              </p>
            )}
          </div>

          {/* Keyboard Grid */}
          <div style={{ padding: '0.3rem 0.4rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {currentKeyboard.rows.map((row, rowIdx) => (
              <div key={rowIdx} style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '2px',
                flexWrap: 'wrap'
              }}>
                {row.map((char, charIdx) => (
                  <button
                    key={`${rowIdx}-${charIdx}`}
                    onClick={() => handleKeyPress(char)}
                    style={{
                      minWidth: kbLang === 'en' ? '30px' : '28px',
                      height: '34px',
                      borderRadius: '5px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                      fontSize: kbLang === 'en' ? '0.85rem' : '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.1s',
                      padding: '0 3px'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus steal
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}

            {/* Bottom row: Space, Backspace, Clear */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <button
                onClick={handleBackspace}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  flex: '0 0 60px', height: '34px', borderRadius: '5px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.2rem'
                }}
              >
                <Delete size={14} /> ⌫
              </button>
              <button
                onClick={handleSpace}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  flex: 1, height: '34px', borderRadius: '5px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ⎵ Space
              </button>
              <button
                onClick={handleClear}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  flex: '0 0 60px', height: '34px', borderRadius: '5px',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  background: 'rgba(234, 179, 8, 0.1)',
                  color: '#fcd34d', fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div style={{
          padding: '0.5rem 0.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {buffer ? `"${buffer.slice(0, 20)}${buffer.length > 20 ? '...' : ''}"` : 'Keyboard minimized'}
          </span>
          {buffer && (
            <button
              onClick={handleInsert}
              style={{
                background: '#16a34a', color: 'white', border: 'none',
                padding: '0.25rem 0.6rem', borderRadius: '6px',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Insert
            </button>
          )}
        </div>
      )}
    </div>
  );
}
