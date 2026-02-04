import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface GameRulesPageProps {
  onBack: () => void;
  onNavigateToPlayers: () => void;
}

export const GameRulesPage: React.FC<GameRulesPageProps> = ({ onBack, onNavigateToPlayers }) => {
  const rules = [
    {
      title: "No Purchase Necessary",
      content: "This is a free contest. No payment or purchase is required to enter or win. Paying for expedited tools is strictly prohibited to ensure a fair \"Game of Skill\" for all participants."
    },
    {
      title: "Skill-Based Competition",
      content: "This is not a lottery. Winners are selected based purely on objective skill, speed, and accuracy in solving riddles and ciphers."
    },
    {
      title: "Selection Process",
      content: "Semi-finalists are determined by the earliest timestamp of valid, correct submissions received by our server. In the event of a tie at the exact same millisecond, a secondary skill-based tie-breaker (such as a complex math or trivia question) will be administered."
    },
    {
      title: "YouTube Disclaimer",
      content: "This contest is in no way sponsored, endorsed, administered by, or associated with YouTube. By participating, you agree to a complete release of YouTube from any and all liability."
    },
    {
      title: "Eligibility",
      content: "Participants must adhere to the official YouTube Community Guidelines. Failure to do so will result in immediate disqualification."
    },
    {
      title: "Prizes & Taxes",
      content: "The 20 semi-finalists will receive an all-expenses-paid trip to the physical final challenge. Winners are solely responsible for all federal, state, and local taxes associated with prize receipt."
    },
    {
      title: "No Metric Manipulation",
      content: "Entries are not tied to likes, subscriptions, or comments. Participants must use the official web app for entry."
    }
  ];

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
          onClick={onBack} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
          aria-label="Back"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl flex flex-col items-center flex-1">
        {/* Centered Headline */}
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-12 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          Game<span className="text-white">Rules</span>
        </h1>

        <div className="w-full bg-vault-panel/60 backdrop-blur-xl border-2 border-vault-gold/20 rounded-3xl p-8 md:p-12 mb-16 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] opacity-0 shadow-2xl">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-10 border-b border-vault-gold/20 pb-4">
            Official Contest Rules
          </h2>

          <div className="space-y-10">
            {rules.map((rule, index) => (
              <div key={index} className="group border-l-2 border-vault-gold/20 pl-6 hover:border-vault-gold transition-colors duration-300">
                <h3 className="font-display font-black text-xl md:text-2xl text-vault-gold uppercase tracking-widest mb-3 group-hover:translate-x-1 transition-transform">
                  {rule.title}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed font-sans">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center gap-6 mt-4 mb-24 relative z-50 w-full max-w-md">
           <VaultButton 
             variant="primary" 
             onClick={onBack} 
             className="w-full px-16 py-6 text-xl tracking-[0.3em] shadow-xl"
           >
             Accept & Return
           </VaultButton>
           <VaultButton 
             variant="secondary" 
             onClick={onNavigateToPlayers} 
             className="w-full px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
           >
             View Players
           </VaultButton>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | LEGAL & COMPLIANCE CORE
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};