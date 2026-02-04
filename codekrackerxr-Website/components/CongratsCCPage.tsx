import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface CongratsCCPageProps {
  onBackToPlayers: () => void;
  onNavigateToCoin: () => void;
  finalTime?: string | null;
}

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

export const CongratsCCPage: React.FC<CongratsCCPageProps> = ({ 
  onBackToPlayers,
  onNavigateToCoin,
  finalTime
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [socials, setSocials] = useState<any>({});
  const [agentName, setAgentName] = useState<string>('');
  const [digitalCoinValue, setDigitalCoinValue] = useState('$5,000');

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

        const creatorRef = doc(db, 'creators', 'MasterCreatorFolder');
        const creatorSnap = await getDoc(creatorRef);
        if (creatorSnap.exists()) {
          const val = creatorSnap.data()?.DigitalCoin?.TheCoin?.DigitalCoilValue;
          if (val && val.trim() !== '') {
            setDigitalCoinValue(val);
          }
        }
      } catch (err) {
        console.warn("Data retrieval failed:", err);
      }
    };
    fetchUserData();
  }, []);

  const shareableSocials = SOCIAL_PLATFORMS.filter(p => !!socials[p.id]);

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBackToPlayers} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl flex flex-col items-center flex-1">
        <h1 className="text-[clamp(1rem,6vw,5.5rem)] leading-none font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-2 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-pulse whitespace-nowrap w-full">
          Congratulations
        </h1>

        {agentName && (
          <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-[0.3em] mb-6 text-center animate-[fadeIn_1s_ease-out] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] w-full">
            {agentName}
          </h2>
        )}

        <div className="flex flex-col items-center mb-8 w-full text-center">
          <h2 className="text-[clamp(0.85rem,2.1vw,1.8rem)] font-display font-bold uppercase tracking-[0.2em] text-center whitespace-nowrap w-full">
            <span className="text-[#22c55e]">Code Secured:</span> <span className="text-vault-alert">Entry Verified</span>
          </h2>
          
          {finalTime && (
            <div className="mt-6 flex flex-col items-center gap-1 animate-[fadeIn_1s_ease-out_0.5s_forwards] opacity-0 w-full">
              <span className="text-[11px] font-display text-white uppercase tracking-[0.4em] font-black mb-1">Caesar Cipher Time</span>
              <span className="text-4xl md:text-6xl font-mono font-light text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] tabular-nums tracking-normal">
                {finalTime}
              </span>
              
              <div className="mt-8 flex flex-col items-center gap-4 animate-fadeInUp w-full px-4">
                <p className="text-vault-gold font-display font-black text-lg md:text-2xl uppercase tracking-widest animate-blink drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] text-center max-w-xl mx-auto leading-tight">
                  I Cracked Caesar Cipher!<br />
                  <span className="text-white text-base md:text-xl opacity-80">Share with friends</span>
                </p>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all group active:scale-90 shadow-lg mx-auto"
                >
                  <svg className="w-8 h-8 text-white group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
            </div>
          )}

          {!finalTime && (
             <div className="mt-12 flex flex-col items-center gap-4 animate-fadeInUp w-full px-4">
                <p className="text-vault-gold font-display font-black text-lg md:text-2xl uppercase tracking-widest animate-blink drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] text-center max-w-xl mx-auto leading-tight">
                   I Cracked Caesar Cipher!<br />
                   <span className="text-white text-base md:text-xl opacity-80">Share with friends</span>
                </p>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all group active:scale-90 shadow-lg mx-auto"
                >
                  <svg className="w-8 h-8 text-white group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
              </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-10 max-w-4xl mt-4">
          <button 
            onClick={onNavigateToCoin}
            className="w-full bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-2xl p-10 md:p-16 flex flex-col items-center animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] opacity-0 shadow-2xl group hover:border-vault-gold transition-all active:scale-95"
          >
              <h2 className="text-4xl md:text-7xl font-display font-black text-vault-alert uppercase tracking-tighter border-4 md:border-8 border-vault-gold px-8 md:px-16 py-4 md:py-8 rounded-2xl animate-bounce shadow-[0_0_50px_rgba(212,175,55,0.3)] text-center group-hover:scale-110 transition-transform">
                BONUS!
              </h2>
              <p className="text-xl md:text-4xl font-display font-bold text-white uppercase tracking-[0.4em] mt-12 text-center leading-tight group-hover:text-vault-gold">
                Claim the Digital Commemorative Coin
              </p>
              
              <div className="mt-8 flex flex-col items-center gap-1">
                <span className="text-5xl md:text-8xl font-display font-bold text-[#22c55e] drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                  {digitalCoinValue}
                </span>
                <span className="text-lg md:text-2xl font-display font-bold text-white uppercase tracking-[0.3em]">
                  Digital Coin
                </span>
              </div>
          </button>
        </div>

        <div className="mt-16 mb-24 relative z-50">
           <VaultButton 
             variant="secondary" 
             onClick={onBackToPlayers} 
             className="px-24 py-8 text-2xl tracking-[0.4em] bg-black/40 shadow-xl border-2"
           >
             Return to Challenges
           </VaultButton>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-lg bg-vault-panel border-2 border-vault-gold rounded-3xl p-8 md:p-10 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-2 text-center">Share Victory</h3>
            <p className="text-white/60 font-display text-[10px] uppercase tracking-[0.4em] mb-8 text-center border-b border-white/10 pb-4">Deployment Channel Verified</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              {shareableSocials.length > 0 ? (
                shareableSocials.map((platform) => (
                  <button 
                    key={platform.id}
                    onClick={() => {
                      const link = socials[platform.id];
                      if (link) window.open(link, '_blank');
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-black/60 border border-white/10 rounded-xl hover:border-vault-gold hover:bg-vault-gold/10 transition-all group"
                  >
                    <span className="text-[10px] font-display font-black uppercase text-white/40 group-hover:text-vault-gold tracking-widest">{platform.label}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center bg-black/40 rounded-xl border border-dashed border-white/10">
                  <p className="text-vault-alert font-display font-black uppercase text-[10px] tracking-widest">No social channels linked</p>
                  <p className="text-white/40 text-[9px] mt-2 px-6 italic font-sans leading-relaxed">Agent, update your dossier socials in the profile module to enable external deployment.</p>
                </div>
              )}
            </div>

            <VaultButton onClick={() => setIsShareModalOpen(false)} className="w-full py-4 text-sm">Close Link</VaultButton>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline"></div>
          </div>
        </div>
      )}

      <div className="relative z-20 w-full py-10 text-center border-t border-white/10 bg-black/80 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | COMMEMORATIVE ASSET CORE
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
