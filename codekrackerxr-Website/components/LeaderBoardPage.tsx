import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS, YOUTUBE_DATA } from '../constants';
import { VaultButton } from './VaultButton';

interface LeaderBoardPageProps {
  onNavigateToBreakIn: (index?: number) => void;
  onNavigateToPlayers: () => void;
}

const SUBMISSION_STATS_DOC = '2SoxEAMBdREAunS4QPCa';

const timeToSeconds = (timeStr: string) => {
  const match = timeStr.match(/(\d+) minutes and (\d+) seconds/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
};

export const LeaderBoardPage: React.FC<LeaderBoardPageProps> = ({ onNavigateToBreakIn, onNavigateToPlayers }) => {
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const statsRef = doc(db, 'Submissions', SUBMISSION_STATS_DOC);
        const snapshot = await getDoc(statsRef);
        
        if (snapshot.exists() && snapshot.data()?.leaderboards) {
          // Use the central field from your Submissions doc
          setLiveLeaderboard(snapshot.data().leaderboards);
        } else {
          // Fallback to constants if the aggregate doc hasn't been populated yet
          const initialData = YOUTUBE_DATA.map((youtuber, index) => ({
            ...youtuber,
            time: "47 minutes and 12 seconds", // placeholder
            originalIndex: index,
            totalSeconds: 2832
          }));
          setLiveLeaderboard(initialData);
        }
      } catch (err) {
        console.warn("Global stats retrieval delayed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStats();
  }, []);

  const renderResponsiveTime = (timeStr: string) => {
    const parts = timeStr.split(' and ');
    if (parts.length === 2) {
      return (
        <>
          {parts[0]} <span className="hidden md:inline">and </span>{parts[1]}
        </>
      );
    }
    return timeStr;
  };

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
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

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button 
          onClick={() => onNavigateToBreakIn()} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
          aria-label="Back to The Hunt"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl flex flex-col items-center flex-1">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          Leader<span className="text-white">Board</span>
        </h1>

        <div className="w-full">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-10 animate-[fadeIn_1s_ease-out_0.2s_forwards] opacity-0">
            Current Rankings
          </h2>

          <div className="flex flex-col gap-4 mb-20">
            {liveLeaderboard.map((youtuber, index) => {
              const teamName = youtuber.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber.name.split(' ')[0]}`;
              const isFirst = index === 0;
              
              return (
                <div 
                  key={youtuber.originalIndex || index} 
                  onClick={() => onNavigateToBreakIn(youtuber.originalIndex)}
                  className={`flex flex-col md:flex-row items-center justify-between gap-6 p-4 md:p-5 bg-vault-panel/40 backdrop-blur-md border border-white/5 rounded-2xl transition-all duration-300 group shadow-xl animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0 cursor-pointer ${
                    isFirst ? 'border-green-500/30 bg-green-950/10' : 'hover:border-vault-gold/40 hover:bg-vault-panel/60'
                  }`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="flex-shrink-0 flex items-center gap-6">
                      <span className={`font-display font-black text-4xl md:text-5xl w-12 text-center drop-shadow-lg transition-colors duration-300 ${
                        isFirst 
                        ? 'text-green-500 group-hover:text-white' 
                        : 'text-vault-gold group-hover:text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <div className={`w-16 h-16 md:w-24 md:h-24 aspect-square flex-shrink-0 rounded-full border-2 p-0.5 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all ${isFirst ? 'border-green-500' : 'border-vault-gold'}`}>
                        <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover rounded-full" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between flex-1 gap-2">
                      <div className="flex flex-col text-left">
                        <h3 className={`font-display font-black text-xl md:text-2xl uppercase tracking-wider transition-colors ${
                          isFirst ? 'text-green-400 group-hover:text-green-300' : 'text-white group-hover:text-vault-gold'
                        }`}>
                          {youtuber.name}
                        </h3>
                        <p className={`font-display font-bold text-sm md:text-base uppercase tracking-widest mt-0.5 ${
                          isFirst ? 'text-green-600/80' : 'text-vault-alert'
                        }`}>
                          {teamName}
                        </p>
                      </div>
                      <div className="md:text-right">
                        <span className={`font-display font-black text-xl md:text-2xl uppercase tracking-widest ${
                          isFirst ? 'text-green-400' : 'text-white'
                        }`}>
                          {renderResponsiveTime(youtuber.time || "Pending...")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
               onClick={() => onNavigateToBreakIn()} 
               className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
             >
               Back to The Game
             </VaultButton>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};