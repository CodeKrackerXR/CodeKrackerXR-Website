import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface Level2BreakInPageProps {
  onNavigateToWheel: () => void;
  onNavigateToPlayers: () => void;
  onNavigateToLeaderBoard: () => void;
  onNavigateToHunt: () => void;
  onNavigateToVigenere: () => void;
  onNavigateToTheBreakIn: () => void;
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
}

export const Level2BreakInPage: React.FC<Level2BreakInPageProps> = ({ 
  onNavigateToWheel, 
  onNavigateToPlayers, 
  onNavigateToLeaderBoard,
  onNavigateToHunt,
  onNavigateToVigenere,
  onNavigateToTheBreakIn,
  breakInAnswers, 
  setBreakInAnswers,
  keywordRiddleAnswer,
  setKeywordRiddleAnswer,
  youtuber
}) => {

  const activePlayer = youtuber || {
    name: "Chris Ramsey",
    avatar: ASSETS.CHRIS_RAMSAY_IMG,
    profile: "https://www.youtube.com/@ChrisRamsay52",
    TheBreakInThumbNail: ASSETS.CHRIS_RAMSAY_TN,
    TheBreakInVideo: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=75s"
  };

  const teamName = activePlayer.name === "Chris Ramsey" ? "Team Area 52" : `Team ${activePlayer.name.split(' ')[0]}`;
  
  const hasBreakInVideo = activePlayer.TheBreakInVideo && activePlayer.TheBreakInThumbNail;

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Navigation Header */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onNavigateToHunt} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl flex-1">
        
        <div className={`flex flex-col lg:flex-row items-center ${hasBreakInVideo ? 'justify-between' : 'justify-center'} gap-12 mb-16 animate-[fadeInUp_0.6s_ease-out]`}>
          <div className={`flex flex-col md:flex-row items-center gap-8 ${!hasBreakInVideo ? 'text-center' : ''}`}>
            <a href={activePlayer.profile} target="_blank" rel="noopener noreferrer" className="relative group transition-transform duration-300 hover:scale-105">
              <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 border-vault-gold overflow-hidden shadow-[0_0_40px_rgba(212,175,55,0.5)]">
                <img src={activePlayer.avatar} alt={activePlayer.name} className="w-full h-full object-cover" />
              </div>
            </a>
            <div className="text-center md:text-left">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-black text-vault-gold uppercase tracking-widest drop-shadow-md">{activePlayer.name}</h2>
              <p className="text-vault-alert font-display text-xl md:text-2xl uppercase tracking-[0.4em] mt-4 font-bold">{teamName}</p>
            </div>
          </div>

          {/* Conditional Rendering for Video Section */}
          {hasBreakInVideo && (
            <a href={activePlayer.TheBreakInVideo} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center group">
              <div className="relative w-80 aspect-video border-4 border-vault-gold rounded-lg overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]">
                <img src={activePlayer.TheBreakInThumbNail} alt="Watch The Break-In" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                   <div className="w-12 h-12 bg-vault-gold text-black rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                   </div>
                </div>
              </div>
            </a>
          )}
        </div>

        <div className="bg-vault-panel/80 backdrop-blur-xl border border-vault-gold/20 p-8 md:p-12 rounded-2xl shadow-2xl mb-16">
          <div className="space-y-6">
            <label className="block text-2xl font-display font-bold text-vault-gold uppercase tracking-widest">Solve riddle to unlock Level 2</label>
            <input 
              type="text"
              value={keywordRiddleAnswer} 
              onChange={(e) => setKeywordRiddleAnswer(e.target.value)} 
              placeholder="Enter your solution..." 
              className="w-full bg-black/60 border-2 border-vault-gold/40 rounded-xl px-6 h-16 font-mono text-xl text-white focus:outline-none focus:border-vault-gold shadow-inner transition-colors" 
            />
          </div>
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8">
            <VaultButton onClick={onNavigateToTheBreakIn} className="w-full max-sm py-5 text-xl">Unlock Level 2</VaultButton>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center gap-6 mt-12 mb-24 relative z-50">
           <VaultButton 
             variant="secondary" 
             onClick={onNavigateToPlayers} 
             className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
           >
             List of Game Players
           </VaultButton>
           <VaultButton 
             variant="secondary" 
             onClick={onNavigateToLeaderBoard} 
             className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
           >
             Leader Board
           </VaultButton>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 scanline"></div>
    </div>
  );
};