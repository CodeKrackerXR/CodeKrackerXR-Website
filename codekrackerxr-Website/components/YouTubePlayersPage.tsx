import React from 'react';
import { ASSETS, YOUTUBE_DATA } from '../constants';
import { VaultButton } from './VaultButton';

interface YouTubePlayersPageProps {
  onNavigateToHunt: (index?: number) => void;
  onNavigateToLevel2BreakIn: (index?: number) => void;
  onNavigateToLeaderBoard: () => void;
  onNavigateToRecommended: (index: number) => void;
}

export const YouTubePlayersPage: React.FC<YouTubePlayersPageProps> = ({ 
  onNavigateToHunt, 
  onNavigateToLevel2BreakIn, 
  onNavigateToLeaderBoard,
  onNavigateToRecommended
}) => {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      {/* Background Atmosphere */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Header Logo */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button 
          onClick={() => onNavigateToHunt()} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
          aria-label="Back to The Hunt"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-[1550px] flex flex-col items-center">
        {/* Centered Headline */}
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          Code<span className="text-white">X</span> Challenge
        </h1>

        <div className="w-full">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-10 animate-[fadeIn_1s_ease-out_0.2s_forwards] opacity-0 px-2">
            List of YouTubers
          </h2>

          <div className="flex flex-col gap-6 md:gap-8 pb-12">
            {YOUTUBE_DATA.map((youtuber, index) => {
              const teamName = youtuber.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber.name.split(' ')[0]}`;
              
              // Conditional checks for each video type
              const hasHunt = youtuber.TheHuntVideo && youtuber.TheHuntThumbNail;
              const hasBreakIn = youtuber.TheBreakInVideo && youtuber.TheBreakInThumbNail;

              return (
                <div 
                  key={index} 
                  onClick={() => onNavigateToRecommended(index)}
                  className="flex flex-col md:flex-row landscape:flex-row items-center justify-between gap-4 md:gap-8 p-4 md:p-6 lg:p-8 bg-vault-panel/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-vault-gold/40 hover:bg-vault-panel/60 transition-all duration-300 group shadow-xl animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0 cursor-pointer"
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  {/* Profile Section */}
                  <div className="flex items-center gap-4 md:gap-8 lg:gap-10 w-full md:flex-1 landscape:flex-1 min-w-0">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(youtuber.profile, '_blank');
                      }}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-28 lg:h-28 xl:w-32 xl:h-32 aspect-square flex-shrink-0 rounded-full border-2 lg:border-4 border-vault-gold p-0.5 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_35px_rgba(212,175,55,0.5)] group-hover:scale-105 transition-all">
                        <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col min-w-0 text-left">
                      <h3 className="font-display font-black text-[18px] md:text-[22px] lg:text-[30px] text-white uppercase tracking-wider group-hover:text-vault-gold transition-colors truncate drop-shadow-sm">
                        {youtuber.name}
                      </h3>
                      <p className="font-display font-bold text-xs md:text-sm lg:text-base xl:text-lg text-vault-alert uppercase tracking-[0.2em] mt-1 lg:mt-2 whitespace-nowrap opacity-90">
                        {teamName}
                      </p>
                    </div>
                  </div>

                  {/* Dual Video Thumbnails Section - Individually Clickable */}
                  <div className="flex flex-row items-center gap-3 md:gap-6 lg:gap-10 w-full md:w-auto landscape:w-auto justify-between md:justify-end landscape:justify-end">
                    
                    {hasHunt && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(youtuber.TheHuntVideo, '_blank');
                          onNavigateToHunt(index);
                        }}
                        className="flex flex-col items-center gap-2 flex-1 md:flex-none max-w-[180px] lg:max-w-[240px] cursor-pointer"
                      >
                        <span className="font-display font-bold text-[16px] md:text-[20px] lg:text-[25px] text-vault-gold hover:text-white uppercase tracking-[0.1em] opacity-80 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">The Hunt</span>
                        <div className="relative w-full aspect-video rounded-lg border border-vault-gold/30 overflow-hidden hover:border-vault-gold hover:scale-105 transition-all shadow-lg">
                          <img src={youtuber.TheHuntThumbNail} alt="The Hunt Challenge" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition-colors flex items-center justify-center group-hover:bg-black/20">
                             <div className="w-6 h-6 md:w-8 md:h-10 lg:w-12 lg:h-12 bg-vault-gold/90 text-black rounded-full flex items-center justify-center transform hover:scale-110 transition-transform shadow-md">
                                <svg className="w-3 h-3 md:w-4 md:h-5 lg:w-6 lg:h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {hasBreakIn && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(youtuber.TheBreakInVideo, '_blank');
                          onNavigateToLevel2BreakIn(index);
                        }}
                        className="flex flex-col items-center gap-2 flex-1 md:flex-none max-w-[180px] lg:max-w-[240px] cursor-pointer"
                      >
                        <span className="font-display font-bold text-[16px] md:text-[20px] lg:text-[25px] text-vault-gold hover:text-white uppercase tracking-[0.1em] opacity-80 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">The Break-In</span>
                        <div className="relative w-full aspect-video rounded-lg border border-vault-gold/30 overflow-hidden hover:border-vault-gold hover:scale-105 transition-all shadow-lg">
                          <img src={youtuber.TheBreakInThumbNail} alt="The Break-In Challenge" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 hover:bg-transparent transition-colors flex items-center justify-center group-hover:bg-black/20">
                             <div className="w-6 h-6 md:w-8 md:h-10 lg:w-12 lg:h-12 bg-vault-gold/90 text-black rounded-full flex items-center justify-center transform hover:scale-110 transition-transform shadow-md">
                                <svg className="w-3 h-3 md:w-4 md:h-5 lg:w-6 lg:h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                             </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-6 mt-8 mb-24 animate-[fadeIn_1s_ease-out_1.2s_forwards] opacity-0">
             <VaultButton 
               variant="secondary" 
               onClick={onNavigateToLeaderBoard} 
               className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40"
             >
               Leader Board
             </VaultButton>
             
             <VaultButton 
               variant="secondary" 
               onClick={() => onNavigateToHunt()} 
               className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 border-2"
             >
               Back to the Game
             </VaultButton>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};