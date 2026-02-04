
import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface HowToPlayGameProps {
  onBack: () => void;
  onNavigateToPlayers: () => void;
}

export const HowToPlayGame: React.FC<HowToPlayGameProps> = ({ onBack, onNavigateToPlayers }) => {
  const steps = [
    {
      step: "Step 1",
      title: "Watch \"The Hunt\" (Part 1)",
      body: "Follow your favorite YouTuber as they track down 7 tools and 3 artifacts hidden across the country. During the video, collect 7 hidden letters."
    },
    {
      step: "Step 2",
      title: "Crack the City Code",
      body: "Find the Shift Key (look for the \"Ring\" artifact and check the YouTube comments for the final clue). Use the Caesar Cipher on our web app to decrypt the letters and reveal the Target City where the vault is hidden."
    },
    {
      step: "Step 3",
      title: "Join \"The Break-In\" (Part 2)",
      body: "As the YouTuber tackles the 14 missions to breach the vault, you must collect 21 specific coded characters revealed during the gameplay."
    },
    {
      step: "Step 4",
      title: "The Sponsor Secret",
      body: "To unlock the final prize, you need the Keyword. Pay close attention to the sponsor’s ad read—they will announce the riddle or keyword (e.g., \"RAMSEY\") required to solve the final Vigenère Cipher."
    },
    {
      step: "Step 5",
      title: "GPS & Entry",
      body: "Plug your 21 characters and the sponsor keyword into our Decipher Tool. If correct, you’ll receive the exact GPS coordinates of the vault and your official entry into the Quarter-Finals."
    },
    {
      step: "Step 6",
      title: "The Live Sprint",
      body: "All pre-qualified players will be alerted to a National Final Riddle released at a synchronized time. The fastest to solve it will win an all-expenses-paid trip to compete in the live grand finale."
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
          aria-label="Back to The Hunt"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-[1600px] flex flex-col items-center flex-1">
        {/* Centered Headline */}
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-8 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          How to <span className="text-white">Play</span>
        </h1>

        <div className="text-center mb-12 animate-[fadeIn_1s_ease-out_0.2s_forwards] opacity-0 max-w-4xl px-4">
          <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-4">The CodeX Challenge</h2>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-sans">
            Is a first-of-its-kind interactive treasure hunt. You don’t just watch the action—you join it. Follow these steps to secure your chance at the grand prize.
          </p>
        </div>

        {/* Steps Stack - Vertical and Dynamic Fitting */}
        <div className="w-full flex flex-col gap-8 mb-20">
          {steps.map((item, index) => (
            <div 
              key={index} 
              className="w-full bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-2xl p-6 md:p-12 hover:border-vault-gold/50 transition-all duration-300 group animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0 shadow-2xl flex flex-col items-stretch"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-center gap-6 mb-8">
                <span className="font-display font-black text-3xl md:text-5xl text-vault-gold transition-transform group-hover:scale-105 duration-300 whitespace-nowrap">
                  {item.step}
                </span>
                <div className="h-px flex-1 bg-vault-gold/20 group-hover:bg-vault-gold/40 transition-colors"></div>
              </div>
              
              {/* Content Module - Headline and Body stacked vertically */}
              <div className="flex flex-col gap-6 w-full">
                <h3 className="font-display font-black text-2xl md:text-4xl text-white uppercase tracking-widest group-hover:text-vault-gold transition-colors leading-tight">
                  {item.title}
                </h3>
                <p className="font-sans text-gray-400 text-lg md:text-2xl leading-relaxed group-hover:text-gray-200 transition-colors max-w-none">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Call to Action / Navigation */}
        <div className="flex flex-col items-center gap-6 mt-4 mb-24 relative z-50 w-full max-w-xl px-4">
           <VaultButton 
             variant="primary" 
             onClick={onBack} 
             className="w-full px-16 py-6 text-xl tracking-[0.3em] shadow-xl"
           >
             Back to The Game
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

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/40 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | OPERATIONAL GUIDELINES
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
