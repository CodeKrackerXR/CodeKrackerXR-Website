import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, auth } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface TheBreakInPageProps {
  onNavigateToWheel: () => void;
  onNavigateToPlayers: () => void;
  onNavigateToLeaderBoard: () => void;
  onNavigateToHunt: () => void;
  onNavigateToVigenere: (resume?: boolean) => void;
  onNavigateToLevel2BreakIn: () => void;
  breakInAnswers: string[];
  setBreakInAnswers: (answers: string[]) => void;
  keywordRiddleAnswer: string;
  setKeywordRiddleAnswer: (val: string) => void;
  youtuber?: {
    name: string;
    avatar: string;
    profile: string;
    TheHuntThumbNail: string;
    TheHuntVideo: string;
    TheBreakInThumbNail: string;
    TheBreakInVideo: string;
  };
  user: any;
}

const MISSIONS = Array.from({ length: 14 }, (_, i) => `Mission ${i + 1}`);
const CREATOR_DOC_ID = 'MasterCreatorFolder';

type PromptStep = 'NONE' | 'SPEED_LINK' | 'TRAINING';

export const TheBreakInPage: React.FC<TheBreakInPageProps> = ({ 
  onNavigateToWheel, 
  onNavigateToPlayers, 
  onNavigateToLeaderBoard,
  onNavigateToHunt,
  onNavigateToVigenere,
  onNavigateToLevel2BreakIn,
  breakInAnswers, 
  setBreakInAnswers,
  keywordRiddleAnswer,
  setKeywordRiddleAnswer,
  youtuber,
  user
}) => {
  const [promptStep, setPromptStep] = useState<PromptStep>('NONE');
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [northWordLen, setNorthWordLen] = useState(7);
  const [westWordLen, setWestWordLen] = useState(7);
  const [showMissionsIncompleteError, setShowMissionsIncompleteError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
        const snap = await getDoc(creatorRef);
        if (snap.exists()) {
          const data = snap.data();
          const codedMissions = data?.TheBreakIn?.["Coded Missions"] || {};
          const northWord = codedMissions.CipherWordNorth || "";
          const westWord = codedMissions.CipherWordWest || "";
          setNorthWordLen(Math.min(14, Math.max(7, northWord.trim().length)));
          setWestWordLen(Math.min(14, Math.max(7, westWord.trim().length)));
        }
      } catch (err) {
        console.warn("Mission metadata uplink unstable.");
      }
    };
    fetchMetadata();
  }, []);

  const fieldLimits = useMemo(() => {
    const limits = new Array(14).fill(1);
    const numDoubleNorth = Math.max(0, northWordLen - 7);
    const numSingleNorth = 7 - numDoubleNorth;
    for (let i = 0; i < 7; i++) limits[i] = i < numSingleNorth ? 1 : 2;
    const numDoubleWest = Math.max(0, westWordLen - 7);
    const numSingleWest = 7 - numDoubleWest;
    for (let i = 0; i < 7; i++) limits[i + 7] = i < numSingleWest ? 1 : 2;
    return limits;
  }, [northWordLen, westWordLen]);

  const syncBreakInToDatabase = async () => {
    const activeUid = auth.currentUser?.uid || user?.uid || '51H7yItLU9WMMiXl10xE';
    if (!activeUid) return;
    const cipherNorth = breakInAnswers.slice(0, 7).join('');
    const cipherWest = breakInAnswers.slice(7, 14).join('');
    setIsSyncing(true);
    try {
      const timestamp = new Date().toISOString();
      const payload = { "CipherNorth": cipherNorth, "CipherWest": cipherWest, "updatedAt": timestamp, "agentAlias": user?.displayName || 'Anonymous Agent' };
      const userRef = doc(db, 'Users', activeUid);
      await setDoc(userRef, { "TheBreakIn": payload }, { merge: true });
      const breakInRef = doc(db, 'BreakIn', activeUid);
      await setDoc(breakInRef, payload, { merge: true });
    } catch (err) {
      console.error("Database Sync Failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAction = async (callback: () => void) => {
    await syncBreakInToDatabase();
    callback();
  };

  const handleItemChange = (index: number, val: string) => {
    const filtered = val.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const maxLen = fieldLimits[index];
    const finalVal = filtered.slice(0, maxLen);
    const newAnswers = [...breakInAnswers];
    newAnswers[index] = finalVal;
    setBreakInAnswers(newAnswers);
    if (finalVal.length === maxLen && index < 13) inputRefs.current[index + 1]?.focus();
  };

  const handleVerifyRiddle = async () => {
    if (!breakInAnswers.every(ans => ans && ans.trim() !== '')) {
      setShowMissionsIncompleteError(true);
      return;
    }
    await syncBreakInToDatabase();
    setPromptStep('SPEED_LINK');
  };

  const renderItem = (item: string, absoluteIndex: number) => {
    const maxLen = fieldLimits[absoluteIndex];
    return (
      <div key={absoluteIndex} className="flex items-center justify-between gap-6 group border-b border-white/5 pb-4 last:border-0 lg:border-b lg:pb-6">
        <span className="font-sans text-xl md:text-2xl text-white font-bold transition-colors flex-1 flex items-center">
          <span className="text-vault-gold/60 mr-4 font-display text-xl md:text-2xl">{absoluteIndex + 1}.</span> 
          <span className="text-2xl group-hover:text-vault-gold transition-colors">{item}</span>
        </span>
        <input ref={el => { inputRefs.current[absoluteIndex] = el; }} type="text" value={breakInAnswers[absoluteIndex] || ''} onChange={(e) => handleItemChange(absoluteIndex, e.target.value)} className="w-20 h-16 bg-black/80 border-2 border-vault-gold/50 rounded-lg text-center font-display font-black text-2xl text-vault-gold focus:outline-none focus:border-vault-gold shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all uppercase" placeholder={maxLen === 2 ? "--" : "-"} maxLength={maxLen} />
      </div>
    );
  };

  const activePlayer = youtuber || { name: "Chris Ramsey", avatar: ASSETS.CHRIS_RAMSAY_IMG, profile: "https://www.youtube.com/@ChrisRamsay52", TheBreakInThumbNail: ASSETS.CHRIS_RAMSAY_TN, TheBreakInVideo: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=75s" };
  const teamName = activePlayer.name === "Chris Ramsey" ? "Team Area 52" : `Team ${activePlayer.name.split(' ')[0]}`;
  const formatTime = (ms: number) => { const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); const s = Math.floor((ms % 60000) / 1000); const c = Math.floor((ms % 1000) / 10); return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`; };
  const savedTimeRaw = localStorage.getItem('ckxr_vigenere_timer_val');
  const savedTimeMs = savedTimeRaw ? parseInt(savedTimeRaw, 10) : 0;

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {isSyncing && <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-vault-gold border-t-transparent rounded-full animate-spin" /><span className="text-vault-gold font-display font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing...</span></div></div>}
      {showMissionsIncompleteError && <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease-out] backdrop-blur-sm"><div className="w-full max-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.2)]"><h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-6">Incomplete Strategy</h3><p className="text-vault-gold font-sans text-lg mb-10 leading-relaxed italic">"You must fill in all 14 Missions before moving forward"</p><VaultButton onClick={() => setShowMissionsIncompleteError(false)} className="w-full py-4 text-sm bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black">Acknowledge</VaultButton></div></div>}

      {promptStep === 'SPEED_LINK' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-w-md bg-vault-panel border-2 border-vault-gold p-10 rounded-3xl text-center shadow-2xl relative">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-6">Code Cracking Speed Link</h3>
            <p className="text-white font-sans text-lg mb-10 leading-relaxed italic">{savedTimeMs > 0 ? `Previous sequence detected at ${formatTime(savedTimeMs)}. Ready to resume?` : `Compete with friends on how fast you can crack the Matrix!`}</p>
            <div className="flex flex-col gap-4">
              <VaultButton onClick={() => handleAction(() => setPromptStep('TRAINING'))} className="py-4 text-xl">YES</VaultButton>
              <VaultButton variant="secondary" onClick={() => handleAction(() => { setPromptStep('NONE'); onNavigateToVigenere(false); })} className="py-4 text-xl border-2">NO</VaultButton>
            </div>
          </div>
        </div>
      )}

      {promptStep === 'TRAINING' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-md bg-vault-panel border-2 border-vault-gold p-10 rounded-3xl text-center shadow-2xl relative">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-6">Training Protocol</h3>
            <p className="text-vault-alert font-display font-black uppercase text-base mb-6 animate-blink text-center">Understand how to use the Vigenere Matrix FIRST</p>
            <a href="https://youtu.be/K2b_2RO385Y" target="_blank" rel="noopener noreferrer" onClick={() => setHasWatchedVideo(true)} className="group relative w-full max-w-[280px] aspect-video rounded-xl border-2 border-vault-gold overflow-hidden shadow-2xl mx-auto mb-10 block transition-transform hover:scale-105">
              <img src="https://i.ibb.co/kVnDMcZQ/You-Tube-Laser-Door.jpg" alt="Tutorial" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-12 h-12 bg-vault-gold text-black rounded-full flex items-center justify-center shadow-xl"><svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg></div></div>
            </a>
            <div className="flex flex-col gap-4">
              <VaultButton onClick={() => { if (!hasWatchedVideo) { window.open("https://youtu.be/K2b_2RO385Y", "_blank"); setHasWatchedVideo(true); } else { handleAction(() => { onNavigateToVigenere(true); setPromptStep('NONE'); }); } }} className="py-4 text-xl">{hasWatchedVideo ? "YES, START" : "YES, WATCH"}</VaultButton>
              <VaultButton variant="secondary" onClick={() => handleAction(() => { onNavigateToVigenere(true); setPromptStep('NONE'); })} className="py-4 text-xl border-2">NO! SKIP TRAINING</VaultButton>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 h-24 md:h-32 items-center">
        <button onClick={() => handleAction(onNavigateToLevel2BreakIn)} className="focus:outline-none hover:scale-105 transition-transform duration-300"><img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" /></button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-5xl flex-1">
        <div className="flex flex-col items-center justify-center mb-8 animate-[fadeInUp_0.6s_ease-out]">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div onClick={() => handleAction(() => window.open(activePlayer.profile, '_blank'))} className="relative group transition-transform duration-300 hover:scale-105 cursor-pointer"><div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-vault-gold overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.5)]"><img src={activePlayer.avatar} alt={activePlayer.name} className="w-full h-full object-cover" /></div></div>
            <div className="text-center md:text-left"><h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-vault-gold uppercase tracking-widest drop-shadow-md">{activePlayer.name}</h2><p className="text-vault-alert font-display text-xl md:text-2xl uppercase tracking-[0.4em] mt-4 font-bold">{teamName}</p></div>
          </div>
        </div>

        <div className="bg-vault-panel/85 backdrop-blur-2xl border border-vault-gold/30 p-8 md:p-12 rounded-3xl shadow-2xl mb-12">
          <h3 className="text-3xl font-display font-black text-vault-gold uppercase tracking-widest text-center md:text-left border-b-2 border-vault-gold/20 pb-6 mb-12">14 Missions</h3>
          <div className="flex lg:hidden flex-col gap-8">{MISSIONS.map((item, idx) => renderItem(item, idx))}</div>
          <div className="hidden lg:grid lg:grid-cols-2 gap-x-20 gap-y-10">
            <div className="flex flex-col gap-10">{MISSIONS.slice(0, 7).map((item, idx) => renderItem(item, idx))}</div>
            <div className="flex flex-col gap-10">{MISSIONS.slice(7, 14).map((item, idx) => renderItem(item, idx + 7))}</div>
          </div>
        </div>

        <div className="bg-vault-panel/80 backdrop-blur-xl border border-vault-gold/20 p-8 md:p-12 rounded-2xl shadow-2xl mb-16">
          <div className="space-y-6">
            <label className="block text-2xl font-display font-bold text-vault-gold uppercase tracking-widest">Solve the Keyword riddle</label>
            <input type="text" value={keywordRiddleAnswer} onChange={(e) => setKeywordRiddleAnswer(e.target.value)} placeholder="Enter your solution..." className="w-full bg-black/60 border-2 border-vault-gold/40 rounded-xl px-6 h-16 font-mono text-xl text-white focus:outline-none focus:border-vault-gold shadow-inner transition-colors" />
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8">
            <VaultButton onClick={() => handleAction(() => window.open(activePlayer.TheBreakInVideo, '_blank'))} className="w-full max-sm py-5 text-xl">Submit Answer on YouTube</VaultButton>
            <VaultButton variant="secondary" onClick={handleVerifyRiddle} className="w-full max-sm py-5 text-xl border-2">Verify the Riddle</VaultButton>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-12 mb-24 relative z-50">
           <VaultButton variant="secondary" onClick={() => handleAction(onNavigateToPlayers)} className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2">List of Game Players</VaultButton>
           <VaultButton variant="secondary" onClick={() => handleAction(onNavigateToLeaderBoard)} className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2">Leader Board</VaultButton>
        </div>
      </div>
      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto"><p className="font-display text-xs text-white uppercase tracking-widest opacity-40">&copy; 2026 CODE KRACKER XR</p></div>
    </div>
  );
};
