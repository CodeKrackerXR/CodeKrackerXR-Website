
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from './firebase';
import { LandingPage } from './components/LandingPage';
import { YouTuberPage } from './components/YouTuberPage';
import { CodeCipherPage } from './components/CodeCipherPage';
import { CaesarCipherWheel } from './components/CaesarCipherWheel';
import { TheHuntPage } from './components/TheHuntPage';
import { TheBreakInPage } from './components/TheBreakInPage';
import { Level2BreakInPage } from './components/Level2BreakInPage';
import { VigenerePage } from './components/VigenerePage';
import { YouTubePlayersPage } from './components/YouTubePlayersPage';
import { LeaderBoardPage } from './components/LeaderBoardPage';
import { UserProfilePage } from './components/UserProfilePage';
import { HowToPlayGame } from './components/HowToPlayGame';
import { GameRulesPage } from './components/GameRulesPage';
import { RequirementsPage } from './components/RequirementsPage';
import { QuarterFinalsPage } from './components/QuarterFinalsPage';
import { DigitalCoinPage } from './components/DigitalCoinPage';
import { CongratsCCPage } from './components/CongratsCCPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { CommandCenterPage } from './components/CommandCenterPage';
import { GamePlayHubPage } from './components/GamePlayHubPage';
import { GamePlayAppPage } from './components/GamePlayAppPage';
import { TheHuntToolsPage } from './components/TheHuntToolsPage';
import { AuthPage } from './components/AuthPage';
import { VaultButton } from './components/VaultButton';
import { FindMePage } from './components/FindMePage';
import { CodeXChallengePage } from './components/CodeXChallengePage';
import { MissionCentralPage } from './components/MissionCentralPage';
import { VoiceofCODIE } from './components/VoiceofCODIE';
import { RPi5ArchivePage } from './components/RPi5ArchivePage';

// Specific Game Play Pages
import { GPDrillPage } from './components/GPDrillPage';
import { GPListeningDevicePage } from './components/GPListeningDevicePage';
import { GPImpactDriverPage } from './components/GPImpactDriverPage';
import { GPEndoScopePage } from './components/GPEndoScopePage';
import { GPStudFinderPage } from './components/GPStudFinderPage';
import { GPHeadphonesPage } from './components/GPHeadphonesPage';
import { GPSpraySmokePage } from './components/GPSpraySmokePage';
import { GPKey1Page } from './components/GPKey1Page';
import { GPKey2Page } from './components/GPKey2Page';
import { GPKeys1Page } from './components/GPKeys1Page';
import { GPKeys2Page } from './components/GPKeys2Page';
import { GPCodeXRingPage } from './components/GPCodeXRingPage';

import { AppView } from './types';
import { YOUTUBE_DATA, ASSETS } from './constants';

const CREATOR_DOC_ID = 'MasterCreatorFolder';

const MOCK_USER = {
  uid: '51H7yItLU9WMMiXl10xE',
  email: 'creator@codekrackerxr.com',
  displayName: 'Agent Creator',
  photoURL: 'https://i.ibb.co/SDhzf003/Vinny-Mug.png'
};

interface YoutuberSessionState {
  huntAnswers: string[];
  breakInAnswers: string[];
  keywordRiddleAnswer: string;
  crackedOutput: string;
  codedTextNorth: string;
  codedTextWest: string;
  gpsNorth: string;
  gpsWest: string;
}

const DEFAULT_SESSION: YoutuberSessionState = {
  huntAnswers: new Array(10).fill(''),
  breakInAnswers: new Array(14).fill(''),
  keywordRiddleAnswer: '',
  crackedOutput: "",
  codedTextNorth: "",
  codedTextWest: "",
  gpsNorth: "",
  gpsWest: ""
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppView>('LANDING');
  const [hubInitialSection, setHubInitialSection] = useState<string | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clueItemId, setClueItemId] = useState<string | null>(null);
  const [finalTime, setFinalTime] = useState<string | null>(null);
  const [vigenereFinalTime, setVigenereFinalTime] = useState<string | null>(null);
  const [isCipherTimerRunning, setIsCipherTimerRunning] = useState(false);
  const [isVigenereTimerRunning, setIsVigenereTimerRunning] = useState(false);
  const [vigenereElapsedTime, setVigenereElapsedTime] = useState(0);
  const [pendingNavigation, setPendingNavigation] = useState<{ view: AppView, section?: string } | null>(null);
  const [lastGPItem, setLastGPItem] = useState<string | null>(null);
  const [isFromHub, setIsFromHub] = useState(false);
  const [tacticalComms, setTacticalComms] = useState<{ message: string; id: string } | null>(null);
  const lastSeenMsgId = useRef<string | null>(null);
  
  // Data from Creator Doc for Mapping
  const [creatorMissionData, setCreatorMissionData] = useState({
    keyStreamNorth: '',
    keyStreamWest: '',
    targetGpsNorth: '',
    targetGpsWest: '',
    cipherWordNorth: '',
    cipherWordWest: ''
  });

  const activeUser = useMemo(() => currentUser || MOCK_USER, [currentUser]);
  
  const [selectedYoutuberIndex, setSelectedYoutuberIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hide hamburger menu when in CodeX Challenge "app" mode
  const isCXMode = appState.startsWith('CX_');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // --- Live Tactical Uplink & Haptics Listener ---
  useEffect(() => {
    const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
    const unsubscribe = onSnapshot(creatorRef, (snapshot) => {
      if (snapshot.exists()) {
        const liveSess = snapshot.data().LiveSession || {};
        const msg = liveSess.tacticalMessage;
        const msgId = liveSess.messageId;

        // CRITICAL: Only trigger if the message exists and is NOT the one we just saw/dismissed
        if (msg && msgId && msgId !== lastSeenMsgId.current) {
          if ("vibrate" in navigator) {
            navigator.vibrate([100, 50, 100, 50, 600]);
          }
          lastSeenMsgId.current = msgId;
          setTacticalComms({ message: msg, id: msgId });
          // Auto-clear after 25s, but don't reset lastSeenMsgId.current
          setTimeout(() => setTacticalComms(null), 25000); 
        }
      }
    });
    return () => unsubscribe();
  }, []); 

  const handleDismissTactical = useCallback(() => {
    setTacticalComms(null);
  }, []);

  // Fetch Creator Mission Data
  useEffect(() => {
    const fetchCreatorMissions = async () => {
      try {
        const creatorRef = doc(db, 'creators', 'MasterCreatorFolder');
        const snap = await getDoc(creatorRef);
        if (snap.exists()) {
          const bi = snap.data()?.TheBreakIn || {};
          const cm = bi["Coded Missions"] || {};
          setCreatorMissionData({
            keyStreamNorth: cm.KeyStreamNorth || '',
            keyStreamWest: cm.KeyStreamWest || '',
            targetGpsNorth: bi.GPSNorthLat || bi.GPSAddress || '',
            targetGpsWest: bi.GPSWestLong || '',
            cipherWordNorth: cm.CipherWordNorth || '',
            cipherWordWest: cm.CipherWordWest || ''
          });
        }
      } catch (err) {
        console.warn("Handshake error with creator missions data.");
      }
    };
    fetchCreatorMissions();
  }, [appState]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as AppView;
    const itemParam = params.get('item');

    if (viewParam) {
      const cxViews = [
        'CX_OPENING', 'CX_M1', 'CX_M2', 'CX_M3', 'CX_M4', 'CX_M5', 'CX_M6', 
        'CX_M7', 'CX_M8', 'CX_M9', 'CX_M10', 'CX_M11', 'CX_M12', 'CX_M13', 
        'CX_M14', 'CX_VAULT'
      ];
      if (cxViews.includes(viewParam)) {
        setAppState(viewParam);
      } else {
        setAppState(viewParam);
      }
    } else if (itemParam) {
      setClueItemId(itemParam);
      setAppState('THE_HUNT_TOOLS');
    }
  }, []);

  const [youtuberSessions, setYoutuberSessions] = useState<{ [key: number]: YoutuberSessionState }>({});

  const currentSession = useMemo(() => {
    return youtuberSessions[selectedYoutuberIndex] || { ...DEFAULT_SESSION };
  }, [youtuberSessions, selectedYoutuberIndex]);

  const { huntAnswers, breakInAnswers, keywordRiddleAnswer, crackedOutput, codedTextNorth, codedTextWest, gpsNorth, gpsWest } = currentSession;

  const [wheelShift, setWheelShift] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  const currentCipherCode = useMemo(() => {
    return huntAnswers.slice(0, 7).join('');
  }, [huntAnswers]);

  const mappingLetter = useMemo(() => {
    return huntAnswers[7] || 'A';
  }, [huntAnswers]);

  const setHuntAnswers = (newAnswers: string[]) => {
    setYoutuberSessions(prev => ({
      ...prev,
      [selectedYoutuberIndex]: {
        ...(prev[selectedYoutuberIndex] || DEFAULT_SESSION),
        huntAnswers: newAnswers
      }
    }));
  };

  const setBreakInAnswers = (newAnswers: string[]) => {
    setYoutuberSessions(prev => ({
      ...prev,
      [selectedYoutuberIndex]: {
        ...(prev[selectedYoutuberIndex] || DEFAULT_SESSION),
        breakInAnswers: newAnswers
      }
    }));
  };

  const setKeywordRiddleAnswer = (val: string) => {
    setYoutuberSessions(prev => ({
      ...prev,
      [selectedYoutuberIndex]: {
        ...(prev[selectedYoutuberIndex] || DEFAULT_SESSION),
        keywordRiddleAnswer: val
      }
    }));
  };

  const setCrackedOutput = (val: string | ((prev: string) => string)) => {
    setYoutuberSessions(prev => {
      const session = prev[selectedYoutuberIndex] || DEFAULT_SESSION;
      const newValue = typeof val === 'function' ? val(session.crackedOutput) : val;
      return {
        ...prev,
        [selectedYoutuberIndex]: {
          ...session,
          crackedOutput: newValue
        }
      };
    });
  };

  const updateVigenereFields = useCallback((updates: Partial<YoutuberSessionState> | ((prev: YoutuberSessionState) => Partial<YoutuberSessionState>)) => {
    setYoutuberSessions(prev => {
      const session = prev[selectedYoutuberIndex] || { ...DEFAULT_SESSION };
      const resolvedUpdates = typeof updates === 'function' ? updates(session) : updates;
      return {
        ...prev,
        [selectedYoutuberIndex]: {
          ...session,
          ...resolvedUpdates
        }
      };
    });
  }, [selectedYoutuberIndex]);

  const handleNavigate = (view: AppView, section?: string, force: boolean = false) => {
    if (!force && isCipherTimerRunning && appState === 'CAESAR_CIPHER_WHEEL') {
      setPendingNavigation({ view, section });
      return;
    }
    
    window.scrollTo(0, 0);
    setHubInitialSection(section);
    setAppState(view);
    setIsMenuOpen(false);
    setPendingNavigation(null);
  };

  const confirmPauseAndNavigate = () => {
    if (pendingNavigation) {
      setIsCipherTimerRunning(false);
      const { view, section } = pendingNavigation;
      window.scrollTo(0, 0);
      setHubInitialSection(section);
      setAppState(view);
      setIsMenuOpen(false);
      setPendingNavigation(null);
    }
  };

  const discardTimeAndNavigate = () => {
    if (pendingNavigation) {
      localStorage.removeItem('ckxr_caesar_timer_val');
      setIsCipherTimerRunning(false);
      const { view, section } = pendingNavigation;
      window.scrollTo(0, 0);
      setHubInitialSection(section);
      setAppState(view);
      setIsMenuOpen(false);
      setPendingNavigation(null);
    }
  };

  const handleNavigateToWheel = (resume: boolean = false) => {
    setIsCipherTimerRunning(resume);
    handleNavigate('CAESAR_CIPHER_WHEEL');
  };

  const handleNavigateToTheHunt = (index?: number) => {
    if (typeof index === 'number') {
      setSelectedYoutuberIndex(index);
    }
    handleNavigate('THE_HUNT');
  };

  const handleNavigateToTheBreakIn = (index?: number) => {
    if (typeof index === 'number') {
      setSelectedYoutuberIndex(index);
    }
    handleNavigate('THE_BREAK_IN');
  };

  const handleNavigateToLevel2BreakIn = (index?: number) => {
    if (typeof index === 'number') {
      setSelectedYoutuberIndex(index);
    }
    handleNavigate('LEVEL2_BREAK_IN');
  };

  const handleNavigateToRecommended = (index: number) => {
    const session = youtuberSessions[index] || DEFAULT_SESSION;
    const isHuntComplete = session.huntAnswers.every(ans => ans && ans.trim() !== '');
    
    if (isHuntComplete) {
      handleNavigateToLevel2BreakIn(index);
    } else {
      handleNavigateToTheHunt(index);
    }
  };

  const handleCodeSuccess = () => {
    handleNavigate('YOUTUBE_PLAYERS');
  };

  const selectedYoutuber = YOUTUBE_DATA[selectedYoutuberIndex];

  const handleNavigateToItem = (item: string, fromHub: boolean = false) => {
    setLastGPItem(item);
    setIsFromHub(fromHub);
    if (item === "Drill") handleNavigate('GP_DRILL');
    else if (item === "Listening Device") handleNavigate('GP_LISTENING_DEVICE');
    else if (item === "Impact Driver") handleNavigate('GP_IMPACT_DRIVER');
    else if (item === "EndoScope") handleNavigate('GP_ENDO_SCOPE');
    else if (item === "Stud Finder") handleNavigate('GP_STUD_FINDER');
    else if (item === "Headphones") handleNavigate('GP_HEADPHONES');
    else if (item === "SpraySmoke" || item === "Spray Smoke") handleNavigate('GP_SPRAY_SMOKE');
    else if (item === "Key 1 Solis") handleNavigate('GP_KEYS1');
    else if (item === "Key 1 Noctis") handleNavigate('GP_KEYS2');
    else if (item === "CodeX Ring") handleNavigate('GP_CODE_X_RING');
    else { setClueItemId(item); handleNavigate('THE_HUNT_TOOLS'); }
  };

  const getItemIndex = (item: string) => {
    const items = ["Drill", "Listening Device", "Impact Driver", "EndoScope", "Stud Finder", "Headphones", "SpraySmoke", "Key 1 Solis", "Key 1 Noctis", "CodeX Ring"];
    return items.indexOf(item);
  };

  const handleBackToEdit = (item: string) => {
    const idx = getItemIndex(item);
    if (idx !== -1) {
      handleNavigate('GAME_PLAY_HUB', `item_${idx}_open`);
    } else {
      handleNavigate('GAME_PLAY_HUB', 'hidingItems');
    }
  };

  const handleCongratsNavigation = (time?: string) => {
    if (time) setFinalTime(time);
    else setFinalTime(null);
    handleNavigate('CONGRATS_CC', undefined, true);
  };

  const handleQuarterFinalsNavigation = (time?: string) => {
    if (time) setVigenereFinalTime(time);
    else setVigenereFinalTime(null);
    handleNavigate('QUARTER_FINALS', undefined, true);
  };

  useEffect(() => {
    const savedTime = localStorage.getItem('ckxr_vigenere_timer_val');
    if (savedTime) setVigenereElapsedTime(parseInt(savedTime, 10));
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (isVigenereTimerRunning) {
      interval = window.setInterval(() => {
        setVigenereElapsedTime(prev => {
          const next = prev + 10;
          localStorage.setItem('ckxr_vigenere_timer_val', next.toString());
          return next;
        });
      }, 10);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isVigenereTimerRunning]);

  return (
    <main className="min-h-screen w-full bg-black text-white relative">
      
      {!isCXMode && (
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="fixed top-6 right-6 z-[100] p-3 bg-black/40 backdrop-blur-md border border-vault-gold/30 rounded-lg hover:border-vault-gold transition-all duration-300 group shadow-lg active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between items-center">
            <span className={`block w-full h-0.5 bg-vault-gold transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[9px]' : ''}`}></span>
            <span className={`block w-full h-0.5 bg-vault-gold transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-full h-0.5 bg-vault-gold transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`}></span>
          </div>
        </button>
      )}

      {isMenuOpen && !isCXMode && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out] flex flex-col items-center overflow-y-auto scrollbar-hide py-16 px-6">
          <div className="absolute top-0 left-0 w-full h-full bg-mesh opacity-10 pointer-events-none fixed" />
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="w-full max-w-[280px] md:max-w-[512px] h-auto object-contain mb-12 opacity-90 flex-shrink-0" />
          <nav className="flex flex-col items-center gap-4 md:gap-5 py-4 px-4 w-full max-md">
            {[
              { id: 'LANDING', label: 'Home' },
              { id: 'CX_OPENING', label: 'CodeX Challenge' },
              { id: 'YOUTUBER', label: 'The Viral Loop' },
              { id: 'AUTH', label: currentUser ? 'Agent Console' : 'Login / Sign Up' },
              { id: 'USER_PROFILE', label: 'My Profile' },
              { id: 'YOUTUBE_PLAYERS', label: 'Game Players' },
              { id: 'LEADERBOARD', label: 'Leader Board' },
              { id: 'THE_HUNT_TOOLS', label: 'List of Tools' },
              { id: 'FIND_ME', label: 'Find Me' },
              { id: 'THE_HUNT', label: 'The Hunt' },
              { id: 'CAESAR_CIPHER_WHEEL', label: 'Caesar Cipher' },
              { id: 'DIGITAL_COIN', label: 'Digital Coin' },
              { id: 'LEVEL2_BREAK_IN', label: 'Level 2 Break-In' },
              { id: 'THE_BREAK_IN', label: 'The Break-In' },
              { id: 'VIGENERE', label: 'Vigenere Matrix' },
              { id: 'QUARTER_FINALS', label: 'Quarter-Finals' },
              { id: 'MISSION_CENTRAL', label: 'Mission Central' },
              { id: 'VOICE_OF_CODIE', label: 'Voice of CODIE' },
              { id: 'GAME_PLAY_HUB', label: 'Game Play Hub' },
              { id: 'GAMEPLAY_APP', label: 'Production App' },
              { id: 'COMMAND_CENTER', label: 'Command Center' },
              { id: 'RPI5_ARCHIVE', label: 'RPi5 Neural Core' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id as AppView)}
                className={`font-display text-base md:text-xl font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-110 whitespace-nowrap block w-full text-center ${appState === link.id ? 'text-vault-gold' : 'text-white/60 hover:text-white'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {pendingNavigation && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
          <div className="w-full max-md bg-vault-panel border-2 border-vault-gold p-10 rounded-3xl text-center relative overflow-hidden shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-6">Pause Protocol?</h3>
            <p className="text-gray-300 font-sans text-lg mb-10 leading-relaxed italic">"Do you want to pause the timer? It will reactivate when you return."</p>
            <div className="flex flex-col gap-4">
              <VaultButton variant="primary" onClick={confirmPauseAndNavigate} className="py-4 text-xl">YES, PAUSE & EXIT</VaultButton>
              <VaultButton variant="secondary" onClick={discardTimeAndNavigate} className="py-4 text-xl border-2">CANCEL</VaultButton>
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      {appState === 'LANDING' && <LandingPage onNavigateToYouTuber={() => handleNavigate('YOUTUBER')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} />}
      {appState === 'AUTH' && <AuthPage onSuccess={() => handleNavigate('USER_PROFILE')} onBack={() => handleNavigate('LANDING')} />}
      {appState === 'USER_PROFILE' && <UserProfilePage onBack={() => handleNavigate('LANDING')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} user={activeUser} />}
      {appState === 'LEADERBOARD' && <LeaderBoardPage onNavigateToBreakIn={(index) => handleNavigateToTheBreakIn(index)} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} />}
      {appState === 'THE_HUNT' && <TheHuntPage onNavigateToWheel={handleNavigateToWheel} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} onNavigateToLeaderBoard={() => handleNavigate('LEADERBOARD')} onNavigateToBreakIn={handleNavigateToTheBreakIn} huntAnswers={huntAnswers} setHuntAnswers={setHuntAnswers} youtuber={selectedYoutuber} />}
      {appState === 'THE_BREAK_IN' && <TheBreakInPage onNavigateToWheel={() => handleNavigateToTheHunt()} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} onNavigateToLeaderBoard={() => handleNavigate('LEADERBOARD')} onNavigateToHunt={() => handleNavigateToTheHunt()} onNavigateToVigenere={(resume) => { setIsVigenereTimerRunning(resume); handleNavigate('VIGENERE'); }} onNavigateToLevel2BreakIn={() => handleNavigate('LEVEL2_BREAK_IN')} breakInAnswers={breakInAnswers} setBreakInAnswers={setBreakInAnswers} keywordRiddleAnswer={keywordRiddleAnswer} setKeywordRiddleAnswer={setKeywordRiddleAnswer} youtuber={selectedYoutuber} user={activeUser} />}
      {appState === 'LEVEL2_BREAK_IN' && <Level2BreakInPage onNavigateToWheel={() => handleNavigateToTheHunt()} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} onNavigateToLeaderBoard={() => handleNavigate('LEADERBOARD')} onNavigateToHunt={() => handleNavigateToTheHunt()} onNavigateToVigenere={() => handleNavigate('VIGENERE')} onNavigateToTheBreakIn={() => handleNavigate('THE_BREAK_IN')} breakInAnswers={breakInAnswers} setBreakInAnswers={setBreakInAnswers} keywordRiddleAnswer={keywordRiddleAnswer} setKeywordRiddleAnswer={setKeywordRiddleAnswer} youtuber={selectedYoutuber} />}
      {appState === 'VIGENERE' && <VigenerePage onNavigateToTheBreakIn={() => handleNavigate('THE_BREAK_IN')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} onNavigateToQuarterFinals={handleQuarterFinalsNavigation} youtuber={selectedYoutuber} breakInAnswers={breakInAnswers} keywordRiddleAnswer={keywordRiddleAnswer} codedTextNorth={codedTextNorth} codedTextWest={codedTextWest} gpsNorth={gpsNorth} gpsWest={gpsWest} updateFields={updateVigenereFields} isTimerActiveExternal={isVigenereTimerRunning} setIsTimerActiveExternal={setIsVigenereTimerRunning} elapsedTime={vigenereElapsedTime} creatorKeyStreamNorth={creatorMissionData.keyStreamNorth} creatorKeyStreamWest={creatorMissionData.keyStreamWest} targetGpsNorth={creatorMissionData.targetGpsNorth} targetGpsWest={creatorMissionData.targetGpsWest} />}
      {appState === 'YOUTUBE_PLAYERS' && <YouTubePlayersPage onNavigateToHunt={(index) => handleNavigateToTheHunt(index)} onNavigateToLevel2BreakIn={(index) => handleNavigateToLevel2BreakIn(index)} onNavigateToLeaderBoard={() => handleNavigate('LEADERBOARD')} onNavigateToRecommended={handleNavigateToRecommended} />}
      {appState === 'GAME_PLAY_HUB' && <GamePlayHubPage user={activeUser} initialSection={hubInitialSection} onBack={() => handleNavigate('LANDING')} onNavigateToItem={handleNavigateToItem} onNavigateToMissionCentral={() => handleNavigate('MISSION_CENTRAL')} onNavigateToGamePlayApp={() => handleNavigate('GAMEPLAY_APP')} />}
      {appState === 'GAMEPLAY_APP' && <GamePlayAppPage onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToMissionCentral={() => handleNavigate('MISSION_CENTRAL')} />}
      {appState === 'CONGRATS_CC' && <CongratsCCPage onBackToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} onNavigateToCoin={() => handleNavigate('DIGITAL_COIN')} finalTime={finalTime} />}
      {appState === 'DIGITAL_COIN' && <DigitalCoinPage onBackToCongrats={() => handleNavigate('CONGRATS_CC')} youtuber={selectedYoutuber} />}
      {appState === 'QUARTER_FINALS' && <QuarterFinalsPage onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} gpsNorth={gpsNorth} gpsWest={gpsWest} youtuber={selectedYoutuber} vigenereFinalTime={vigenereFinalTime} />}
      {appState === 'YOUTUBER' && <YouTuberPage onBack={() => handleNavigate('LANDING')} onNavigateToCipher={() => handleNavigate('CODE_CIPHER')} />}
      {appState === 'CODE_CIPHER' && <CodeCipherPage onBack={() => handleNavigate('LANDING')} onSuccess={handleCodeSuccess} initialCode={currentCipherCode} />}
      {appState === 'COMMAND_CENTER' && <CommandCenterPage onBack={() => handleNavigate('LANDING')} />}
      {appState === 'FIND_ME' && <FindMePage onNavigateToHunt={() => handleNavigate('THE_HUNT')} user={activeUser} onNavigateToItem={handleNavigateToItem} />}
      {appState === 'MISSION_CENTRAL' && <MissionCentralPage onBack={() => handleNavigate('GAME_PLAY_HUB')} user={activeUser} onNavigateToHub={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToGamePlayApp={() => handleNavigate('GAMEPLAY_APP')} />}
      {appState === 'VOICE_OF_CODIE' && <VoiceofCODIE onBack={() => handleNavigate('GAME_PLAY_HUB')} />}
      {appState === 'RPI5_ARCHIVE' && <RPi5ArchivePage onBack={() => handleNavigate('COMMAND_CENTER')} />}
      
      {/* Missing handlers for legal and informational views */}
      {appState === 'HOW_TO_PLAY' && <HowToPlayGame onBack={() => handleNavigate('LANDING')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} />}
      {appState === 'GAME_RULES' && <GameRulesPage onBack={() => handleNavigate('LANDING')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} />}
      {appState === 'REQUIREMENTS' && <RequirementsPage onBack={() => handleNavigate('LANDING')} onNavigateToPlayers={() => handleNavigate('YOUTUBE_PLAYERS')} />}
      {appState === 'PRIVACY_POLICY' && <PrivacyPolicyPage onBack={() => handleNavigate('LANDING')} />}
      {appState === 'TERMS_OF_SERVICE' && <TermsOfServicePage onBack={() => handleNavigate('LANDING')} />}

      {/* CodeX Challenge 16 Separate Mission Pages */}
      {appState === 'CX_OPENING' && <CodeXChallengePage stepIndex={0} onBack={() => handleNavigate('LANDING')} onNext={() => handleNavigate('CX_M1')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M1' && <CodeXChallengePage stepIndex={1} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_OPENING')} onNext={() => handleNavigate('CX_M2')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M2' && <CodeXChallengePage stepIndex={2} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M1')} onNext={() => handleNavigate('CX_M3')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M3' && <CodeXChallengePage stepIndex={3} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M2')} onNext={() => handleNavigate('CX_M4')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M4' && <CodeXChallengePage stepIndex={4} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M3')} onNext={() => handleNavigate('CX_M5')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M5' && <CodeXChallengePage stepIndex={5} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M4')} onNext={() => handleNavigate('CX_M6')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M6' && <CodeXChallengePage stepIndex={6} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M5')} onNext={() => handleNavigate('CX_M7')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M7' && <CodeXChallengePage stepIndex={7} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M6')} onNext={() => handleNavigate('CX_M8')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M8' && <CodeXChallengePage stepIndex={8} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M7')} onNext={() => handleNavigate('CX_M9')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M9' && <CodeXChallengePage stepIndex={9} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M8')} onNext={() => handleNavigate('CX_M10')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M10' && <CodeXChallengePage stepIndex={10} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M9')} onNext={() => handleNavigate('CX_M11')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M11' && <CodeXChallengePage stepIndex={11} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M10')} onNext={() => handleNavigate('CX_M12')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M12' && <CodeXChallengePage stepIndex={12} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M11')} onNext={() => handleNavigate('CX_M13')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M13' && <CodeXChallengePage stepIndex={13} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M12')} onNext={() => handleNavigate('CX_M14')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_M14' && <CodeXChallengePage stepIndex={14} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M13')} onNext={() => handleNavigate('CX_VAULT')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}
      {appState === 'CX_VAULT' && <CodeXChallengePage stepIndex={15} onBack={() => handleNavigate('LANDING')} onPrev={() => handleNavigate('CX_M14')} creatorMissionData={creatorMissionData} tacticalComms={tacticalComms} onDismissComms={handleDismissTactical} />}

      {appState === 'THE_HUNT_TOOLS' && <TheHuntToolsPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToItem={handleNavigateToItem} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} lastGPItem={lastGPItem} />}
      {appState === 'GP_DRILL' && <GPDrillPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Drill')} />}
      {appState === 'GP_LISTENING_DEVICE' && <GPListeningDevicePage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Listening Device')} />}
      {appState === 'GP_IMPACT_DRIVER' && <GPImpactDriverPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Impact Driver')} />}
      {appState === 'GP_ENDO_SCOPE' && <GPEndoScopePage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('EndoScope')} />}
      {appState === 'GP_STUD_FINDER' && <GPStudFinderPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Stud Finder')} />}
      {appState === 'GP_HEADPHONES' && <GPHeadphonesPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Headphones')} />}
      {appState === 'GP_SPRAY_SMOKE' && <GPSpraySmokePage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('SpraySmoke')} />}
      {appState === 'GP_KEYS1' && <GPKeys1Page user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Key 1 Solis')} />}
      {appState === 'GP_KEYS2' && <GPKeys2Page user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('Key 1 Noctis')} />}
      {appState === 'GP_CODE_X_RING' && <GPCodeXRingPage user={activeUser} onBack={() => handleNavigate('GAME_PLAY_HUB')} onNavigateToHub={(sec) => handleNavigate('GAME_PLAY_HUB', sec)} onNavigateToClues={() => handleNavigate('THE_HUNT_TOOLS')} onNavigateToItem={handleNavigateToItem} onNavigateToTheHunt={() => handleNavigate('FIND_ME')} isFromHub={isFromHub} onBackToEdit={() => handleBackToEdit('CodeX Ring')} />}

      {appState === 'CAESAR_CIPHER_WHEEL' && (
        <CaesarCipherWheel 
          onBack={() => handleNavigate('LANDING')} 
          onNavigateToTheHunt={() => handleNavigate('THE_HUNT')} 
          onNavigateToDigitalCoin={handleCongratsNavigation} 
          initialInput={currentCipherCode} 
          crackedOutput={crackedOutput} 
          setCrackedOutput={setCrackedOutput} 
          mappingLetter={mappingLetter} 
          shift={wheelShift} 
          setShift={setWheelShift} 
          currentRotation={wheelRotation} 
          setCurrentRotation={setWheelRotation} 
          youtuber={selectedYoutuber} 
          huntAnswers={huntAnswers} 
          isTimerActiveExternal={isCipherTimerRunning}
          setIsTimerActiveExternal={setIsCipherTimerRunning}
        />
      )}
    </main>
  );
};

export default App;
