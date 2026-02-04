
import React, { useState, useMemo } from 'react';
import { ASSETS } from '../constants';

interface AppComingSoonPageProps {
  onBack: () => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const AppComingSoonPage: React.FC<AppComingSoonPageProps> = ({ onBack }) => {
  const [shift, setShift] = useState(0);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'ENCODE' | 'DECODE'>('ENCODE');

  // Caesar Logic
  const processedText = useMemo(() => {
    const s = mode === 'ENCODE' ? shift : (26 - shift) % 26;
    return input.toUpperCase().split("").map(char => {
      const index = ALPHABET.indexOf(char);
      if (index === -1) return char;
      return ALPHABET[(index + s) % 26];
    }).join("");
  }, [input, shift, mode]);

  const handleRotation = (delta: number) => {
    setShift(prev => (prev + delta + 26) % 26);
  };

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Header / Logo */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center overflow-hidden">
        <button 
            onClick={onBack} 
            className="hover:scale-105 transition-transform duration-300 focus:outline-none h-full w-full flex justify-center items-center"
            aria-label="Back to Home"
        >
           <img 
            src={ASSETS.YOUTUBER_LOGO} 
            alt="CodeKrackerXR Logo" 
            className="max-h-full w-auto max-w-[80%] object-contain p-4" 
           />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-8">
        
        {/* Left: The Wheel */}
        <div className="w-full max-w-[400px] md:max-w-[500px] flex flex-col items-center">
          <div className="relative w-full aspect-square">
            {/* Outer Static Ring */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <circle cx="50" cy="50" r="48" fill="transparent" stroke="rgba(212,175,55,0.2)" strokeWidth="0.5" />
              {ALPHABET.map((letter, i) => {
                const angle = (i * 360) / 26;
                const x = 50 + 42 * Math.cos((angle - 90) * (Math.PI / 180));
                const y = 50 + 42 * Math.sin((angle - 90) * (Math.PI / 180));
                return (
                  <text 
                    key={`outer-${i}`} 
                    x={x} y={y} 
                    fill="white" 
                    fontSize="3" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="font-display font-bold"
                  >
                    {letter}
                  </text>
                );
              })}
            </svg>

            {/* Inner Rotating Ring */}
            <div 
              className="absolute inset-0 transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{ transform: `rotate(${(shift * 360) / 26}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="35" fill="rgba(212,175,55,0.05)" stroke="#d4af37" strokeWidth="0.5" />
                {ALPHABET.map((letter, i) => {
                  const angle = (i * 360) / 26;
                  const x = 50 + 30 * Math.cos((angle - 90) * (Math.PI / 180));
                  const y = 50 + 30 * Math.sin((angle - 90) * (Math.PI / 180));
                  return (
                    <text 
                      key={`inner-${i}`} 
                      x={x} y={y} 
                      fill="#d4af37" 
                      fontSize="3.5" 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="font-display font-bold"
                      style={{ transform: `rotate(${-(shift * 360) / 26}deg)`, transformOrigin: `${x}px ${y}px` }}
                    >
                      {letter}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Center Hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-black border-2 border-vault-gold flex flex-col items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)] z-20">
                <span className="text-xs font-display text-vault-gold/60 uppercase tracking-widest">Shift</span>
                <span className="text-4xl md:text-5xl font-display font-black text-white">{shift}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => handleRotation(-1)}
              className="w-12 h-12 rounded-full border border-vault-gold flex items-center justify-center hover:bg-vault-gold/20 transition-colors"
            >
              <svg className="w-6 h-6 text-vault-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => handleRotation(1)}
              className="w-12 h-12 rounded-full border border-vault-gold flex items-center justify-center hover:bg-vault-gold/20 transition-colors"
            >
              <svg className="w-6 h-6 text-vault-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Input Panel */}
        <div className="w-full max-w-2xl bg-vault-panel/90 backdrop-blur-xl border border-vault-gold/30 p-6 md:p-10 rounded-2xl shadow-2xl relative">
          <div className="absolute -top-4 left-6 px-4 py-1 bg-vault-gold text-black font-display font-bold uppercase tracking-tighter text-sm">
            CKXR Caesar Cipher v1.0
          </div>

          {/* Mode Switch */}
          <div className="flex bg-black/40 p-1 rounded-lg mb-8 border border-white/10">
            <button 
              onClick={() => setMode('ENCODE')}
              className={`flex-1 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all ${mode === 'ENCODE' ? 'bg-vault-gold text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Encode
            </button>
            <button 
              onClick={() => setMode('DECODE')}
              className={`flex-1 py-3 font-display text-sm font-bold uppercase tracking-widest transition-all ${mode === 'DECODE' ? 'bg-vault-gold text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Decode
            </button>
          </div>

          {/* Text Areas */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-display text-vault-gold uppercase tracking-[0.3em] ml-1">Plaintext Input</label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter message to encrypt..."
                className="w-full bg-black/60 border border-white/10 rounded-lg p-4 font-mono text-lg text-white focus:outline-none focus:border-vault-gold h-32 resize-none transition-colors"
              />
            </div>

            <div className="relative py-4 flex items-center justify-center">
               <div className="h-px w-full bg-gradient-to-r from-transparent via-vault-gold/30 to-transparent"></div>
               <div className="absolute bg-vault-panel px-3 text-[10px] text-vault-gold/50 font-display uppercase tracking-widest">Processing Layer</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display text-vault-gold uppercase tracking-[0.3em] ml-1">Ciphered Output</label>
              <div className="w-full bg-black/40 border border-vault-gold/20 rounded-lg p-4 font-mono text-xl text-vault-gold min-h-[128px] break-all shadow-inner relative overflow-hidden">
                {processedText || <span className="opacity-20 italic">Encrypted text will appear here...</span>}
                {/* Tech scanline effect */}
                <div className="absolute inset-0 pointer-events-none opacity-10 scanline"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center text-[10px] font-display text-white/30 uppercase tracking-[0.2em]">
            <span>Algorithm: Rotational Offset</span>
            <span>Security: Active</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-20 w-full py-6 text-center border-t border-white/10 bg-black/40">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-60">
           &copy; 2026 CODE KRACKER XR | AES-256 EMULATION LAYER
        </p>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 opacity-10 scanline"></div>
    </div>
  );
};
