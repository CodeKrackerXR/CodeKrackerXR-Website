import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface CodeXChallengePageProps {
  stepIndex: number;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  creatorMissionData: any;
  tacticalComms: { message: string; id: string } | null;
  onDismissComms?: () => void;
}

interface StepData {
  type: string;
  id?: string;
  num?: number;
  title: string;
  scene: string;
  voiceLine: string;
  whatHappens: string;
  notes: string;
  audienceMessage: string;
}

const PRODUCTION_STEPS: StepData[] = [
  {
    type: 'OPENING',
    title: 'Meet CODIE',
    scene: 'This is where you and your partner meet CODIE for the first time. CODIE Will do a biometric scan on you and your partner. Make sure you have fun with it.',
    voiceLine: 'Step up to the plate boys and look into the camera, show me those pearly whites.',
    whatHappens: 'You find CODIE. You are introduced. You get scanned. You have to crack the Cryptex.',
    notes: 'Set the tone and the excitement about what is going to happen.',
    audienceMessage: "Welcome back Agents! Today we're finally here at the secret location. This is where you get a riddle and need to open up the crypt text. Scan the QR code to start the timer. Then use the paper clip and find a small hole that the paper clip goes into"
  },
  {
    type: 'MISSION',
    num: 1,
    title: 'The First Signal',
    scene: 'Every system has a first signal. Find the smallest opening. Precision matters.',
    voiceLine: 'Signal detected. Minimal force required. Let’s see if you notice what others miss.',
    whatHappens: 'A hidden release is triggered. Your first physical game piece is revealed. This item will be reused later in the Vault.',
    notes: 'Set the tone. Slow down. This tells the audience nothing is accidental.',
    audienceMessage: "Alright guys, first signal is live. We need to be surgical here. I'm scanning for the smallest interface points. Stay focused, the timer is ticking!"
  },
  {
    type: 'MISSION',
    num: 2,
    title: 'Pressure Point',
    scene: 'Not all entry points face forward. Search where most people wouldn’t.',
    voiceLine: 'Pressure anomaly located. Apply force carefully… I’m watching.',
    whatHappens: 'A concealed mechanism opens. You collect a precision measurement tool.',
    notes: 'Narrate your thinking. This helps viewers play along.',
    audienceMessage: "We're moving to the blind spots now. Most people look at the front door, but the vault is smarter than that. I'm checking the lateral seams for a hidden trigger."
  },
  {
    type: 'MISSION',
    num: 3,
    title: 'Dead Reckoning',
    scene: 'Follow the path exactly. Deviation will lead you nowhere.',
    voiceLine: 'Alignment critical. One incorrect move will wake the wrong mechanism.',
    whatHappens: 'Prior tools must be used together. Internal locking components engage. A hidden access door is revealed.',
    notes: 'This is a tension builder—embrace the pressure.',
    audienceMessage: "This is pure dead reckoning. If my alignment is off by even a millimeter, CODIE is going to lock us out. We need to use the magnetic piece exactly on the vector."
  },
  {
    type: 'MISSION',
    num: 4,
    title: 'The Astro Wheel',
    scene: 'The stars guided explorers long before maps. Remove the wheel. You’ll need it again.',
    voiceLine: 'Celestial interface unlocked. Interesting choice… I would’ve done the same.',
    whatHappens: 'The Astro Wheel is retrieved. Hidden compartments reveal specialty tools.',
    notes: 'Treat this like a discovery moment, not a task.',
    audienceMessage: "Look at this! It's a celestial wheel. The craftsmanship is insane. This isn't just a prop, it's a navigational tool for the entire vault structure."
  },
  {
    type: 'MISSION',
    num: 5,
    title: 'Hidden Spectrum',
    scene: 'What you seek is already here—just outside the visible range.',
    voiceLine: 'Spectral shift confirmed. You’re seeing what the Vault prefers to keep secret.',
    whatHappens: 'Special lighting reveals concealed information. CODIE begins direct, reactive dialogue. A numeric sequence unlocks a wall safe. A dual-key puzzle is obtained.',
    notes: 'Lean into CODIE’s presence. React to it.',
    audienceMessage: "The blue light is revealing messages we literally couldn't see a second ago. This sequence is key to the wall safe. We're getting deep into the circuitry now."
  },
  {
    type: 'MISSION',
    num: 6,
    title: 'The Knock',
    scene: 'Some systems respond to rhythm, not strength. Listen first. Then act.',
    voiceLine: 'Knock sequence recognized. Stand by… deploying hatch in five… four… three… two… one.',
    whatHappens: 'Audio-based interaction triggers a release. A compartment deploys a wire spool.',
    notes: 'This is playful tension—have fun with it.',
    audienceMessage: "It's all about the rhythm. I've got to match the sequence perfectly. If you listen closely, the vault is actually talking back to us in code."
  },
  {
    type: 'MISSION',
    num: 7,
    title: 'The Labyrinth',
    scene: 'Every maze has a center. Speed won’t help you here.',
    voiceLine: 'Cognitive patience detected. Good. Most fail before reaching this point.',
    whatHappens: 'A maze-based tool must be solved. Completion reveals a drill bit.',
    notes: 'Let frustration show. Viewers relate to this.',
    audienceMessage: "This labyrinth is a mental grind. It's a circular maze embedded in a shaft. One wrong turn and the whole thing resets. Patience is everything right now."
  },
  {
    type: 'MISSION',
    num: 8,
    title: 'The Key of Three',
    scene: 'One object. Multiple purposes. Break it to understand it.',
    voiceLine: 'Transformation complete. Keys rarely look important—until they are.',
    whatHappens: 'A tool converts into a three-symbol key. Unlocks a hidden drawer. Additional tools are collected.',
    notes: 'Call out how earlier items keep paying off.',
    audienceMessage: "Wait, the labyrinth shaft just cracked open like a bottle! Look at this pointed key. It's got three distinct shapes. I need to find where this fits immediately."
  },
  {
    type: 'MISSION',
    num: 9,
    title: 'Reversal',
    scene: 'Forward is an assumption. Try the opposite.',
    voiceLine: 'Orientation inverted. You adapted faster than expected.',
    whatHappens: 'A concealed letter mechanism activates. A new control element is revealed.',
    notes: 'Sell the misdirection—this is a brain-twist moment.',
    audienceMessage: "I was trying to push, but the answer was to pull and spin. Orientation inverted! CODIE is trying to catch us off guard, but we're one step ahead."
  },
  {
    type: 'MISSION',
    num: 10,
    title: 'Axis Alignment',
    scene: 'Everything has a correct angle. You already have the tool.',
    voiceLine: 'Angular alignment within tolerance. Proceed… carefully.',
    whatHappens: 'The Astro Wheel is used for precise measurement. A hex key is released. A 3-foot control rod deploys.',
    notes: 'This is rewards paying attention earlier—say that out loud.',
    audienceMessage: "I need that Astro Wheel back. We have to calculate the latitude and longitude of the 'X' to release the hex key. This is high-stakes engineering!"
  },
  {
    type: 'MISSION',
    num: 11,
    title: 'The Iris',
    scene: 'Two halves. One purpose. Timing matters.',
    voiceLine: 'Iris mechanism responding. You’re getting close now.',
    whatHappens: 'Dual keys are separated. One activates an iris door. Deeper Vault access is unlocked.',
    notes: 'Pause before opening. Let the moment breathe.',
    audienceMessage: "The keys are separated. One half goes into the 'C' and... look! The iris door is actually opening inside the 'O'. We're finally seeing inside the core!"
  },
  {
    type: 'MISSION',
    num: 12,
    title: 'The Watcher',
    scene: 'The Vault is fully aware of you. Mistakes will cost time.',
    voiceLine: 'Motion detected. Correction advised… or penalties will apply. (After success) I have a message for you. Look below.',
    whatHappens: 'Multi-tool coordination. Precision drilling. Motion and shock sensors activate penalties. CODIE delivers a printed message with progress time.',
    notes: 'This is the hardest mission. Communicate with your partner.',
    audienceMessage: "This is the hardest one. I'm using the endoscope to guide the rod, but if I hit the podium, CODIE adds a massive penalty to our time. Watch my back!"
  },
  {
    type: 'MISSION',
    num: 13,
    title: 'The Circuit',
    scene: 'Power flows where intention is precise. Choose wisely.',
    voiceLine: 'Circuit closed. You’ve just armed the final sequence.',
    whatHappens: 'Wire-based puzzle. Correct contact releases a fuse. Fuse becomes essential for the final lock.',
    notes: 'Move quickly—energy should spike here.',
    audienceMessage: "15 feet of wire and two specific bolts. We need to complete the circuit to pop the fuse. If we get this wrong, we might fry the interface. Here goes nothing!"
  },
  {
    type: 'MISSION',
    num: 14,
    title: 'The Final Lock',
    scene: 'You’ve earned the right to listen. The Vault will tell you when you’re close.',
    voiceLine: 'Tumblers disengaging… This is your moment. Don’t rush it.',
    whatHappens: 'Audio-assisted combination cracking. Final key rotation releases internal tumblers. Vault door opens. Crystal Cube is captured.',
    notes: 'Slow. Focused. Cinematic. This is the payoff.',
    audienceMessage: "I'm using the headphones and the listening device. I can hear the tumblers. It's almost there... one more click. We are seconds away from opening the vault!"
  },
  {
    type: 'FINAL',
    title: 'It’s Break in Time',
    scene: 'This is where you and your partner have to disable the lasers and the timer.',
    voiceLine: 'Subject not reconized.',
    whatHappens: 'Disable lasers. Get into the detonation box. Disable the TNT. Disable floor. Capture the The Crystal CodeX Cube.',
    notes: 'Full blown excitement and worried about the vault blowing.',
    audienceMessage: "LASERS DOWN! We're inside! The timer is screaming at us. We have to disable the TNT and secure the CodeX Cube before this whole location goes dark. Let's MOVE!"
  }
];

const TIMER_STORAGE_KEY = 'ckxr_cx_timer_start';
const PAUSE_STORAGE_KEY = 'ckxr_cx_is_paused';
const ELAPSED_AT_PAUSE_KEY = 'ckxr_cx_elapsed_at_pause';

export const CodeXChallengePage: React.FC<CodeXChallengePageProps> = ({ 
  stepIndex, 
  onBack, 
  onNext, 
  onPrev, 
  creatorMissionData, 
  tacticalComms,
  onDismissComms
}) => {
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeModal, setActiveModal] = useState<{ title: string, content: string } | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingAction, setPendingAction] = useState<'NEXT' | 'CAMERA' | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const currentStep = PRODUCTION_STEPS[stepIndex];
  const isLastPage = stepIndex === PRODUCTION_STEPS.length - 1;

  // Trigger a visual "glitch" animation when step changes to make it feel like a new page load
  useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => setIsSyncing(false), 500);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  const codedLetter = useMemo(() => {
    if (currentStep.type !== 'MISSION') return ''; 
    const missionNum = currentStep.num || 0;
    if (missionNum <= 7) {
      return creatorMissionData.cipherWordNorth?.[missionNum - 1] || '?';
    } else {
      return creatorMissionData.cipherWordWest?.[missionNum - 8] || '?';
    }
  }, [currentStep, creatorMissionData]);

  // Persistent Timer Setup
  useEffect(() => {
    const storedStart = localStorage.getItem(TIMER_STORAGE_KEY);
    const storedPaused = localStorage.getItem(PAUSE_STORAGE_KEY) === 'true';
    const storedElapsed = parseInt(localStorage.getItem(ELAPSED_AT_PAUSE_KEY) || '0', 10);

    if (storedStart) {
      setGameStartTime(parseInt(storedStart, 10));
      setIsPaused(storedPaused);
      if (storedPaused) {
        setElapsedTime(storedElapsed);
      }
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (gameStartTime && !isPaused) {
      interval = window.setInterval(() => {
        setElapsedTime(Date.now() - gameStartTime);
      }, 100);
    }
    return () => interval && clearInterval(interval);
  }, [gameStartTime, isPaused]);

  const togglePause = () => {
    if (!gameStartTime) return;

    if (!isPaused) {
      const currentElapsed = Date.now() - gameStartTime;
      localStorage.setItem(ELAPSED_AT_PAUSE_KEY, currentElapsed.toString());
      localStorage.setItem(PAUSE_STORAGE_KEY, 'true');
      setIsPaused(true);
    } else {
      const storedElapsed = parseInt(localStorage.getItem(ELAPSED_AT_PAUSE_KEY) || '0', 10);
      const newStart = Date.now() - storedElapsed;
      localStorage.setItem(TIMER_STORAGE_KEY, newStart.toString());
      localStorage.setItem(PAUSE_STORAGE_KEY, 'false');
      setGameStartTime(newStart);
      setIsPaused(false);
    }
  };

  const performNext = () => {
    if (stepIndex === 0 && !gameStartTime) {
      const startTime = Date.now();
      localStorage.setItem(TIMER_STORAGE_KEY, startTime.toString());
      localStorage.setItem(PAUSE_STORAGE_KEY, 'false');
      localStorage.setItem(ELAPSED_AT_PAUSE_KEY, '0');
      setGameStartTime(startTime);
    }
    
    if (onNext) {
      if ("vibrate" in navigator) navigator.vibrate(50);
      onNext();
    }
  };

  const handleNextAction = () => {
    if (stepIndex > 0 && codedLetter) {
      setPendingAction('NEXT');
    } else {
      performNext();
    }
  };

  const performCamera = () => {
    if ("vibrate" in navigator) navigator.vibrate(20);
    cameraInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (stepIndex > 0 && codedLetter) {
      setPendingAction('CAMERA');
    } else {
      performCamera();
    }
  };

  const handleAcknowledgeCode = () => {
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'NEXT') performNext();
    else if (action === 'CAMERA') performCamera();
  };

  const handleMediaCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      setHasCaptured(true);
      setTimeout(() => setHasCaptured(false), 3000);
    }
  };

  const handleTerminate = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    localStorage.removeItem(PAUSE_STORAGE_KEY);
    localStorage.removeItem(ELAPSED_AT_PAUSE_KEY);
    onBack();
  };

  const handleLogoClick = () => {
    if (isLastPage) {
      handleTerminate();
    } else if (onNext) {
      handleNextAction();
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
  };

  const buttonStyle = "bg-white/5 border-vault-gold/20 py-8 md:py-12 flex flex-col items-center justify-center gap-4 group hover:bg-white transition-colors duration-200 border-r border-b last:border-r-0";

  return (
    <div className={`min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-y-auto overflow-x-hidden scrollbar-hide transition-opacity duration-300 ${isSyncing ? 'opacity-0' : 'opacity-100'}`}>
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />
      
      {/* Visual Glitch Layer during "Page Swaps" */}
      {isSyncing && (
        <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-vault-gold border-t-transparent rounded-full animate-spin"></div>
              <span className="text-vault-gold font-display font-black uppercase tracking-[0.4em] animate-pulse">Uplink: Mission {stepIndex}</span>
           </div>
        </div>
      )}

      {/* Hidden Camera Input */}
      <input 
        type="file" 
        accept="image/*,video/*" 
        capture="environment" 
        ref={cameraInputRef} 
        className="hidden" 
        onChange={handleMediaCaptured}
      />

      {/* Code Letter Announcement Popup */}
      {pendingAction && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fadeIn">
          <div className="w-full max-w-lg bg-vault-panel border-4 border-red-600 rounded-3xl p-10 text-center shadow-[0_0_100px_rgba(255,0,0,0.3)] relative overflow-hidden">
            <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-8 leading-tight">
              Did you announce the code letter?
            </h3>
            <div className="mb-10 flex items-center justify-center">
              <span className="text-red-600 font-display font-black text-9xl md:text-[12rem] drop-shadow-[0_0_40px_rgba(255,0,0,0.5)] animate-pulse">
                {codedLetter}
              </span>
            </div>
            <VaultButton 
              onClick={handleAcknowledgeCode} 
              className="w-full py-6 text-xl bg-red-600 text-white border-white hover:bg-white hover:text-red-600 shadow-2xl"
            >
              Acknowledge
            </VaultButton>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      {/* EMERGENCY TACTICAL OVERLAY - High Visibility Centered Red Box */}
      {tacticalComms && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-fadeIn bg-black/70 backdrop-blur-md pointer-events-auto">
          <div className="w-full max-w-2xl bg-vault-alert border-4 border-white rounded-3xl p-8 md:p-14 shadow-[0_0_120px_rgba(255,51,51,0.6)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-black/5 animate-pulse pointer-events-none" />
            
            {/* Manual Dismiss Button - White X */}
            <button 
              onClick={(e) => { e.stopPropagation(); if(onDismissComms) onDismissComms(); }}
              className="absolute top-2 right-2 p-6 text-white hover:scale-125 transition-transform z-30 pointer-events-auto"
              aria-label="Dismiss message"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative z-20 flex flex-col gap-6 items-center text-center">
              <div className="flex items-center gap-3 bg-white/20 px-6 py-2 rounded-full border border-white/30 backdrop-blur-sm animate-bounce">
                <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                <span className="text-[12px] md:text-sm font-display text-white font-black uppercase tracking-[0.5em]">
                  PRIORITY TRANSMISSION
                </span>
              </div>
              
              <p className="text-3xl md:text-5xl lg:text-7xl font-display font-black text-white uppercase tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] leading-[1.1] max-w-lg mx-auto">
                {tacticalComms.message}
              </p>

              <button 
                onClick={(e) => { e.stopPropagation(); if(onDismissComms) onDismissComms(); }}
                className="mt-6 w-full max-w-xs py-5 bg-white text-vault-alert font-display font-black uppercase text-lg tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-vault-alert hover:text-white border-2 border-white transition-all active:scale-95"
              >
                ACKNOWLEDGE
              </button>
            </div>
            
            {/* Background Texture for the Red Box */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.15] scanline" />
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-4 md:px-8">
        
        {/* Fixed Top Header (Timer) */}
        <header className="flex flex-col items-center pt-2 md:pt-6 pb-2">
          <button onClick={handleLogoClick} className="hover:scale-105 transition-transform duration-300 active:scale-95 mb-1">
            <img 
              src={ASSETS.LANDING_BANNER} 
              alt={isLastPage ? "Exit Challenge" : "Next Mission"} 
              className="h-10 md:h-20 lg:h-24 w-auto object-contain" 
            />
          </button>
          
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full ${gameStartTime && !isPaused ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-white/10'}`} />
            <span className="font-display font-black text-[clamp(20px,6.5vw,32px)] text-white uppercase tracking-[0.1em]">
              GAME TIME: <span className="text-vault-gold font-mono ml-1">{formatTime(elapsedTime)}</span>
            </span>
          </div>
        </header>

        {/* Step Header Bar */}
        <div className="w-full flex items-center justify-between border-b-4 border-vault-gold py-1 mb-2 md:mb-4 mt-1 md:mt-2">
          <span className="text-white/20 font-display font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter min-w-[1ch] leading-none">
            {currentStep.num || ""}
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-display font-black text-white uppercase tracking-normal text-center flex-1 px-2 md:px-4 drop-shadow-2xl truncate leading-tight">
            {currentStep.title}
          </h1>
          <div className="min-w-[1ch] text-right">
            {codedLetter && (
              <span className="text-red-600 font-display font-black text-5xl md:text-7xl lg:text-8xl drop-shadow-[0_0_20px_rgba(255,0,0,0.6)] leading-none">
                {codedLetter}
              </span>
            )}
          </div>
        </div>

        {/* Main Focus: The Audience Message (Yellow Box) */}
        <div className="min-h-[75vh] flex flex-col justify-start mb-12">
          <div className="bg-vault-gold text-black rounded-3xl p-6 md:p-12 shadow-[0_0_60px_rgba(212,175,55,0.2)] border-4 border-white/10 relative overflow-hidden group flex-1 flex items-center justify-center">
             <p className="text-[clamp(22px,8.5vw,72px)] md:text-[clamp(20px,6vw,56px)] font-black leading-[1.05] uppercase tracking-tighter italic text-center drop-shadow-sm select-none max-w-5xl mx-auto">
               {currentStep.audienceMessage}
             </p>
             <div className="absolute inset-0 pointer-events-none opacity-[0.08] scanline" />
          </div>
        </div>

        {/* Tactical Buttons Grid - Now scrolled below the fold */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-vault-gold/30 rounded-2xl overflow-hidden shadow-xl mb-16">
          <button onClick={() => setActiveModal({ title: 'The Scene Intel', content: currentStep.scene })} className={buttonStyle}>
            <svg className="w-8 h-8 md:w-12 md:h-12 text-vault-gold group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="font-display font-black text-[11px] md:text-sm uppercase tracking-[0.2em] text-white/50 group-hover:text-black transition-colors">The Scene</span>
          </button>
          <button onClick={() => setActiveModal({ title: 'Mission Events', content: currentStep.whatHappens })} className={buttonStyle}>
            <svg className="w-8 h-8 md:w-12 md:h-12 text-vault-gold group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="font-display font-black text-[11px] md:text-sm uppercase tracking-[0.2em] text-white/50 group-hover:text-black transition-colors">Events</span>
          </button>
          <button onClick={() => setActiveModal({ title: 'CODIE Voice Data', content: currentStep.voiceLine })} className={buttonStyle}>
            <svg className="w-8 h-8 md:w-12 md:h-12 text-vault-gold group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <span className="font-display font-black text-[11px] md:text-sm uppercase tracking-[0.2em] text-white/50 group-hover:text-black transition-colors">CODIE Speaks</span>
          </button>
          <button onClick={() => setActiveModal({ title: 'Production Notes', content: currentStep.notes })} className={`${buttonStyle} border-r-0`}>
            <svg className="w-8 h-8 md:w-12 md:h-12 text-vault-gold group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="font-display font-black text-[11px] md:text-sm uppercase tracking-[0.2em] text-white/50 group-hover:text-black transition-colors">Creator Notes</span>
          </button>
        </div>

        {/* Navigation Controls Area - integrated into scroll */}
        <div className="pt-8 pb-16 flex flex-col items-center gap-16 w-full max-w-2xl mx-auto border-t border-vault-gold/20">
           <div className="grid grid-cols-3 w-full items-center">
              <div className="flex justify-start">
                <button 
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="text-vault-gold hover:text-white disabled:opacity-20 transition-all transform hover:scale-125 active:scale-90"
                >
                  <svg className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleCameraClick}
                  className={`group relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center transition-all ${hasCaptured ? 'bg-[#22c55e] scale-110 shadow-[0_0_60px_#22c55e]' : 'bg-vault-gold hover:bg-vault-alert shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:shadow-[0_0_50px_rgba(255,51,51,0.5)] hover:scale-105 active:scale-95'}`}
                  aria-label="Open Camera"
                >
                  {hasCaptured ? (
                    <svg className="w-12 h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 text-white animate-[fadeIn_0.2s_ease-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-12 h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                  <div className={`absolute inset-0 rounded-full border-4 border-white/40 scale-110 opacity-20 pointer-events-none ${hasCaptured ? 'animate-none opacity-0' : 'animate-ping'}`} />
                </button>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleNextAction}
                  disabled={!onNext}
                  className="text-vault-gold hover:text-white disabled:opacity-20 transition-all transform hover:scale-125 active:scale-90"
                >
                  <svg className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
           </div>
           
           <div className="w-full flex flex-col items-center gap-10">
              {gameStartTime && (
                <button 
                  onClick={togglePause}
                  className="bg-vault-gold text-black rounded-lg px-12 py-4 font-display font-black uppercase text-base tracking-[0.2em] shadow-xl hover:bg-white transition-colors active:scale-95"
                >
                  {isPaused ? 'Resume Timer' : 'Pause Timer'}
                </button>
              )}
              
              <button onClick={handleTerminate} className="text-xs font-display font-black uppercase text-white/20 tracking-[0.8em] hover:text-vault-alert transition-colors py-4">TERMINATE SESSION</button>
           </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8 animate-fadeIn" onClick={() => setActiveModal(null)}>
          <div className="w-full max-w-2xl bg-vault-panel border-4 border-vault-gold rounded-3xl p-10 md:p-16 shadow-[0_0_100px_rgba(212,175,55,0.4)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
             <header className="mb-10 border-b border-vault-gold/20 pb-6 flex items-center justify-between">
                <h3 className="text-2xl md:text-4xl font-display font-black text-vault-gold uppercase tracking-widest">{activeModal.title}</h3>
                <button onClick={() => setActiveModal(null)} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </header>
             <p className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight text-white uppercase tracking-tight">
               {activeModal.content}
             </p>
             <div className="mt-12">
               <VaultButton onClick={() => setActiveModal(null)} className="w-full py-6 text-xl">Acknowledge Intel</VaultButton>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] scanline" />
    </div>
  );
};