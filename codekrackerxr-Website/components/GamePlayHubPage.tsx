
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, deleteField } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { GoogleGenAI, Type } from "@google/genai";

const CREATOR_DOC_ID = 'MasterCreatorFolder';
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const HIDING_ITEMS_LIST = [
  "Drill", "Listening Device", "Impact Driver", "EndoScope", "Stud Finder",
  "Headphones", "SpraySmoke", "Key 1 Solis", "Key 1 Noctis", "CodeX Ring"
];

type FieldStatus = 'synced' | 'dirty' | 'error' | 'none';

// Helper to merge nested objects for setDoc
const setDeepValue = (obj: any, path: string, value: any) => {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
};

const ShimmerDropdown: React.FC<{
  title: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  noShimmer?: boolean;
  noHover?: boolean;
  className?: string;
  headerExtra?: React.ReactNode;
  isMain?: boolean;
}> = ({ title, isOpen, onToggle, children, noShimmer, noHover, className = "mb-6", headerExtra, isMain }) => {
  return (
    <div 
      className={`w-full bg-vault-panel/80 border border-white/10 rounded-[2rem] p-4 md:p-6 ${className} shadow-xl transition-all relative overflow-hidden cursor-pointer ${!noHover ? 'hover:border-vault-gold/40 group' : ''}`}
      onClick={onToggle}
    >
       {!noShimmer && !noHover && (
         <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isOpen ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
       )}
       <div className="relative z-10 w-full flex items-center justify-between">
         <div className={`${isMain ? 'text-[20px] md:text-[32px]' : 'text-[18px] md:text-[22px]'} font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors`}>{title}</div>
         <div className="flex items-center gap-4">
           {headerExtra}
           <svg className={`w-6 h-6 text-vault-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
         </div>
       </div>
       <div 
         className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[25000px] mt-8 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
         onClick={(e) => e.stopPropagation()}
       >
          <div className={`${isMain ? 'px-2 md:px-6' : ''}`}>
            {children}
          </div>
       </div>
    </div>
  );
};

const StatusBullet: React.FC<{ status: FieldStatus }> = ({ status }) => {
  if (status === 'none') return null;
  const color = status === 'synced' ? '#22c55e' : status === 'dirty' ? '#f97316' : '#ef4444';
  return <span className="ml-2 text-xl leading-none transition-colors duration-300" style={{ color }}>●</span>;
};

const InputGroup: React.FC<{ 
  label?: React.ReactNode; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  isTextArea?: boolean;
  type?: string;
  onAskAI?: () => void;
  isLoadingAI?: boolean;
  labelTracking?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  labelClassName?: string;
  status?: FieldStatus;
  inputClassName?: string;
  placeholderClassName?: string;
  maxLength?: number;
  trailingButton?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    variant?: 'gold' | 'green' | 'red';
  };
  resize?: boolean;
}> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  isTextArea, 
  type = 'text',
  onAskAI, 
  isLoadingAI, 
  labelTracking = "tracking-[0.2em]", 
  className = "mb-8", 
  disabled, 
  readOnly,
  labelClassName, 
  status = 'none',
  inputClassName = "",
  placeholderClassName = "placeholder:text-white/30",
  maxLength,
  trailingButton,
  resize
}) => {
  const labelClasses = labelClassName || "text-vault-gold group-hover/field:text-white";
  
  return (
    <div className={`flex flex-col gap-2 group/field w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between px-1">
          <label className={`text-[11px] md:text-[13px] font-display font-black uppercase ${labelTracking} transition-colors cursor-default whitespace-nowrap flex items-center ${labelClasses}`}>
            {label}
            <StatusBullet status={status} />
          </label>
          {onAskAI && (
            <button 
              onClick={onAskAI} 
              disabled={isLoadingAI}
              className="text-[10px] md:text-[12px] font-display font-black bg-vault-gold/10 border border-vault-gold/40 text-vault-gold px-4 py-1.5 rounded-lg hover:bg-vault-gold hover:text-black transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg active:scale-95"
            >
              {isLoadingAI ? 'ANALYZING...' : 'ASK AI'}
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16z" /></svg>
            </button>
          )}
        </div>
      )}
      <div className="flex items-stretch gap-4 w-full">
        <div className="relative group/box overflow-hidden rounded-xl flex-1">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 scale-y-0 group-hover/box:scale-y-100 group-hover/box:bg-vault-gold transition-all duration-300 z-10" />
          
          {isTextArea ? (
            <textarea 
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`w-full bg-black/40 border-2 border-white/5 rounded-xl px-6 py-5 font-sans text-lg md:text-[20px] text-white focus:outline-none focus:border-vault-gold/50 hover:bg-white/[0.05] transition-all min-h-[140px] ${resize ? 'resize-y' : 'resize-none'} shadow-inner disabled:opacity-50 ${readOnly ? 'cursor-default' : ''} ${placeholderClassName} ${inputClassName}`}
            />
          ) : (
            <input 
              type={type}
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`w-full bg-black/40 border-2 border-white/5 rounded-xl px-6 py-5 font-sans text-lg md:text-[20px] text-white focus:outline-none focus:border-vault-gold/50 hover:bg-white/[0.05] transition-all shadow-inner disabled:opacity-50 ${readOnly ? 'cursor-default' : ''} ${placeholderClassName} ${inputClassName}`}
            />
          )}
        </div>
        {trailingButton && (
          <button 
            onClick={trailingButton.onClick}
            disabled={trailingButton.disabled || trailingButton.isLoading}
            className={`px-6 md:px-10 font-display font-black uppercase tracking-widest text-[11px] md:text-[13px] rounded-xl transition-all shadow-lg active:scale-95 whitespace-nowrap border-2 
              ${trailingButton.isLoading 
                ? (trailingButton.variant === 'green' ? 'bg-[#22c55e] text-white animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.4)] border-[#22c55e]' : trailingButton.variant === 'red' ? 'bg-vault-alert text-white animate-pulse shadow-[0_0_20px_rgba(255,51,51,0.4)] border-vault-alert' : 'bg-vault-gold text-black animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.4)] border-vault-gold') 
                : (trailingButton.variant === 'red' ? 'bg-vault-alert text-white border-vault-alert shadow-[0_0_15px_rgba(255,51,51,0.3)]' : trailingButton.variant === 'green' ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white text-black border-transparent hover:bg-vault-gold')
              }
              ${trailingButton.disabled && !trailingButton.isLoading ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            {trailingButton.label}
          </button>
        )}
      </div>
    </div>
  );
};

const UploadField: React.FC<{ 
  label?: React.ReactNode; 
  onFileSelect: (file: File) => void; 
  previewUrl?: string; 
  labelTracking?: string; 
  className?: string; 
  subText?: string; 
  labelClassName?: string;
  isCompact?: boolean;
  buttonText?: string;
  hidePreview?: boolean;
  status?: FieldStatus;
  align?: 'left' | 'right';
}> = ({ label, onFileSelect, previewUrl, labelTracking = "tracking-[0.2em]", className = "mb-8", subText, labelClassName, isCompact, buttonText = "UPLOAD", hidePreview = false, status = 'none', align = 'left' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelClasses = labelClassName || "text-vault-gold group-hover/field:text-white";

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2 group/field ${isCompact ? '' : 'w-full'} ${className} ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {label && (
        <label className={`text-[11px] md:text-[13px] font-display font-black uppercase ${labelTracking} transition-colors cursor-default whitespace-nowrap flex items-center ${labelClasses}`}>
          {label}
        </label>
      )}
      <div className={`relative group/box overflow-hidden rounded-xl w-full ${align === 'right' ? 'max-w-[280px]' : ''}`}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 scale-y-0 group-hover/box:scale-y-100 group-hover/box:bg-vault-gold transition-all duration-300 z-10" />
        
        <div className={`flex items-center gap-4 bg-black/30 border-2 border-dashed border-white/10 rounded-xl transition-all hover:bg-white/[0.05] group-hover/box:border-vault-gold/20 overflow-hidden w-full ${isCompact ? 'p-1' : 'p-4'} ${align === 'right' ? 'justify-end' : ''}`}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={handleClick}
            className={`${isCompact ? 'px-4 py-2.5 text-[10px]' : 'px-6 py-2.5 text-xs md:text-[14px]'} bg-white text-black rounded-lg font-display font-black uppercase tracking-[0.2em] hover:bg-vault-gold transition-all shadow-[0_5px_15px_rgba(255,255,255,0.1)] active:scale-95 whitespace-nowrap`}
          >
            {buttonText}
          </button>
          
          {!hidePreview && (
            <div className="flex-shrink-0">
              {previewUrl && (
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-vault-gold/40 overflow-hidden bg-black shadow-[0_0_100px_rgba(212,175,55,0.2)] animate-[fadeIn_0.3s_ease-out]">
                  <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                </div>
              )}
              {!previewUrl && subText && !isCompact && <p className="text-[10px] text-white/30 uppercase tracking-widest">{subText}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PageDoneBullet: React.FC<{ status: 'yellow' | 'red' | 'green' }> = ({ status }) => {
  const color = status === 'green' ? '#22c55e' : status === 'red' ? '#ef4444' : '#d4af37';
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-vault-gold p-[3px] ml-4 flex-shrink-0">
      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
};

export const GamePlayHubPage: React.FC<{ user: any, onBack: () => void, onNavigateToItem: (item: string, fromHub?: boolean) => void, initialSection?: string, onNavigateToMissionCentral: () => void, onNavigateToGamePlayApp: () => void }> = ({ user, onBack, onNavigateToItem, initialSection, onNavigateToMissionCentral, onNavigateToGamePlayApp }) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    credentials: false,
    hunt: initialSection === 'hunt' || initialSection?.startsWith('item_'),
    coin: false,
    breakin: false,
    locationCodes: false,
    hidingItems: initialSection === 'hidingItems' || initialSection?.startsWith('item_'),
    breakin_RiddlesAns: false,
    breakin_CodedMissions: false,
    coin_TheCoin: false,
    coin_Stage1: false,
    coin_Stage2: false,
    coin_Stage3: false,
    coin_Stage4: false,
    coin_Stage5: false,
    ...Array.from({ length: 10 }).reduce<Record<string, boolean>>((acc, _, i) => ({ 
      ...acc, 
      [`item_${i}_open`]: initialSection === `item_${i}_open` 
    }), {})
  });
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  
  const [syncingTarget, setSyncingTarget] = useState<string | null>(null);
  const isSyncing = syncingTarget !== null;
  
  const [customError, setCustomError] = useState<{ title: string; message: string; onConfirm?: () => void } | null>(null);
  const [networkError, setNetworkError] = useState<{ show: boolean, message: string } | null>(null);
  const [suggestionModal, setSuggestionModal] = useState<{ targetField: string; riddles: string[] } | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<{ base64: string; fileName: string; target: string; index?: number } | null>(null);
  const [itemValidationError, setItemValidationError] = useState<{ item: string, missing: string[], unsynced: string[] } | null>(null);
  
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [deleteImageConfirm, setDeleteImageConfirm] = useState<{ target: string; index?: number; url: string } | null>(null);

  const [formData, setFormData] = useState<any>({
    adminEmail: '', adminPhone: '', creatorEmail: '', creatorPhone: '',
    firstName: '', lastName: '', creatorName: '', creatorTeam: '', landingPage: '',
    avatarImageBase64: '', creatorAvatarName: '',
    huntCity: '', huntState: '', huntAddress: '', ringRiddleAnswer: '', ringRiddle: '',
    huntCityName: '', shiftKey: '', codedWord: '', huntVideoLink: '', huntThumbnail: '',
    SecretImage: '', SecretWord: '', CoinHint: '', CoinWebaddress: '', DigitalCoilValue: '', DigitalCointhumbnail: '', DigitalCoinShort: '', WorkingCoin: '',
    WorkingCoinImage: '', WorkingCoinNotes: '', workingCoinStatus: 'not_started',
    dcStage1Clues: '', dcStage1Facts: '',
    dcStage1NumPlaces: '', dcStage1State: '', dcStage1EliminateMsg: '', dcStage1Thumbnail: '', dcStage1Short: '', dcStage1HuntRiddle: '', dcStage1Answer: '',
    dcStage2Clues: '', dcStage2Facts: '',
    dcStage2State: '',
    dcStage2Thumbnail: '', dcStage2Short: '', dcStage2HuntRiddle: '', dcStage2Answer: '',
    dcStage3HuntFind: '', dcStage3HuntAnswer: '',
    dcStage4Facts: '',
    dcStage4LiveDate: '', dcStage4LiveNotes: '', dcStage4Thumbnail: '', dcStage4Short: '', dcStage4Hunt1: '', dcStage4Clues1: '', dcStage4Answer: '',
    dcStage4Password: '', dcStage4Hunt2: '', dcStage4Clues2: '', dcStage4Hunt3: '', dcStage4Clues3: '',
    dcStage4Answer1: '', dcStage4Answer2: '', dcStage4Answer3: '',
    dcStage5BurnerPhone: '', dcStage5WinnersInfo: '',
    breakInCity: '', breakInState: '', gpsNorthLat: '', gpsWestLong: '', breakInVideo: '', breakInThumbnail: '', breakInAnswer: '',
    breakInRiddle: '', sponsorRiddle: '', sponsorKeyword: '', vaultAddress: '',
    finalTime: '',
    cipherWordNorth: '', cipherWordWest: '', cipherNumberNorth: '', cipherNumberWest: '',
    keyStreamNorth: '', keyStreamWest: '',
    hidingItems: HIDING_ITEMS_LIST.map(() => ({ notes: '', photo: '', clue: '', filmingNotes: '', masterPhoto: '', creatorClue: '', gps: '' }))
  });

  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});
  const [itemDoneStatus, setItemDoneStatus] = useState<Record<number, 'yellow' | 'red' | 'green'>>(
    (() => {
      const initial: Record<number, 'yellow' | 'red' | 'green'> = {};
      for (let i = 0; i < 10; i++) {
        initial[i] = 'yellow';
      }
      return initial;
    })()
  );

  const [locationCodesDoneStatus, setLocationCodesDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [breakInRiddlesAnsDoneStatus, setBreakInRiddlesAnsDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');

  // Digital Coin sub-section statuses
  const [theCoinDoneStatus, setTheCoinDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [dcStage1DoneStatus, setDcStage1DoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [dcStage2DoneStatus, setDcStage2DoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [dcStage3DoneStatus, setDcStage3DoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [dcStage4DoneStatus, setDcStage4DoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [dcStage5DoneStatus, setDcStage5DoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');

  const hidingItemsAggregateStatus = useMemo(() => {
    const statuses = Object.values(itemDoneStatus);
    if (statuses.every(s => s === 'green')) return 'green';
    if (statuses.some(s => s === 'red')) return 'red';
    return 'yellow';
  }, [itemDoneStatus]);

  // Aggregate Status for Main Sections
  const huntMainStatus = useMemo(() => {
    if (locationCodesDoneStatus === 'green' && hidingItemsAggregateStatus === 'green') return 'green';
    if (locationCodesDoneStatus === 'red' || hidingItemsAggregateStatus === 'red') return 'red';
    return 'yellow';
  }, [locationCodesDoneStatus, hidingItemsAggregateStatus]);

  const coinMainStatus = useMemo(() => {
    const statuses = [theCoinDoneStatus, dcStage1DoneStatus, dcStage2DoneStatus, dcStage3DoneStatus, dcStage4DoneStatus, dcStage5DoneStatus];
    if (statuses.every(s => s === 'green')) return 'green';
    if (statuses.some(s => s === 'red')) return 'red';
    return 'yellow';
  }, [theCoinDoneStatus, dcStage1DoneStatus, dcStage2DoneStatus, dcStage3DoneStatus, dcStage4DoneStatus, dcStage5DoneStatus]);

  const breakInMainStatus = useMemo(() => {
    return breakInRiddlesAnsDoneStatus;
  }, [breakInRiddlesAnsDoneStatus]);

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
        const snapshot = await getDoc(creatorRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cl = data.CreatorLinks || {};
          const pi = cl["Personal Info"] || {};
          const th = data.TheHunt || {};
          const h10 = th["Hunt 10 Items"] || {};
          const gpi = h10["Game Play Images"] || {}; 
          const dc = data.DigitalCoin || {};
          
          const tc = dc.TheCoin || {};
          const s1 = dc.Stage1 || {};
          const s2 = dc.Stage2 || {};
          const s3 = dc.Stage3 || {};
          const s4 = dc.Stage4 || {};
          const s5 = dc.Stage5 || {};

          const bi = data.TheBreakIn || {};
          const biTimeLoc = bi["Time and location"] || {};
          const biRiddlesAns = bi["Riddles and answers"] || {};
          const cm = bi["Coded Missions"] || {};

          const hidingItems = HIDING_ITEMS_LIST.map((name) => {
            let dbKey = name.replace(/\s+/g, '');
            if (name === "Key 1 Solis") dbKey = "Key1";
            if (name === "Key 1 Noctis") dbKey = "Key2";
            return {
              notes: h10[`${dbKey}Notes`] || '',
              photo: h10[`Find${dbKey}Image`] || '',
              clue: h10[`${dbKey}Clue`] || '',
              filmingNotes: h10[`${dbKey}FilmingNotes`] || '',
              masterPhoto: gpi[`GP${dbKey}Image`] || '',
              creatorClue: h10[`Creator${dbKey}Clue`] || '',
              gps: h10[`${dbKey}GPS`] || ''
            };
          });

          // Automatic initial evaluation of individual page statuses
          const initialItemDoneStatus: Record<number, 'yellow' | 'red' | 'green'> = {};
          hidingItems.forEach((item, idx) => {
            const hasAllData = item.gps?.trim() && item.notes?.trim() && item.creatorClue?.trim() && item.filmingNotes?.trim() && item.photo && item.masterPhoto;
            initialItemDoneStatus[idx] = hasAllData ? 'green' : 'yellow';
          });
          setItemDoneStatus(initialItemDoneStatus);

          const initialFormData = { 
            adminEmail: pi.AdminEmail || '',
            adminPhone: pi.AdminPhone || '',
            creatorEmail: pi.CreatorEmail || '',
            creatorPhone: pi.CreatorPhone || '',
            firstName: pi.FirstName || '',
            lastName: pi.LastName || '',
            creatorName: cl.CreatorName || '',
            creatorTeam: cl.CreatorTeam || '',
            landingPage: cl.LandingPage || '',
            avatarImageBase64: cl.AvatarImage || '',
            creatorAvatarName: cl.AvatarImage ? 'Active Identity Data' : '',
            huntCity: th.City || '',
            huntState: th.State || '',
            huntAddress: th.HuntAddress || '',
            ringRiddleAnswer: th.RingRiddleAnswer || '',
            ringRiddle: th.RingRiddle || '',
            huntCityName: th.CityName || '',
            shiftKey: th.ShiftKey || '',
            codedWord: th.HuntCodedWord || th.CodedWord || '',
            huntVideoLink: th.HuntVideoLink || '',
            huntThumbnail: th.HuntThumbnail || '',
            hidingItems: hidingItems,
            
            SecretImage: tc.SecretImage || '',
            SecretWord: tc.SecretWord || '',
            CoinHint: tc.CoinHint || '',
            CoinWebaddress: tc.CoinWebaddress || '',
            DigitalCoilValue: tc.DigitalCoilValue || '',
            WorkingCoin: tc.WorkingCoin || '',
            WorkingCoinImage: tc.WorkingCoinImage || '',
            WorkingCoinNotes: tc.WorkingCoinNotes || '',
            workingCoinStatus: tc.workingCoinStatus || 'not_started',
            
            dcStage1Clues: s1.dcStage1Clues || '',
            dcStage1Facts: s1.dcStage1Facts || '',
            dcStage1NumPlaces: s1.dcStage1NumPlaces || '',
            dcStage1State: s1.dcStage1State || '',
            dcStage1EliminateMsg: s1.dcStage1EliminateMsg || '',
            dcStage1Thumbnail: s1.dcStage1Thumbnail || '',
            dcStage1Short: s1.dcStage1Short || '',
            dcStage1HuntRiddle: s1.dcStage1HuntRiddle || '',
            dcStage1Answer: s1.dcStage1Answer || '',
            
            dcStage2Clues: s2.dcStage2Clues || '',
            dcStage2Facts: s2.dcStage2Facts || '',
            dcStage2State: s2.dcStage2State || '',
            dcStage2Thumbnail: s2.dcStage2Thumbnail || '',
            dcStage2Short: s2.dcStage2Short || '',
            dcStage2HuntRiddle: s2.dcStage2HuntRiddle || '',
            dcStage2Answer: s2.dcStage2Answer || '',
            
            dcStage3HuntFind: s3.dcStage3HuntFind || '',
            dcStage3HuntAnswer: s3.dcStage3HuntAnswer || '',
            DigitalCointhumbnail: s3.DigitalCointhumbnail || '',
            DigitalCoinShort: s3.DigitalCoinShort || '',
            
            dcStage4Facts: s4.dcStage4Facts || '',
            dcStage4LiveDate: s4.dcStage4LiveDate || '',
            dcStage4LiveNotes: s4.dcStage4LiveNotes || '',
            dcStage4Thumbnail: s4.dcStage4Thumbnail || '',
            dcStage4Short: s4.dcStage4Short || '',
            dcStage4Password: s4.dcStage4Password || '',
            dcStage4Hunt1: s4.dcStage4Hunt1 || '',
            dcStage4Clues1: s4.dcStage4Clues1 || '',
            dcStage4Answer1: s4.dcStage4Answer1 || '',
            dcStage4Hunt2: s4.dcStage4Hunt2 || '',
            dcStage4Clues2: s4.dcStage4Clues2 || '',
            dcStage4Answer2: s4.dcStage4Answer2 || '',
            dcStage4Hunt3: s4.dcStage4Hunt3 || '',
            dcStage4Clues3: s4.dcStage4Clues3 || '',
            dcStage4Answer3: s4.dcStage4Answer3 || '',
            dcStage4Answer: s4.dcStage4Answer || '',
            
            dcStage5BurnerPhone: s5.dcStage5BurnerPhone || '',
            dcStage5WinnersInfo: s5.dcStage5WinnersInfo || '',
            
            breakInCity: biTimeLoc.BreakInCity || bi.BreakInCity || '',
            breakInState: biTimeLoc.BreakInState || bi.BreakInState || '',
            gpsNorthLat: biTimeLoc.GPSNorthLat || bi.GPSNorthLat || bi.GPSAddress || '', 
            gpsWestLong: biTimeLoc.GPSWestLong || bi.GPSWestLong || '',
            finalTime: biTimeLoc.FinalTime || bi.FinalTime || '',
            vaultAddress: biTimeLoc.VaultAddress || bi.VaultAddress || '',

            breakInVideo: biRiddlesAns.TheBreakInVideo || bi.TheBreakInVideo || '',
            breakInThumbnail: biRiddlesAns.TheBreakInThumbnail || bi.TheBreakInThumbnail || '',
            breakInAnswer: biRiddlesAns.Level2Answer || bi.Level2Answer || '',
            breakInRiddle: biRiddlesAns.Level2Riddle || bi.Level2Riddle || '',
            sponsorKeyword: biRiddlesAns.SponsorKeyword || bi.SponsorKeyword || '',
            sponsorRiddle: biRiddlesAns.SponsorRiddle || bi.SponsorRiddle || '',
            
            cipherWordNorth: cm.CipherWordNorth || '',
            cipherWordWest: cm.CipherWordWest || '',
            cipherNumberNorth: cm.CipherNumberNorth || '',
            cipherNumberWest: cm.CipherNumberWest || '',
            keyStreamNorth: cm.KeyStreamNorth || '',
            keyStreamWest: cm.KeyStreamWest || ''
          };

          setFormData(initialFormData);

          const statuses: Record<string, FieldStatus> = {};
          Object.keys(initialFormData).forEach(key => {
            if (key === 'hidingItems') {
              initialFormData.hidingItems.forEach((item: any, idx: number) => {
                statuses[`hidingItems_${idx}_notes`] = item.notes?.trim() ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_photo`] = item.photo ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_clue`] = item.clue?.trim() ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_filmingNotes`] = item.filmingNotes?.trim() ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_masterPhoto`] = item.masterPhoto ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_creatorClue`] = item.creatorClue?.trim() ? 'synced' : 'none';
                statuses[`hidingItems_${idx}_gps`] = item.gps?.trim() ? 'synced' : 'none';
              });
            } else {
              const val = (initialFormData as any)[key];
              statuses[key] = (typeof val === 'string' && val.trim() !== '') ? 'synced' : 'none';
            }
          });
          if (initialFormData.codedWord) statuses['codedWord'] = 'synced';
          setFieldStatus(statuses);

          // Sub-evaluations
          const locFields = ['huntCity', 'huntState', 'huntAddress', 'ringRiddleAnswer', 'ringRiddle', 'shiftKey', 'huntCityName', 'huntVideoLink', 'huntThumbnail'];
          setLocationCodesDoneStatus(locFields.every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setTheCoinDoneStatus(['SecretImage', 'CoinWebaddress', 'DigitalCoilValue', 'WorkingCoin', 'WorkingCoinImage', 'WorkingCoinNotes'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setDcStage1DoneStatus(['dcStage1HuntRiddle', 'dcStage1Answer', 'dcStage1Thumbnail'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setDcStage2DoneStatus(['dcStage2HuntRiddle', 'dcStage2Answer', 'dcStage2Thumbnail'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setDcStage3DoneStatus(['dcStage3HuntFind', 'dcStage3HuntAnswer', 'DigitalCointhumbnail'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setDcStage4DoneStatus(['dcStage4Answer', 'dcStage4Thumbnail'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');
          setDcStage5DoneStatus(['dcStage5BurnerPhone', 'dcStage5WinnersInfo'].every(f => (initialFormData as any)[f] && (initialFormData as any)[f].trim() !== '') ? 'green' : 'yellow');

          setBreakInRiddlesAnsDoneStatus(['breakInThumbnail', 'breakInAnswer', 'breakInRiddle', 'sponsorKeyword', 'sponsorRiddle'].every(f => (initialFormData as any)[f] && (typeof (initialFormData as any)[f] === 'string' ? (initialFormData as any)[f].trim() !== '' : !!(initialFormData as any)[f])) ? 'green' : 'yellow');
        }
      } catch (err: any) {
        console.warn("Dossier Retrieval Interrupted:", err?.message || err);
      }
    };
    fetchDossier();
  }, [user]);

  const updateStatus = (field: string, status: FieldStatus) => {
    setFieldStatus(prev => ({ ...prev, [field]: status }));
  };

  const updateField = (field: string, val: string) => {
    if (field === 'shiftKey') {
      val = val.toUpperCase().substring(0, 3);
      if (val.length > 0 && !/[A-Z]/.test(val[0])) { setCustomError({ title: "Neural Protocol Error", message: "Shift Key MUST have one letter and 2 numbers (0-25)" }); return; }
      if (val.length > 1 && !/[0-9]/.test(val[1])) { setCustomError({ title: "Neural Protocol Error", message: "Shift Key MUST have one letter and 2 numbers (0-25)" }); return; }
      if (val.length > 2 && !/[0-9]/.test(val[2])) { setCustomError({ title: "Neural Protocol Error", message: "Shift Key MUST have one letter and 2 numbers (0-25)" }); return; }
      const numMatch = val.match(/\d+/);
      if (numMatch && parseInt(numMatch[0], 10) > 25) { setCustomError({ title: "Neural Protocol Error", message: "Shift Key MUST have one letter and 2 numbers (0-25)" }); return; }
    }

    if (field === 'huntCityName' && /[^a-zA-Z\s]/.test(val)) {
      setCustomError({ title: "Neural Protocol Error", message: "Hunt City Name MUST NOT contain numbers or special characters." });
      val = val.replace(/[^a-zA-Z\s]/g, '');
    }

    setFormData((prev: any) => ({ ...prev, [field]: val }));
    updateStatus(field, val.trim() === '' ? 'none' : 'dirty');
    
    if (field === 'huntCityName' || field === 'shiftKey') {
      updateStatus('codedWord', 'dirty');
      for (let i = 0; i < 10; i++) updateStatus(`hidingItems_${i}_clue`, 'dirty');
    }

    if (['huntCity', 'huntState', 'huntAddress', 'ringRiddleAnswer', 'ringRiddle', 'shiftKey', 'huntCityName', 'huntVideoLink', 'huntThumbnail'].includes(field)) setLocationCodesDoneStatus('red');
    if (['SecretImage', 'CoinWebaddress', 'DigitalCoilValue', 'WorkingCoin', 'WorkingCoinImage', 'WorkingCoinNotes'].includes(field)) setTheCoinDoneStatus('red');
    if (['dcStage1Clues', 'dcStage1Facts', 'dcStage1NumPlaces', 'dcStage1State', 'dcStage1EliminateMsg', 'dcStage1Thumbnail', 'dcStage1Short', 'dcStage1HuntRiddle', 'dcStage1Answer'].includes(field)) setDcStage1DoneStatus('red');
    if (['dcStage2Clues', 'dcStage2Facts', 'dcStage2State', 'dcStage2Thumbnail', 'dcStage2Short', 'dcStage2HuntRiddle', 'dcStage2Answer'].includes(field)) setDcStage2DoneStatus('red');
    if (['dcStage3HuntFind', 'dcStage3HuntAnswer', 'DigitalCointhumbnail'].includes(field)) setDcStage3DoneStatus('red');
    if (['dcStage4Answer', 'dcStage4Thumbnail'].includes(field)) setDcStage4DoneStatus('red');
    if (['dcStage5BurnerPhone', 'dcStage5WinnersInfo'].includes(field)) setDcStage5DoneStatus('red');
    if (['breakInThumbnail', 'breakInAnswer', 'breakInRiddle', 'sponsorKeyword', 'sponsorRiddle'].includes(field)) setBreakInRiddlesAnsDoneStatus('red');
  };
  
  const updateHidingItemValue = (index: number, field: 'notes' | 'clue' | 'filmingNotes' | 'photo' | 'masterPhoto' | 'creatorClue' | 'gps', val: string) => {
    setFormData((prev: any) => {
      const newList = [...prev.hidingItems];
      newList[index] = { ...newList[index], [field]: val };
      return { ...prev, hidingItems: newList };
    });
    updateStatus(`hidingItems_${index}_${field}`, val && val.trim() !== '' ? 'dirty' : 'none');
    setItemDoneStatus((prev: Record<number, 'yellow' | 'red' | 'green'>) => ({ ...prev, [index]: 'red' }));
  };

  const handleFileUpload = (file: File, targetField: string, index?: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800; let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } } else { if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setPendingAvatar({ base64: compressedBase64, fileName: file.name, target: targetField, index });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = () => {
    if (pendingAvatar) {
      if (pendingAvatar.target === 'hidingItemsPhoto' || pendingAvatar.target === 'hidingItemsMasterPhoto') {
        const idx = pendingAvatar.index!!;
        const field = pendingAvatar.target === 'hidingItemsPhoto' ? 'photo' : 'masterPhoto';
        updateHidingItemValue(idx, field, pendingAvatar.base64);
      } else {
        setFormData((prev: any) => ({ ...prev, [pendingAvatar.target]: pendingAvatar.base64, creatorAvatarName: pendingAvatar.target === 'avatarImageBase64' ? pendingAvatar.fileName : prev.creatorAvatarName }));
        updateStatus(pendingAvatar.target, pendingAvatar.base64 ? 'dirty' : 'none');
        if (pendingAvatar.target === 'huntThumbnail') setLocationCodesDoneStatus('red');
        if (['SecretImage', 'WorkingCoinImage'].includes(pendingAvatar.target)) setTheCoinDoneStatus('red');
        if (pendingAvatar.target === 'breakInThumbnail') setBreakInRiddlesAnsDoneStatus('red');
        if (['dcStage1Thumbnail', 'dcStage1Payload', 'DigitalCointhumbnail', 'dcStage4Thumbnail'].includes(pendingAvatar.target)) {
          if (pendingAvatar.target === 'dcStage1Thumbnail') setDcStage1DoneStatus('red');
          if (pendingAvatar.target === 'dcStage2Thumbnail') setDcStage2DoneStatus('red');
          if (pendingAvatar.target === 'DigitalCointhumbnail') setDcStage3DoneStatus('red');
          if (pendingAvatar.target === 'dcStage4Thumbnail') setDcStage4DoneStatus('red');
        }
      }
      setPendingAvatar(null);
    }
  };

  const handleImageDelete = () => {
    if (deleteImageConfirm) {
      const { target, index } = deleteImageConfirm;
      if ((target === 'hidingItemsPhoto' || target === 'hidingItemsMasterPhoto') && index !== undefined) {
        const field = target === 'hidingItemsPhoto' ? 'photo' : 'masterPhoto';
        updateHidingItemValue(index, field, '');
      } else {
        setFormData((prev: any) => ({ ...prev, [target]: '' }));
        updateStatus(target, 'none');
        if (target === 'huntThumbnail') setLocationCodesDoneStatus('red');
        if (['SecretImage', 'WorkingCoinImage'].includes(target)) setTheCoinDoneStatus('red');
        if (target === 'breakInThumbnail') setBreakInRiddlesAnsDoneStatus('red');
        if (['dcStage1Thumbnail', 'dcStage2Thumbnail', 'DigitalCointhumbnail', 'dcStage4Thumbnail'].includes(target)) {
          if (target === 'dcStage1Thumbnail') setDcStage1DoneStatus('red');
          if (target === 'dcStage2Thumbnail') setDcStage2DoneStatus('red');
          if (target === 'DigitalCointhumbnail') setDcStage3DoneStatus('red');
          if (target === 'dcStage4Thumbnail') setDcStage4DoneStatus('red');
        }
      }
      setDeleteImageConfirm(null);
    }
  };

  const calculateCaesar = (name: string, shiftKey: string) => {
    if (!name.trim() || !shiftKey.trim()) return "Caesar Cipher coded word";
    const match = shiftKey.trim().match(/^([A-Za-z])=?(\d{1,2})$/);
    if (!match) return "Caesar Cipher coded word";
    const char = match[1].toUpperCase();
    const newVal = parseInt(match[2], 10);
    const originalIdx = char.charCodeAt(0) - 65; 
    const shiftAmount = (newVal - originalIdx + 26) % 26;
    return name.toUpperCase().split('').map(c => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shiftAmount) % 26) + 65);
      return c;
    }).join('');
  };

  const getAllCodedChunks = (word: string, shift: string): string[] => {
    const cleanWord = word.trim().toUpperCase(); const cleanShift = shift.trim().toUpperCase(); const len = cleanWord.length;
    let wordChunks: string[] = Array(7).fill("");
    if (len > 0) {
      const safeLen = Math.min(14, Math.max(0, len)); const numDoubles = Math.max(0, safeLen - 7); const numSingles = 7 - numDoubles;
      wordChunks = []; let cursor = 0;
      for (let i = 0; i < numSingles; i++) { wordChunks.push(cleanWord[cursor] || ""); cursor += 1; }
      for (let i = 0; i < numDoubles; i++) { wordChunks.push(cleanWord.substring(cursor, cursor + 2) || ""); cursor += 2; }
      while (wordChunks.length < 7) wordChunks.push("");
    }
    const match = cleanShift.match(/^([A-Za-z])=?(\d{1,2})$/);
    const shiftLetter = match ? match[1].toUpperCase() : (cleanShift[0] || "");
    const shiftNums = match ? match[2].padStart(2, '0') : "";
    return [...wordChunks, shiftLetter, shiftNums[0] || "", shiftNums[1] || ""];
  };

  const computedCodedWord = calculateCaesar(formData.huntCityName, formData.shiftKey);
  const allChunks = useMemo(() => {
    const wordSource = (computedCodedWord === "Caesar Cipher coded word") ? "" : computedCodedWord;
    return getAllCodedChunks(wordSource, formData.shiftKey);
  }, [computedCodedWord, formData.shiftKey]);

  useEffect(() => {
    const cityNameRaw = formData.huntCityName || "";
    const isCityNameEmpty = cityNameRaw.trim() === "";
    const displayCodedWord = isCityNameEmpty ? "" : (computedCodedWord === "Caesar Cipher coded word" ? "" : computedCodedWord);
    setFormData((prev: any) => {
      const newList = [...prev.hidingItems]; let hasChanged = false;
      for (let i = 0; i < 10; i++) {
        const targetClue = isCityNameEmpty && i < 7 ? "" : allChunks[i];
        if (newList[i].clue !== targetClue) { newList[i] = { ...newList[i], clue: targetClue }; hasChanged = true; }
      }
      if (prev.codedWord !== displayCodedWord || hasChanged) return { ...prev, hidingItems: newList, codedWord: displayCodedWord };
      return prev;
    });
  }, [computedCodedWord, allChunks, formData.huntCityName]);

  useEffect(() => {
    const keyword = formData.sponsorKeyword.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (!keyword) { setFormData((prev: any) => ({ ...prev, cipherWordNorth: '', cipherNumberNorth: '', cipherWordWest: '', cipherNumberWest: '', keyStreamNorth: '', keyStreamWest: '' })); return; }
    const getDigits = (s: string) => s.replace(/[^0-9]/g, '');
    const northDigits = getDigits(formData.gpsNorthLat).padEnd(7, '0').substring(0, 7);
    const westDigits = getDigits(formData.gpsWestLong).padEnd(7, '0').substring(0, 7);
    const getPossibleColumnIndices = (digit: number) => { const indices = [digit, digit + 10]; if (digit <= 5) indices.push(digit + 20); return indices; };
    let wordN = "", numN = "", wordW = "", numW = "", ksN = "", ksW = "";
    for (let i = 0; i < 7; i++) {
      const plaintextDigit = parseInt(northDigits[i], 10); const keyChar = keyword[i % keyword.length]; ksN += keyChar;
      const keyCharIndex = keyChar.charCodeAt(0) - 65; const possibleCols = getPossibleColumnIndices(plaintextDigit);
      const selectionSeed = (i + plaintextDigit + keyCharIndex) % possibleCols.length; const colIndex = possibleCols[selectionSeed];
      const cipherIndex = (keyCharIndex + colIndex) % 26; wordN += ALPHABET[cipherIndex]; numN += (cipherIndex % 10).toString();
    }
    for (let i = 0; i < 7; i++) {
      const plaintextDigit = parseInt(westDigits[i], 10); const keyChar = keyword[(i + 7) % keyword.length]; ksW += keyChar;
      const keyCharIndex = keyChar.charCodeAt(0) - 65; const possibleCols = getPossibleColumnIndices(plaintextDigit);
      const selectionSeed = (i + plaintextDigit + keyCharIndex + 7) % possibleCols.length; const colIndex = possibleCols[selectionSeed];
      const cipherIndex = (keyCharIndex + colIndex) % 26; wordW += ALPHABET[cipherIndex]; numW += (cipherIndex % 10).toString();
    }
    setFormData((prev: any) => { if (prev.cipherWordNorth === wordN && prev.cipherNumberNorth === numN && prev.cipherWordWest === wordW && prev.cipherNumberWest === numW && prev.keyStreamNorth === ksN && prev.keyStreamWest === ksW) return prev; return { ...prev, cipherWordNorth: wordN, cipherNumberNorth: numN, cipherWordWest: wordW, cipherNumberWest: numW, keyStreamNorth: ksN, keyStreamWest: ksW }; });
  }, [formData.sponsorKeyword, formData.gpsNorthLat, formData.gpsWestLong]);

  const handleSaveHub = async (target: string = 'MAIN_SAVE') => {
    if (!navigator.onLine) {
      setNetworkError({ show: true, message: "Lost connection to the internet. Uplink impossible." });
      return;
    }

    setSyncingTarget(target);
    try {
      const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
      const nestedUpdate: any = {};
      setDeepValue(nestedUpdate, "TheHunt.City", formData.huntCity);
      setDeepValue(nestedUpdate, "TheHunt.State", formData.huntState);
      setDeepValue(nestedUpdate, "TheHunt.HuntAddress", formData.huntAddress);
      setDeepValue(nestedUpdate, "TheHunt.RingRiddleAnswer", formData.ringRiddleAnswer);
      setDeepValue(nestedUpdate, "TheHunt.RingRiddle", formData.ringRiddle);
      setDeepValue(nestedUpdate, "TheHunt.CityName", formData.huntCityName);
      setDeepValue(nestedUpdate, "TheHunt.ShiftKey", formData.shiftKey);
      setDeepValue(nestedUpdate, "TheHunt.HuntCodedWord", formData.codedWord);
      setDeepValue(nestedUpdate, "TheHunt.HuntVideoLink", formData.huntVideoLink);
      setDeepValue(nestedUpdate, "TheHunt.HuntThumbnail", formData.huntThumbnail);
      HIDING_ITEMS_LIST.forEach((name, idx) => {
        let dbKey = name.replace(/\s+/g, ''); if (name === "Key 1 Solis") dbKey = "Key1"; if (name === "Key 1 Noctis") dbKey = "Key2";
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.${dbKey}Notes`, formData.hidingItems[idx].notes);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.${dbKey}Clue`, formData.hidingItems[idx].clue);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.${dbKey}FilmingNotes`, formData.hidingItems[idx].filmingNotes);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.Find${dbKey}Image`, formData.hidingItems[idx].photo);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.Game Play Images.GP${dbKey}Image`, formData.hidingItems[idx].masterPhoto);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.Creator${dbKey}Clue`, formData.hidingItems[idx].creatorClue);
        setDeepValue(nestedUpdate, `TheHunt.Hunt 10 Items.${dbKey}GPS`, formData.hidingItems[idx].gps);
      });
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.SecretImage", formData.SecretImage);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.SecretWord", formData.SecretWord);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.CoinHint", formData.CoinHint);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.CoinWebaddress", formData.CoinWebaddress);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.DigitalCoilValue", formData.DigitalCoilValue);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.WorkingCoin", formData.WorkingCoin);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.WorkingCoinImage", formData.WorkingCoinImage);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.WorkingCoinNotes", formData.WorkingCoinNotes);
      setDeepValue(nestedUpdate, "DigitalCoin.TheCoin.workingCoinStatus", formData.workingCoinStatus);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1Clues", formData.dcStage1Clues);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1Facts", formData.dcStage1Facts);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1NumPlaces", formData.dcStage1NumPlaces);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1State", formData.dcStage1State);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1EliminateMsg", formData.dcStage1EliminateMsg);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1Thumbnail", formData.dcStage1Thumbnail);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1Short", formData.dcStage1Short);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1HuntRiddle", formData.dcStage1HuntRiddle);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage1.dcStage1Answer", formData.dcStage1Answer);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2Clues", formData.dcStage2Clues);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2Facts", formData.dcStage2Facts);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2State", formData.dcStage2State);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2Thumbnail", formData.dcStage2Thumbnail);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2Short", formData.dcStage2Short);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2HuntRiddle", formData.dcStage2HuntRiddle);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage2.dcStage2Answer", formData.dcStage2Answer);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage3.dcStage3HuntFind", formData.dcStage3HuntFind);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage3.dcStage3HuntAnswer", formData.dcStage3HuntAnswer);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage3.DigitalCointhumbnail", formData.DigitalCointhumbnail);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage3.DigitalCoinShort", formData.DigitalCoinShort);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Facts", formData.dcStage4Facts);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4LiveDate", formData.dcStage4LiveDate);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4LiveNotes", formData.dcStage4LiveNotes);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Thumbnail", formData.dcStage4Thumbnail);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Short", formData.dcStage4Short);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Password", formData.dcStage4Password);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Hunt1", formData.dcStage4Hunt1);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Clues1", formData.dcStage4Clues1);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Answer1", formData.dcStage4Answer1);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Hunt2", formData.dcStage4Hunt2);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Clues2", formData.dcStage4Clues2);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Answer2", formData.dcStage4Answer2);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Hunt3", formData.dcStage4Hunt3);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Clues3", formData.dcStage4Clues3);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Answer3", formData.dcStage4Answer3);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage4.dcStage4Answer", formData.dcStage4Answer);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage5.dcStage5BurnerPhone", formData.dcStage5BurnerPhone);
      setDeepValue(nestedUpdate, "DigitalCoin.Stage5.dcStage5WinnersInfo", formData.dcStage5WinnersInfo);

      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.TheBreakInVideo", formData.breakInVideo);
      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.TheBreakInThumbnail", formData.breakInThumbnail);
      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.Level2Answer", formData.breakInAnswer);
      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.Level2Riddle", formData.breakInRiddle);
      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.SponsorKeyword", formData.sponsorKeyword);
      setDeepValue(nestedUpdate, "TheBreakIn.Riddles and answers.SponsorRiddle", formData.sponsorRiddle);

      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.CipherWordNorth", formData.cipherWordNorth);
      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.CipherWordWest", formData.cipherWordWest);
      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.CipherNumberNorth", formData.cipherNumberNorth);
      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.CipherNumberWest", formData.cipherNumberWest);
      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.KeyStreamNorth", formData.keyStreamNorth);
      setDeepValue(nestedUpdate, "TheBreakIn.Coded Missions.KeyStreamWest", formData.keyStreamWest);

      await setDoc(creatorRef, nestedUpdate, { merge: true });
      alert('Mission Parameters Synchronized.');
      setFieldStatus(prev => { const next = { ...prev }; Object.keys(next).forEach(k => { if (next[k] === 'dirty') next[k] = 'synced'; }); return next; });
    } catch (err: any) { 
      console.error("Sync Failure:", err); 
      setNetworkError({ show: true, message: "Neural Handshake Failed. Please connect to the internet and retry uplink." });
    } finally { 
      setSyncingTarget(null); 
    }
  };

  const handleAskAI = async (targetField: string, sourceField: string) => {
    const riddleAnswer = (formData as any)[sourceField];
    if (!riddleAnswer) { setCustomError({ title: "Neural Protocol Error", message: "Fill the target answer field first." }); return; }
    setAiLoading(targetField);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Generate exactly 3 short, highly cryptic, and intelligent riddles for the answer: "${riddleAnswer}". The tone should be high-stakes and mysterious.`,
        config: { thinkingConfig: { thinkingBudget: 4000 }, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { riddles: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["riddles"] } }
      });
      const result = JSON.parse(response.text || '{}');
      setSuggestionModal({ targetField, riddles: result.riddles || [] });
    } catch (err) { alert("AI Neural Link Interrupted."); } finally { setAiLoading(null); }
  };

  const handleItemPageDone = (index: number) => {
    const item = formData.hidingItems[index]; const itemName = HIDING_ITEMS_LIST[index];
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [
      { key: 'gps', label: `${itemName} GPS`, val: item.gps, status: fieldStatus[`hidingItems_${index}_gps`] },
      { key: 'notes', label: `${itemName} Intel`, val: item.notes, status: fieldStatus[`hidingItems_${index}_notes`] },
      { key: 'creatorClue', label: `Creator ${itemName} Clue`, val: item.creatorClue, status: fieldStatus[`hidingItems_${index}_creatorClue`] },
      { key: 'filmingNotes', label: `${itemName} Filming Notes`, val: item.filmingNotes, status: fieldStatus[`hidingItems_${index}_filmingNotes`] },
      { key: 'photo', label: `Hidden Photo`, val: item.photo, status: fieldStatus[`hidingItems_${index}_photo`] },
      { key: 'masterPhoto', label: `GP Master Photo`, val: item.masterPhoto, status: fieldStatus[`hidingItems_${index}_masterPhoto`] }
    ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setItemDoneStatus((prev: any) => ({ ...prev, [index]: 'green' }));
    else setItemValidationError({ item: itemName, missing, unsynced });
  };

  const handleLocationCodesDone = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const locFields = [
      { key: 'huntCity', label: 'The Hunt City', val: formData.huntCity, status: fieldStatus.huntCity },
      { key: 'huntState', label: 'The Hunt State', val: formData.huntState, status: fieldStatus.huntState },
      { key: 'huntAddress', label: 'The Hunt Address', val: formData.huntAddress, status: fieldStatus.huntAddress },
      { key: 'ringRiddleAnswer', label: 'Ring Riddle Answer', val: formData.ringRiddleAnswer, status: fieldStatus.ringRiddleAnswer },
      { key: 'ringRiddle', label: 'Ring Riddle', val: formData.ringRiddle, status: fieldStatus.ringRiddle },
      { key: 'shiftKey', label: 'Shift Key', val: formData.shiftKey, status: fieldStatus.shiftKey },
      { key: 'huntCityName', label: 'Hunt City Name', val: formData.huntCityName, status: fieldStatus.huntCityName },
      { key: 'huntVideoLink', label: 'The Hunt Video Link', val: formData.huntVideoLink, status: fieldStatus.huntVideoLink },
      { key: 'huntThumbnail', label: 'The Hunt Thumbnail', val: formData.huntThumbnail, status: fieldStatus.huntThumbnail }
    ];
    locFields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setLocationCodesDoneStatus('green');
    else setItemValidationError({ item: "Location and Codes", missing, unsynced });
  };

  const handleBreakInRiddlesAnsDone = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [
      { key: 'breakInThumbnail', label: 'Break-In Thumbnail', val: formData.breakInThumbnail, status: fieldStatus.breakInThumbnail },
      { key: 'breakInAnswer', label: 'Level 2 Answer', val: formData.breakInAnswer, status: fieldStatus.breakInAnswer },
      { key: 'breakInRiddle', label: 'Level 2 Riddle', val: formData.breakInRiddle, status: fieldStatus.breakInRiddle },
      { key: 'sponsorKeyword', label: 'Sponsor Keyword', val: formData.sponsorKeyword, status: fieldStatus.sponsorKeyword },
      { key: 'sponsorRiddle', label: 'Sponsor Riddle', val: formData.sponsorRiddle }
    ];
    fields.forEach(f => { const valEmpty = typeof f.val === 'string' ? f.val.trim() === '' : !f.val; if (valEmpty) missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setBreakInRiddlesAnsDoneStatus('green');
    else setItemValidationError({ item: "Riddles and answers", missing, unsynced });
  };

  const handleTheCoinDone = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [
      { key: 'SecretImage', label: 'Digital Coin Image', val: formData.SecretImage, status: fieldStatus.SecretImage },
      { key: 'CoinWebaddress', label: 'Digital Coin Web address', val: formData.CoinWebaddress, status: fieldStatus.CoinWebaddress },
      { key: 'DigitalCoilValue', label: 'Digital Coin Value', val: formData.DigitalCoilValue, status: fieldStatus.DigitalCoilValue },
      { key: 'WorkingCoin', label: 'Working Coin', val: formData.WorkingCoin, status: fieldStatus.WorkingCoin },
      { key: 'WorkingCoinImage', label: 'Working Coin Image', val: formData.WorkingCoinImage, status: fieldStatus.WorkingCoinImage },
      { key: 'WorkingCoinNotes', label: 'Working Coin Notes', val: formData.WorkingCoinNotes }
    ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setTheCoinDoneStatus('green');
    else setItemValidationError({ item: "The Coin", missing, unsynced });
  };

  const handleStage1Done = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [ { key: 'dcStage1HuntRiddle', label: 'Stage 1 Hunt Riddle', val: formData.dcStage1HuntRiddle, status: fieldStatus.dcStage1HuntRiddle }, { key: 'dcStage1Answer', label: 'Stage 1 Answer', val: formData.dcStage1Answer, status: fieldStatus.dcStage1HuntRiddle } ] ;
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setDcStage1DoneStatus('green');
    else setItemValidationError({ item: "Stage 1", missing, unsynced });
  };

  const handleStage2Done = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [ { key: 'dcStage2HuntRiddle', label: 'Stage 2 Hunt Riddle', val: formData.dcStage2HuntRiddle, status: fieldStatus.dcStage2HuntRiddle }, { key: 'dcStage2Answer', label: 'Stage 2 Answer', val: formData.dcStage2Answer, status: fieldStatus.dcStage2Answer }, { key: 'dcStage2Thumbnail', label: 'Stage 2 Thumbnail', val: formData.dcStage2Thumbnail, status: fieldStatus.dcStage2Thumbnail } ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setDcStage2DoneStatus('green');
    else setItemValidationError({ item: "Stage 2", missing, unsynced });
  };

  const handleStage3Done = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [ { key: 'dcStage3HuntFind', label: 'Stage 3 Hunt Riddle', val: formData.dcStage3HuntFind, status: fieldStatus.dcStage3HuntFind }, { key: 'dcStage3HuntAnswer', label: 'Stage 3 Answer', val: formData.dcStage3HuntAnswer, status: fieldStatus.dcStage3HuntAnswer }, { key: 'DigitalCointhumbnail', label: 'Stage 3 Thumbnail', val: formData.DigitalCointhumbnail, status: fieldStatus.DigitalCointhumbnail } ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setDcStage3DoneStatus('green');
    else setItemValidationError({ item: "Stage 3", missing, unsynced });
  };

  const handleStage4Done = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [ { key: 'dcStage4Answer', label: 'Stage 4 Answer', val: formData.dcStage4Answer, status: fieldStatus.dcStage4Answer }, { key: 'dcStage4Thumbnail', label: 'Stage 4 Thumbnail', val: formData.dcStage4Thumbnail, status: fieldStatus.dcStage4Thumbnail } ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setDcStage4DoneStatus('green');
    else setItemValidationError({ item: "Stage 4", missing, unsynced });
  };

  const handleStage5Done = () => {
    const missing: string[] = []; const unsynced: string[] = [];
    const fields = [ { key: 'dcStage5BurnerPhone', label: 'Burner Phone Number', val: formData.dcStage5BurnerPhone, status: fieldStatus.dcStage5BurnerPhone }, { key: 'dcStage5WinnersInfo', label: 'Winners Intel', val: formData.dcStage5WinnersInfo, status: fieldStatus.dcStage5WinnersInfo } ];
    fields.forEach(f => { if (!f.val || f.val.trim() === '') missing.push(f.label); else if (f.status === 'dirty' || f.status === 'error') unsynced.push(f.label); });
    if (missing.length === 0 && unsynced.length === 0) setDcStage5DoneStatus('green');
    else setItemValidationError({ item: "Stage 5", missing, unsynced });
  };

  const toggleSection = (section: string) => { setOpenSections(prev => ({ ...prev, [section]: !prev[section] })); };

  const ImageBox: React.FC<{ url: string; field: string; index?: number; alt: string; isCircle?: boolean; label?: string; status?: FieldStatus }> = ({ url, field, index, alt, isCircle, label, status = 'none' }) => {
    const timerRef = useRef<number | null>(null);
    const startPress = () => { timerRef.current = window.setTimeout(() => setDeleteImageConfirm({ target: field, index, url }), 600); };
    const endPress = () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
    const borderColor = status === 'synced' ? '#22c55e' : status === 'dirty' ? '#f97316' : status === 'error' ? '#ef4444' : 'rgba(212,175,55,0.2)';
    const borderWidth = status !== 'none' ? '3px' : '2px';
    if (!url) return (
      <div className={`h-full w-full bg-black/40 relative flex flex-col items-center justify-center p-2 text-center transition-all ${isCircle ? 'rounded-full' : 'rounded-lg'}`} style={{ border: `${borderWidth} solid ${borderColor}` }}>
        <div className="opacity-[0.1]"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
        {label && <span className="text-[7px] font-display font-black text-white/20 uppercase tracking-tighter mt-1">{label} Missing</span>}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] scanline"></div>
      </div>
    );
    return (
      <div className={`h-full w-full bg-black/40 relative group/preview cursor-pointer transition-all shadow-inner flex items-center justify-center overflow-hidden ${isCircle ? 'rounded-full' : 'rounded-lg'}`} style={{ border: `${borderWidth} solid ${borderColor}` }} onClick={() => setFullscreenImage(url)} onMouseDown={startPress} onMouseUp={endPress} onTouchStart={startPress} onTouchEnd={endPress}>
        <img src={url} alt={alt} className="h-full w-full object-cover animate-[fadeIn_0.5s_ease-out]" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center"><span className="text-opacity-100 font-display font-black text-vault-gold uppercase tracking-tighter text-center px-1">{label || 'Visual'} Data</span><span className="text-[7px] font-display text-white/60 uppercase mt-1">Hold to Del</span></div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] scanline"></div>
      </div>
    );
  };

  const SyncDataButton: React.FC<{ target: string, onClick?: () => void }> = ({ target, onClick }) => (
    <div className="flex justify-center no-print">
      <button 
        onClick={(e) => { e.stopPropagation(); if(onClick) onClick(); else handleSaveHub(target); }} 
        className={`px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 
          ${syncingTarget === target ? 'bg-vault-gold text-black border-vault-gold animate-pulse' : 'bg-white text-black border-transparent hover:bg-vault-gold hover:border-vault-gold'}`}
      >
        {syncingTarget === target ? 'SYNCING...' : 'SYNC DATA'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden no-print pb-48">
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center px-4">
        <button onClick={onBack} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto p-6 lg:p-16 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">Game Play Hub</h1>

        <ShimmerDropdown isMain title={<div className="flex items-center"><span>The Hunt</span><PageDoneBullet status={huntMainStatus} /></div>} isOpen={openSections.hunt} onToggle={() => toggleSection('hunt')}>
          <div className="flex flex-col w-full">
            <ShimmerDropdown title={<div className="flex items-center"><span>Location and Codes</span><PageDoneBullet status={locationCodesDoneStatus} /></div>} isOpen={openSections.locationCodes} onToggle={() => toggleSection('locationCodes')}>
              <InputGroup label="The Hunt City" value={formData.huntCity} onChange={(v) => updateField('huntCity', v)} status={fieldStatus.huntCity} />
              <InputGroup label="The Hunt State" value={formData.huntState} onChange={(v) => updateField('huntState', v)} status={fieldStatus.huntState} />
              <InputGroup label="The Hunt Address" value={formData.huntAddress} onChange={(v) => updateField('huntAddress', v)} status={fieldStatus.huntAddress} />
              <InputGroup label="Ring Riddle answer" value={formData.ringRiddleAnswer} onChange={(v) => updateField('ringRiddleAnswer', v)} status={fieldStatus.ringRiddleAnswer} />
              <InputGroup label="Ring Riddle" value={formData.ringRiddle} onChange={(v) => updateField('ringRiddle', v)} status={fieldStatus.ringRiddle} isTextArea onAskAI={() => handleAskAI('ringRiddle', 'ringRiddleAnswer')} isLoadingAI={aiLoading === 'ringRiddle'} />
              <InputGroup label="Shift Key" value={formData.shiftKey} onChange={(v) => updateField('shiftKey', v)} status={fieldStatus.shiftKey} maxLength={3} />
              <InputGroup label="Hunt City Name" value={formData.huntCityName} onChange={(v) => updateField('huntCityName', v)} status={fieldStatus.huntCityName} />
              <InputGroup label="Coded Word" value={formData.codedWord} onChange={() => {}} disabled={true} readOnly status={fieldStatus.codedWord} />
              <InputGroup label="The Hunt Video Link" value={formData.huntVideoLink} onChange={(v) => updateField('huntVideoLink', v)} status={fieldStatus.huntVideoLink} />
              <div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8">
                 <div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">The Hunt Thumbnail</label></div>
                 <div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1">
                   <div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'huntThumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div>
                   <div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.huntThumbnail} field="huntThumbnail" alt="Hunt Thumbnail" label="Hunt" status={fieldStatus.huntThumbnail} /></div>
                 </div>
              </div>
              <div className="flex items-center justify-center gap-4 mt-8">
                <SyncDataButton target="DC_HUNT_LOCATION_CODES" />
                <button onClick={(e) => { e.stopPropagation(); handleLocationCodesDone(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button>
              </div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Hiding the 10 items</span><PageDoneBullet status={hidingItemsAggregateStatus} /></div>} isOpen={openSections.hidingItems} onToggle={() => toggleSection('hidingItems')}>
               <div className="p-0 md:p-4 space-y-6">
                 {HIDING_ITEMS_LIST.map((item, idx) => {
                   const isOpen = openSections[`item_${idx}_open`]; 
                   const sGps = fieldStatus[`hidingItems_${idx}_gps`];
                   const sNotes = fieldStatus[`hidingItems_${idx}_notes`];
                   const sCreatorClue = fieldStatus[`hidingItems_${idx}_creatorClue`];
                   const sFilming = fieldStatus[`hidingItems_${idx}_filmingNotes`];
                   const sPhoto = fieldStatus[`hidingItems_${idx}_photo`];
                   const sMaster = fieldStatus[`hidingItems_${idx}_masterPhoto`];

                   return (
                     <ShimmerDropdown 
                        key={idx}
                        title={<div className="flex items-center"><span>{idx + 1}. {item}</span><PageDoneBullet status={itemDoneStatus[idx]} /></div>}
                        isOpen={isOpen}
                        onToggle={() => toggleSection(`item_${idx}_open`)}
                        className="mb-4"
                        headerExtra={
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[12px] md:text-[14px] font-display font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">Cipher</span>
                              <div className="w-12 h-10 bg-black/60 border border-vault-gold/40 rounded flex items-center justify-center font-display font-black text-vault-gold text-xl relative">{allChunks[idx]}</div>
                            </div>
                          </div>
                        }
                     >
                        <div className="p-2 space-y-6 animate-[fadeIn_0.3s_ease-out]">
                          <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1 flex flex-col gap-6 w-full">
                              <InputGroup label={`${item} GPS`} value={formData.hidingItems[idx].gps || ''} onChange={(v) => updateHidingItemValue(idx, 'gps', v)} status={sGps} className="mb-0" />
                              <InputGroup label={`${item} Intel`} value={formData.hidingItems[idx].notes} onChange={(v) => updateHidingItemValue(idx, 'notes', v)} status={sNotes} isTextArea className="mb-0" />
                              <InputGroup label={`Creator ${item} Clue`} value={formData.hidingItems[idx].creatorClue} onChange={(v) => updateHidingItemValue(idx, 'creatorClue', v)} status={sCreatorClue} isTextArea className="mb-0" />
                              <InputGroup label={`${item} filming notes`} value={formData.hidingItems[idx].filmingNotes || ''} onChange={(v) => updateHidingItemValue(idx, 'filmingNotes', v)} status={sFilming} isTextArea className="mb-0" />
                            </div>
                            <div className="w-full lg:w-[336px] flex flex-col gap-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-3">
                                  <UploadField label="Hidden" onFileSelect={(f) => handleFileUpload(f, 'hidingItemsPhoto', idx)} isCompact hidePreview />
                                  <div className="aspect-square bg-black/60 rounded-xl border border-white/5 overflow-hidden">
                                    <ImageBox url={formData.hidingItems[idx].photo} field="hidingItemsPhoto" index={idx} alt={`${item} Hidden`} label="Hidden" status={sPhoto} />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                  <UploadField label="GP Master" onFileSelect={(f) => handleFileUpload(f, 'hidingItemsMasterPhoto', idx)} isCompact hidePreview />
                                  <div className="aspect-square bg-black/60 rounded-xl border border-white/5 overflow-hidden">
                                    <ImageBox url={formData.hidingItems[idx].masterPhoto} field="hidingItemsMasterPhoto" index={idx} alt={`${item} Master`} label="GP Master" status={sMaster} />
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => onNavigateToItem(item, true)} className="w-full py-3 bg-vault-gold/10 border border-vault-gold/40 text-vault-gold rounded-lg font-display font-black uppercase tracking-widest text-[11px] hover:bg-vault-gold hover:text-black transition-all shadow-lg active:scale-[0.99]">Check page</button>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-4 mt-10">
                            <SyncDataButton target={`DC_HUNT_HIDING_ITEM_${idx}`} onClick={() => handleSaveHub(`DC_HUNT_HIDING_ITEM_${idx}`)} />
                            <button onClick={(e) => { e.stopPropagation(); handleItemPageDone(idx); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button>
                          </div>
                        </div>
                     </ShimmerDropdown>
                   );
                 })}
               </div>
            </ShimmerDropdown>
          </div>
        </ShimmerDropdown>

        <ShimmerDropdown isMain title={<div className="flex items-center"><span>Digital Coin</span><PageDoneBullet status={coinMainStatus} /></div>} isOpen={openSections.coin} onToggle={() => toggleSection('coin')}>
          <div className="flex flex-col w-full">
            <ShimmerDropdown title={<div className="flex items-center"><span>The Coin</span><PageDoneBullet status={theCoinDoneStatus} /></div>} isOpen={openSections.coin_TheCoin} onToggle={() => toggleSection('coin_TheCoin')}>
              <div className="flex flex-col w-full">
                <div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8">
                   <div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Digital Coin Image</label></div>
                   <div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1">
                     <div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'SecretImage')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div>
                     <div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.SecretImage} field="SecretImage" alt="Digital Coin Image" label="Coin" status={fieldStatus.SecretImage} /></div>
                   </div>
                </div>
                <InputGroup label="Digital Coin Web address" value={formData.CoinWebaddress} onChange={(v) => updateField('CoinWebaddress', v)} status={fieldStatus.CoinWebaddress} />
                <InputGroup label="Digital Coin Value" value={formData.DigitalCoilValue} onChange={(v) => updateField('DigitalCoilValue', v)} status={fieldStatus.DigitalCoilValue} />
                <InputGroup label="Working Coin" value={formData.WorkingCoin} onChange={(v) => updateField('WorkingCoin', v)} status={fieldStatus.WorkingCoin} />
                <div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8">
                   <div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Working Coin Image</label></div>
                   <div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1">
                     <div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'WorkingCoinImage')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div>
                     <div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.WorkingCoinImage} field="WorkingCoinImage" alt="Working Coin Image" label="Progress" status={fieldStatus.WorkingCoinImage} /></div>
                   </div>
                </div>
                <InputGroup label="Working Coin Notes" value={formData.WorkingCoinNotes} onChange={(v) => updateField('WorkingCoinNotes', v)} status={fieldStatus.WorkingCoinNotes} />
                <div className="flex flex-col gap-2 mb-8"><label className="text-[11px] md:text-[13px] font-display font-black uppercase tracking-[0.2em] text-vault-gold">Working Coin Status</label><div className="flex wrap items-center gap-6 p-4 bg-black/40 border border-white/5 rounded-xl">{[{ label: 'Not Started', value: 'not_started' }, { label: 'In Progress', value: 'in_progress' }, { label: 'Finished', value: 'finished' }].map((s) => (<button key={s.value} onClick={() => updateField('workingCoinStatus', s.value)} className={`text-[10px] font-display font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${formData.workingCoinStatus === s.value ? 'bg-vault-gold text-black border-vault-gold' : 'bg-transparent text-white/40 border-white/10 hover:border-vault-gold/40'}`}>{s.label}</button>))}</div></div>
                <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_THE_COIN" /><button onClick={(e) => { e.stopPropagation(); handleTheCoinDone(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
              </div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Stage 1</span><PageDoneBullet status={dcStage1DoneStatus} /></div>} isOpen={openSections.coin_Stage1} onToggle={() => toggleSection('coin_Stage1')}>
              <InputGroup label="Stage 1 Hunt Riddle" value={formData.dcStage1HuntRiddle} onChange={(v) => updateField('dcStage1HuntRiddle', v)} status={fieldStatus.dcStage1HuntRiddle} isTextArea /><InputGroup label="Stage 1 Answer" value={formData.dcStage1Answer} onChange={(v) => updateField('dcStage1Answer', v)} status={fieldStatus.dcStage1HuntRiddle} /><div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8"><div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Stage 1 Thumbnail</label></div><div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1"><div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'dcStage1Thumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div><div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.dcStage1Thumbnail} field="dcStage1Thumbnail" alt="Stage 1 Thumbnail" label="Stage 1" status={fieldStatus.dcStage1Thumbnail} /></div></div></div>
              <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_STAGE_1" /><button onClick={(e) => { e.stopPropagation(); handleStage1Done(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Stage 2</span><PageDoneBullet status={dcStage2DoneStatus} /></div>} isOpen={openSections.coin_Stage2} onToggle={() => toggleSection('coin_Stage2')}>
              <InputGroup label="Stage 2 Hunt Riddle" value={formData.dcStage2HuntRiddle} onChange={(v) => updateField('dcStage2HuntRiddle', v)} status={fieldStatus.dcStage2HuntRiddle} isTextArea /><InputGroup label="Stage 2 Answer" value={formData.dcStage2Answer} onChange={(v) => updateField('dcStage2Answer', v)} status={fieldStatus.dcStage2Answer} /><div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8"><div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Stage 2 Thumbnail</label></div><div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1"><div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'dcStage2Thumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div><div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.dcStage2Thumbnail} field="dcStage2Thumbnail" alt="Stage 2 Thumbnail" label="Stage 2" status={fieldStatus.dcStage2Thumbnail} /></div></div></div>
              <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_STAGE_2" /><button onClick={(e) => { e.stopPropagation(); handleStage2Done(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Stage 3</span><PageDoneBullet status={dcStage3DoneStatus} /></div>} isOpen={openSections.coin_Stage3} onToggle={() => toggleSection('coin_Stage3')}>
              <InputGroup label="Stage 3 Hunt Riddle" value={formData.dcStage3HuntFind} onChange={(v) => updateField('dcStage3HuntFind', v)} status={fieldStatus.dcStage3HuntFind} isTextArea /><InputGroup label="Stage 3 Answer" value={formData.dcStage3HuntAnswer} onChange={(v) => updateField('dcStage3HuntAnswer', v)} status={fieldStatus.dcStage3HuntAnswer} /><div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8"><div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Stage 3 Thumbnail</label></div><div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1"><div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'DigitalCointhumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div><div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.DigitalCointhumbnail} field="DigitalCointhumbnail" alt="Stage 3 Thumbnail" label="Stage 3" status={fieldStatus.DigitalCointhumbnail} /></div></div></div>
              <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_STAGE_3" /><button onClick={(e) => { e.stopPropagation(); handleStage3Done(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Stage 4</span><PageDoneBullet status={dcStage4DoneStatus} /></div>} isOpen={openSections.coin_Stage4} onToggle={() => toggleSection('coin_Stage4')}>
              <InputGroup label="Stage 4 Answer" value={formData.dcStage4Answer} onChange={(v) => updateField('dcStage4Answer', v)} status={fieldStatus.dcStage4Answer} /><div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8"><div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">Stage 4 Thumbnail</label></div><div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1"><div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'dcStage4Thumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div><div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.dcStage4Thumbnail} field="dcStage4Thumbnail" alt="Stage 4 Thumbnail" label="Stage 4" status={fieldStatus.dcStage4Thumbnail} /></div></div></div>
              <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_STAGE_4" /><button onClick={(e) => { e.stopPropagation(); handleStage4Done(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
            </ShimmerDropdown>
            <ShimmerDropdown title={<div className="flex items-center"><span>Stage 5</span><PageDoneBullet status={dcStage5DoneStatus} /></div>} isOpen={openSections.coin_Stage5} onToggle={() => toggleSection('coin_Stage5')}>
              <InputGroup label="Burner Phone Number" value={formData.dcStage5BurnerPhone} onChange={(v) => updateField('dcStage5BurnerPhone', v)} status={fieldStatus.dcStage5BurnerPhone} /><InputGroup label="Winners Intel" value={formData.dcStage5WinnersInfo} onChange={(v) => updateField('dcStage5WinnersInfo', v)} status={fieldStatus.dcStage5WinnersInfo} isTextArea />
              <div className="flex items-center justify-center gap-4 mt-8"><SyncDataButton target="DC_STAGE_5" /><button onClick={(e) => { e.stopPropagation(); handleStage5Done(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button></div>
            </ShimmerDropdown>
          </div>
        </ShimmerDropdown>

        <ShimmerDropdown isMain title={<div className="flex items-center"><span>The Break-In</span><PageDoneBullet status={breakInMainStatus} /></div>} isOpen={openSections.breakin} onToggle={() => toggleSection('breakin')}>
          <div className="flex flex-col w-full">
            <ShimmerDropdown title={<div className="flex items-center"><span>Riddles and answers</span><PageDoneBullet status={breakInRiddlesAnsDoneStatus} /></div>} isOpen={openSections.breakin_RiddlesAns} onToggle={() => toggleSection('breakin_RiddlesAns')}>
              <div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg hover:border-vault-gold/20 transition-all overflow-hidden mb-8">
                <div className="flex items-center"><label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap flex items-center">The Break In ThumbNail</label></div>
                <div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1">
                  <div className="flex-shrink-0"><UploadField onFileSelect={(f) => handleFileUpload(f, 'breakInThumbnail')} className="mb-0" isCompact hidePreview buttonText="UPLOAD" /></div>
                  <div className="flex-shrink-0 h-16 w-28 md:h-20 md:w-36 relative"><ImageBox url={formData.breakInThumbnail} field="breakInThumbnail" alt="Break In ThumbNail" label="BreakIn TN" status={fieldStatus.breakInThumbnail} /></div>
                </div>
              </div>
              <InputGroup label="Level 2 Answer" value={formData.breakInAnswer} onChange={(v) => updateField('breakInAnswer', v)} status={fieldStatus.breakInAnswer} />
              <InputGroup label="Level 2 Riddle" value={formData.breakInRiddle} onChange={(v) => updateField('breakInRiddle', v)} status={fieldStatus.breakInRiddle} isTextArea onAskAI={() => handleAskAI('breakInRiddle', 'breakInAnswer')} isLoadingAI={aiLoading === 'breakInRiddle'} />
              <InputGroup label="Sponsor Keyword" value={formData.sponsorKeyword} onChange={(v) => updateField('sponsorKeyword', v)} status={fieldStatus.sponsorKeyword} />
              <InputGroup label="Sponsor Riddle" value={formData.sponsorRiddle} onChange={(v) => updateField('sponsorRiddle', v)} status={fieldStatus.sponsorRiddle} isTextArea onAskAI={() => handleAskAI('sponsorRiddle', 'sponsorKeyword')} isLoadingAI={aiLoading === 'sponsorRiddle'} />
              <div className="flex items-center justify-center gap-4 mt-8">
                <SyncDataButton target="DC_BREAKIN_RIDDLES_ANS" />
                <button onClick={(e) => { e.stopPropagation(); handleBreakInRiddlesAnsDone(); }} className="px-10 py-3 rounded-xl font-display font-black uppercase tracking-widest text-[13px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white hover:border-white shadow-lg active:scale-95">page done</button>
              </div>
            </ShimmerDropdown>

            <ShimmerDropdown title={<div className="flex items-center"><span>Coded missions</span></div>} isOpen={openSections.breakin_CodedMissions} onToggle={() => toggleSection('breakin_CodedMissions')}>
              <div className="bg-vault-panel/90 border-t-2 border-vault-gold/20 pt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2"><InputGroup label="Cipher Word North" value={formData.cipherWordNorth} onChange={(v) => updateField('cipherWordNorth', v)} status={fieldStatus.cipherWordNorth} readOnly /><InputGroup label="Cipher Word West" value={formData.cipherWordWest} onChange={(v) => updateField('cipherWordWest', v)} status={fieldStatus.cipherWordWest} readOnly /><InputGroup label="Cipher Number North" value={formData.cipherNumberNorth} onChange={(v) => updateField('cipherNumberNorth', v)} status={fieldStatus.cipherNumberNorth} readOnly /><InputGroup label="Cipher Number West" value={formData.cipherNumberWest} onChange={(v) => updateField('cipherNumberWest', v)} status={fieldStatus.cipherNumberWest} readOnly /><InputGroup label="Key Stream North" value={formData.keyStreamNorth} onChange={(v) => updateField('keyStreamNorth', v)} status={fieldStatus.keyStreamNorth} readOnly /><InputGroup label="Key Stream West" value={formData.keyStreamWest} onChange={(v) => updateField('keyStreamWest', v)} status={fieldStatus.keyStreamWest} readOnly /></div></div>
            </ShimmerDropdown>
          </div>
        </ShimmerDropdown>

        {/* Navigation Buttons Area */}
        <section className="w-full flex flex-col md:flex-row gap-6 mt-12">
          <VaultButton 
            onClick={onNavigateToGamePlayApp} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Production App
          </VaultButton>
          <VaultButton 
            onClick={onNavigateToMissionCentral} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Mission Central
          </VaultButton>
        </section>

      </div>

      {/* Modals & Popups removed for brevity - identical to existing code */}
      {/* ... (Error Modals, Suggestion Modal, Pending Avatar, etc.) */}

      {/* Network Error Modal */}
      {networkError?.show && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-sm bg-vault-panel border-2 border-vault-alert rounded-3xl p-10 shadow-[0_0_80px_rgba(255,51,51,0.3)] text-center relative overflow-hidden">
             <div className="mb-6 relative">
                <div className="w-20 h-20 bg-vault-alert/10 rounded-full mx-auto flex items-center justify-center border border-vault-alert/30">
                  <svg className="w-10 h-10 text-vault-alert animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-vault-alert/5 animate-ping opacity-20"></div>
             </div>
             <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-4 leading-tight">Uplink Interrupted</h3>
             <p className="text-vault-gold font-sans text-lg mb-10 leading-relaxed italic">"{networkError.message}"</p>
             <div className="space-y-4">
                <VaultButton onClick={() => { setNetworkError(null); handleSaveHub(syncingTarget || 'RETRY'); }} className="w-full py-4 text-sm bg-vault-gold text-black border-none">Retry Uplink</VaultButton>
                <button onClick={() => setNetworkError(null)} className="w-full text-white/40 font-display font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors py-2">Dismiss Terminal</button>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline"></div>
          </div>
        </div>
      )}

      {suggestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
           <div className="w-full max-w-2xl bg-vault-panel border-2 border-vault-gold rounded-3xl overflow-hidden"><header className="p-8 border-b border-vault-gold/20 flex items-center justify-between"><h2 className="text-2xl font-display font-black text-vault-gold uppercase">Neural Intel</h2><button onClick={() => setSuggestionModal(null)} className="text-white/40">CLOSE</button></header><div className="p-8 space-y-4">{suggestionModal.riddles.map((r, i) => (<button key={i} onClick={() => { updateField(suggestionModal.targetField, r); setSuggestionModal(null); }} className="w-full text-left p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-vault-gold">{r}</button>))}</div></div>
        </div>
      )}

      {pendingAvatar && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-lg bg-vault-panel border-2 border-vault-gold p-8 rounded-3xl shadow-2xl text-center"><h3 className="text-xl font-display font-black text-vault-gold uppercase tracking-widest mb-8">Is this the right image?</h3><div className="w-80 h-80 md:w-[450px] md:h-[450px] mx-auto mb-10 rounded-2xl border-2 border-vault-gold/40 overflow-hidden shadow-2xl bg-black"><img src={pendingAvatar.base64} alt="Preview" className="w-full h-full object-contain" /></div><div className="flex gap-4 max-w-[240px] mx-auto"><VaultButton onClick={confirmUpload} className="flex-1 py-1.5 text-[10px]">YES</VaultButton><button onClick={() => setPendingAvatar(null)} className="flex-1 font-display font-black uppercase text-[9px] tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 rounded-lg">NO</button></div></div>
        </div>
      )}

      {itemValidationError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-lg bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_80px_rgba(255,51,51,0.3)]"><h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-4">Incomplete Section</h3><p className="text-vault-gold text-[13px] font-black uppercase tracking-[0.2em] mb-8">Agent, the following items in "{itemValidationError.item}" require attention:</p><div className="space-y-6 text-left mb-10 max-h-[40vh] overflow-y-auto px-4 scrollbar-hide">{itemValidationError.missing.length > 0 && (<div><h4 className="text-vault-alert font-display font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-vault-alert animate-pulse" />is not filled in yet:</h4><ul className="space-y-1 pl-4 border-l border-vault-alert/30">{itemValidationError.missing.map((m, i) => <li key={i} className="text-white/60 text-sm font-sans italic">{m}</li>)}</ul></div>)}{itemValidationError.unsynced.length > 0 && (<div><h4 className="text-orange-500 font-display font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />has not been updated:</h4><ul className="space-y-1 pl-4 border-l border-orange-500/30">{itemValidationError.unsynced.map((m, i) => <li key={i} className="text-white/60 text-sm font-sans italic">{m} (Bullet is Red)</li>)}</ul></div>)}</div><VaultButton onClick={() => setItemValidationError(null)} className="w-full py-4 bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black">Acknowledge</VaultButton><div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" /></div>
        </div>
      )}

      {fullscreenImage && (
        <div className="fixed inset-0 z-[150] bg-black/98 flex flex-col items-center justify-center p-4 md:p-12 animate-[fadeIn_0.3s_ease-out] cursor-zoom-out" onClick={() => setFullscreenImage(null)}><img src={fullscreenImage} alt="Fullscreen View" className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg border border-vault-gold/20" /></div>
      )}

      {deleteImageConfirm && (
        <div className="fixed inset-0 z-160 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"><div className="w-full max-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden"><h3 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-4">Purge Visual Data?</h3><p className="text-white/60 text-sm mb-10">This frame will be scrubbed from the dossier. Confirm?</p><div className="flex gap-4"><button onClick={handleImageDelete} className="flex-1 bg-vault-alert text-white py-4 rounded-xl font-display font-black uppercase text-sm active:scale-95">Confirm Purge</button><button onClick={() => setDeleteImageConfirm(null)} className="flex-1 font-display font-black uppercase text-xs text-white/40">Abort</button></div></div></div>
      )}

      {customError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90"><div className="w-full max-w-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center"><h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-4">{customError.title}</h3><p className="text-vault-gold text-sm font-black uppercase tracking-widest mb-8">{customError.message}</p><VaultButton onClick={customError.onConfirm || (() => setCustomError(null))} className="w-full py-4 bg-vault-alert text-white border-vault-alert">Acknowledge</VaultButton></div></div>
      )}
    </div>
  );
};
