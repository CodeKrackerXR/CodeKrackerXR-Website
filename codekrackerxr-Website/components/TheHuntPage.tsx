import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, auth } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface TheHuntPageProps {
  onNavigateToWheel: (resume?: boolean) => void;
  onNavigateToPlayers: () => void;
  onNavigateToLeaderBoard: () => void;
  onNavigateToBreakIn: (index?: number) => void;
  huntAnswers: string[];
  setHuntAnswers: (answers: string[]) => void;
  youtuber?: {
    name: string;
    avatar: string;
    profile: string;
    TheHuntThumbNail: string;
    TheHuntVideo: string;
    TheBreakInVideo: string;
    TheBreakInThumbNail: string;
  };
}

const ITEMS = [
  "Drill", "Listening Device", "Impact Driver", "EndoScope", "Stud Finder",
  "Headphones", "Spray Smoke", "Key 1 “Solis”", "Key 2 “Noctis”", "CodeX Ring"
];

const CREATOR_DOC_ID = 'MasterCreatorFolder';

export const TheHuntPage: React.FC<TheHuntPageProps> = ({ 
  onNavigateToWheel, 
  onNavigateToPlayers, 
  onNavigateToLeaderBoard,
  onNavigateToBreakIn,
  huntAnswers, 
  setHuntAnswers,
  youtuber
}) => {
  const [riddleAnswer, setRiddleAnswer] = React.useState('');
  const [codedWordLength, setCodedWordLength] = useState(7);
  const [showShiftError, setShowShiftError] = useState(false);
  const [showIncompleteError, setShowIncompleteError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
        const snap = await getDoc(creatorRef);
        if (snap.exists()) {
          const word = snap.data()?.TheHunt?.HuntCodedWord || snap.data()?.TheHunt?.CodedWord || "";
          const len = Math.min(14, Math.max(7, word.trim().length));
          setCodedWordLength(len);
        }
      } catch (err) {
        console.warn("Mission metadata link unstable, defaulting to 7.");
      }
    };
    fetchMetadata();
  }, []);

  const fieldLimits = useMemo(() => {
    const numDoubleFields = Math.max(0, codedWordLength - 7);
    const numSingleFields = 7 - numDoubleFields;
    const limits = new Array(10).fill(1);
    for (let i = 0; i < 7; i++) {
      limits[i] = i < numSingleFields ? 1 : 2;
    }
    limits[7] = 1;
    limits[8] = 1;
    limits[9] = 1;
    return limits;
  }, [codedWordLength]);

  const handleItemChange = (index: number, val: string) => {
    const isNumericOnly = index === 8 || index === 9;
    const regex = isNumericOnly ? /[^0-9]/g : /[^a-zA-Z]/g;
    const filtered = val.replace(regex, '').toUpperCase();
    const maxLen = fieldLimits[index];
    let finalVal = filtered.slice(0, maxLen);
    if (index === 8) {
      if (finalVal !== '' && !['0', '1', '2'].includes(finalVal)) return; 
    }
    if (index === 9) {
      const val8 = huntAnswers[8] || '0';
      const combined = parseInt(val8 + finalVal, 10);
      if (finalVal !== '' && combined > 25) {
        setShowShiftError(true);
        return;
      }
    }
    const newAnswers = [...huntAnswers];
    newAnswers[index] = finalVal;
    setHuntAnswers(newAnswers);
    if (finalVal.length === maxLen && index < 9) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyRiddle = async () => {
    const allFilled = huntAnswers.every(ans => ans.trim() !== '');
    if (!allFilled) {
      setShowIncompleteError(true);
      return;
    }
    const targetUid = auth.currentUser?.uid || '51H7yItLU9WMMiXl10xE';
    try {
      const savedTime = localStorage.getItem('ckxr_caesar_timer_val');
      const hasPausedSession = savedTime && parseInt(savedTime, 10) > 0;
      if (hasPausedSession) {
        onNavigateToWheel(true);
        return;
      }
      onNavigateToWheel(false);
    } catch (err) {
      onNavigateToWheel(false);
    }
  };

  const renderItem = (item: string, absoluteIndex: number) => {
    const isNumericOnly = absoluteIndex === 8 || absoluteIndex === 9;
    const maxLen = fieldLimits[absoluteIndex];
    return (
      <div key={absoluteIndex} className="flex items-center justify-between gap-6 group border-b border-white/5 pb-4 last:border-0 lg:border-b lg:pb-6">
        <span className="font-sans text-xl md:text-2xl text-white font-bold transition-colors flex-1 flex items-center">
          <span className="text-vault-gold/60 mr-4 font-display text-xl md:text-2xl">{absoluteIndex + 1}.</span> 
          <span className="text-2xl group-hover:text-vault-gold transition-colors">{item}</span>
        </span>
        <input 
          ref={el => { inputRefs.current[absoluteIndex] = el; }}
          type="text"
          value={huntAnswers[absoluteIndex]}
          onChange={(e) => handleItemChange(absoluteIndex, e.target.value)}
          className="w-20 h-16 bg-black/80 border-2 border-vault-gold/50 rounded-lg text-center font-display font-black text-2xl text-vault-gold focus:outline-none focus:border-vault-gold shadow-lg uppercase"
          placeholder={isNumericOnly ? "0" : (maxLen === 2 ? "--" : "-")}
          maxLength={maxLen}
          inputMode={isNumericOnly ? "numeric" : "text"}
        />
      </div>
    );
  };

  const activePlayer = youtuber || {
    name: "Chris Ramsey",
    avatar: ASSETS.CHRIS_RAMSAY_IMG,
    profile: "https://www.youtube.com/@ChrisRamsay52",
    TheHuntThumbNail: ASSETS.CHRIS_RAMSAY_TN,
    TheHuntVideo: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=75s"
  };

  const teamName = activePlayer.name === "Chris Ramsey" ? "Team Area 52" : `Team ${activePlayer.name.split(' ')[0] || 'Unknown'}`;
  const hasHuntVideo = activePlayer.TheHuntVideo && activePlayer.TheHuntThumbNail;

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {showShiftError && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.2)]">
            <h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-6">Protocol Alert</h3>
            <p className="text-vault-gold font-sans text-lg mb-10 leading-relaxed italic">"The Shift key has to be 25 or less in Value"</p>
            <VaultButton onClick={() => setShowShiftError(false)} className="w-full py-4 text-sm bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black">Acknowledge</VaultButton>
          </div>
        </div>
      )}

      {showIncompleteError && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.2)]">
            <h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-6">Incomplete Dossier</h3>
            <p className="text-vault-gold font-sans text-lg mb-10 leading-relaxed italic">"You must fill in all 10 boxes"</p>
            <VaultButton onClick={() => setShowIncompleteError(false)} className="w-full py-4 text-sm bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black">Acknowledge</VaultButton>
          </div>
        </div>
      )}

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={() => onNavigateToBreakIn()} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl flex-1">
        <div className={`flex flex-col lg:flex-row items-center ${hasHuntVideo ? 'justify-between' : 'justify-center'} gap-12 mb-16 animate-[fadeInUp_0.6s_ease-out]`}>
          <div className={`flex flex-col md:flex-row items-center gap-8 ${!hasHuntVideo ? 'text-center' : ''}`}>
            <div className="w-40 h-40 md:w-52 md:h-52 aspect-square flex-shrink-0 rounded-full border-4 border-vault-gold overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.5)]">
              <img src={activePlayer.avatar} alt={activePlayer.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-vault-gold uppercase tracking-widest drop-shadow-md">{activePlayer.name}</h2>
              <p className="text-vault-alert font-display text-xl md:text-2xl uppercase tracking-[0.4em] mt-4 font-bold">{teamName}</p>
            </div>
          </div>
          {hasHuntVideo && (
            <a href={activePlayer.TheHuntVideo} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
              <div className="relative w-64 aspect-video border-4 border-vault-gold rounded-lg overflow-hidden transition-all group-hover:scale-105">
                <img src={activePlayer.TheHuntThumbNail} alt="Watch The Hunt" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-12 h-12 bg-vault-gold text-black rounded-full flex items-center justify-center opacity-80"><svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg></div></div>
              </div>
              <span className="mt-4 font-display font-bold text-vault-gold uppercase tracking-widest text-lg group-hover:text-white transition-colors">Watch The Hunt</span>
            </a>
          )}
        </div>

        <div className="bg-vault-panel/85 backdrop-blur-2xl border border-vault-gold/30 p-8 md:p-12 rounded-3xl shadow-2xl mb-12">
          <h3 className="text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-12 border-b-2 border-vault-gold/20 pb-6 text-center md:text-left">Tools & Artifacts</h3>
          <div className="flex lg:hidden flex-col gap-8">{ITEMS.map((item, idx) => renderItem(item, idx))}</div>
          <div className="hidden lg:grid lg:grid-cols-2 gap-x-20 gap-y-10">
            <div className="flex flex-col gap-10">{ITEMS.slice(0, 5).map((item, idx) => renderItem(item, idx))}</div>
            <div className="flex flex-col gap-10">{ITEMS.slice(5, 10).map((item, idx) => renderItem(item, idx + 5))}</div>
          </div>
        </div>

        <div className="bg-vault-panel/80 backdrop-blur-xl border border-vault-gold/20 p-8 md:p-12 rounded-2xl shadow-2xl mb-16">
          <div className="space-y-6">
            <label className="block text-2xl font-display font-bold text-vault-gold uppercase tracking-widest">Codex Ring Riddle answer</label>
            <input type="text" value={riddleAnswer} onChange={(e) => setRiddleAnswer(e.target.value)} placeholder="Enter your solution..." className="w-full bg-black/60 border-2 border-vault-gold/40 rounded-xl px-6 h-16 font-mono text-xl text-white focus:outline-none focus:border-vault-gold shadow-inner transition-colors" />
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8">
            <VaultButton onClick={() => window.open(activePlayer.TheHuntVideo, '_blank')} className="w-full max-sm py-5 text-xl">Submit Answer on YouTube</VaultButton>
            <VaultButton variant="secondary" onClick={handleVerifyRiddle} className="w-full max-sm py-5 text-xl border-2">Verify the riddle</VaultButton>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-12 mb-24 relative z-50">
           <VaultButton variant="secondary" onClick={onNavigateToPlayers} className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2">List of Game Players</VaultButton>
           <VaultButton variant="secondary" onClick={onNavigateToLeaderBoard} className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2">Leader Board</VaultButton>
        </div>
      </div>
    </div>
  );
};