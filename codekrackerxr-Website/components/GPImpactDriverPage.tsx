import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

export const GPImpactDriverPage: React.FC<{ user: any; onBack: () => void; onNavigateToHub?: (section?: string) => void; onNavigateToClues?: () => void; onNavigateToItem: (item: string) => void; onNavigateToTheHunt: () => void; isFromHub?: boolean; onBackToEdit?: () => void }> = ({ user, onBack, onNavigateToHub, onNavigateToClues, onNavigateToItem, onNavigateToTheHunt, isFromHub, onBackToEdit }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const isAuthorized = user?.uid === '51H7yItLU9WMMiXl10xE';

  useEffect(() => {
    if (!isAuthorized) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'creators', 'MasterCreatorFolder'));
        if (snap.exists()) {
          const h10 = snap.data()?.TheHunt?.["Hunt 10 Items"] || {};
          const gpi = h10["Game Play Images"] || {};
          setData({
            clue: h10["ImpactDriverClue"] || "",
            creatorClue: h10["CreatorImpactDriverClue"] || "",
            notes: h10["ImpactDriverFilmingNotes"] || "",
            image: gpi["GPImpactDriverImage"] || null
          });
        }
      } finally { setLoading(false); }
    };
    fetch();
  }, [isAuthorized]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-vault-gold font-display uppercase tracking-widest animate-pulse">Loading Intel...</div>;
  if (!isAuthorized) return <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center"><h1 className="text-3xl font-display font-black text-vault-alert uppercase mb-8">Unauthorized</h1><VaultButton onClick={onBack}>Return</VaultButton></div>;

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden">
      <div className="relative z-50 w-full flex flex-col items-center pt-8 pb-4">
        <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-20 md:h-28 w-auto object-contain" />
      </div>
      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col items-center text-center">
        <h1 className="w-full relative flex items-center justify-center text-2xl md:text-7xl font-display font-black uppercase tracking-tighter border-b-4 border-vault-gold pb-4 mb-12">
          <span className="absolute left-0 text-white/40">3.</span>
          <span className="text-white">Impact Driver</span>
          <span className="absolute right-0 text-vault-gold">{data?.clue}</span>
        </h1>
        
        <p className="text-2xl md:text-3xl text-vault-gold font-bold mb-4 uppercase tracking-[0.2em] animate-pulse">
          {data?.creatorClue || "Clue pending..."}
        </p>

        <div className="relative w-full max-w-2xl mb-12 border-4 border-vault-gold rounded-3xl overflow-hidden shadow-2xl bg-vault-panel">
          {data?.image ? <img src={data.image} alt="Impact Driver" className="w-full h-auto block" /> : <div className="aspect-video flex items-center justify-center text-white/20">NO IMAGE DATA</div>}
        </div>
        
        <div className="mb-16 w-full max-w-2xl flex items-center justify-center gap-6">
          <button onClick={() => onNavigateToItem("Listening Device")} className="text-vault-gold hover:text-white transition-all transform hover:scale-125 flex-shrink-0" title="Previous Tool">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 flex justify-center">
            {!showNotes ? (
              <button onClick={() => setShowNotes(true)} className="px-6 py-2 bg-vault-gold text-black font-display font-black uppercase tracking-widest rounded-full shadow-lg hover:scale-105 transition-transform">Filming Notes</button>
            ) : (
              <div onClick={() => setShowNotes(false)} className="w-full bg-vault-panel/95 backdrop-blur-xl border-2 border-vault-gold p-8 rounded-2xl text-left cursor-pointer transition-all">
                <h4 className="text-vault-gold font-display font-black uppercase text-sm mb-4">Filming Notes</h4>
                <p className="text-white/80 font-sans text-lg md:text-xl leading-relaxed italic">{data?.notes || "No specific filming intelligence logged."}</p>
              </div>
            )}
          </div>
          <button onClick={() => onNavigateToItem("EndoScope")} className="text-vault-gold hover:text-white transition-all transform hover:scale-125 flex-shrink-0" title="Next Tool">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="w-full max-sm flex flex-col gap-4">
          <VaultButton variant="secondary" onClick={onNavigateToClues || (() => {})} className="w-full py-4 text-lg border-2">List of Tools</VaultButton>
          <VaultButton onClick={onNavigateToTheHunt} className="w-full py-6 text-xl bg-vault-gold text-black">Return to Hunt</VaultButton>
          {isFromHub && (
            <VaultButton 
              onClick={onBackToEdit || (() => {})} 
              className="w-full py-6 text-xl bg-[#22c55e] text-white hover:bg-green-600 !border-none !clip-path-none shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              Back to Edit
            </VaultButton>
          )}
        </div>
      </div>
    </div>
  );
};
