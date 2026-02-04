import React, { useState, useEffect, useRef } from 'react';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from '../firebase';
import { ASSETS, YOUTUBE_DATA } from '../constants';
import { VaultButton } from './VaultButton';
import { UserSocials, ClearanceLevel } from '../types';

interface UserProfilePageProps {
  onBack: () => void;
  onNavigateToPlayers: () => void;
  user: any; 
}

const COUNTRIES = [
  { code: 'ARG', name: 'Argentina' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'CAN', name: 'Canada' },
  { code: 'COL', name: 'Colombia' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'FRA', name: 'France' },
  { code: 'DEU', name: 'Germany' },
  { code: 'IND', name: 'India' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'ITA', name: 'Italy' },
  { code: 'JPN', name: 'Japan' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'POL', name: 'Poland' },
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'ESP', name: 'Spain' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
  { code: 'VNM', name: 'Vietnam' }
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
  { id: 'discord', label: 'Discord' },
  { id: 'meta', label: 'Meta' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'snapchat', label: 'Snapchat' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'wechat', label: 'WeChat China' },
  { id: 'whatsapp', label: 'WhatsApp' }
];

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ onBack, onNavigateToPlayers, user }) => {
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLevel2Modal, setShowLevel2Modal] = useState(false);
  const [showLevel3Modal, setShowLevel3Modal] = useState(false);
  const [showSmsAlert, setShowSmsAlert] = useState(false);
  
  // Section Toggles
  const [isSocialMatrixOpen, setIsSocialMatrixOpen] = useState(false);
  const [isAlertHubOpen, setIsAlertHubOpen] = useState(false);
  const [isTimedCodesOpen, setIsTimedCodesOpen] = useState(false);
  const [isCaesarOpen, setIsCaesarOpen] = useState(false);
  const [isVigenereOpen, setIsVigenereOpen] = useState(false);
  const [isStage2Open, setIsStage2Open] = useState(false);
  const [isStage3Open, setIsStage3Open] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Solve Data
  const [userSubmissions, setUserSubmissions] = useState<Record<string, any>>({});

  // Lock States
  const [isHandleLocked, setIsHandleLocked] = useState(true);
  const [isNameLocked, setIsNameLocked] = useState(true);
  const [isEmailLocked, setIsEmailLocked] = useState(true);
  const [isRegionLocked, setIsRegionLocked] = useState(true);
  const [isPhoneLocked, setIsPhoneLocked] = useState(true);
  const [isLegalFirstNameLocked, setIsLegalFirstNameLocked] = useState(true);
  const [isLegalLastNameLocked, setIsLegalLastNameLocked] = useState(true);
  const [isAddressLocked, setIsAddressLocked] = useState(true);
  const [isCityLocked, setIsCityLocked] = useState(true);
  const [isZipLocked, setIsZipLocked] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    ytHandle: '',
    email: '',
    passphrase: '',
    uidNumber: '--------',
    profilePicture: '',
    over18Attested: false,
    rulesAgreed: true,
    pushEnabled: false,
    emailOpin: false,
    createdAt: '',
    dob: '',
    countryCode: 'USA',
    region: '',
    isMinor: false,
    guardianEmail: '',
    guardianPhone: '',
    consentStatus: 'PENDING',
    phoneNumber: '',
    smsOptIn: false,
    legalFirstName: '',
    legalLastName: '',
    streetAddress: '',
    city: '',
    zipPostalCode: '',
    taxIdType: 'SSN',
    taxIdEncrypted: '',
    hasPassport: false,
    clearanceLevel: 1 as ClearanceLevel,
    vigenereCipherTime: '0:00:00:00'
  });

  const [socials, setSocials] = useState<UserSocials>({});

  useEffect(() => {
    const fetchUserProfile = async () => {
      const targetUid = user?.uid || '51H7yItLU9WMMiXl10xE';
      
      try {
        // Pillar 2: Fetch User Dossier
        const userRef = doc(db, 'Users', targetUid);
        const snapshot = await getDoc(userRef);
        
        // Pillar 3: Fetch User Submissions (Solve Times)
        const subQuery = query(collection(db, 'Submissions'), where('userId', '==', targetUid));
        const subSnapshot = await getDocs(subQuery);
        const submissionsMap: Record<string, any> = {};
        subSnapshot.forEach(doc => {
          submissionsMap[doc.data().creatorId] = doc.data();
        });
        setUserSubmissions(submissionsMap);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const l1 = data?.["Level 1"] || {};
          const l2 = data?.["Level 2"] || {};
          const l3 = data?.["Level 3"] || {};
          const sm = l1?.["Social Media"] || data?.["Social Media"] || data?.socials || {};

          setProfileData({
            displayName: l1.displayName || data?.displayName || '',
            ytHandle: l1.ytHandle || data?.ytHandle || '',
            email: l1.email || data?.email || user?.email || '',
            passphrase: l1.storedPassword || l1.storedPassphrase || '',
            uidNumber: l1.uidNumber || '--------',
            profilePicture: l1.avatarImage || l1.profilePicture || data?.profilePicture || '',
            over18Attested: l1.over18Attested ?? data?.over18Attested ?? true,
            rulesAgreed: l1.rulesAgreed ?? data?.agreedToRules ?? true,
            pushEnabled: l1.pushEnabled ?? data?.pushEnabled ?? false,
            emailOpin: l1.emailOpin ?? data?.emailOptIn ?? false,
            createdAt: l1.createdAt || data?.createdAt || new Date().toISOString(),
            dob: l2.dob || data?.dob || '',
            countryCode: l2.countryCode || data?.countryCode || 'USA',
            region: l2.region || data?.region || '',
            isMinor: l2.isMinor ?? data?.isMinor ?? false,
            guardianEmail: l2.guardianEmail || data?.guardianEmail || '',
            guardianPhone: l2.guardianPhone || data?.guardianPhone || '',
            consentStatus: l2.consentStatus || data?.consentStatus || 'PENDING',
            phoneNumber: l2.phoneNumber || data?.phoneNumber || '',
            smsOptIn: l2.smsOptIn ?? data?.smsOptIn ?? false,
            legalFirstName: l3.legalFirstName || data?.legalFirstName || '',
            legalLastName: l3.legalLastName || data?.legalLastName || '',
            streetAddress: l3.streetAddress || data?.physicalAddress || '',
            city: l3.city || data?.city || '',
            zipPostalCode: l3.zipPostalCode || data?.postalCode || '',
            taxIdType: l3.taxIdType || data?.taxIdType || 'SSN',
            taxIdEncrypted: l3.taxIdEncrypted || data?.taxIdEncrypted || '',
            hasPassport: l3.hasPassport ?? data?.hasPassport ?? false,
            clearanceLevel: (data?.clearanceLevel as ClearanceLevel) || 1,
            vigenereCipherTime: data?.vigenereCipherTime || '0:00:00:00'
          });

          setSocials(sm || {});
        }
      } catch (err) {
        console.warn("Dossier retrieval interrupted:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [user]);

  const handleSyncProfile = async (targetLevel?: ClearanceLevel) => {
    const targetUid = user?.uid || '51H7yItLU9WMMiXl10xE';
    setIsSyncing(true);
    const now = new Date().toISOString();
    
    const finalSmsOptIn = profileData.phoneNumber ? profileData.smsOptIn : false;
    const finalLevel = targetLevel || profileData.clearanceLevel;
    
    try {
      const userRef = doc(db, 'Users', targetUid);
      await setDoc(userRef, {
        "Level 1": {
          uid: targetUid,
          uidNumber: profileData.uidNumber,
          email: profileData.email,
          displayName: profileData.displayName,
          ytHandle: profileData.ytHandle,
          avatarImage: profileData.profilePicture,
          storedPassword: profileData.passphrase,
          over18Attested: profileData.over18Attested,
          clearance: 1,
          createdAt: profileData.createdAt,
          rulesAgreed: profileData.rulesAgreed,
          pushEnabled: profileData.pushEnabled,
          emailOpin: profileData.emailOpin,
          "Social Media": socials,
          updatedAt: now
        },
        "Level 2": {
          dob: profileData.dob,
          countryCode: profileData.countryCode,
          region: profileData.region,
          isMinor: profileData.isMinor,
          guardianEmail: profileData.guardianEmail,
          guardianPhone: profileData.guardianPhone,
          consentStatus: profileData.consentStatus,
          clearance: finalLevel >= 2 ? 2 : 1,
          phoneNumber: profileData.phoneNumber,
          smsOptIn: finalSmsOptIn,
          updatedAt: now
        },
        "Level 3": {
          legalFirstName: profileData.legalFirstName,
          legalLastName: profileData.legalLastName,
          streetAddress: profileData.streetAddress,
          city: profileData.city,
          zipPostalCode: profileData.zipPostalCode,
          taxIdType: profileData.taxIdType,
          taxIdEncrypted: profileData.taxIdEncrypted,
          hasPassport: profileData.hasPassport,
          clearance: finalLevel >= 3 ? 3 : (finalLevel >= 2 ? 2 : 1),
          updatedAt: now
        },
        clearanceLevel: finalLevel,
        vigenereCipherTime: profileData.vigenereCipherTime, 
        updatedAt: now
      }, { merge: true });
      
      if (!targetLevel) alert("Neural Profile Synchronized.");
    } catch (err) {
      console.error("Sync failure:", err);
      if (!targetLevel) alert("Database sync failure.");
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfileData(prev => ({ ...prev, profilePicture: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onBack();
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const handleVerifyLevel2 = async () => {
    if (!profileData.region.trim()) {
      alert("State/Region is mandatory for Level 2 verification.");
      return;
    }
    await handleSyncProfile(2);
    setProfileData(prev => ({ ...prev, clearanceLevel: 2 }));
    setShowLevel2Modal(false);
    alert("Clearance Level 2 Granted.");
  };

  const handleVerifyLevel3 = async () => {
    if (!profileData.legalFirstName.trim() || !profileData.legalLastName.trim()) {
      alert("Full Legal Name is mandatory for Stage 3 validation.");
      return;
    }
    await handleSyncProfile(3);
    setProfileData(prev => ({ ...prev, clearanceLevel: 3 }));
    setShowLevel3Modal(false);
    alert("Quarter-Finalist Clearance Granted.");
  };

  const handleSmsToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (profileData.clearanceLevel < 2) return;
    if (!profileData.phoneNumber || profileData.phoneNumber.trim() === "") {
      setShowSmsAlert(true);
      return;
    }
    setProfileData(prev => ({ ...prev, smsOptIn: !prev.smsOptIn }));
  };

  const shareableSocials = SOCIAL_PLATFORMS.filter(p => !!(socials as any)[p.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-display">
        <div className="text-vault-gold animate-pulse tracking-[0.5em] uppercase">Decrypting Profile...</div>
      </div>
    );
  }

  const finalPhotoURL = profileData.profilePicture || user?.photoURL || "https://i.ibb.co/SDhzf003/Vinny-Mug.png";

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/80 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBack} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-5xl flex flex-col items-center flex-1">
        
        {/* Agent Card */}
        <div className="bg-vault-panel/90 border-2 border-vault-gold/40 rounded-3xl p-6 md:p-10 mb-8 shadow-2xl flex flex-col md:flex-row items-center gap-10 w-full relative overflow-hidden">
           <div className="relative flex-shrink-0">
             <div 
               className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-vault-gold p-1 overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.3)] cursor-pointer hover:border-white transition-colors group/avatar"
               onClick={() => fileInputRef.current?.click()}
             >
               <img src={finalPhotoURL} alt={profileData.displayName} className="w-full h-full object-cover rounded-full" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full">
                 <span className="text-[10px] font-display font-black text-white uppercase tracking-widest">Update Photo</span>
               </div>
             </div>
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-vault-gold text-black px-4 py-1 text-[10px] font-display font-black uppercase tracking-widest rounded border border-black/20 whitespace-nowrap shadow-lg">
               CLEARANCE LEVEL {profileData.clearanceLevel}
             </div>
           </div>

           <div className="flex-1 w-full flex-col md:flex-row flex md:items-start justify-between overflow-visible">
             <div className="flex flex-col gap-2 flex-1">
               <div className="w-full relative group/name">
                 <input 
                   type="text"
                   value={profileData.displayName}
                   readOnly={isNameLocked}
                   onDoubleClick={() => setIsNameLocked(false)}
                   onBlur={() => setIsNameLocked(true)}
                   onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                   className={`w-full bg-transparent border-none p-0 text-3xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-wider focus:ring-0 placeholder-white/20 text-center md:text-left transition-all duration-300 ${isNameLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'}`}
                   placeholder="AGENT ALIAS"
                 />
               </div>
               
               <div className="w-full relative group/handle">
                 <input 
                   type="text"
                   value={profileData.ytHandle}
                   readOnly={isHandleLocked}
                   onDoubleClick={() => setIsHandleLocked(false)}
                   onBlur={() => setIsHandleLocked(true)}
                   onChange={(e) => setProfileData({...profileData, ytHandle: e.target.value})}
                   className={`w-full bg-transparent border-none p-0 text-vault-gold font-display font-medium text-xl md:text-2xl lg:text-3xl uppercase tracking-[0.3em] focus:ring-0 placeholder-white/10 text-center md:text-left transition-all duration-300 ${isHandleLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'}`}
                   placeholder="@YOUTUBEHANDLE"
                 />
               </div>

               <div className="w-full relative group/email mt-4">
                 <div className="h-px w-full bg-white/10 mb-4 md:max-w-md" />
                 <input 
                   type="email"
                   value={profileData.email}
                   readOnly={isEmailLocked}
                   onDoubleClick={() => setIsEmailLocked(false)}
                   onBlur={() => setIsEmailLocked(true)}
                   onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                   className={`w-full bg-transparent border-none p-0 text-white font-display font-medium text-sm md:text-base uppercase tracking-[0.3em] focus:ring-0 placeholder-white/20 text-center md:text-left transition-all duration-300 ${isEmailLocked ? 'opacity-60 cursor-not-allowed select-none' : 'opacity-100 cursor-text'}`}
                   placeholder="AGENT@EMAIL.COM"
                 />
               </div>
             </div>
           </div>
        </div>

        {/* Social Media Links Dropdown */}
        <div 
          className="w-full bg-vault-panel/80 border border-white/10 rounded-3xl p-4 md:p-5 mb-4 shadow-xl transition-all hover:border-vault-gold/40 group relative overflow-hidden cursor-pointer"
          onClick={() => setIsSocialMatrixOpen(!isSocialMatrixOpen)}
        >
           <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isSocialMatrixOpen ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
           <div className="relative z-10 w-full flex items-center justify-between">
             <h3 className="text-[18px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors">Social Media Links</h3>
             <svg className={`w-5 h-5 text-vault-gold transition-transform duration-300 ${isSocialMatrixOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
           <div className={`transition-all duration-300 overflow-hidden ${isSocialMatrixOpen ? 'max-h-[1200px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <div key={platform.id} className="space-y-1">
                    <label className="text-[12px] font-display uppercase tracking-widest text-white/40 block ml-1">{platform.label}</label>
                    <input type="text" placeholder="Link or Handle" value={(socials as any)[platform.id] || ''} onChange={(e) => setSocials({...socials, [platform.id]: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-1 text-[16px] text-vault-gold focus:ring-0 focus:border-vault-gold/50 transition-all" />
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Alert Hub Dropdown */}
        <div 
          className="w-full bg-vault-panel/80 border border-white/10 rounded-3xl p-4 md:p-5 mb-4 shadow-xl transition-all hover:border-vault-gold/40 group relative overflow-hidden cursor-pointer"
          onClick={() => setIsAlertHubOpen(!isAlertHubOpen)}
        >
           <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isAlertHubOpen ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
           <div className="relative z-10 w-full flex items-center justify-between">
             <h3 className="text-[18px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors">Alert Hub</h3>
             <svg className={`w-5 h-5 text-vault-gold transition-transform duration-300 ${isAlertHubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
           <div className={`transition-all duration-300 overflow-hidden ${isAlertHubOpen ? 'max-h-[800px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex items-center justify-between px-4 py-2 bg-black/60 rounded-xl border border-white/10 cursor-pointer hover:bg-black/80 hover:border-vault-gold/30 transition-all group/item">
                  <span className="text-[15px] font-display uppercase tracking-widest text-white/80 group-hover/item:text-white">Push Alerts</span>
                  <input type="checkbox" checked={profileData.pushEnabled} onChange={() => setProfileData({...profileData, pushEnabled: !profileData.pushEnabled})} className="w-6 h-6 rounded border-gray-300 text-vault-gold bg-black/40 focus:ring-vault-gold" />
                </label>
                <label className="flex items-center justify-between px-4 py-2 bg-black/60 rounded-xl border border-white/10 cursor-pointer hover:bg-black/80 hover:border-vault-gold/30 transition-all group/item">
                  <span className="text-[15px] font-display uppercase tracking-widest text-white/80 group-hover/item:text-white">Email Intel</span>
                  <input type="checkbox" checked={profileData.emailOpin} onChange={() => setProfileData({...profileData, emailOpin: !profileData.emailOpin})} className="w-6 h-6 rounded border-gray-300 text-vault-gold bg-black/40 focus:ring-vault-gold" />
                </label>
                <label onClick={handleSmsToggle} className={`flex items-center justify-between px-4 py-2 rounded-xl border transition-all ${profileData.clearanceLevel < 2 ? 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed' : 'bg-black/60 border-white/10 cursor-pointer hover:bg-black/80 hover:border-vault-gold/30 group/item'}`}>
                  <span className="text-[15px] font-display uppercase tracking-widest text-white/80 group-hover/item:text-white">SMS Gateway</span>
                  <input type="checkbox" disabled={profileData.clearanceLevel < 2} checked={profileData.phoneNumber ? profileData.smsOptIn : false} readOnly className={`w-6 h-6 rounded border-gray-300 bg-black/40 ${!profileData.phoneNumber && profileData.clearanceLevel >= 2 ? 'text-vault-alert' : 'text-vault-gold'}`} />
                </label>
              </div>
           </div>
        </div>

        {/* Timed Cracked Codes Dropdown */}
        <div 
          className="w-full bg-vault-panel/80 border border-white/10 rounded-3xl p-4 md:p-5 mb-4 shadow-xl transition-all hover:border-vault-gold/40 group relative overflow-hidden cursor-pointer"
          onClick={() => setIsTimedCodesOpen(!isTimedCodesOpen)}
        >
           <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isTimedCodesOpen ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
           <div className="relative z-10 w-full flex items-center justify-between">
             <h3 className="text-[18px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors">Timed Cracked Codes</h3>
             <svg className={`w-5 h-5 text-vault-gold transition-transform duration-300 ${isTimedCodesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
           
           <div className={`transition-all duration-300 overflow-hidden ${isTimedCodesOpen ? 'max-h-[8000px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              
              {/* Caesar Cipher Sub-Folder */}
              <div 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 hover:border-vault-gold/20 transition-all cursor-pointer group/sub"
                onClick={() => setIsCaesarOpen(!isCaesarOpen)}
              >
                <div className="flex items-center justify-between">
                   <h4 className="text-[14px] font-display font-bold text-white uppercase tracking-widest group-hover/sub:text-vault-gold transition-colors">Caesar Cipher Times</h4>
                   <svg className={`w-4 h-4 text-white/40 transition-transform ${isCaesarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isCaesarOpen && (
                  <div className="mt-8 space-y-4 animate-fadeIn">
                    {YOUTUBE_DATA.map((youtuber, idx) => {
                      const teamName = youtuber.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber.name.split(' ')[0]}`;
                      // Use a generic logic to find matching submission for this YouTuber (placeholder matches index 0 for Ramsey in this version)
                      const solveData = userSubmissions['MasterCreatorFolder']; 
                      const displayTime = (idx === 0 && solveData) ? solveData.huntTime : "--:--:--:--";

                      return (
                        <div key={idx} className="flex items-center justify-between p-4 md:p-6 bg-vault-panel/60 rounded-2xl border border-white/5 hover:border-vault-gold/30 transition-all gap-4 relative overflow-hidden group/item">
                          {/* Identity Section */}
                          <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-vault-gold/40 overflow-hidden flex-shrink-0 shadow-lg">
                              <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col text-left min-w-0">
                              <span className="text-[14px] md:text-[18px] font-display font-black uppercase text-white tracking-wider leading-tight truncate">{youtuber.name}</span>
                              <span className="text-[9px] md:text-[11px] font-display font-bold text-vault-alert uppercase tracking-widest mt-0.5">{teamName}</span>
                              {/* Mobile View: Time under team name */}
                              <span className="md:hidden text-white font-mono text-[13px] tracking-widest mt-1.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                {displayTime}
                              </span>
                            </div>
                          </div>

                          {/* Result Section: Centered */}
                          <div className="hidden md:flex flex-1 justify-center">
                             <span className="text-white font-mono text-xl md:text-2xl lg:text-3xl tracking-[0.1em] tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                {displayTime}
                             </span>
                          </div>
                          
                          {/* Action Section: Flush Right */}
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="text-[8px] md:text-[10px] font-display font-black text-vault-gold uppercase tracking-widest animate-blink text-right hidden sm:block">
                              Share my time with Friends
                            </span>
                            <button 
                              onClick={() => setIsShareModalOpen(true)}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-vault-gold hover:text-black transition-all active:scale-90 shadow-xl group/share-btn"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Vigenere Cipher Sub-Folder */}
              <div 
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 hover:border-vault-gold/20 transition-all cursor-pointer group/sub"
                onClick={() => setIsVigenereOpen(!isVigenereOpen)}
              >
                <div className="flex items-center justify-between">
                   <h4 className="text-[14px] font-display font-bold text-white uppercase tracking-widest group-hover/sub:text-vault-gold transition-colors">Vigeneré Cipher Times</h4>
                   <svg className={`w-4 h-4 text-white/40 transition-transform ${isVigenereOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {isVigenereOpen && (
                  <div className="mt-8 space-y-4 animate-fadeIn">
                    {YOUTUBE_DATA.map((youtuber, idx) => {
                      const teamName = youtuber.name === "Chris Ramsey" ? "Team Area 52" : `Team ${youtuber.name.split(' ')[0]}`;
                      const solveData = userSubmissions['MasterCreatorFolder']; 
                      const displayTime = (idx === 0 && solveData && solveData.vigenereTime) ? solveData.vigenereTime : "--:--:--:--";
                      const hasVigenereTime = displayTime !== "--:--:--:--" && displayTime !== "NO_TIME_RECORDED";

                      return (
                        <div key={idx} className="flex items-center justify-between p-4 md:p-6 bg-vault-panel/60 rounded-2xl border border-white/5 hover:border-vault-gold/30 transition-all gap-4 relative overflow-hidden group/item">
                          {/* Identity Section */}
                          <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-vault-gold/40 overflow-hidden flex-shrink-0 shadow-lg">
                              <img src={youtuber.avatar} alt={youtuber.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col text-left min-w-0">
                              <span className="text-[14px] md:text-[18px] font-display font-black uppercase text-white tracking-wider leading-tight truncate">{youtuber.name}</span>
                              <span className="text-[9px] md:text-[11px] font-display font-bold text-vault-alert uppercase tracking-widest mt-0.5">{teamName}</span>
                              {/* Mobile View: Time under team name */}
                              <span className={`md:hidden font-mono text-[13px] tracking-widest mt-1.5 ${hasVigenereTime ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'text-white/40'}`}>
                                {displayTime}
                              </span>
                            </div>
                          </div>

                          {/* Result Section: Centered */}
                          <div className="hidden md:flex flex-1 justify-center">
                             <span className={`font-mono text-xl md:text-2xl lg:text-3xl tracking-[0.1em] tabular-nums ${hasVigenereTime ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-white/30'}`}>
                                {displayTime}
                             </span>
                          </div>
                          
                          {/* Action Section: Flush Right */}
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {hasVigenereTime && (
                              <span className="text-[8px] md:text-[10px] font-display font-black text-vault-gold uppercase tracking-widest animate-blink text-right hidden sm:block">
                                Share my time with Friends
                              </span>
                            )}
                            <button 
                              onClick={() => setIsShareModalOpen(true)}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-vault-gold hover:text-black transition-all active:scale-90 shadow-xl group/share-btn"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

           </div>
        </div>

        {/* Stage 2 Dropdown */}
        <div 
          className="w-full bg-vault-panel/80 border border-white/10 rounded-3xl p-4 md:p-5 mb-4 shadow-xl transition-all hover:border-vault-gold/40 group relative overflow-hidden cursor-pointer"
          onClick={() => setIsStage2Open(!isStage2Open)}
        >
           <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isStage2Open ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
           <div className="relative z-10 w-full flex items-center justify-between">
             <h3 className={`text-[18px] font-display font-black uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors ${profileData.clearanceLevel < 2 ? 'text-white/40' : 'text-vault-gold'}`}>
               Stage 2: <span className={profileData.clearanceLevel < 2 ? '' : (profileData.phoneNumber ? 'text-[#22c55e]' : 'text-vault-alert')}>Verified</span>
             </h3>
             <svg className={`w-5 h-5 transition-transform duration-300 ${isStage2Open ? 'rotate-180' : ''} ${profileData.clearanceLevel < 2 ? 'text-white/20' : 'text-vault-gold'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
           <div className={`transition-all duration-300 overflow-hidden ${isStage2Open ? 'max-h-[800px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full">
                {profileData.clearanceLevel < 2 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-2xl border border-white/5">
                    <VaultButton variant="secondary" onClick={() => setShowLevel2Modal(true)} className="py-2 px-4 text-[10px]">Apply Level 2 Clearance</VaultButton>
                    <span className="text-[10px] font-display text-white/40 uppercase tracking-widest mt-4">Verification Required</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 px-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">state/region</span>
                      <input 
                        type="text"
                        value={profileData.region}
                        readOnly={isRegionLocked}
                        onDoubleClick={() => setIsRegionLocked(false)}
                        onBlur={() => setIsRegionLocked(true)}
                        onChange={(e) => setProfileData({...profileData, region: e.target.value})}
                        className={`bg-black/60 border border-white/10 rounded px-3 py-2 text-[15px] font-display uppercase tracking-widest focus:border-vault-gold outline-none w-full transition-all duration-300 ${isRegionLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[15px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">Phone</span>
                      <input 
                        type="text"
                        value={profileData.phoneNumber}
                        readOnly={isPhoneLocked}
                        onDoubleClick={() => setIsPhoneLocked(false)}
                        onBlur={() => setIsPhoneLocked(true)}
                        onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                        className={`bg-black/60 border border-white/10 rounded px-3 py-2 text-[15px] font-display uppercase tracking-widest focus:border-vault-gold outline-none w-full transition-all duration-300 ${isPhoneLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} ${!profileData.phoneNumber ? 'placeholder:text-vault-alert placeholder:font-black text-vault-alert' : 'text-white'}`}
                        placeholder="no phone number on file"
                      />
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Stage 3 Dropdown */}
        <div 
          className="w-full bg-vault-panel/80 border border-white/10 rounded-3xl p-4 md:p-5 mb-12 shadow-xl transition-all hover:border-vault-gold/40 group relative overflow-hidden cursor-pointer"
          onClick={() => setIsStage3Open(!isStage3Open)}
        >
           <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/15 to-transparent -translate-x-full ${!isStage3Open ? 'group-hover:animate-[shimmer_1.5s_infinite]' : ''} pointer-events-none`}></div>
           <div className="relative z-10 w-full flex items-center justify-between">
             <h3 className={`text-[18px] font-display font-black uppercase tracking-[0.3em] flex items-center gap-2 group-hover:text-white transition-colors ${profileData.clearanceLevel < 3 ? 'text-white/40' : 'text-vault-gold'}`}>
               Stage 3: <span className={profileData.clearanceLevel < 3 ? '' : 'text-[#22c55e]'}>Quarter-Finalist</span>
             </h3>
             <svg className={`w-5 h-5 transition-transform duration-300 ${isStage3Open ? 'rotate-180' : ''} ${profileData.clearanceLevel < 3 ? 'text-white/20' : 'text-vault-gold'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
           <div className={`transition-all duration-300 overflow-hidden ${isStage3Open ? 'max-h-[1200px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full">
                {profileData.clearanceLevel < 3 ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-black/40 rounded-2xl border border-white/5">
                    <VaultButton variant="secondary" onClick={() => setShowLevel3Modal(true)} className="py-2 px-4 text-[10px]">
                      Upgrade to Quarter-Finalist Status
                    </VaultButton>
                  </div>
                ) : (
                  <div className="space-y-6 py-4 px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 relative group/fName">
                        <label className="text-[13px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">Legal First Name</label>
                        <input 
                          type="text" 
                          value={profileData.legalFirstName} 
                          readOnly={isLegalFirstNameLocked}
                          onDoubleClick={() => setIsLegalFirstNameLocked(false)}
                          onBlur={() => setIsLegalFirstNameLocked(true)}
                          onChange={(e) => setProfileData({...profileData, legalFirstName: e.target.value})}
                          className={`w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[15px] font-display uppercase tracking-widest transition-all duration-300 ${isLegalFirstNameLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} text-white focus:border-vault-gold outline-none shadow-inner`} 
                        />
                      </div>
                      <div className="flex flex-col gap-1 relative group/lName">
                        <label className="text-[13px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">Legal Last Name</label>
                        <input 
                          type="text" 
                          value={profileData.legalLastName} 
                          readOnly={isLegalLastNameLocked}
                          onDoubleClick={() => setIsLegalLastNameLocked(false)}
                          onBlur={() => setIsLegalLastNameLocked(true)}
                          onChange={(e) => setProfileData({...profileData, legalLastName: e.target.value})}
                          className={`w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[15px] font-display uppercase tracking-widest transition-all duration-300 ${isLegalLastNameLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} text-white focus:border-vault-gold outline-none shadow-inner`} 
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 relative group/address">
                      <label className="text-[13px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">Street Address</label>
                      <input 
                        type="text" 
                        value={profileData.streetAddress} 
                        readOnly={isAddressLocked}
                        onDoubleClick={() => setIsAddressLocked(false)}
                        onBlur={() => setIsAddressLocked(true)}
                        onChange={(e) => setProfileData({...profileData, streetAddress: e.target.value})}
                        className={`w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[15px] font-display uppercase tracking-widest transition-all duration-300 ${isAddressLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} text-white focus:border-vault-gold outline-none shadow-inner`} 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 relative group/city">
                        <label className="text-[13px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">City</label>
                        <input 
                          type="text" 
                          value={profileData.city} 
                          readOnly={isCityLocked}
                          onDoubleClick={() => setIsCityLocked(false)}
                          onBlur={() => setIsCityLocked(true)}
                          onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                          className={`w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[15px] font-display uppercase tracking-widest transition-all duration-300 ${isCityLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} text-white focus:border-vault-gold outline-none shadow-inner`} 
                        />
                      </div>
                      <div className="flex flex-col gap-1 relative group/zip">
                        <label className="text-[13px] font-display uppercase tracking-widest text-vault-gold/80 block font-black">Zip Code</label>
                        <input 
                          type="text" 
                          value={profileData.zipPostalCode} 
                          readOnly={isZipLocked}
                          onDoubleClick={() => setIsZipLocked(false)}
                          onBlur={() => setIsZipLocked(true)}
                          onChange={(e) => setProfileData({...profileData, zipPostalCode: e.target.value})}
                          className={`w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-[15px] font-display uppercase tracking-widest transition-all duration-300 ${isZipLocked ? 'opacity-80 cursor-not-allowed select-none' : 'opacity-100 cursor-text'} text-white focus:border-vault-gold outline-none shadow-inner`} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-4 mb-24 relative z-50 w-full max-w-4xl">
           <VaultButton onClick={() => handleSyncProfile()} disabled={isSyncing} className="w-full py-6 text-xl tracking-[0.3em] shadow-xl">
             {isSyncing ? 'SYNCHRONIZING...' : 'SYNCHRONIZE PROFILE'}
           </VaultButton>
           <div className="flex flex-col md:flex-row gap-6 w-full">
             <VaultButton variant="secondary" onClick={onNavigateToPlayers} className="w-full md:flex-1 py-6 bg-black/40 border-2">Return to Mission</VaultButton>
             <VaultButton variant="secondary" onClick={handleSignOut} className="w-full md:flex-1 py-6 border-vault-alert/30 text-vault-alert">Sign Out</VaultButton>
           </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-lg bg-vault-panel border-2 border-vault-gold rounded-3xl p-8 md:p-10 shadow-[0_0_100px_rgba(212,175,55,0.2)] relative overflow-hidden">
            <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-2 text-center">Share Intel</h3>
            <p className="text-white/60 font-display text-[10px] uppercase tracking-[0.4em] mb-8 text-center border-b border-white/10 pb-4">Select Deployment Channel</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
              {shareableSocials.length > 0 ? (
                shareableSocials.map((platform) => (
                  <button 
                    key={platform.id}
                    onClick={() => {
                      const link = (socials as any)[platform.id];
                      if (link) window.open(link, '_blank');
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-black/60 border border-white/10 rounded-xl hover:border-vault-gold hover:bg-vault-gold/10 transition-all group"
                  >
                    <span className="text-[10px] font-display font-black uppercase text-white/40 group-hover:text-vault-gold tracking-widest">{platform.label}</span>
                  </button>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center bg-black/40 rounded-xl border border-dashed border-white/10">
                  <p className="text-vault-alert font-display font-black uppercase text-[10px] tracking-widest">No social channels linked</p>
                  <p className="text-white/40 text-[9px] mt-2 px-6 italic font-sans leading-relaxed">Please configure your links in the 'Social Media Links' section of your profile card first.</p>
                </div>
              )}
            </div>

            <VaultButton onClick={() => setIsShareModalOpen(false)} className="w-full py-4 text-sm">Close Link</VaultButton>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline"></div>
          </div>
        </div>
      )}

      {/* Level 2 Modal */}
      {showLevel2Modal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-lg bg-vault-panel border-2 border-vault-gold p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-display font-black text-vault-gold uppercase mb-6 tracking-widest border-b border-vault-gold/20 pb-4">Verification Gateway</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Birth Date</label>
                <input type="date" value={profileData.dob} onChange={(e) => setProfileData({...profileData, dob: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-vault-gold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Country</label>
                  <select value={profileData.countryCode} onChange={(e) => setProfileData({...profileData, countryCode: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none">
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">state/region <span className="text-vault-alert">*</span></label>
                  <input type="text" placeholder="State/Prov" value={profileData.region} onChange={(e) => setProfileData({...profileData, region: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Phone Link</label>
                <input type="text" placeholder="+1-XXX-XXX-XXXX" value={profileData.phoneNumber} onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-vault-gold" />
              </div>
              <div className="flex gap-4 pt-4">
                <VaultButton onClick={handleVerifyLevel2} disabled={isSyncing} className="flex-1 py-4 text-sm tracking-widest shadow-lg">Submit Intel</VaultButton>
                <button onClick={() => setShowLevel2Modal(false)} className="px-6 text-[10px] uppercase font-display text-white/40 hover:text-vault-gold transition-colors">Cancel</button>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline"></div>
          </div>
        </div>
      )}

      {/* Level 3 Modal */}
      {showLevel3Modal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-2xl bg-vault-panel border-2 border-vault-gold p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-display font-black text-vault-gold uppercase mb-6 tracking-widest border-b border-vault-gold/20 pb-4">Quarter-Finalist Info</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Legal First Name</label>
                  <input type="text" value={profileData.legalFirstName} onChange={(e) => setProfileData({...profileData, legalFirstName: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" placeholder="John" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Legal Last Name</label>
                  <input type="text" value={profileData.legalLastName} onChange={(e) => setProfileData({...profileData, legalLastName: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Residential Street Address</label>
                <input type="text" value={profileData.streetAddress} onChange={(e) => setProfileData({...profileData, streetAddress: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" placeholder="123 Cryptic Way" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">City</label>
                  <input type="text" value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" placeholder="City" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-gold/60 ml-1">Zip/Postal Code</label>
                  <input type="text" value={profileData.zipPostalCode} onChange={(e) => setProfileData({...profileData, zipPostalCode: e.target.value})} className="w-full bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white outline-none" placeholder="00000" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <VaultButton onClick={handleVerifyLevel3} disabled={isSyncing} className="flex-1 py-4 text-sm tracking-widest shadow-lg">Submit Information</VaultButton>
                <button onClick={() => setShowLevel3Modal(false)} className="px-6 text-[10px] uppercase font-display text-white/40 hover:text-vault-gold transition-colors">Cancel</button>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline"></div>
          </div>
        </div>
      )}

      {/* SMS Alert */}
      {showSmsAlert && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease-out] backdrop-blur-sm">
          <div className="w-full max-sm bg-vault-panel border-2 border-vault-alert p-8 rounded-3xl shadow-[0_0_50px_rgba(255,51,51,0.3)] text-center relative overflow-hidden">
             <h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-4">Protocol Error</h3>
             <p className="text-vault-gold font-display font-bold text-sm uppercase tracking-widest leading-relaxed mb-8">Must fill in phone number to get texting.</p>
             <VaultButton onClick={() => setShowSmsAlert(false)} className="w-full py-4 text-sm bg-vault-alert hover:bg-white text-white hover:text-black border-vault-alert">Acknowledge</VaultButton>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline"></div>
          </div>
        </div>
      )}

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/80 mt-auto">
        <p className="font-display text-sm text-white uppercase tracking-widest opacity-40">&copy; 2026 CODE KRACKER XR | AGENT DOSSIER MODULE</p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.03] scanline"></div>
    </div>
  );
};