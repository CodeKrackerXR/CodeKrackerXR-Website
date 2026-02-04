
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, auth } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface CaesarCipherWheelProps {
  onBack: () => void;
  onNavigateToTheHunt: () => void;
  onNavigateToDigitalCoin: (finalTime?: string) => void;
  initialInput?: string;
  crackedOutput: string;
  maxHeight?: string;
  setCrackedOutput: (val: string | ((prev: string) => string)) => void;
  mappingLetter?: string;
  shift: number;
  setShift: (val: number) => void;
  currentRotation: number;
  setCurrentRotation: (val: number) => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
  huntAnswers?: string[];
  isTimerActiveExternal?: boolean;
  setIsTimerActiveExternal?: (val: boolean) => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DEGREES_PER_LETTER = 360 / 26;
const CREATOR_DOC_ID = 'MasterCreatorFolder';

type PromptStep = 'NONE' | 'SPEED_LINK' | 'TRAINING';

export const CaesarCipherWheel: React.FC<CaesarCipherWheelProps> = ({ 
  onBack, 
  onNavigateToTheHunt,
  onNavigateToDigitalCoin,
  initialInput = "", 
  crackedOutput, 
  setCrackedOutput,
  mappingLetter = "A",
  shift,
  setShift,
  currentRotation,
  setCurrentRotation,
  youtuber,
  huntAnswers = [],
  isTimerActiveExternal,
  setIsTimerActiveExternal
}) => {
  const [cipherInput, setCipherInput] = useState(initialInput);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRotationError, setShowRotationError] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [pendingLetter, setPendingLetter] = useState<string | null>(null);
  const [suppressMismatch, setSuppressMismatch] = useState(false);
  const [hasInteractedWithWheel, setHasInteractedWithWheel] = useState(false);
  const [promptStep, setPromptStep] = useState<PromptStep>('NONE');
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [manualWord, setManualWord] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startAngle, setStartAngle] = useState(0);

  const isTimerActive = isTimerActiveExternal ?? false;

  const expectedShift = useMemo(() => {
    const d1 = huntAnswers[8] || "0";
    const d2 = huntAnswers[9] || "0";
    return parseInt(d1 + d2, 10);
  }, [huntAnswers]);

  useEffect(() => {
    const savedTime = localStorage.getItem('ckxr_caesar_timer_val');
    const parsedSavedTime = savedTime ? parseInt(savedTime, 10) : 0;
    if (parsedSavedTime > 0) setElapsedTime(parsedSavedTime);

    const checkCompletion = async () => {
      const targetUid = auth.currentUser?.uid || '51H7yItLU9WMMiXl10xE';
      try {
        const userRef = doc(db, 'Users', targetUid);
        const snapshot = await getDoc(userRef);
        
        if (snapshot.exists()) {
          const l1 = snapshot.data()?.["Level 1"] || {};
          const existingTime = l1.caesarCipherTime || snapshot.data()?.CaesarCipherTime || "";
          if (existingTime && existingTime !== "" && existingTime !== "N/A" && existingTime !== "NO_TIME_RECORDED") {
             // Already solved
          }
        }
        
        if (!isTimerActive) {
          setPromptStep('SPEED_LINK');
        }
      } catch (err) {
        if (!isTimerActive) setPromptStep('SPEED_LINK');
      }
    };

    checkCompletion();
  }, [isTimerActive]);

  useEffect(() => {
    if (initialInput) setCipherInput(initialInput);
    else setCipherInput("");
  }, [initialInput]);

  useEffect(() => {
    let interval: number | undefined;
    if (isTimerActive) {
      interval = window.setInterval(() => {
        setElapsedTime(prev => {
          const next = prev + 10;
          localStorage.setItem('ckxr_caesar_timer_val', next.toString());
          return next;
        });
      }, 10);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
  };

  const getAngle = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    const angle = getAngle(clientX, clientY);
    setStartAngle(angle - currentRotation);
    setHasInteractedWithWheel(true);
    setSuppressMismatch(false);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const angle = getAngle(clientX, clientY);
    const newRotation = angle - startAngle;
    setCurrentRotation(newRotation);
    let normalizedRotation = newRotation % 360;
    if (normalizedRotation < 0) normalizedRotation += 360;
    const rotationSteps = Math.round(normalizedRotation / DEGREES_PER_LETTER) % 26;
    const newShiftValue = (26 - rotationSteps) % 26;
    setShift(newShiftValue);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const snappedRotationSteps = (26 - shift) % 26;
    setCurrentRotation(snappedRotationSteps * DEGREES_PER_LETTER);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        if (isDragging) e.preventDefault();
      }
    };
    const onTouchEnd = () => handleEnd();
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, startAngle, currentRotation, shift]);

  const handleManualRotation = (delta: number) => {
    const nextShift = (shift + delta + 26) % 26;
    setShift(nextShift);
    const nextRotationSteps = (26 - nextShift) % 26;
    setCurrentRotation(nextRotationSteps * DEGREES_PER_LETTER);
    setHasInteractedWithWheel(true);
    setSuppressMismatch(false);
  };

  const handleLetterClick = (letter: string) => {
    if (!hasInteractedWithWheel) {
      setShowRotationError(true);
      return;
    }
    if (shift !== expectedShift && !suppressMismatch) {
      setPendingLetter(letter);
      setShowMismatchModal(true);
      return;
    }
    setCrackedOutput(prev => prev + letter);
  };

  const handleMismatchConfirm = (allow: boolean) => {
    if (allow && pendingLetter) {
      setSuppressMismatch(true);
      setCrackedOutput(prev => prev + pendingLetter);
    }
    setPendingLetter(null);
    setShowMismatchModal(false);
  };

  const handleDeleteLast = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setCrackedOutput(prev => prev.slice(0, -1));
  };

  const handleVerifySubmission = async (overrideValue?: string) => {
    const rawValue = (overrideValue !== undefined ? overrideValue : crackedOutput);
    const valueToVerify = rawValue.toUpperCase().replace(/[^A-Z]/g, '');
    if (!valueToVerify) return;
    
    setIsVerifying(true);
    try {
      const docRef = doc(db, 'creators', CREATOR_DOC_ID);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("CREATOR_DATA_MISSING");

      const data = snap.data();
      const correctWord = (data?.TheHunt?.CityName || "").toUpperCase().replace(/[^A-Z]/g, '');

      if (valueToVerify === correctWord && correctWord !== "") {
        if (setIsTimerActiveExternal) setIsTimerActiveExternal(false);
        const finalFormattedTime = isTimerActive ? formatTime(elapsedTime) : "NO_TIME_RECORDED";
        localStorage.removeItem('ckxr_caesar_timer_val');
        const targetUid = auth.currentUser?.uid || '51H7yItLU9WMMiXl10xE';
        try {
          const submissionId = `${targetUid}_${CREATOR_DOC_ID}`;
          await setDoc(doc(db, 'Submissions', submissionId), {
            userId: targetUid,
            creatorId: CREATOR_DOC_ID,
            huntTime: finalFormattedTime,
            huntSolvedAt: serverTimestamp(),
            userName: auth.currentUser?.displayName || 'Agent',
            creatorName: youtuber?.name || 'Unknown'
          }, { merge: true });

          const userRef = doc(db, 'Users', targetUid);
          await setDoc(userRef, { "Level 1": { caesarCipherTime: finalFormattedTime }, updatedAt: new Date().toISOString() }, { merge: true });
        } catch (telemetryErr) {
          console.warn("Telemetry log failed", telemetryErr);
        }
        onNavigateToDigitalCoin(finalFormattedTime === "NO_TIME_RECORDED" ? undefined : finalFormattedTime);
      } else {
        setManualWord(valueToVerify);
        setShowErrorModal(true);
      }
    } catch (err: any) {
      alert("Neural uplink unstable. Ensure you have the correct City Name.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOverrideWord = () => {
    const cleanWord = manualWord.toUpperCase().trim();
    setShowErrorModal(false);
    handleVerifySubmission(cleanWord);
  };

  const teamName = youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`;

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/90 via-black/70 to-black/90 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {isTimerActive && promptStep === 'NONE' && (
        <div className="fixed top-0 right-0 z-[110] bg-black/85 border-l border-b border-vault-gold/30 px-4 py-3 rounded-bl-2xl shadow-2xl backdrop-blur-2xl w-[150px] md:w-[180px] flex flex-col items-center overflow-hidden">
          <span className="text-[9px] font-display text-white/80 uppercase tracking-[0.2em] mb-1 font-black">Caesar Timer</span>
          <div className="w-full flex justify-center items-baseline">
            <span className="text-xl md:text-2xl font-mono font-light text-vault-gold tabular-nums tracking-normal drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
        </div>
      )}

      {showRotationError && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-xl bg-vault-panel border-2 border-vault-alert p-10 md:p-14 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.2)]">
            <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-8 leading-tight">Calibration Required</h3>
            
            <div className="mb-8 font-display font-black text-6xl md:text-8xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {mappingLetter}=<span className="text-vault-gold">{huntAnswers[8] || "0"}{huntAnswers[9] || "0"}</span>
            </div>

            <p className="text-vault-gold font-sans text-xl md:text-2xl mb-12 leading-relaxed italic">
              "You must rotate the center yellow wheel first to set the shift key"
            </p>
            <VaultButton onClick={() => setShowRotationError(false)} className="w-full py-5 text-lg bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black">Acknowledge</VaultButton>
          </div>
        </div>
      )}

      {showMismatchModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-lg bg-vault-panel border-2 border-vault-gold p-10 md:p-14 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.2)]">
            <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-8 leading-tight">Key Mismatch</h3>
            
            <div className="flex flex-col gap-6 mb-10 border-y border-white/10 py-10">
              <div className="flex justify-between items-center px-6">
                <span className="text-white font-display font-black uppercase text-sm md:text-base tracking-[0.2em]">Mission Data:</span>
                <span className="text-3xl md:text-5xl font-display font-black text-white">
                  {mappingLetter}=<span className="text-vault-gold">{huntAnswers[8] || "0"}{huntAnswers[9] || "0"}</span>
                </span>
              </div>
              <div className="flex justify-between items-center px-6">
                <span className="text-white font-display font-black uppercase text-sm md:text-base tracking-[0.2em]">Wheel Data:</span>
                <span className="text-3xl md:text-5xl font-display font-black text-white">
                  {mappingLetter}=<span className="text-vault-gold">{shift}</span>
                </span>
              </div>
            </div>

            <p className="text-vault-gold font-sans text-lg md:text-xl mb-12 leading-relaxed italic text-center">
              "Your value doesn't match the shift key. Do you want to move forward?"
            </p>
            
            <div className="flex flex-col gap-4">
              <VaultButton onClick={() => handleMismatchConfirm(true)} className="py-4 text-xl">YES</VaultButton>
              <VaultButton variant="secondary" onClick={() => handleMismatchConfirm(false)} className="py-4 text-xl border-2">NO</VaultButton>
            </div>
          </div>
        </div>
      )}

      {promptStep === 'SPEED_LINK' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-md bg-vault-panel border-2 border-vault-gold p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_212,175,55,0.2)]">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-6">Code Cracking Speed Link</h3>
            <p className="text-white font-sans text-lg mb-10 leading-relaxed italic">{elapsedTime > 0 ? `Previous sequence detected at ${formatTime(elapsedTime)}. Ready to resume?` : `Compete with friends on how fast you can crack the code!`}</p>
            <div className="flex flex-col gap-4">
              <VaultButton onClick={() => setPromptStep('TRAINING')} className="py-4 text-xl">YES</VaultButton>
              <VaultButton variant="secondary" onClick={() => { setPromptStep('NONE'); if (setIsTimerActiveExternal) setIsTimerActiveExternal(false); }} className="py-4 text-xl border-2">NO</VaultButton>
            </div>
          </div>
        </div>
      )}

      {promptStep === 'TRAINING' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-md bg-vault-panel border-2 border-vault-gold p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_212,175,55,0.2)]">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-6">Training Protocol</h3>
            <p className="text-vault-alert font-display font-black uppercase tracking-[0.15em] text-base mb-6 animate-blink text-center">Understand how to crack the code FIRST</p>
            <a href="https://youtu.be/K2b_2RO385Y" target="_blank" rel="noopener noreferrer" onClick={() => setHasWatchedVideo(true)} className="group relative w-full max-w-[280px] aspect-video rounded-xl border-2 border-vault-gold overflow-hidden shadow-2xl mx-auto mb-10 block transition-transform hover:scale-105">
              <img src="https://i.ibb.co/kVnDMcZQ/You-Tube-Laser-Door.jpg" alt="Tutorial" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-12 h-12 bg-vault-gold text-black rounded-full flex items-center justify-center shadow-xl"><svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg></div></div>
            </a>
            <div className="flex flex-col gap-4">
              <VaultButton onClick={() => { if (!hasWatchedVideo) { window.open("https://youtu.be/K2b_2RO385Y", "_blank"); setHasWatchedVideo(true); } else { if (setIsTimerActiveExternal) setIsTimerActiveExternal(true); setPromptStep('NONE'); } }} className="py-4 text-xl">{hasWatchedVideo ? "YES, START" : "YES, WATCH"}</VaultButton>
              <VaultButton variant="secondary" onClick={() => { if (setIsTimerActiveExternal) setIsTimerActiveExternal(true); setPromptStep('NONE'); }} className="py-4 text-xl border-2">NO! SKIP TRAINING</VaultButton>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-lg bg-vault-panel border-4 border-vault-alert p-6 md:p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.3)]">
            <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-widest mb-2 leading-tight">Sorry try again!</h3>
            <div className="text-2xl md:text-4xl font-display font-black text-vault-alert uppercase tracking-[0.3em] bg-black/60 py-5 rounded-2xl border border-vault-alert/30 mb-8">{manualWord || crackedOutput || "EMPTY"}</div>
            <input type="text" value={manualWord} onChange={(e) => setManualWord(e.target.value.toUpperCase())} className="w-full bg-black border-2 border-white/10 rounded-xl px-6 py-4 text-white font-display text-xl uppercase mb-6 text-center focus:border-vault-gold outline-none" placeholder="RETRY SEQUENCE" />
            <VaultButton onClick={handleOverrideWord} className="w-full py-4 text-lg">SUBMIT</VaultButton>
            <button onClick={() => setShowErrorModal(false)} className="mt-4 w-full text-white/40 font-display font-black uppercase text-xs">Close</button>
          </div>
        </div>
      )}

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center overflow-hidden">
        <button onClick={onNavigateToTheHunt} className="hover:scale-105 transition-transform duration-300 focus:outline-none h-full w-full flex justify-center items-center">
           <img src={ASSETS.YOUTUBER_LOGO} alt="Logo" className="max-h-full w-auto max-w-[80%] object-contain p-4" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 py-8">
        <div className="w-full max-w-[450px] md:max-w-[650px] flex flex-col items-center">
          <div ref={wheelRef} className="relative w-full aspect-square select-none touch-none">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_40px_rgba(212,175,55,0.6)] overflow-visible">
              <circle cx="50" cy="50" r="50" fill="rgba(0,0,0,0.85)" stroke="#d4af37" strokeWidth="0.8" />
              {ALPHABET.map((letter, i) => {
                const angle = (i * 360) / 26;
                const x = 50 + 44.5 * Math.cos((angle - 90) * (Math.PI / 180));
                const y = 50 + 44.5 * Math.sin((angle - 90) * (Math.PI / 180));
                return <text key={`outer-${i}`} x={x} y={y} fill="white" fontSize="5" textAnchor="middle" dominantBaseline="middle" className="font-display font-black cursor-pointer hover:fill-[#22c55e] transition-all" onClick={() => handleLetterClick(letter)}>{letter}</text>;
              })}
              <g className={`${isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'} cursor-grab active:cursor-grabbing`} style={{ transform: `rotate(${currentRotation}deg)`, transformOrigin: '50% 50%' }} onMouseDown={(e) => handleStart(e.clientX, e.clientY)} onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}>
                <circle cx="50" cy="50" r="39" fill="rgba(212,175,55,0.12)" stroke="#d4af37" strokeWidth="1" />
                {ALPHABET.map((letter, i) => {
                  const angle = (i * 360) / 26;
                  const x = 50 + 33.5 * Math.cos((angle - 90) * (Math.PI / 180));
                  const y = 50 + 33.5 * Math.sin((angle - 90) * (Math.PI / 180));
                  return <text key={`inner-${i}`} x={x} y={y} fill="#d4af37" fontSize="4.5" textAnchor="middle" dominantBaseline="middle" className="font-display font-black pointer-events-none" transform={`rotate(${-currentRotation}, ${x}, ${y})`}>{letter}</text>;
                })}
              </g>
              <circle cx="50" cy="50" r="28.5" fill="#000" stroke="rgba(212,175,55,0.5)" strokeWidth="1.2" />
              <text x="50" y="34" fill="white" fontSize="7" textAnchor="middle" className="font-display font-black">{mappingLetter} = <tspan fill="#d4af37">{shift}</tspan></text>
              <text x="50" y="42" fill="#d4af37" fontSize="4.2" textAnchor="middle" className="font-display font-black uppercase opacity-70">Cipher</text>
              <text x="50" y="49" fill="#ff3333" fontSize="5.2" textAnchor="middle" className="font-display font-black">{cipherInput.slice(0, 10) || "------"}</text>
              <text x="50" y="58" fill="white" fontSize="4.2" textAnchor="middle" className="font-display font-black uppercase opacity-70">Cracked</text>
              <text x="50" y="65" fill="#22c55e" fontSize="5.2" textAnchor="middle" className="font-display font-black">{crackedOutput.slice(0, 10) || "------"}</text>
            </svg>
          </div>
          <div className="flex gap-8 mt-12">
            <button onClick={() => handleManualRotation(-1)} className="w-16 h-16 rounded-full border-2 border-vault-gold flex items-center justify-center hover:bg-vault-gold/20 active:scale-90 transition-all"><svg className="w-10 h-10 text-vault-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={() => handleManualRotation(1)} className="w-16 h-16 rounded-full border-2 border-vault-gold flex items-center justify-center hover:bg-vault-gold/20 active:scale-90 transition-all"><svg className="w-10 h-10 text-vault-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-vault-panel/90 backdrop-blur-xl border border-vault-gold/30 p-6 md:p-10 rounded-2xl shadow-2xl relative">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-display text-white uppercase tracking-[0.3em]">Cipher Input</label>
              <div className="w-full bg-black/60 border border-white/10 rounded-lg p-5 font-mono text-3xl text-vault-gold uppercase text-center">{cipherInput || "------"}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-display text-white uppercase tracking-[0.3em]">Cracked Output</label>
              <div className="relative group">
                <div className="w-full bg-black/40 border border-vault-gold/20 rounded-lg p-5 font-mono text-3xl text-[#22c55e] uppercase text-center">{crackedOutput || "------"}</div>
                {crackedOutput.length > 0 && (
                  <button onClick={handleDeleteLast} className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-white hover:scale-110 active:scale-95">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="pt-6 flex flex-col gap-4">
              <button onClick={() => handleVerifySubmission()} disabled={isVerifying || !crackedOutput} className="w-full py-5 font-display font-black uppercase text-lg rounded-xl bg-white text-black hover:bg-vault-gold active:scale-95">{isVerifying ? 'VERIFYING...' : 'Submit Decrypted City'}</button>
              <button onClick={onNavigateToTheHunt} className="w-full py-3 font-display font-bold uppercase text-[10px] text-white/40 hover:text-white transition-colors">Return to Missions</button>
            </div>
          </div>
          <div className="mt-8 flex justify-between items-center text-[9px] font-display text-white/20 uppercase"><span>Node: {CREATOR_DOC_ID}</span><span>Status: Encryption Bypassed</span></div>
        </div>
      </div>
      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto"><p className="font-display text-xs text-white uppercase tracking-widest opacity-40">&copy; 2026 CODE KRACKER XR</p></div>
    </div>
  );
};
