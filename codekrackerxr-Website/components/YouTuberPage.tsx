
import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface YouTuberPageProps {
  onBack: () => void;
  onNavigateToCipher: () => void;
}

export const YouTuberPage: React.FC<YouTuberPageProps> = ({ onBack, onNavigateToCipher }) => {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
       {/* Background Image (Cube) */}
       <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5
        }}
      />
      
      {/* Dark Gradient Overlay for readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/90 via-black/50 to-black/90 pointer-events-none" />
      
      {/* Header Logo - Matching Homepage style (Absolute positioned for same layout) */}
      <div className="absolute top-0 left-0 w-full z-30 pointer-events-auto flex justify-center">
          <button 
            onClick={onBack}
            className="focus:outline-none hover:scale-105 transition-transform duration-300 active:scale-95"
            aria-label="Back to Home"
          >
            <img 
              src={ASSETS.LANDING_BANNER} 
              alt="CodeKrackerXR Logo" 
              className="w-full h-auto object-contain max-h-32 md:max-h-48"
            />
          </button>
      </div>

      {/* Main Content - Reduced top padding by 50% (pt-44 -> pt-22, md:pt-[20rem] -> md:pt-[10rem]) */}
      <div className="relative z-10 container mx-auto px-6 flex-1 flex flex-col items-center justify-start pt-24 md:pt-[10rem] pb-12 md:pb-20 animate-[fadeInUp_0.8s_ease-out_forwards]">
         
         {/* Top Yellow Bordered Box */}
         <div className="max-w-5xl w-full bg-vault-panel/80 backdrop-blur-xl border-2 border-vault-gold p-8 md:p-16 rounded-xl shadow-[0_0_80px_rgba(212,175,55,0.15)] flex flex-col items-center text-center mb-16">
            
            <h1 className="font-display font-black text-4xl md:text-6xl text-white mb-10 tracking-wide uppercase drop-shadow-md">
              The Viral <span className="text-vault-gold">Loop</span>
            </h1>

            <div className="space-y-8 font-light text-lg md:text-2xl text-gray-200 leading-relaxed max-w-4xl">
                <p>
                  At <span className="text-vault-gold font-bold">CodeKrackerXR</span>, we’ve built a viral loop designed to accelerate channel growth—giving creators the potential to double their subscriber base through a never-before-seen interactive game.
                </p>
                <p>
                  Your audience doesn’t just watch—they play with you for a chance to win the final prize. This has never been done before.
                </p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-vault-gold/50 to-transparent my-12"></div>

            <div className="flex flex-col items-center gap-8">
                <p className="font-display text-xl md:text-2xl text-vault-gold uppercase tracking-widest font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight">
                   Want to see the <span className="text-white">VAULT</span> in <br /> Silicon Valley?
                </p>
                
                <VaultButton 
                    onClick={() => window.open('https://calendar.google.com', '_blank')}
                    className="text-lg px-12 py-5"
                >
                   Book a call with US
                </VaultButton>
            </div>

         </div>

         {/* New Cryptex Section */}
         <div className="flex flex-col items-center text-center animate-[fadeIn_1s_ease-out_0.5s_forwards] max-w-4xl w-full">
            {/* Image Container */}
            <div className="w-full max-w-lg mb-8 relative p-2 flex items-center justify-center">
              
              {/* Glow Image - Behind & Animated */}
              <img 
                src={ASSETS.CRYPTEX_GLOW}
                alt=""
                className="absolute inset-0 w-full h-full object-contain z-0 animate-pulse mix-blend-screen"
                style={{ animationDuration: '3s' }}
              />
              
              {/* Main Cryptex Image - Front */}
              <img 
                src={ASSETS.CRYPTEX_IMG} 
                alt="Cryptex Center" 
                className="relative z-10 w-full h-auto object-contain drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Bold White Text */}
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white uppercase tracking-widest mb-10 drop-shadow-lg">
              Step into our Code Cipher App.
            </h2>

            {/* CTA Button */}
            <VaultButton 
              onClick={onNavigateToCipher}
              className="text-lg px-10 py-4"
            >
              See it in action
            </VaultButton>
         </div>

      </div>
      
      {/* Footer */}
      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/40">
        <p className="font-display text-sm text-white uppercase tracking-widest">
           &copy; 2026 CODE KRACKER XR
        </p>
      </div>

      {/* Scanline Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-10 scanline"></div>
    </div>
  );
};
