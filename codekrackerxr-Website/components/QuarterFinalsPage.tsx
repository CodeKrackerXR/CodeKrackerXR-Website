import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, auth } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface QuarterFinalsPageProps {
  onNavigateToPlayers: () => void;
  gpsNorth: string;
  gpsWest: string;
  youtuber?: {
    name: string;
    avatar: string;
  };
  vigenereFinalTime?: string | null;
}

const CREATOR_DOC_ID = 'MasterCreatorFolder';

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'discord', label: 'Discord' },
  { id: 'meta', label: 'Meta' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'wechat', label: 'WeChat China' },
  { id: 'whatsapp', label: 'WhatsApp' }
];

export const QuarterFinalsPage: React.FC<QuarterFinalsPageProps> = ({ 
  onNavigateToPlayers, 
  gpsNorth, 
  gpsWest,
  youtuber,
  vigenereFinalTime
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [socials, setSocials] = useState<any>({});
  const [agentName, setAgentName] = useState<string>('');

  const displayNorth = "37° 55’19.6”";
  const displayWest = "121°55’38”";

  useEffect(() => {
    const fetchUserData = async () => {
      const targetUid = auth.currentUser?.uid || '51H7yItLU9WMMiXl10xE';
      try {
        const userRef = doc(db, 'Users', targetUid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const sm = data?.["Level 1"]?.["Social Media"] || data?.socials || {};
          const name = data?.["Level 1"]?.displayName || data?.displayName || '';
          setSocials(sm);
          setAgentName(name);
        }
      } catch (err) {
        console.warn("User data retrieval failed:", err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const finalizeSubmission = async () => {
      const targetUid = auth.currentUser?.uid || '51H7yItLU9WMMiXl10xE';
      setIsSubmitting(true);
      try {
        const submissionId = `${targetUid}_${CREATOR_DOC_ID}`;
        await setDoc(doc(db, 'Submissions', submissionId), {
          breakInSolvedAt: serverTimestamp(),
          vigenereTime: vigenereFinalTime || "NO_TIME_RECORDED",
          breakInVerified: true,
          gpsVerified: true,
          status: 'QUALIFIED'
        }, { merge: true });

        await updateDoc(doc(db, 'Users', targetUid), {
          clearanceLevel: 3,
          "Level 3.finalistStatus": "QUALIFIED",
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Final status handshake failure:", err);
      } finally {
        setIsSubmitting(false);
      }
    };
    finalizeSubmission();
  }, [vigenereFinalTime]);

  const activeYoutuber = youtuber || { name: "Chris Ramsey", avatar: ASSETS.CHRIS_RAMSAY_IMG };
  const teamName = activeYoutuber.name === "Chris Ramsey" ? "Team Area 52" : `Team ${activeYoutuber.name.split(' ')[0]}`;
  const shareableSocials = SOCIAL_PLATFORMS.filter(p => !!socials[p.id]);

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onNavigateToPlayers} className="focus:outline-none hover:scale-105 transition-transform duration-300"><img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" /></button>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-[1600px] flex flex-col items-center flex-1">
        <h1 className="text-[clamp(1rem,6vw,5.5rem)] font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-2 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-pulse whitespace-nowrap w-full">Congratulations</h1>
        {agentName && <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-[0.3em] mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] w-full">{agentName}</h2>}

        <div className="flex flex-col items-center mb-8 w-full text-center">
          <h2 className="text-[clamp(0.85rem,2.1vw,1.8rem)] font-display font-bold uppercase tracking-[0.2em] mb-6 text-center w-full flex flex-col md:flex-row items-center justify-center gap-1 md:gap-0"><span className="text-[#22c55e] whitespace-nowrap">Target Secured:</span> <span className="text-vault-alert whitespace-nowrap md:ml-2">Quarter-Finals Entry Verified</span></h2>
          <h3 className="text-[clamp(0.7rem,4.2vw,3.85rem)] font-display font-black text-vault-gold uppercase tracking-[0.15em] mb-3 text-center whitespace-nowrap w-full drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">Vault Location Secured</h3>
          {vigenereFinalTime && <div className="flex flex-col items-center mb-6"><span className="text-[11px] font-display text-white uppercase tracking-[0.4em] font-black mb-1">Matrix Solve Time</span><span className="text-3xl md:text-5xl font-mono font-light text-vault-gold">{vigenereFinalTime}</span></div>}

          <div className="flex flex-col items-center gap-4 mb-12 w-full px-4"><p className="text-vault-gold font-display font-black text-lg md:text-2xl uppercase tracking-widest animate-blink text-center">I Cracked Vigeneré Cipher!<br /><span className="text-white text-base md:text-xl opacity-80">Share with friends</span></p><button onClick={() => setIsShareModalOpen(true)} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all group active:scale-90 shadow-lg mx-auto"><svg className="w-8 h-8 text-white group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg></button></div>
          <p className="text-xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-12 text-center">Use the coordinates below for extraction</p>

          <div className="flex items-center gap-6 md:gap-10 mb-16"><div className="w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-vault-gold overflow-hidden shadow-[0_0_25px_#d4af37]"><img src={activeYoutuber.avatar} alt={activeYoutuber.name} className="w-full h-full object-cover" /></div><div className="flex flex-col items-center"><h3 className="text-2xl md:text-5xl font-display font-black text-vault-gold uppercase tracking-wider">{activeYoutuber.name}</h3><p className="text-vault-alert font-display font-bold text-lg md:text-2xl uppercase tracking-[0.2em]">{teamName}</p></div></div>

          <div className="w-full lg:w-[70%] lg:mx-auto bg-vault-panel/60 border border-vault-gold/20 rounded-2xl p-8 md:p-12 mb-10"><div className="w-full bg-black/80 border-2 border-vault-gold/30 rounded py-8 font-display text-[16px] md:text-[26px] text-center uppercase text-vault-gold flex flex-col md:flex-row items-center justify-center gap-2">{displayNorth} <span className="text-white ml-2">North</span> <span className="hidden md:inline mx-10 opacity-30 text-white">|</span> {displayWest} <span className="text-white ml-2">West</span></div></div>
          <div className="w-full bg-vault-panel/60 border border-vault-gold/20 rounded-2xl p-10 flex flex-col items-center shadow-2xl"><h2 className="text-6xl md:text-9xl font-display font-black text-vault-alert uppercase tracking-tighter border-4 border-vault-gold px-10 py-6 rounded-2xl animate-bounce shadow-[0_0_50px_rgba(212,175,55,0.3)]">BONUS!</h2><p className="text-2xl md:text-5xl font-display font-bold text-white uppercase tracking-[0.4em] mt-12 text-center">Go find the commemorative coin</p></div>

          <div className="mt-16 mb-24 w-full flex justify-center"><VaultButton variant="secondary" onClick={onNavigateToPlayers} className="px-24 py-8 text-2xl tracking-[0.4em] bg-black/40 shadow-xl border-2">Return to Game Players</VaultButton></div>
        </div>
      </div>

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-lg bg-vault-panel border-2 border-vault-gold rounded-3xl p-8 relative overflow-hidden"><h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-2 text-center">Share Intel</h3><p className="text-white/60 font-display text-[10px] uppercase tracking-[0.4em] mb-8 text-center border-b border-white/10 pb-4">Select Deployment Channel</p><div className="grid grid-cols-2 gap-4 mb-10">{shareableSocials.length > 0 ? shareableSocials.map((platform) => (<button key={platform.id} onClick={() => { const link = socials[platform.id]; if (link) window.open(link, '_blank'); }} className="flex flex-col items-center justify-center p-4 bg-black/60 border border-white/10 rounded-xl hover:border-vault-gold hover:bg-vault-gold/10 transition-all group"><span className="text-[10px] font-display font-black uppercase text-white/40 group-hover:text-vault-gold tracking-widest">{platform.label}</span></button>)) : <div className="col-span-2 py-8 text-center bg-black/40 rounded-xl border border-dashed border-white/10"><p className="text-vault-alert font-display font-black uppercase text-[10px] tracking-widest">No social channels linked</p></div>}</div><VaultButton onClick={() => setIsShareModalOpen(false)} className="w-full py-4 text-sm">Close Link</VaultButton></div>
        </div>
      )}
      <div className="relative z-20 w-full py-10 text-center border-t border-white/10 bg-black/60 mt-auto"><p className="font-display text-xs text-white uppercase tracking-widest opacity-40">&copy; 2026 CODE KRACKER XR</p></div>
    </div>
  );
};
