import React, { useEffect, useState, useRef } from 'react';
import { ASSETS, TEXT_CONTENT } from '../constants';
import { VaultButton } from './VaultButton';

interface LandingPageProps {
  onNavigateToYouTuber: () => void;
  onNavigateToPlayers: () => void;
}

// Component to handle scroll-based color transition for Titles
const ScrollRevealTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const domRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!domRef.current) return;
      
      const rect = domRef.current.getBoundingClientRect();
      const winH = window.innerHeight || 800;
      
      const center = winH / 2;
      const elCenter = rect.top + (rect.height / 2);
      const range = winH * 0.35 || 300; 
      
      let intensity = 0;

      if (elCenter <= center) {
        intensity = 1;
      } else {
        const dist = elCenter - center;
        intensity = 1 - (dist / range);
        const safeIntensity = isNaN(intensity) ? 0 : Math.max(0, Math.min(1, intensity));
        intensity = safeIntensity;
      }
      
      const r = 255 + Math.round((212 - 255) * intensity);
      const g = 255 + Math.round((175 - 255) * intensity);
      const b = 255 + Math.round((55 - 255) * intensity);
      
      domRef.current.style.color = `rgb(${r},${g},${b})`;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return <h3 ref={domRef} className={className} style={{ transition: 'color 0.1s linear' }}>{children}</h3>
};

const ParallaxSection: React.FC<{ 
  children: React.ReactNode; 
  direction: 'left' | 'right';
}> = ({ children, direction }) => {
  const domRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight || 800;
      const center = winH / 2;
      const elCenter = rect.top + (rect.height / 2);
      
      const dist = elCenter - center;
      const isMobile = window.innerWidth < 768;
      const intensity = isMobile ? 0.15 : 0.35; 
      
      let tx = 0;
      if (direction === 'left') {
         tx = -dist * intensity;
      } else {
         tx = dist * intensity;
      }
      
      const safeZone = 250;
      const fadeRate = 400;
      let opacity = Math.max(0, Math.min(1, 1 - (Math.abs(dist) - safeZone) / fadeRate));
      if (isNaN(opacity)) opacity = 1;

      el.style.transform = `translate3d(${isNaN(tx) ? 0 : tx}px, 0, 0)`;
      el.style.opacity = opacity.toString();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [direction]);

  return (
    <div ref={domRef} className="will-change-transform opacity-0">
      {children}
    </div>
  );
};

const FinalHeroSection: React.FC = () => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />

      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center justify-start pt-12 md:pt-20 h-full">
        <h2 
          className={`font-display font-black text-2xl md:text-4xl lg:text-5xl text-vault-gold uppercase tracking-wider mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transform transition-all duration-1000 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          You want to know what's inside the Crystal Cube!
        </h2>

        <h2 
          className={`mt-12 md:mt-16 font-display font-black text-3xl md:text-5xl lg:text-7xl text-white uppercase tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,1)] transform transition-all duration-1000 ease-out delay-1000 ${
            inView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          STAY TUNED!
        </h2>
      </div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToYouTuber, onNavigateToPlayers }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-vault-dark overflow-x-hidden">
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `scale(${1.0 + scrollY * 0.0005})`, 
          transition: 'transform 0.1s linear'
        }}
      />
      
      {/* Top Banner Logo - Now Clickable to Players Page */}
      <div className="absolute top-0 left-0 w-full z-30 pointer-events-auto animate-[fadeIn_1s_ease-out_0.5s_forwards] opacity-0 flex justify-center">
          <button 
            onClick={onNavigateToPlayers}
            className="focus:outline-none hover:scale-105 transition-transform duration-300 active:scale-95"
            aria-label="Open YouTube Players List"
          >
            <img 
              src={ASSETS.LANDING_BANNER} 
              alt="CodeKrackerXR Banner" 
              className="w-full h-auto object-contain max-h-32 md:max-h-48"
            />
          </button>
      </div>

      <div className="relative z-10 w-full pt-44 md:pt-[20rem]">
        
        <div className="container mx-auto px-6">
          <header className="flex flex-col items-center text-center mb-48 animate-[fadeIn_1s_ease-out_0.5s_forwards] opacity-0">
            <h1 className="mt-12 text-5xl md:text-7xl lg:text-8xl font-display font-black text-white mb-4 tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] flex flex-col items-center gap-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Coming Soon!</span>
              <span className="text-vault-gold text-4xl md:text-6xl lg:text-7xl">Summer 2026</span>
            </h1>
            <div className="h-1 w-24 bg-vault-gold mb-6 mx-auto"></div>
            <p className="font-sans text-xl md:text-2xl text-white tracking-[0.2em] uppercase font-semibold max-w-4xl leading-tight mb-8">
              {TEXT_CONTENT.SUBTITLE}
            </p>
            <p className="font-sans text-lg md:text-xl text-vault-gold font-medium max-w-3xl leading-relaxed mx-auto">
              This interactive, code-cracking series is built to scale across 25 top-tier YouTubers—driving viewership, engagement, and revenue. Every vault deployment grows the cash prize as the host and viewers at home work together to crack the code, giving one lucky fan a chance to win big.
            </p>
          </header>
        </div>

        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-32 md:gap-48 max-w-6xl mx-auto pb-32 md:pb-48">
            {TEXT_CONTENT.SECTIONS.map((section, idx) => {
              const isLeft = idx % 2 === 0;
              return (
                <ParallaxSection key={idx} direction={isLeft ? 'left' : 'right'}>
                  <div className={`flex flex-col md:flex-row gap-8 items-center ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 bg-vault-panel/90 backdrop-blur-md border border-white/10 p-8 md:p-10 hover:border-vault-gold/50 transition-colors duration-300 shadow-2xl group ${isLeft ? 'clip-path-slant' : 'clip-path-slant-reverse'}`}>
                      <div className="flex items-center gap-3 mb-4">
                         <ScrollRevealTitle className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wide">
                           {section.title}
                         </ScrollRevealTitle>
                      </div>
                      <p className="font-sans text-lg text-gray-300 leading-relaxed border-l-2 border-vault-gold/30 pl-4">
                        {section.body}
                      </p>
                    </div>
                    <div className="w-full md:w-5/12 relative overflow-hidden border border-vault-gold rounded bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                       <div className="absolute inset-0 bg-vault-gold/10 z-10 group-hover:bg-transparent transition-colors pointer-events-none"></div>
                       <img 
                         src={section.image} 
                         alt={section.title} 
                         className="w-full h-auto block opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-700"
                       />
                       <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-vault-gold to-transparent opacity-50 pointer-events-none"></div>
                       <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-vault-gold to-transparent opacity-50 pointer-events-none"></div>
                    </div>
                  </div>
                </ParallaxSection>
              );
            })}
          </div>
        </div>
        
        <FinalHeroSection />

        <div className="bg-black border-t border-white/10 relative z-20">
          <div className="container mx-auto px-6 pt-16 pb-12">
            
            <div className="flex flex-col items-center justify-center text-center mb-16">
              <div className="font-display font-bold text-2xl md:text-4xl text-vault-gold uppercase tracking-wider mb-8 leading-tight">
                <p>If you're a YouTuber that has over</p>
                <p className="mt-2 md:mt-3">
                  <span className="text-white">10</span> Million Subscribers
                </p>
              </div>
              <VaultButton onClick={onNavigateToYouTuber}>
                Click here
              </VaultButton>
            </div>

            <div className="text-center pt-8 border-t border-white/5">
               <p className="font-display text-sm text-white uppercase tracking-widest">
                 &copy; 2026 CODE KRACKER XR
               </p>
            </div>

          </div>
        </div>

      </div>
      
      <div className="fixed inset-0 pointer-events-none z-50 opacity-10 scanline"></div>
    </div>
  );
};