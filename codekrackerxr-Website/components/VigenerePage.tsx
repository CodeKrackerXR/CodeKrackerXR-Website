import React, { useState, useMemo } from 'react';
import { ASSETS } from '../constants';
// Added missing import for VaultButton to fix "Cannot find name 'VaultButton'" error
import { VaultButton } from './VaultButton';

interface VigenerePageProps {
  onNavigateToTheBreakIn: () => void;
  onNavigateToPlayers: () => void;
  onNavigateToQuarterFinals: (time?: string) => void;
  youtuber?: {
    name: string;
    avatar: string;
  };
  breakInAnswers?: string[];
  keywordRiddleAnswer?: string;
  codedTextNorth: string;
  codedTextWest: string;
  gpsNorth: string;
  gpsWest: string;
  updateFields: (updates: any) => void;
  isTimerActiveExternal?: boolean;
  setIsTimerActiveExternal?: (val: boolean) => void;
  elapsedTime: number;
  creatorKeyStreamNorth?: string;
  creatorKeyStreamWest?: string;
  targetGpsNorth?: string;
  targetGpsWest?: string;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Helper: Haversine distance in miles
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3958.8; // Miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper: Parse packed digits (e.g., "3755196") to Decimal Degrees
// Format assumed: first 2-3 digits are degrees, next 2 are minutes, next are seconds
const parsePackedToDecimal = (str: string, isWest: boolean) => {
  if (!str || str.length < 5) return 0;
  // Handle 3-digit degrees for West (e.g., 121) vs 2-digit for North (e.g., 37)
  const degLen = isWest ? 3 : 2;
  const deg = parseInt(str.substring(0, degLen), 10);
  const min = parseInt(str.substring(degLen, degLen + 2), 10);
  const secPart = str.substring(degLen + 2);
  const sec = parseFloat(secPart.length === 3 ? `${secPart.substring(0, 2)}.${secPart.substring(2)}` : secPart);
  
  const decimal = deg + min / 60 + sec / 3600;
  return isWest ? -decimal : decimal;
};

// Helper: Parse DMS string (e.g., "37°55’19.6” North") to Decimal Degrees
const parseDMSToDecimal = (str: string) => {
  if (!str) return 0;
  const match = str.match(/(\d+)[^\d.]+?(\d+)[^\d.]+?([\d.]+)/);
  if (!match) return 0;
  const deg = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const sec = parseFloat(match[3]);
  const decimal = deg + min / 60 + sec / 3600;
  return (str.toUpperCase().includes('W') || str.toUpperCase().includes('S')) ? -decimal : decimal;
};

export const VigenerePage: React.FC<VigenerePageProps> = ({ 
  onNavigateToTheBreakIn, 
  onNavigateToPlayers, 
  onNavigateToQuarterFinals,
  youtuber, 
  breakInAnswers = [],
  keywordRiddleAnswer = "",
  codedTextNorth,
  codedTextWest,
  gpsNorth,
  gpsWest,
  updateFields,
  isTimerActiveExternal,
  setIsTimerActiveExternal,
  elapsedTime,
  creatorKeyStreamNorth = "",
  creatorKeyStreamWest = "",
  targetGpsNorth = "",
  targetGpsWest = ""
}) => {
  // Interactive state for grid row and column highlighting
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null);
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ keyword: '', cipher: '', cracked: '' });

  // Deviation Alert state
  const [deviationAlert, setDeviationAlert] = useState<{ distance: string } | null>(null);

  // Completion Popup state
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const c = Math.floor((ms % 1000) / 10);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${c.toString().padStart(2, '0')}`;
  };

  // Map missions to Cipher Text North/West and lock them
  const cipherTextNorth = useMemo(() => {
    return breakInAnswers.slice(0, 7).join('');
  }, [breakInAnswers]);

  const cipherTextWest = useMemo(() => {
    return breakInAnswers.slice(7, 14).join('');
  }, [breakInAnswers]);

  const headerLabels = useMemo(() => {
    return ALPHABET.map((letter, i) => `${letter}/${i % 10}`);
  }, []);

  // Format GPS string progress dynamically with exact requested symbols and colors
  const renderGpsProgress = (digits: string, isWest: boolean) => {
    if (!digits) return null;
    const degLen = isWest ? 3 : 2;
    const elements: React.ReactNode[] = [];
    
    // Degrees
    elements.push(<span key="deg" className="text-white">{digits.substring(0, Math.min(digits.length, degLen))}°</span>);
    
    // Minutes
    if (digits.length > degLen) {
      elements.push(<span key="min" className="text-white"> {digits.substring(degLen, Math.min(digits.length, degLen + 2))}’</span>);
    }
    
    // Seconds
    if (digits.length > degLen + 2) {
      if (isWest) {
        // West: 2 digits + ”
        elements.push(<span key="sec-w" className="text-white">{digits.substring(degLen + 2, Math.min(digits.length, degLen + 4))}”</span>);
      } else {
        // North: 2 digits + . + 1 digit + ”
        elements.push(<span key="sec-n-main" className="text-white">{digits.substring(degLen + 2, Math.min(digits.length, degLen + 4))}</span>);
        if (digits.length > degLen + 4) {
          elements.push(<span key="sec-n-dec" className="text-white">.{digits.substring(degLen + 4, Math.min(digits.length, degLen + 5))}”</span>);
        }
      }
    }
    
    if (digits.length > 0) {
      elements.push(<span key="indicator" className="text-vault-gold"> {isWest ? "W" : "N"}</span>);
    }
    
    return <>{elements}</>;
  };

  // Calculate current mission tracker letters
  const missionTracker = useMemo(() => {
    const currentLenNorth = codedTextNorth.length;
    const currentLenWest = codedTextWest.length;
    
    if (currentLenNorth < 7) {
      return {
        key: (creatorKeyStreamNorth || "").charAt(currentLenNorth) || "-",
        cipher: (cipherTextNorth || "").charAt(currentLenNorth) || "-"
      };
    } else if (currentLenWest < 7) {
      return {
        key: (creatorKeyStreamWest || "").charAt(currentLenWest) || "-",
        cipher: (cipherTextWest || "").charAt(currentLenWest) || "-"
      };
    }
    return { key: "✓", cipher: "✓" };
  }, [codedTextNorth, codedTextWest, creatorKeyStreamNorth, creatorKeyStreamWest, cipherTextNorth, cipherTextWest]);

  // Styles
  const lockedRedInputStyle = "w-full bg-black/80 border-2 border-vault-alert/30 rounded px-2 py-2 font-display font-black text-[20px] sm:text-[23px] text-center cursor-not-allowed uppercase text-vault-alert shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.5em] pl-[0.5em]";
  const lockedBlueInputStyle = "w-full bg-black/80 border-2 border-[#3b82f6]/30 rounded px-2 py-2 font-display font-black text-[20px] sm:text-[23px] text-center cursor-not-allowed uppercase text-[#3b82f6] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.5em] pl-[0.5em]";
  const lockedGreenInputStyle = "w-full bg-black/80 border-2 border-[#22c55e]/30 rounded px-2 py-2 font-display font-black text-[20px] sm:text-[23px] text-center cursor-not-allowed uppercase text-[#22c55e] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] tracking-[0.5em] pl-[0.5em]";
  const sectionLabelStyle = "text-vault-gold font-display font-black text-[18px] lg:text-[24px] py-1 uppercase tracking-widest text-center";
  const panelHeaderStyle = "bg-black/60 text-white font-display font-black text-[22px] lg:text-[30px] py-2 px-4 uppercase text-center tracking-widest border-b border-vault-gold/10";
  const triangleBtnStyle = "absolute right-0.5 top-1/2 -translate-y-1/2 text-white hover:text-vault-gold active:scale-90 transition-all text-xl md:text-2xl cursor-pointer select-none z-20 flex items-center justify-center w-10 h-full bg-transparent";

  const teamName = youtuber?.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber?.name.split(' ')[0] || 'Unknown'}`;

  const handleRowClick = (index: number) => {
    if (selectedRowIndex === index) {
      setSelectedRowIndex(null);
      setSelectedColIndex(null);
      setShowPopup(false);
    } else {
      setSelectedRowIndex(index);
      setSelectedColIndex(null);
      setShowPopup(false);
    }
  };

  const handleCellClick = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRowIndex === rowIndex) {
      setSelectedColIndex(colIndex);
      const rowLetter = ALPHABET[rowIndex];
      const headerLabel = headerLabels[colIndex].replace('/', '');
      const charIndex = (rowIndex + colIndex) % 26;
      const cipherLetter = ALPHABET[charIndex];
      
      setPopupData({
        keyword: rowLetter,
        cipher: cipherLetter,
        cracked: headerLabel
      });
      setShowPopup(true);
    }
  };

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    const letter = popupData.cracked[0];
    const number = popupData.cracked[1];
    
    updateFields((prev: any) => {
      let nextCodedNorth = prev.codedTextNorth;
      let nextGpsNorth = prev.gpsNorth;
      let nextCodedWest = prev.codedTextWest;
      let nextGpsWest = prev.gpsWest;

      if (prev.codedTextNorth.length < 7) {
        nextCodedNorth = prev.codedTextNorth + letter;
        nextGpsNorth = prev.gpsNorth + number;
      } else {
        nextCodedWest = prev.codedTextWest + letter;
        nextGpsWest = prev.gpsWest + number;
      }

      // Check for completion after this update
      if (nextCodedNorth.length === 7 && nextCodedWest.length === 7) {
        setShowCompletionPopup(true);
      }

      return {
        codedTextNorth: nextCodedNorth,
        gpsNorth: nextGpsNorth,
        codedTextWest: nextCodedWest,
        gpsWest: nextGpsWest
      };
    });
    
    setShowPopup(false);
  };

  const handleTryAgain = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPopup(false);
  };

  const closePopup = () => {
    if (showPopup) setShowPopup(false);
  };

  const handleClearNorth = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateFields((prev: any) => ({
      codedTextNorth: prev.codedTextNorth.slice(0, -1),
      gpsNorth: prev.gpsNorth.slice(0, -1)
    }));
  };

  const handleClearWest = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateFields((prev: any) => ({
      codedTextWest: prev.codedTextWest.slice(0, -1),
      gpsWest: prev.gpsWest.slice(0, -1)
    }));
  };

  const handleSubmitGPS = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Convert User Input to Decimal
    const userLat = parsePackedToDecimal(gpsNorth, false);
    const userLon = parsePackedToDecimal(gpsWest, true);

    // 2. Convert Target DB strings to Decimal
    const targetLat = parseDMSToDecimal(targetGpsNorth);
    const targetLon = parseDMSToDecimal(targetGpsWest);

    // 3. Compare and Calculate Distance
    const distance = getHaversineDistance(userLat, userLon, targetLat, targetLon);

    // 4. Threshold Check (0.05 miles is about half a block - very tight)
    if (distance < 0.05) {
      if (setIsTimerActiveExternal) setIsTimerActiveExternal(false);
      const finalFormattedTime = isTimerActiveExternal ? formatTime(elapsedTime) : undefined;
      localStorage.removeItem('ckxr_vigenere_timer_val');
      onNavigateToQuarterFinals(finalFormattedTime);
    } else {
      setDeviationAlert({ distance: distance.toFixed(1) });
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white"
      onClick={closePopup}
    >
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

      {/* Floating Timer Header */}
      {isTimerActiveExternal && (
        <div className="fixed top-0 right-0 z-[110] bg-black/85 border-l border-b border-vault-gold/30 px-4 py-3 rounded-bl-2xl shadow-2xl backdrop-blur-2xl animate-[fadeIn_0.5s_ease-out] w-[150px] md:w-[180px] flex flex-col items-center overflow-hidden">
          <span className="text-[9px] font-display text-white/80 uppercase tracking-[0.25em] mb-1 font-black">Vigenere Timer</span>
          <div className="w-full flex justify-center items-baseline">
            <span className="text-xl md:text-2xl font-mono font-light text-vault-gold tabular-nums tracking-normal drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
              {formatTime(elapsedTime)}
            </span>
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
        </div>
      )}

      {/* Floating Mission Tracker - FIXED POSITION AT ALL TIMES */}
      <div 
        className="fixed left-0 top-1/2 -translate-y-1/2 w-[45px] md:w-[65px] z-[120] flex flex-col pointer-events-none shadow-2xl"
      >
        <div className="bg-white flex items-center justify-center border-b border-black/10 pointer-events-auto" style={{ height: '44px' }}>
          <span className="text-blue-600 font-display font-black text-[22px] md:text-[28px] uppercase">{missionTracker.key}</span>
        </div>
        <div className="bg-vault-gold flex items-center justify-center pointer-events-auto" style={{ height: '44px' }}>
          <span className="text-red-600 font-display font-black text-[22px] md:text-[28px] uppercase">{missionTracker.cipher}</span>
        </div>
      </div>

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button 
          onClick={(e) => { e.stopPropagation(); onNavigateToTheBreakIn(); }} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      {/* Solving Popup */}
      {showPopup && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-[fadeIn_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-vault-panel/95 border-2 border-vault-gold p-8 rounded-xl shadow-[0_0_50px_rgba(212,175,55,0.4)] backdrop-blur-xl min-w-[360px] text-center relative overflow-hidden">
             <div className="space-y-4 font-display font-black uppercase tracking-widest">
               <p className="text-white text-xl">
                 Your Keyword letter is <span className="text-vault-gold">[{popupData.keyword}]</span>
               </p>
               <p className="text-white text-xl">
                 Your Cipher Text letter is <span className="text-vault-gold">[{popupData.cipher}]</span>
               </p>
               <div className="text-vault-gold text-2xl pt-4 border-t border-vault-gold/20 flex flex-col items-center gap-2">
                 <span>Your Cracked Letter and number is</span>
                 <div className="bg-vault-gold text-black px-6 py-2 rounded font-display font-black text-3xl shadow-lg ring-2 ring-black/20">
                   {popupData.cracked}
                 </div>
               </div>
             </div>

             <div className="flex justify-between items-center mt-10 gap-6">
                <button 
                  onClick={handleAccept}
                  className="flex-1 bg-white text-black py-3 font-display font-black uppercase tracking-widest text-sm hover:bg-[#22c55e] transition-colors rounded clip-path-slant shadow-md"
                >
                  Accept
                </button>
                <button 
                  onClick={handleTryAgain}
                  className="flex-1 border border-vault-alert text-vault-alert py-3 font-display font-black uppercase tracking-widest text-sm hover:bg-vault-alert/10 transition-colors rounded clip-path-slant shadow-md"
                >
                  Try Again
                </button>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline overflow-hidden rounded-xl"></div>
          </div>
        </div>
      )}

      {/* Completion Popup */}
      {showCompletionPopup && (
        <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-lg bg-vault-gold border-4 border-black p-10 rounded-3xl text-center shadow-[0_0_100px_rgba(212,175,55,0.5)]">
            <h3 className="text-2xl md:text-4xl font-display font-black text-red-600 uppercase tracking-widest leading-tight">
              Your done coding your GPS coordinates
            </h3>
            <button 
              onClick={() => setShowCompletionPopup(false)}
              className="mt-8 bg-black text-vault-gold font-display font-black px-10 py-4 uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl"
            >
              Close Intelligence
            </button>
          </div>
        </div>
      )}

      {/* Deviation Alert Popup */}
      {deviationAlert && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-md bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_100px_rgba(255,51,51,0.2)]">
            <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-6">Deviation Detected</h3>
            <p className="text-vault-gold font-sans text-xl md:text-2xl mb-10 leading-relaxed italic">
              Are you sure? Because you're <span className="text-vault-alert font-black">{deviationAlert.distance} miles</span> away. <br/><br/>
              <span className="text-white text-base font-bold uppercase tracking-widest">Try again Agent.</span>
            </p>
            <VaultButton 
              variant="primary" 
              onClick={() => setDeviationAlert(null)} 
              className="w-full py-4 text-xl bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black"
            >
              Recalculate
            </VaultButton>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-1 sm:px-4 py-8 lg:py-12 flex flex-col gap-10 items-center justify-start max-w-[1600px]">
        
        {/* YouTuber Lockup */}
        {youtuber && (
          <div className="flex flex-col items-center justify-center animate-[fadeInDown_0.6s_ease-out] w-full">
             <div className="relative group">
               <div className="w-[120px] h-[120px] md:w-40 md:h-40 rounded-full border-4 border-vault-gold overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                 <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover" />
               </div>
             </div>
             <div className="mt-4 text-center">
               <h3 className="font-display font-black text-3xl md:text-5xl lg:text-6xl text-vault-gold uppercase tracking-wider drop-shadow-md">{youtuber.name}</h3>
               <p className="font-display font-bold text-lg md:text-[22px] text-vault-alert uppercase tracking-[0.3em] mt-1">
                 {teamName}
               </p>
             </div>
          </div>
        )}

        {/* Decryption Workspace - VERTICAL STACK ONLY */}
        <div className="w-full flex flex-col gap-6 animate-[fadeInUp_0.6s_ease-out] px-1 md:px-0">
          
          {/* 1. Keyword Panel */}
          <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg">
            <div className={panelHeaderStyle}>Keyword</div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-vault-gold/10">
                <div className={sectionLabelStyle}>Key Stream North</div>
                <input type="text" value={creatorKeyStreamNorth} readOnly className={lockedBlueInputStyle} placeholder="---" />
              </div>
              <div className="p-3">
                <div className={sectionLabelStyle}>Key Stream West</div>
                <input type="text" value={creatorKeyStreamWest} readOnly className={lockedBlueInputStyle} placeholder="---" />
              </div>
            </div>
          </div>

          {/* 2. Cipher Text Panel */}
          <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg">
            <div className={panelHeaderStyle}>Cipher Text</div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-vault-gold/10">
                <div className={sectionLabelStyle}>Cipher text North</div>
                <input type="text" value={cipherTextNorth} readOnly className={lockedRedInputStyle} placeholder="---" />
              </div>
              <div className="p-3">
                <div className={sectionLabelStyle}>Cipher text West</div>
                <input type="text" value={cipherTextWest} readOnly className={lockedRedInputStyle} placeholder="---" />
              </div>
            </div>
          </div>

          {/* 3. Coded Text Panel */}
          <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg">
            <div className={panelHeaderStyle}>Coded Text</div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-vault-gold/10">
                <div className={sectionLabelStyle}>Coded text North</div>
                <div className="relative group/input">
                  <input type="text" value={codedTextNorth} readOnly className={lockedRedInputStyle} placeholder="---" />
                  <div onClick={handleClearNorth} className={triangleBtnStyle} title="Clear North Data">◀</div>
                </div>
              </div>
              <div className="p-3">
                <div className={sectionLabelStyle}>Coded text West</div>
                <div className="relative group/input">
                  <input type="text" value={codedTextWest} readOnly className={lockedRedInputStyle} placeholder="---" />
                  <div onClick={handleClearWest} className={triangleBtnStyle} title="Clear West Data">◀</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Coded GPS Panel */}
          <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg">
            <div className={panelHeaderStyle}>Coded GPS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-vault-gold/10">
                <div className={sectionLabelStyle}>North / Latitude</div>
                <div className="relative group/input">
                  <input type="text" value={gpsNorth} readOnly className={lockedGreenInputStyle} placeholder="---" />
                  <div onClick={handleClearNorth} className={triangleBtnStyle} title="Clear North Data">◀</div>
                </div>
              </div>
              <div className="p-3">
                <div className={sectionLabelStyle}>West / Longitude</div>
                <div className="relative group/input">
                  <input type="text" value={gpsWest} readOnly className={lockedGreenInputStyle} placeholder="---" />
                  <div onClick={handleClearWest} className={triangleBtnStyle} title="Clear West Data">◀</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Vault GPS Coordinates Panel */}
          <div className="w-full bg-vault-panel/90 border border-vault-gold/20 rounded-lg overflow-hidden shadow-lg">
            <div className={panelHeaderStyle}>Vault GPS Coordinates</div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-vault-gold/10">
                <div className={sectionLabelStyle}>Extracted Location</div>
                <div className="w-full bg-black/80 border-2 border-vault-gold rounded px-2 sm:px-4 py-2 font-display font-medium text-[clamp(10px,4.2vw,14px)] sm:text-[14px] md:text-[16px] lg:text-[24px] text-center cursor-default uppercase shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] flex items-center justify-center whitespace-nowrap overflow-hidden min-h-[52px] md:min-h-[56px]">
                  {renderGpsProgress(gpsNorth, false)}
                  {gpsNorth && gpsWest && <span className="mx-4 md:mx-6 lg:mx-8 opacity-30 text-white">|</span>}
                  {renderGpsProgress(gpsWest, true)}
                  {!gpsNorth && !gpsWest && <span className="opacity-20 italic text-white">Awaiting Extraction...</span>}
                </div>
              </div>
              <div className="p-3 flex flex-col">
                <div className={sectionLabelStyle}>Status</div>
                <button 
                  onClick={handleSubmitGPS}
                  className="w-full flex-1 bg-white text-black font-display font-black py-2 px-6 uppercase tracking-widest text-[16px] md:text-[22px] rounded transition-all duration-300 hover:bg-vault-gold hover:text-black hover:scale-[1.01] shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center min-h-[52px] md:min-h-[56px]"
                >
                  Submit GPS Coordinates
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Vigenere Matrix Grid - Full width always below panels */}
        <div className="w-full bg-vault-panel/95 backdrop-blur-2xl border border-vault-gold/40 rounded-xl overflow-hidden shadow-2xl animate-[fadeInUp_0.8s_ease-out] relative">
          <div className="bg-[#ef4444] text-white font-display font-black text-[24px] md:text-[28px] py-3 px-6 uppercase text-center tracking-[0.4em]">
            Coded Text and GPS Coordinates
          </div>
          <div className="overflow-x-auto scrollbar-hide relative">
            
            <table className="w-full table-fixed min-w-[1050px] border-collapse relative">
              <thead>
                <tr>
                  <th className="w-[45px] md:w-[65px] bg-[#ef4444] border border-white/20"></th>
                  <th className="w-12 bg-[#ef4444] border border-white/20"></th>
                  {headerLabels.map((label, i) => {
                    const isSelectedCol = selectedColIndex === i;
                    return (
                      <th key={i} className={`border border-white/20 py-1 text-[9px] md:text-[11px] font-display font-black uppercase leading-none transition-colors duration-300 ${isSelectedCol ? 'bg-vault-gold text-black shadow-[0_5px_15px_rgba(212,175,55,0.4)]' : 'bg-[#ef4444] text-white'}`}>
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ALPHABET.map((rowLetter, rowIndex) => {
                  const isSelectedRow = selectedRowIndex === rowIndex;
                  return (
                    <tr key={rowLetter} className={`group transition-colors duration-200 ${isSelectedRow ? 'bg-blue-900/60 shadow-[inset_0_0_30px_rgba(59,130,246,0.5)]' : ''}`}>
                      {rowIndex === 0 && (
                        <td 
                          rowSpan={26} 
                          className="bg-[#3b82f6] text-white font-display font-black border-r border-white/20 whitespace-nowrap select-none relative"
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="uppercase tracking-[0.5em] text-[18px] md:text-[24px] -rotate-90 whitespace-nowrap">
                              Keystream
                            </div>
                          </div>
                        </td>
                      )}
                      
                      <td 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(rowIndex); }} 
                        className={`border border-white/20 py-2 text-center font-display font-black text-[22px] cursor-pointer transition-all duration-300 select-none ${isSelectedRow ? 'bg-blue-600 text-vault-gold shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'bg-[#3b82f6] text-white hover:bg-blue-400'}`}
                      >
                        {rowLetter}
                      </td>
                      
                      {ALPHABET.map((colLetter, colIndex) => {
                        const charIndex = (rowIndex + colIndex) % 26;
                        const displayChar = ALPHABET[charIndex];
                        const isSelectedCol = selectedColIndex === colIndex;
                        const isIntersection = isSelectedRow && isSelectedCol;
                        let cellClasses = "border border-white/10 text-center font-sans font-bold text-[18px] md:text-[22px] transition-all duration-150 select-none ";
                        if (isIntersection) cellClasses += "bg-vault-gold text-red-600 font-black scale-110 z-10 shadow-[0_0_20px_rgba(212,175,55,0.8)] cursor-pointer";
                        else if (isSelectedRow) cellClasses += "text-white cursor-pointer hover:bg-vault-gold/20 hover:text-vault-alert ";
                        else if (isSelectedCol) cellClasses += "bg-red-500/20 text-vault-alert cursor-default ";
                        else cellClasses += "text-gray-200 group-hover:bg-vault-gold/5 hover:bg-vault-gold/20 hover:text-white cursor-default ";
                        return (
                          <td key={colLetter} onClick={(e) => handleCellClick(rowIndex, colIndex, e)} className={cellClasses}>
                            {displayChar}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | VIGENERE CRYPTOGRAPHIC MATRIX
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.08] scanline"></div>
    </div>
  );
};
