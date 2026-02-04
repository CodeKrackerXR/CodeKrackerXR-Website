
import React, { useState, useRef } from 'react';

export const MissionCoreRPi5: React.FC = () => {
  const [manualIp] = useState("192.168.0.55");
  const [isUplinkVerified, setIsUplinkVerified] = useState(true);
  const streamRef = useRef<HTMLImageElement>(null);

  return (
    <section className="bg-black border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col mt-2 w-full">
      {/* Yellow Header Bar */}
      <div className="w-full bg-vault-gold px-6 py-2 flex items-center gap-3">
         <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
         <h2 className="text-black font-display font-black uppercase tracking-[0.2em] text-xs">Virtual Command Grid</h2>
      </div>

      <div className="p-6 md:p-10 flex flex-col items-center">
        {/* Main Section Title */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-[0.15em] mb-1 leading-none text-center">
            Mission RPi5 Core
          </h1>
          <div className="w-40 h-1 bg-vault-gold/60"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* Left Column: Vision Uplink */}
          <div className="lg:col-span-7 flex flex-col gap-3">
             <div className="flex justify-between items-end px-1">
                <span className="text-vault-gold font-display font-black uppercase tracking-[0.15em] text-[12px]">Neural Visual Uplink</span>
                <span className="text-vault-alert font-display font-black uppercase text-[9px] tracking-widest animate-pulse">Live HD Feed</span>
             </div>
             <div className="aspect-video bg-black border border-white/10 rounded-xl overflow-hidden relative group">
                <img 
                  ref={streamRef}
                  src={`http://${manualIp}:8080/stream.mjpg`} 
                  alt="Uplink" 
                  className="w-full h-full object-cover opacity-60"
                  onError={() => setIsUplinkVerified(false)}
                  onLoad={() => setIsUplinkVerified(true)}
                />
                {!isUplinkVerified && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                     <div className="text-white/20 font-display font-black uppercase tracking-[0.4em] text-sm">No Visual Signal</div>
                  </div>
                )}
             </div>
             <button className="w-full py-4 bg-[#22c55e] text-black font-display font-black uppercase tracking-widest rounded-lg text-xs shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:brightness-110 transition-all">
                Optical Link Active
             </button>
          </div>

          {/* Right Column: Analytics Module */}
          <div className="lg:col-span-5 flex flex-col gap-3">
             <div className="flex justify-between items-end px-1">
                <span className="text-white/30 font-display font-black uppercase tracking-[0.15em] text-[12px]">Analytics Module</span>
                <span className="text-[#3b82f6] font-display font-black uppercase text-[9px] tracking-widest">Neural Path Open</span>
             </div>
             <div className="flex-1 bg-black border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex-1 grid grid-cols-2 gap-3 min-h-[160px]">
                   <div className="bg-black border border-white/10 rounded-lg relative flex items-center justify-center">
                      <span className="absolute top-2 left-2 text-[8px] font-display font-black text-white/30 uppercase">RPi Still</span>
                      <svg className="w-8 h-8 text-white/5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                   </div>
                   <div className="bg-black border border-white/10 rounded-lg relative flex items-center justify-center">
                      <span className="absolute top-2 left-2 text-[8px] font-display font-black text-white/30 uppercase">RPi Burst</span>
                      <svg className="w-8 h-8 text-white/5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tactical Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-10">
           <button className="py-5 border-2 border-vault-gold text-vault-gold bg-black rounded-lg font-display font-black uppercase text-lg tracking-widest hover:bg-vault-gold/10 transition-all">
             Calibration
           </button>
           <button className="py-5 border-2 border-vault-alert text-vault-alert bg-black rounded-lg font-display font-black uppercase text-lg tracking-widest hover:bg-vault-alert/10 transition-all">
             Emergency Reset
           </button>
        </div>
      </div>
      
      {/* Background Overlay for depth */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] scanline pointer-events-none"></div>
    </section>
  );
};
