import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

export const GPKey2Page: React.FC<{ user: any; onBack: () => void; onNavigateToHub?: (section?: string) => void; onNavigateToClues?: () => void }> = ({ user, onBack, onNavigateToHub, onNavigateToClues }) => {
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
            clue: h10["Key2Clue"] || "",
            notes: h10["Key2FilmingNotes"] || "",
            image: gpi["GPKey2Image"] || null
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
        <h1 className="text-5xl md:text-7xl font-display font-black text-white uppercase tracking-tighter border-b-4 border-vault-gold pb-4 inline-block mb-12">Key 2</h1>
        <p className="text-3xl md:text-5xl text-vault-gold font-bold leading-tight mb-12">"{data?.clue || "Clue pending..."}"</p>
        <div className="relative w-full max-w-2xl mb-12 border-4 border-vault-gold rounded-3xl overflow-hidden shadow-2xl bg-vault-panel">
          {data?.image ? <img src={data.image} alt="Key 2" className="w-full h-auto block" /> : <div className="aspect-video flex items-center justify-center text-white/20">NO IMAGE DATA</div>}
        </div>
        <div className="mb-16 w-full max-w-2xl flex flex-col items-center">
          {!showNotes ? (
            <button onClick={() => setShowNotes(true)} className="px-6 py-2 bg-vault-gold text-black font-display font-black uppercase tracking-widest rounded-full animate-pulse">Filming Notes</button>
          ) : (
            <div onClick={() => setShowNotes(false)} className="w-full bg-vault-panel/95 backdrop-blur-xl border-2 border-vault-gold p-8 rounded-2xl text-left cursor-pointer transition-all">
              <h4 className="text-vault-gold font-display font-black uppercase text-sm mb-4">Filming Notes</h4>
              <p className="text-white/80 font-sans text-lg md:text-xl leading-relaxed italic">{data?.notes || "No specific filming intelligence logged."}</p>
            </div>
          )}
        </div>
        <div className="w-full max-sm flex flex-col gap-4">
          <VaultButton variant="secondary" onClick={onNavigateToClues || (() => {})} className="w-full py-4 text-lg border-2">List of Tools</VaultButton>
          <VaultButton onClick={() => onNavigateToHub ? onNavigateToHub('hidingItems') : onBack()} className="w-full py-6 text-xl bg-vault-gold text-black">Game Hub</VaultButton>
        </div>
      </div>
    </div>
  );
};
