
import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

const CREATOR_DOC_ID = 'MasterCreatorFolder';

type FieldStatus = 'synced' | 'dirty' | 'error' | 'none';

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
  title: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode; className?: string; headerExtra?: React.ReactNode; noShimmer?: boolean;
}> = ({ title, isOpen, onToggle, children, className = "mb-6", headerExtra, noShimmer }) => {
  return (
    <div className={`w-full bg-vault-panel/80 border border-white/10 rounded-[2rem] p-4 md:p-6 ${className} shadow-xl transition-all relative overflow-hidden cursor-pointer hover:border-vault-gold/40 group`} onClick={onToggle}>
       {!noShimmer && (
         <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/5 to-transparent -translate-x-full ${!isOpen ? 'group-hover:animate-[shimmer_2s_infinite]' : ''} pointer-events-none`}></div>
       )}
       <div className="relative z-10 w-full flex items-center justify-between">
         <div className="text-[18px] md:text-[32px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center group-hover:text-white transition-colors">{title}</div>
         <div className="flex items-center gap-4">
           {headerExtra}
           <svg className={`w-6 h-6 text-vault-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
         </div>
       </div>
       <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[25000px] mt-8 opacity-100 pb-4' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>
          {children}
       </div>
    </div>
  );
};

const StatusBullet: React.FC<{ status: FieldStatus }> = ({ status }) => {
  if (status === 'none') return null;
  const color = status === 'synced' ? '#22c55e' : status === 'dirty' ? '#f97316' : '#ef4444';
  return <span className="ml-2 text-xl leading-none transition-colors duration-300" style={{ color }}>●</span>;
};

const PageDoneBullet: React.FC<{ status: 'yellow' | 'red' | 'green' }> = ({ status }) => {
  const color = status === 'green' ? '#22c55e' : status === 'red' ? '#ef4444' : '#d4af37';
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-vault-gold p-[3px] ml-4 flex-shrink-0">
      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
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
  status?: FieldStatus;
  className?: string;
  inputClassName?: string;
  readOnly?: boolean;
  resize?: boolean;
}> = ({ label, value, onChange, placeholder, isTextArea, type = 'text', onAskAI, isLoadingAI, status = 'none', className = "mb-8", inputClassName = "", readOnly, resize }) => (
  <div className={`flex flex-col gap-2 group/field w-full ${className}`}>
    {label && (
      <div className="flex items-center justify-between px-1">
        <label className="text-[11px] md:text-[13px] font-display font-black uppercase tracking-[0.2em] text-vault-gold group-hover/field:text-white transition-colors cursor-default whitespace-nowrap flex items-center">
          {label}
          <StatusBullet status={status} />
        </label>
        {onAskAI && (
          <button onClick={onAskAI} disabled={isLoadingAI} className="text-[10px] md:text-[12px] font-display font-black bg-vault-gold/10 border border-vault-gold/40 text-vault-gold px-4 py-1.5 rounded-lg hover:bg-vault-gold hover:text-black transition-all flex items-center gap-2 disabled:opacity-50">
            {isLoadingAI ? 'ANALYZING...' : 'ASK AI'}
            <span className="ml-1 text-[8px]">●</span>
          </button>
        )}
      </div>
    )}
    <div className={`relative group/box overflow-hidden rounded-xl ${!readOnly ? 'shadow-[0_0_15px_rgba(212,175,55,0.05)]' : ''}`}>
      {isTextArea ? (
        <textarea value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-black/40 border-2 ${readOnly ? 'border-white/5' : 'border-vault-gold/20'} rounded-xl px-6 py-5 font-sans text-lg text-white focus:outline-none focus:border-vault-gold/50 transition-all min-h-[140px] ${resize ? 'resize-y' : 'resize-none'} ${inputClassName}`} />
      ) : (
        <input type={type} value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full bg-black/40 border-2 ${readOnly ? 'border-white/5' : 'border-vault-gold/20'} rounded-xl px-6 py-5 font-sans text-lg text-white focus:outline-none focus:border-vault-gold/50 transition-all ${inputClassName}`} />
      )}
    </div>
  </div>
);

const UploadField: React.FC<{ 
  label?: React.ReactNode; 
  onFileSelect: (file: File) => void; 
  previewUrl?: string; 
  isCompact?: boolean;
  buttonText?: string;
  hidePreview?: boolean;
  className?: string;
}> = ({ label, onFileSelect, previewUrl, isCompact, buttonText = "UPLOAD", hidePreview = false, className = "" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`flex flex-col gap-2 group/field ${isCompact ? '' : 'w-full'} ${className}`}>
      {label && <label className="text-[11px] md:text-[13px] font-display font-black uppercase tracking-[0.2em] text-vault-gold">{label}</label>}
      <div className="flex items-center gap-4 bg-black/30 border-2 border-dashed border-white/10 rounded-xl p-2 hover:bg-white/[0.05] transition-all">
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} className="hidden" accept="image/*" />
        <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-4 py-2 rounded-lg font-display font-black uppercase text-xs hover:bg-vault-gold transition-all">{buttonText}</button>
        {!hidePreview && previewUrl && (
          <div className="w-12 h-12 md:w-16 md:h-16 aspect-square flex-shrink-0 rounded-full border-2 border-vault-gold/40 overflow-hidden bg-black shadow-lg">
            <img src={previewUrl} alt="Thumbnail" className="w-full h-full object-cover rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export const MissionCentralPage: React.FC<{ onBack: () => void; user: any, onNavigateToHub: () => void, onNavigateToGamePlayApp: () => void }> = ({ onBack, user, onNavigateToHub, onNavigateToGamePlayApp }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    mission_admin_info_open: false,
    mission_creator_info_open: false,
    missionGlobalOps: false
  });

  const [formData, setFormData] = useState<any>({
    adminEmail: '', adminPhone: '', firstName: '', lastName: '',
    creatorEmail: '', creatorPhone: '', creatorName: '', creatorTeam: '', landingPage: '', avatarImageBase64: '',
    missionLaunchDate: '', missionDirectionsTemplate: '', missionItineraryNotes: '', missionCameramanName: '', missionCameramanPhone: '', missionCameramanEmail: '',
    missionProducerName: '', missionProducerPhone: '', missionProducerEmail: '', 
    breakInCity: '', breakInState: '', gpsNorthLat: '', gpsWestLong: '', finalTime: '', vaultAddress: ''
  });

  const [fieldStatus, setFieldStatus] = useState<Record<string, FieldStatus>>({});
  const [adminInfoDoneStatus, setAdminInfoDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [creatorInfoDoneStatus, setCreatorInfoDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [globalOpsDoneStatus, setGlobalOpsDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [syncingTarget, setSyncingTarget] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'creators', CREATOR_DOC_ID));
      if (snap.exists()) {
        const data = snap.data();
        const cl = data.CreatorLinks || {};
        const pi = cl["Personal Info"] || {};
        const mc = data.MissionCentral || {};
        const mgo = mc["Global Operations"] || {};
        const bi = data.TheBreakIn || {};
        const biTimeLoc = bi["Time and location"] || {};
        
        setFormData({
          adminEmail: pi.AdminEmail || '', adminPhone: pi.AdminPhone || '', firstName: pi.FirstName || '', lastName: pi.LastName || '',
          creatorEmail: pi.CreatorEmail || '', creatorPhone: pi.CreatorPhone || '', creatorName: cl.CreatorName || '', creatorTeam: cl.CreatorTeam || '', 
          landingPage: cl.LandingPage || '', avatarImageBase64: cl.AvatarImage || '',
          missionLaunchDate: mgo.LaunchDate || '', missionDirectionsTemplate: mgo.DirectionsTemplate || '', missionItineraryNotes: mgo.ItineraryNotes || '',
          missionCameramanName: mgo.CameramanName || '', missionCameramanPhone: mgo.CameramanPhone || '', missionCameramanEmail: mgo.CameramanEmail || '',
          missionProducerName: mgo.ProducerName || '', missionProducerPhone: mgo.ProducerPhone || '', missionProducerEmail: mgo.ProducerEmail || '',
          breakInCity: biTimeLoc.BreakInCity || '',
          breakInState: biTimeLoc.BreakInState || '',
          gpsNorthLat: biTimeLoc.GPSNorthLat || '',
          gpsWestLong: biTimeLoc.GPSWestLong || '',
          finalTime: biTimeLoc.FinalTime || '',
          vaultAddress: biTimeLoc.VaultAddress || ''
        });
      }
    };
    fetch();
  }, []);

  const updateField = (field: string, val: string) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    setFieldStatus(prev => ({ ...prev, [field]: 'dirty' }));
    if (['firstName', 'lastName', 'adminEmail', 'adminPhone'].includes(field)) setAdminInfoDoneStatus('red');
    if (['creatorName', 'creatorEmail', 'creatorPhone', 'creatorTeam', 'landingPage'].includes(field)) setCreatorInfoDoneStatus('red');
    if (['missionLaunchDate', 'missionDirectionsTemplate', 'missionItineraryNotes', 'missionCameramanName', 'missionCameramanPhone', 'missionCameramanEmail', 'missionProducerName', 'missionProducerPhone', 'missionProducerEmail', 'breakInCity', 'breakInState', 'gpsNorthLat', 'gpsWestLong', 'finalTime', 'vaultAddress'].includes(field)) {
      setGlobalOpsDoneStatus('red');
    }
  };

  const handleSave = async (target: string) => {
    setSyncingTarget(target);
    try {
      const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
      const update: any = {};

      setDeepValue(update, "CreatorLinks.Personal Info.AdminEmail", formData.adminEmail);
      setDeepValue(update, "CreatorLinks.Personal Info.AdminPhone", formData.adminPhone);
      setDeepValue(update, "CreatorLinks.Personal Info.FirstName", formData.firstName);
      setDeepValue(update, "CreatorLinks.Personal Info.LastName", formData.lastName);
      setDeepValue(update, "CreatorLinks.Personal Info.CreatorEmail", formData.creatorEmail);
      setDeepValue(update, "CreatorLinks.Personal Info.CreatorPhone", formData.creatorPhone);
      setDeepValue(update, "CreatorLinks.CreatorName", formData.creatorName);
      setDeepValue(update, "CreatorLinks.CreatorTeam", formData.creatorTeam);
      setDeepValue(update, "CreatorLinks.LandingPage", formData.landingPage);
      setDeepValue(update, "CreatorLinks.AvatarImage", formData.avatarImageBase64);
      
      setDeepValue(update, "MissionCentral.Global Operations.DirectionsTemplate", formData.missionDirectionsTemplate);
      setDeepValue(update, "MissionCentral.Global Operations.LaunchDate", formData.missionLaunchDate);
      setDeepValue(update, "MissionCentral.Global Operations.ItineraryNotes", formData.missionItineraryNotes);
      setDeepValue(update, "MissionCentral.Global Operations.CameramanName", formData.missionCameramanName);
      setDeepValue(update, "MissionCentral.Global Operations.CameramanPhone", formData.missionCameramanPhone);
      setDeepValue(update, "MissionCentral.Global Operations.CameramanEmail", formData.missionCameramanEmail);
      setDeepValue(update, "MissionCentral.Global Operations.ProducerName", formData.missionProducerName);
      setDeepValue(update, "MissionCentral.Global Operations.ProducerPhone", formData.missionProducerPhone);
      setDeepValue(update, "MissionCentral.Global Operations.ProducerEmail", formData.missionProducerEmail);
      
      setDeepValue(update, "TheBreakIn.Time and location.BreakInCity", formData.breakInCity);
      setDeepValue(update, "TheBreakIn.Time and location.BreakInState", formData.breakInState);
      setDeepValue(update, "TheBreakIn.Time and location.GPSNorthLat", formData.gpsNorthLat);
      setDeepValue(update, "TheBreakIn.Time and location.GPSWestLong", formData.gpsWestLong);
      setDeepValue(update, "TheBreakIn.Time and location.FinalTime", formData.finalTime);
      setDeepValue(update, "TheBreakIn.Time and location.VaultAddress", formData.vaultAddress);

      await setDoc(creatorRef, update, { merge: true });
      
      setFieldStatus(prev => {
        const next = { ...prev };
        Object.keys(formData).forEach(k => {
          if (next[k] === 'dirty') next[k] = 'synced';
        });
        return next;
      });
      alert("Mission Parameters Synchronized.");
    } catch (err) { alert("Handshake Failure."); } finally { setSyncingTarget(null); }
  };

  const handlePageDone = (section: string) => {
    if (section === 'admin') setAdminInfoDoneStatus('green');
    if (section === 'creator') setCreatorInfoDoneStatus('green');
    if (section === 'global') setGlobalOpsDoneStatus('green');
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden">
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBack} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto p-6 lg:p-16 pb-48 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center">Mission Central</h1>

        <div className="flex flex-col w-full gap-8">
            <ShimmerDropdown title={<div className="flex items-center"><span>Admin info</span><PageDoneBullet status={adminInfoDoneStatus} /></div>} isOpen={openSections.mission_admin_info_open} onToggle={() => setOpenSections(p => ({...p, mission_admin_info_open: !p.mission_admin_info_open}))}>
              <InputGroup label="Admin First Name" value={formData.firstName} onChange={v => updateField('firstName', v)} status={fieldStatus.firstName} />
              <InputGroup label="Admin Last Name" value={formData.lastName} onChange={v => updateField('lastName', v)} status={fieldStatus.lastName} />
              <InputGroup label="Admin Email" value={formData.adminEmail} onChange={v => updateField('adminEmail', v)} status={fieldStatus.adminEmail} />
              <InputGroup label="Admin Phone" value={formData.adminPhone} onChange={v => updateField('adminPhone', v)} status={fieldStatus.adminPhone} />
              <div className="flex items-center justify-center gap-4 mt-8">
                <VaultButton onClick={() => handleSave('ADMIN_INFO')}>Sync Data</VaultButton>
                <button onClick={() => handlePageDone('admin')} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
              </div>
            </ShimmerDropdown>

            <ShimmerDropdown title={<div className="flex items-center"><span>Creator Info</span><PageDoneBullet status={creatorInfoDoneStatus} /></div>} isOpen={openSections.mission_creator_info_open} onToggle={() => setOpenSections(p => ({...p, mission_creator_info_open: !p.mission_creator_info_open}))}>
              <div className="bg-black/40 py-4 px-4 rounded-xl border border-white/5 w-full group/item flex flex-col md:flex-row items-stretch md:items-center gap-4 shadow-lg overflow-hidden mb-8">
                <label className="text-[12px] md:text-[14px] font-display font-black uppercase text-vault-gold tracking-[0.2em] whitespace-nowrap">Creator Avatar</label>
                <div className="flex flex-row items-center justify-between md:justify-end gap-6 flex-1">
                  <UploadField onFileSelect={(f) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => updateField('avatarImageBase64', ev.target?.result as string);
                    reader.readAsDataURL(f);
                  }} className="mb-0" isCompact hidePreview buttonText="UPLOAD" previewUrl={formData.avatarImageBase64} />
                </div>
              </div>
              <InputGroup label="Creator Name" value={formData.creatorName} onChange={v => updateField('creatorName', v)} status={fieldStatus.creatorName} />
              <InputGroup label="Creator Email" value={formData.creatorEmail} onChange={v => updateField('creatorEmail', v)} status={fieldStatus.creatorEmail} />
              <InputGroup label="Creator Phone" value={formData.creatorPhone} onChange={v => updateField('creatorPhone', v)} status={fieldStatus.creatorPhone} />
              <InputGroup label="Creator Team" value={formData.creatorTeam} onChange={v => updateField('creatorTeam', v)} status={fieldStatus.creatorTeam} />
              <InputGroup label="Landing Page" value={formData.landingPage} onChange={v => updateField('landingPage', v)} status={fieldStatus.landingPage} />
              <div className="flex items-center justify-center gap-4 mt-8">
                <VaultButton onClick={() => handleSave('CREATOR_INFO')}>Sync Data</VaultButton>
                <button onClick={() => handlePageDone('creator')} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
              </div>
            </ShimmerDropdown>

            <ShimmerDropdown title={<div className="flex items-center"><span>GLOBAL OPERATIONS</span><PageDoneBullet status={globalOpsDoneStatus} /></div>} isOpen={openSections.missionGlobalOps} onToggle={() => setOpenSections(p => ({...p, missionGlobalOps: !p.missionGlobalOps}))}>
              <div className="flex flex-col w-full space-y-8 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                  <InputGroup type="date" label="MISSION LAUNCH DATE" value={formData.missionLaunchDate} onChange={v => updateField('missionLaunchDate', v)} status={fieldStatus.missionLaunchDate} className="mb-0" inputClassName="pr-12" />
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] md:text-[13px] font-display font-black uppercase tracking-[0.2em] text-vault-gold ml-1">VAULT CALENDAR LINK</label>
                    <button onClick={() => window.open('https://calendar.google.com', '_blank')} className="w-full bg-white text-black font-display font-black uppercase tracking-widest py-5 rounded-xl border-2 border-transparent hover:bg-vault-gold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z" /></svg>
                      ADD TO VAULT CALENDAR
                    </button>
                  </div>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-8">
                  <h4 className="text-[12px] md:text-[14px] font-display font-black text-vault-gold uppercase tracking-[0.3em] border-b border-white/10 pb-4 mb-4">Tactical Time and Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputGroup label="Final Time" value={formData.finalTime} onChange={(v) => updateField('finalTime', v)} status={fieldStatus.finalTime} className="mb-0" />
                    <InputGroup label="Break In City" value={formData.breakInCity} onChange={(v) => updateField('breakInCity', v)} status={fieldStatus.breakInCity} className="mb-0" />
                    <InputGroup label="Break In State" value={formData.breakInState} onChange={(v) => updateField('breakInState', v)} status={fieldStatus.breakInState} className="mb-0" />
                  </div>
                  <InputGroup label="Vault Address" value={formData.vaultAddress} onChange={(v) => updateField('vaultAddress', v)} status={fieldStatus.vaultAddress} placeholder="This is where parking is." className="mb-0" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="GPS North / Latitude" value={formData.gpsNorthLat} onChange={(v) => updateField('gpsNorthLat', v)} status={fieldStatus.gpsNorthLat} className="mb-0" />
                    <InputGroup label="GPS West / Longitude" value={formData.gpsWestLong} onChange={(v) => updateField('gpsWestLong', v)} status={fieldStatus.gpsWestLong} className="mb-0" />
                  </div>
                </div>
                <InputGroup label="MISSION DIRECTIONS TEMPLATE" value={formData.missionDirectionsTemplate} onChange={v => updateField('missionDirectionsTemplate', v)} status={fieldStatus.missionDirectionsTemplate} isTextArea resize={true} className="mb-0" inputClassName="min-h-[220px]" />
                <InputGroup label="ITINERARY TACTICAL NOTES" value={formData.missionItineraryNotes} onChange={v => updateField('missionItineraryNotes', v)} status={fieldStatus.missionItineraryNotes} isTextArea resize={true} className="mb-0" inputClassName="min-h-[220px]" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputGroup label="CAMERAMAN NAME" value={formData.missionCameramanName} onChange={v => updateField('missionCameramanName', v)} status={fieldStatus.missionCameramanName} className="mb-0" />
                  <InputGroup label="CAMERAMAN PHONE" value={formData.missionCameramanPhone} onChange={v => updateField('missionCameramanPhone', v)} status={fieldStatus.missionCameramanPhone} className="mb-0" />
                  <InputGroup label="CAMERAMAN EMAIL" value={formData.missionCameramanEmail} onChange={v => updateField('missionCameramanEmail', v)} status={fieldStatus.missionCameramanEmail} className="mb-0" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputGroup label="PRODUCER NAME" value={formData.missionProducerName} onChange={v => updateField('missionProducerName', v)} status={fieldStatus.missionProducerName} className="mb-0" />
                  <InputGroup label="PRODUCER PHONE" value={formData.missionProducerPhone} onChange={v => updateField('missionProducerPhone', v)} status={fieldStatus.missionProducerPhone} className="mb-0" />
                  <InputGroup label="PRODUCER EMAIL" value={formData.missionProducerEmail} onChange={v => updateField('missionProducerEmail', v)} status={fieldStatus.missionProducerEmail} className="mb-0" />
                </div>
                <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-white/10">
                  <button onClick={() => handleSave('GLOBAL_OPS')} className={`px-12 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[14px] transition-all border-2 ${syncingTarget === 'GLOBAL_OPS' ? 'bg-vault-gold text-black border-vault-gold animate-pulse' : 'bg-white text-black border-transparent hover:bg-vault-gold shadow-lg active:scale-95'}`}>
                    {syncingTarget === 'GLOBAL_OPS' ? 'SYNCING...' : 'SYNC DATA'}
                  </button>
                  <button onClick={() => handlePageDone('global')} className="px-12 py-4 rounded-xl font-display font-black uppercase tracking-widest text-[14px] transition-all border-2 bg-vault-gold text-black border-transparent hover:bg-white shadow-lg active:scale-95">
                    PAGE DONE
                  </button>
                </div>
              </div>
            </ShimmerDropdown>
        </div>

        {/* Navigation Buttons Area */}
        <section className="w-full flex flex-col md:flex-row gap-6 mt-12">
          <VaultButton 
            onClick={onNavigateToHub} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Game Play Hub
          </VaultButton>
          <VaultButton 
            onClick={onNavigateToGamePlayApp} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Production App
          </VaultButton>
        </section>

      </div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] scanline" />
    </div>
  );
};
