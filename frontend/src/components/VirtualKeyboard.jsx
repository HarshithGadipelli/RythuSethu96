import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Keyboard, X, ChevronDown, ChevronUp, Mic, Delete, CornerDownLeft } from 'lucide-react';
import { useLang } from '../context/LangContext';

// Character grids for each language
const KEYBOARDS = {
  en: {
    label: "English",
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
    rows: [
      ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','अं','अः'],
      ['क','ख','ग','घ','ङ','च','छ','ज','झ','ञ'],
      ['ट','ठ','ड','ढ','ण','त','थ','द','ध','न'],
      ['प','फ','ब','भ','म','य','र','ल','व'],
      ['श','ष','स','ह','क्ष','त्र','ज्ञ','श्र'],
      ['ा','ि','ी','ु','ू','े','ै','ो','ौ','्','ं','ः'],
      ['1','2','3','4','5','6','7','8','9','0']
    ]
  },
  kn: {
    label: "ಕನ್ನಡ",
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
  const [kbLang, setKbLang] = useState(lang !== 'en' ? lang : 'te');
  const [buffer, setBuffer] = useState('');
  const [lastFocusedInput, setLastFocusedInput] = useState(null);
  const panelRef = useRef(null);

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
      // Create and dispatch a native input event to work with React's state management
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;
      
      if (nativeInputValueSetter) {
        const currentValue = lastFocusedInput.value || '';
        const cursorPos = lastFocusedInput.selectionStart || currentValue.length;
        const newValue = currentValue.slice(0, cursorPos) + buffer + currentValue.slice(cursorPos);
        nativeInputValueSetter.call(lastFocusedInput, newValue);
        lastFocusedInput.dispatchEvent(new Event('input', { bubbles: true }));
        lastFocusedInput.dispatchEvent(new Event('change', { bubbles: true }));
        lastFocusedInput.focus();
        // Set cursor position after inserted text
        const newCursorPos = cursorPos + buffer.length;
        setTimeout(() => {
          lastFocusedInput.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      }
    }
    setBuffer('');
  }, [buffer, lastFocusedInput]);

  const currentKeyboard = KEYBOARDS[kbLang] || KEYBOARDS.en;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Open Multilingual Virtual Keyboard"
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          zIndex: 9990,
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
          boxShadow: '0 6px 20px rgba(22, 163, 74, 0.4)',
          transition: 'all 0.3s ease'
        }}
      >
        <Keyboard size={24} />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        bottom: isMinimized ? '20px' : '20px',
        right: '20px',
        zIndex: 9990,
        width: isMinimized ? '280px' : '420px',
        background: 'linear-gradient(145deg, #0f172a, #1e293b)',
        border: '2px solid rgba(34, 197, 94, 0.4)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(34, 197, 94, 0.15)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0.8rem',
        background: 'rgba(22, 163, 74, 0.15)',
        borderBottom: '1px solid rgba(34, 197, 94, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Keyboard size={16} color="#22c55e" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>
            Virtual Keyboard
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px', display: 'flex'
            }}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setBuffer(''); }}
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
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '0.4rem 0.6rem',
              border: '1px solid rgba(255,255,255,0.1)',
              minHeight: '36px'
            }}>
              <span
                data-vkb-buffer="true"
                style={{
                  flex: 1,
                  fontSize: '0.95rem',
                  color: buffer ? '#e2e8f0' : '#64748b',
                  fontFamily: kbLang === 'en' ? 'inherit' : 'Noto Sans, sans-serif',
                  wordBreak: 'break-all',
                  lineHeight: 1.4
                }}
              >
                {buffer || 'Type using keyboard below...'}
              </span>
              {buffer && (
                <button
                  onClick={handleInsert}
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
                  {lastFocusedInput.placeholder || lastFocusedInput.name || 'input field'}
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
