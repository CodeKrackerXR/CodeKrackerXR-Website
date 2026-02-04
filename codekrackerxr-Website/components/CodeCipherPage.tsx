
import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants';

interface CodeCipherPageProps {
  onBack: () => void;
  onSuccess: () => void;
  initialCode?: string;
}

export const CodeCipherPage: React.FC<CodeCipherPageProps> = ({ onBack, onSuccess, initialCode = "" }) => {
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState(false);

  const correctCode = 'ILOUDT';

  useEffect(() => {
    if (initialCode) setCode(initialCode);
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === correctCode) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => {
        setError(false);
        setCode('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.4 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/60 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Header Logo - Matching Homepage style (Absolute positioned) */}
      <div className="absolute top-0 left-0 w-full z-30 pointer-events-auto flex justify-center">
        <button 
          onClick={onBack} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300 active:scale-95"
          aria-label="Back to Home"
        >
           <img 
            src={ASSETS.LANDING_BANNER} 
            alt="CodeKrackerXR Logo" 
            className="w-full h-auto object-contain max-h-32 md:max-h-48" 
           />
        </button>
      </div>

      {/* Main Content - Reduced top padding by 50% (pt-44 -> pt-22, md:pt-[20rem] -> md:pt-[10rem]) */}
      <div className="relative z-10 container mx-auto px-6 flex-1 flex flex-col items-center justify-center pt-24 md:pt-[10rem] pb-12">
        <div className="w-full max-w-xl bg-vault-panel/90 backdrop-blur-md border border-vault-gold/40 p-10 md:p-14 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
           <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 relative">
              <label htmlFor="codeInput" className="font-display text-2xl md:text-3xl text-vault-gold uppercase tracking-[0.2em] font-bold mb-2">Enter Code</label>
              <div className="relative w-full">
                <input id="codeInput" type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full bg-black/60 border-2 border-white/20 text-white text-center text-3xl md:text-4xl font-display uppercase tracking-widest py-6 px-4 rounded focus:outline-none focus:border-vault-gold transition-colors placeholder-white/10" placeholder="------" autoComplete="off" />
                {error && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded border-2 border-vault-alert animate-[fadeIn_0.2s_ease-out]">
                     <h3 className="font-display font-black text-3xl md:text-5xl text-vault-alert uppercase tracking-wide text-center">Sorry Try Again!</h3>
                  </div>
                )}
              </div>
              <button type="submit" className="mt-4 px-12 py-4 bg-white text-black font-display font-bold uppercase tracking-widest text-lg hover:bg-vault-gold hover:scale-105 transition-all duration-300 clip-path-slant">Unlock</button>
           </form>
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-10 scanline"></div>
    </div>
  );
};
