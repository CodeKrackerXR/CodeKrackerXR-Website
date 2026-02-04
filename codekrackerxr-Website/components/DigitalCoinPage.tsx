import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface DigitalCoinPageProps {
  onBackToCongrats: () => void;
  youtuber?: {
    name: string;
    avatar: string;
    DigitalCoinThumbNail: string;
    DigitalCoinShort: string;
  };
}

interface StageSectionProps {
  stage: number;
  title: string;
  isOpen: boolean;
  isLocked: boolean;
  onToggle: (stage: number) => void;
  children: React.ReactNode;
  subtitle?: string;
  subtitleColor?: string;
}

const StageSection: React.FC<StageSectionProps> = ({ 
  stage, 
  title, 
  isOpen, 
  isLocked,
  onToggle, 
  children, 
  subtitle, 
  subtitleColor = "text-white" 
}) => {
  return (
    <div 
      className={`w-full border-2 rounded-3xl mb-4 shadow-2xl transition-all relative overflow-hidden 
        ${isLocked 
          ? 'bg-black/70 border-white/15 opacity-75 cursor-not-allowed' 
          : 'bg-vault-panel/80 border-white/10 hover:border-vault-gold/40 group cursor-pointer'
        }`}
      onClick={() => !isLocked && onToggle(stage)}
    >
      {/* Interactive Shimmer for Unlocked */}
      {!isLocked && (
        <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${(!isOpen) ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
      )}

      {/* Header Bar - Robust layout to prevent "crashing" of text elements */}
      <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between px-6 py-6 md:py-8 gap-2 md:gap-6">
        
        {/* Primary Row: Title, Lock, and Chevron */}
        <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <h3 className={`text-[18px] md:text-[22px] font-display font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${isLocked ? 'text-white/40' : 'text-vault-gold group-hover:text-white'}`}>
              {title}
            </h3>
            <div className="relative flex items-center">
              <svg 
                className={`w-5 h-5 transition-colors ${isLocked ? 'text-vault-alert/70 animate-pulse' : 'text-vault-gold/40 group-hover:text-white'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                {isLocked ? (
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                ) : (
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h12a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                )}
              </svg>
            </div>
          </div>
          
          {/* Mobile Chevron */}
          <div className="md:hidden">
            <svg className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isLocked ? 'text-white/20' : 'text-vault-gold'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Status/Subtitle Text - Given its own layout space */}
        <div className="flex-1 flex md:items-center justify-start md:justify-center pt-1 md:pt-0">
          {subtitle && (
            <span className={`font-display font-black uppercase tracking-[0.2em] text-[14px] md:text-[18px] lg:text-[24px] text-left md:text-center transition-all ${isLocked ? 'text-white/60 grayscale opacity-60' : subtitleColor}`}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Desktop Chevron */}
        <div className="hidden md:block flex-shrink-0">
          <svg className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isLocked ? 'text-white/20' : 'text-vault-gold'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {!isLocked && (
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3500px] opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
          <div className="px-6 pb-8 md:px-10 md:pb-12">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DigitalCoinPage: React.FC<DigitalCoinPageProps> = ({ 
  onBackToCongrats,
  youtuber
}) => {
  const [stage1Answer, setStage1Answer] = useState('');
  const [stage2Answer, setStage2Answer] = useState('');
  const [stage3Answer, setStage3Answer] = useState('');
  const [stage4Answer, setStage4Answer] = useState('');
  const [stage5Answer, setStage5Answer] = useState('');

  const [isStage1Solved, setIsStage1Solved] = useState(false);
  const [isStage2Solved, setIsStage2Solved] = useState(false);
  const [isStage3Solved, setIsStage3Solved] = useState(false);
  const [isStage4Solved, setIsStage4Solved] = useState(false);
  const [isStage5Solved, setIsStage5Solved] = useState(false);

  const [digitalCoinValue, setDigitalCoinValue] = useState('$5,000');
  const [burnerPhone, setBurnerPhone] = useState('1-800-987-5309');

  const [openStages, setOpenStages] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false
  });

  // Fetch data from DB
  useEffect(() => {
    const fetchDossierData = async () => {
      try {
        const creatorRef = doc(db, 'creators', 'MasterCreatorFolder');
        const snapshot = await getDoc(creatorRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const val = data?.DigitalCoin?.TheCoin?.DigitalCoilValue;
          if (val && val.trim() !== '') {
            setDigitalCoinValue(val);
          }
          const phone = data?.DigitalCoin?.Stage5?.dcStage5BurnerPhone;
          if (phone && phone.trim() !== '') {
            setBurnerPhone(phone);
          }
        }
      } catch (err) {
        console.warn("Dossier data fetch failed, using defaults.");
      }
    };
    fetchDossierData();
  }, []);

  // Solution checks
  useEffect(() => {
    const ans = stage1Answer.trim().toUpperCase();
    if (ans === 'ARROW') setIsStage1Solved(true);
  }, [stage1Answer]);

  useEffect(() => {
    const ans = stage2Answer.trim().toUpperCase();
    if (ans === 'COIN' || ans === 'BEE') setIsStage2Solved(true);
  }, [stage2Answer]);

  useEffect(() => {
    const ans = stage3Answer.trim().toUpperCase();
    if (ans === 'CLAIM' || ans === 'VAULT') setIsStage3Solved(true);
  }, [stage3Answer]);

  useEffect(() => {
    const ans = stage4Answer.trim().toUpperCase();
    if (ans === 'WIN' || ans === 'PHONE') {
      setIsStage4Solved(true);
      setOpenStages(prev => ({ ...prev, 5: true }));
    }
  }, [stage4Answer]);

  useEffect(() => {
    if (stage5Answer.trim().toUpperCase() === 'FINAL') setIsStage5Solved(true);
  }, [stage5Answer]);

  const toggleStage = (stage: number) => {
    setOpenStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  const handleCallNow = () => {
    window.location.href = `tel:${burnerPhone.replace(/[^0-9+]/g, '')}`;
  };

  const activeYoutuber = youtuber || {
    name: "Chris Ramsey",
    avatar: ASSETS.CHRIS_RAMSAY_IMG,
    DigitalCoinThumbNail: "https://i.ibb.co/wh2WxJj9/Chris-Ramsey-TN.png",
    DigitalCoinShort: "https://www.youtube.com/watch?v=g5sZYv3edNE&t=313s"
  };

  const hasShort = activeYoutuber.DigitalCoinShort && activeYoutuber.DigitalCoinThumbNail;

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBackToCongrats} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl flex flex-col items-center flex-1">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-4 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          Digital <span className="text-white">Coin</span>
        </h1>

        <div className="mb-12 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] opacity-0 flex flex-col items-center">
          <span className="text-5xl md:text-8xl font-display font-bold text-[#22c55e] drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            {digitalCoinValue}
          </span>
        </div>

        <div className="w-full flex flex-col gap-2 mb-12">
          <StageSection 
            stage={1} 
            title="Stage 1" 
            subtitle="Start Searching"
            subtitleColor="text-vault-alert"
            isOpen={openStages[1]} 
            isLocked={false}
            onToggle={toggleStage}
          >
            <div className="flex flex-col gap-6">
              <div className="space-y-4 text-gray-200 font-sans leading-relaxed">
                <p className="font-bold text-vault-gold text-center md:text-left text-[20px] md:text-[22px]">Congrats on getting the area where the Vault is located in Clayton, but there are <span className="text-white">30 Claytons</span> in the USA. Lets start eliminating some and have some fun with them.</p>
                <p className="text-center md:text-left text-[20px] md:text-[22px] font-bold">On 36 Degree North Latitude line going across the USA. 5 states that have Clayton in them intersect.</p>
                <div className="border-l-2 border-vault-gold/40 pl-6 space-y-2 italic text-white/90">
                  <p className="font-display font-bold uppercase tracking-widest text-lg text-vault-gold mb-2">Clues:</p>
                  <p>I have a N'10 street</p>
                  <p>I'm close to a building that's the color of the sun.</p>
                  <p>Next to a rock</p>
                  <p>Can only be scene from 2 sides</p>
                  <p>One side I'm close to 6</p>
                  <p>The other side I'm close to 9</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative group/input">
                  <input 
                    type="text" 
                    value={stage1Answer}
                    onChange={(e) => setStage1Answer(e.target.value)}
                    placeholder="What am I ?"
                    className={`w-full bg-black/60 border-2 rounded-xl px-6 py-5 font-display font-black text-xl placeholder:text-vault-gold/30 focus:outline-none transition-all uppercase tracking-widest ${isStage1Solved ? 'border-vault-gold text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-vault-gold text-vault-gold focus:shadow-[0_0_20px_rgba(212,175,55,0.3)]'}`}
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline rounded-xl"></div>
                </div>
              </div>

              <div className={`transition-all duration-700 ease-out overflow-hidden ${isStage1Solved ? 'max-h-[1500px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                <div className="bg-black/60 border border-vault-gold/30 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
                  <h4 className="text-[#22c55e] font-display font-black text-2xl md:text-3xl uppercase tracking-widest mb-8 text-center animate-pulse">
                    Congrats your moving on to Stage 2
                  </h4>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-vault-gold/40 to-transparent mb-10"></div>
                  <h5 className="text-white font-display font-black text-xl uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
                    <span className="bg-vault-gold text-black px-3 py-1 rounded">5</span>
                    Fun Facts: Clayton, Oklahoma
                  </h5>
                  <div className="space-y-8">
                    <div className="group/fact flex gap-4">
                      <span className="text-vault-gold font-display font-bold text-lg pt-1">01</span>
                      <div className="space-y-1">
                        <p className="text-white font-bold uppercase tracking-wide text-sm md:text-base group-hover/fact:text-vault-gold transition-colors">A Mirror of Missouri</p>
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">The town wasn't always called Clayton. Dexter, founded in 1894, was renamed in 1907 after Clayton, Missouri.</p>
                      </div>
                    </div>
                    <div className="group/fact flex gap-4">
                      <span className="text-vault-gold font-display font-bold text-lg pt-1">02</span>
                      <div className="space-y-1">
                        <p className="text-white font-bold uppercase tracking-wide text-sm md:text-base group-hover/fact:text-vault-gold transition-colors">The High School’s Big Stage</p>
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">The Clayton High School auditorium is a WPA rarity, one of only two single-use auditoriums built by the WPA in Oklahoma.</p>
                      </div>
                    </div>
                    <div className="group/fact flex gap-4">
                      <span className="text-vault-gold font-display font-bold text-lg pt-1">03</span>
                      <div className="space-y-1">
                        <p className="text-white font-bold uppercase tracking-wide text-sm md:text-base group-hover/fact:text-vault-gold transition-colors">The Fire Tower Sentinel</p>
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">Flagpole Mountain hosts one of the last metal fire towers in the region, a beloved local landmark.</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline"></div>
                </div>
              </div>
            </div>
          </StageSection>

          <StageSection 
            stage={2} 
            title="Stage 2" 
            subtitle="Video Clues"
            subtitleColor="text-white"
            isOpen={openStages[2]} 
            isLocked={!isStage1Solved}
            onToggle={toggleStage}
          >
            <div className="flex flex-col items-center gap-8">
              {hasShort && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <p className="text-vault-gold font-display font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-center drop-shadow-md">
                    Watch YouTube Short to find Clues
                  </p>
                  <button 
                    onClick={() => window.open(activeYoutuber.DigitalCoinShort, '_blank')}
                    className="relative group max-w-sm md:max-w-md overflow-hidden rounded-2xl border-4 border-vault-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                  >
                    <img src={activeYoutuber.DigitalCoinThumbNail} alt="YouTube Short Thumbnail" className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-vault-gold text-black rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-2xl">
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                        </div>
                    </div>
                  </button>
                </div>
              )}
              <div className="w-full max-xl px-4">
                <input 
                  type="text" 
                  value={stage2Answer}
                  onChange={(e) => setStage2Answer(e.target.value)}
                  placeholder="What am I ?"
                  className={`w-full bg-black/60 border-2 rounded-xl px-6 py-5 font-display font-black text-xl placeholder:text-vault-gold/30 focus:outline-none transition-all uppercase tracking-widest ${isStage2Solved ? 'border-vault-gold text-[#22c55e]' : 'border-vault-gold text-vault-gold'}`}
                />
              </div>
            </div>
          </StageSection>

          <StageSection 
            stage={3} 
            title="Stage 3" 
            subtitle="Claim Digital Coin"
            subtitleColor="text-[#3b82f6]"
            isOpen={openStages[3]} 
            isLocked={!isStage2Solved}
            onToggle={toggleStage}
          >
            <div className="flex flex-col items-center gap-8">
              {hasShort && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <p className="text-vault-gold font-display font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-center drop-shadow-md">
                    Watch YouTube Short to find Clues
                  </p>
                  <button 
                    onClick={() => window.open(activeYoutuber.DigitalCoinShort, '_blank')}
                    className="relative group max-w-sm md:max-w-md overflow-hidden rounded-2xl border-4 border-vault-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                  >
                    <img src={activeYoutuber.DigitalCoinThumbNail} alt="YouTube Short Thumbnail" className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-vault-gold text-black rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-2xl">
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                        </div>
                    </div>
                  </button>
                </div>
              )}
              <div className="w-full max-xl px-4">
                <input 
                  type="text" 
                  value={stage3Answer}
                  onChange={(e) => setStage3Answer(e.target.value)}
                  placeholder="What am I ?"
                  className={`w-full bg-black/60 border-2 rounded-xl px-6 py-5 font-display font-black text-xl placeholder:text-vault-gold/30 focus:outline-none transition-all uppercase tracking-widest ${isStage3Solved ? 'border-vault-gold text-[#22c55e]' : 'border-vault-gold text-vault-gold'}`}
                />
              </div>
            </div>
          </StageSection>

          <StageSection 
            stage={4} 
            title="Stage 4" 
            subtitle="Enter to Win"
            subtitleColor="text-vault-alert"
            isOpen={openStages[4]} 
            isLocked={!isStage3Solved}
            onToggle={toggleStage}
          >
            <div className="flex flex-col items-center gap-8">
              {hasShort && (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-vault-gold font-display font-black text-xl md:text-2xl uppercase tracking-[0.2em] text-center drop-shadow-md">
                      Watch us live for Final Clues
                    </p>
                    <p className="text-white font-display font-bold text-lg md:text-xl uppercase tracking-widest text-center">
                      Saturday June 20th 1pm (EST)
                    </p>
                  </div>
                  <button 
                    onClick={() => window.open(activeYoutuber.DigitalCoinShort, '_blank')}
                    className="relative group max-w-sm md:max-w-md overflow-hidden rounded-2xl border-4 border-vault-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.03] active:scale-95"
                  >
                    <img src={activeYoutuber.DigitalCoinThumbNail} alt="YouTube Short Thumbnail" className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 bg-vault-gold text-black rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-2xl">
                          <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                        </div>
                    </div>
                  </button>
                </div>
              )}
              <div className="w-full max-xl px-4">
                <input 
                  type="text" 
                  value={stage4Answer}
                  onChange={(e) => setStage4Answer(e.target.value)}
                  placeholder="What am I ?"
                  className={`w-full bg-black/60 border-2 rounded-xl px-6 py-5 font-display font-black text-xl placeholder:text-vault-gold/30 focus:outline-none transition-all uppercase tracking-widest ${isStage4Solved ? 'border-vault-gold text-[#22c55e]' : 'border-vault-gold text-vault-gold'}`}
                />
              </div>
            </div>
          </StageSection>

          <StageSection 
            stage={5} 
            title="Stage 5" 
            subtitle="Final Code"
            subtitleColor="text-[#22c55e]"
            isOpen={openStages[5]} 
            isLocked={!isStage4Solved}
            onToggle={toggleStage}
          >
            <div className="flex flex-col items-center gap-8 py-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-vault-alert font-display font-black text-3xl md:text-5xl uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,51,51,0.4)]">
                  Call ASAP!
                </p>
                <p className="text-white font-display font-black text-4xl md:text-7xl lg:text-8xl tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {burnerPhone}
                </p>
                {burnerPhone && (
                  <div className="flex flex-col items-center">
                    <VaultButton 
                      onClick={handleCallNow}
                      className="mt-6 px-16 py-5 text-xl tracking-[0.2em] shadow-xl border-2"
                    >
                      Call Now
                    </VaultButton>
                    <p className="text-[10px] text-vault-gold uppercase tracking-widest mt-4 font-bold">
                      message and data rates may apply
                    </p>
                  </div>
                )}
              </div>
            </div>
          </StageSection>
        </div>

        <div className="mt-16 mb-24 relative z-50">
           <VaultButton 
             variant="secondary" 
             onClick={onBackToCongrats} 
             className="px-24 py-8 text-2xl tracking-[0.4em] bg-black/40 shadow-xl border-2"
           >
             Return to Congrats
           </VaultButton>
        </div>
      </div>

      <div className="relative z-20 w-full py-10 text-center border-t border-white/10 bg-black/80 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | COMMEMORATIVE ASSET CORE
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
