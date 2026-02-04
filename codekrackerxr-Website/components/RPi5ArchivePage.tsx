import React from 'react';
import { ASSETS } from '../constants';

export const RPi5ArchivePage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-mesh opacity-10 pointer-events-none" />

      <div className="relative z-50 w-full flex flex-col items-center pt-4 pb-2 px-6 bg-black/80 backdrop-blur-lg">
        <button onClick={onBack} className="hover:scale-105 transition-transform">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-14 md:h-20 object-contain" />
        </button>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto flex flex-col gap-4 p-4 pb-20">
        <div className="bg-vault-panel p-8 rounded-3xl border border-vault-gold/20 mb-8">
            <h1 className="text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-4">RPi5 Neural Core Archive</h1>
            <p className="text-white/60 font-sans italic">This module is currently detached from the primary Command Center.</p>
        </div>
        
        <div className="w-full aspect-video bg-black border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-6 p-12 text-center">
           <div className="w-20 h-20 bg-vault-alert/10 rounded-full flex items-center justify-center border-2 border-vault-alert">
             <svg className="w-10 h-10 text-vault-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
           </div>
           <div className="space-y-2">
             <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">Neural Link Terminated</h2>
             <p className="text-white/40 uppercase tracking-widest text-xs">Core logic is dormant to prevent unauthorized broadcast.</p>
           </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] scanline"></div>
    </div>
  );
};