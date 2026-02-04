
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

const CREATOR_DOC_ID = 'MasterCreatorFolder';

const MISSION_GAMEPLAY_COPY: Record<number, string> = {
  1: "Mission 1 .", 2: "Mission 2. .", 3: "Mission 3. .", 4: "Mission 4. .", 5: "Mission 5. .",
  6: "Mission 5. .", 7: "Mission 7. ", 8: "Mission 8. .", 9: "Mission 9. .", 10: "Mission 10. ",
  11: "Mission 11. ", 12: "Mission 12. ", 13: "Mission 13. .", 14: "Mission 14. ."
};

const INTRO_DEFAULT_COPY = "Introro.";
const VAULT_DEFAULT_COPY = "LASERS DOWN! !";

type FieldStatus = 'synced' | 'dirty' | 'none';

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
  title: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode; className?: string; noShimmer?: boolean;
}> = ({ title, isOpen, onToggle, children, className = "mb-6", noShimmer }) => (
  <div className={`w-full bg-vault-panel/80 border border-white/10 rounded-[2rem] p-4 md:p-6 ${className} shadow-xl transition-all relative overflow-hidden cursor-pointer hover:border-vault-gold/40 group`} onClick={onToggle}>
    {!noShimmer && <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/5 to-transparent -translate-x-full ${!isOpen ? 'group-hover:animate-[shimmer_2s_infinite]' : ''} pointer-events-none`} />}
    <div className="relative z-10 w-full flex items-center justify-between">
      <div className="text-[18px] md:text-[32px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center group-hover:text-white transition-colors">{title}</div>
      <svg className={`w-6 h-6 text-vault-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
    </div>
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[25000px] mt-8 opacity-100 pb-4' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

const PageDoneBullet: React.FC<{ status: 'yellow' | 'red' | 'green' }> = ({ status }) => {
  const color = status === 'green' ? '#22c55e' : status === 'red' ? '#ef4444' : '#d4af37';
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-vault-gold p-[3px] ml-4 flex-shrink-0">
      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
};

const InputGroup: React.FC<{ 
  label: string; value: string; onChange: (val: string) => void; isTextArea?: boolean; status?: FieldStatus;
}> = ({ label, value, onChange, isTextArea, status = 'none' }) => (
  <div className="flex flex-col gap-2 mb-8 group/field">
    <label className="text-[11px] md:text-[13px] font-display font-black uppercase tracking-[0.2em] text-vault-gold group-hover/field:text-white transition-colors flex items-center">
      {label}
      {status !== 'none' && <span className="ml-2 text-xl" style={{ color: status === 'synced' ? '#22c55e' : '#f97316' }}>●</span>}
    </label>
    {isTextArea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border-2 border-vault-gold/20 rounded-xl px-6 py-5 font-sans text-lg text-white focus:outline-none focus:border-vault-gold/50 min-h-[140px] resize-none" />
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border-2 border-vault-gold/20 rounded-xl px-6 py-5 font-sans text-lg text-white focus:outline-none focus:border-vault-gold/50" />
    )}
  </div>
);

export const GamePlayAppPage: React.FC<{ onBack: () => void, onNavigateToHub: () => void, onNavigateToMissionCentral: () => void }> = ({ onBack, onNavigateToHub, onNavigateToMissionCentral }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    gameplay: false, control: true, guide: false, intro: false, vault: false
  });
  const [formData, setFormData] = useState<any>({
    tacticalMessage: '', introFirstShot: INTRO_DEFAULT_COPY, introCreatorNotes: '', introVideoNotes: '',
    vaultGamePlay: VAULT_DEFAULT_COPY, vaultCreatorNotes: '', vaultVideoNotes: '',
    vvgMissions: Array.from({ length: 14 }, () => ({ creatorNotes: '', videoNotes: '', gamePlay: '' }))
  });
  const [gamePlayDoneStatus, setGamePlayDoneStatus] = useState<'yellow' | 'red' | 'green'>('yellow');
  const [vvgDoneStatus, setVvgDoneStatus] = useState<Record<string, 'yellow' | 'red' | 'green'>>(() => {
    const initial: Record<string, 'yellow' | 'red' | 'green'> = { main: 'yellow', intro: 'yellow', vault: 'yellow' };
    for (let i = 1; i <= 14; i++) {
      initial[String(i)] = 'yellow';
    }
    return initial;
  });

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'creators', CREATOR_DOC_ID));
      if (snap.exists()) {
        const data = snap.data();
        const mc = data.MissionCentral || {};
        const mvg = mc["Vault Video Guide"] || {};
        const liveSess = data.LiveSession || {};
        setFormData({
          tacticalMessage: liveSess.tacticalMessage || '',
          introFirstShot: mvg.IntroFirstShot || INTRO_DEFAULT_COPY,
          introCreatorNotes: mvg.IntroCreatorNotes || '',
          introVideoNotes: mvg.IntroVideoNotes || '',
          vaultGamePlay: mvg.VaultGamePlay || VAULT_DEFAULT_COPY,
          vaultCreatorNotes: mvg.VaultCreatorNotes || '',
          vaultVideoNotes: mvg.VaultVideoNotes || '',
          vvgMissions: Array.from({ length: 14 }, (_, i) => ({
            creatorNotes: mvg[`Mission${i + 1}CreatorNotes`] || '',
            videoNotes: mvg[`Mission${i + 1}VideoNotes`] || '',
            gamePlay: mvg[`Mission${i + 1}GamePlay`] || MISSION_GAMEPLAY_COPY[i + 1]
          }))
        });
      }
    };
    fetch();
  }, []);

  const handleUpdateField = (key: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: val }));
    if (['introFirstShot', 'introCreatorNotes', 'introVideoNotes'].includes(key)) {
      setVvgDoneStatus(prev => ({ ...prev, intro: 'red', main: 'red' }));
    } else if (['vaultGamePlay', 'vaultCreatorNotes', 'vaultVideoNotes'].includes(key)) {
      setVvgDoneStatus(prev => ({ ...prev, vault: 'red', main: 'red' }));
    }
  };

  const handleUpdateMission = (index: number, key: string, val: string) => {
    const n = [...formData.vvgMissions];
    n[index] = { ...n[index], [key]: val };
    setFormData({ ...formData, vvgMissions: n });
    setVvgDoneStatus(prev => ({ ...prev, [String(index + 1)]: 'red', main: 'red' }));
  };

  const handleSave = async (target: string) => {
    try {
      const update: any = {};
      setDeepValue(update, "LiveSession.tacticalMessage", formData.tacticalMessage);
      setDeepValue(update, "MissionCentral.Vault Video Guide.IntroFirstShot", formData.introFirstShot);
      setDeepValue(update, "MissionCentral.Vault Video Guide.IntroCreatorNotes", formData.introCreatorNotes);
      setDeepValue(update, "MissionCentral.Vault Video Guide.IntroVideoNotes", formData.introVideoNotes);
      setDeepValue(update, "MissionCentral.Vault Video Guide.VaultGamePlay", formData.vaultGamePlay);
      setDeepValue(update, "MissionCentral.Vault Video Guide.VaultCreatorNotes", formData.vaultCreatorNotes);
      setDeepValue(update, "MissionCentral.Vault Video Guide.VaultVideoNotes", formData.vaultVideoNotes);
      formData.vvgMissions.forEach((m: any, i: number) => {
        setDeepValue(update, `MissionCentral.Vault Video Guide.Mission${i + 1}CreatorNotes`, m.creatorNotes);
        setDeepValue(update, `MissionCentral.Vault Video Guide.Mission${i + 1}VideoNotes`, m.videoNotes);
        setDeepValue(update, `MissionCentral.Vault Video Guide.Mission${i + 1}GamePlay`, m.gamePlay);
      });
      await setDoc(doc(db, 'creators', CREATOR_DOC_ID), update, { merge: true });
      alert("Neural Protocol Synced.");
    } catch (err) { alert("Sync Failure."); }
  };

  const handlePushTactical = async () => {
    if (!formData.tacticalMessage.trim()) return;
    await setDoc(doc(db, 'creators', CREATOR_DOC_ID), { LiveSession: { tacticalMessage: formData.tacticalMessage, messageId: Math.random().toString(36).substring(7), sentAt: serverTimestamp() } }, { merge: true });
    alert("Tactical Data Pushed.");
  };

  const handleVvgPageDone = (id: string) => {
    // Fix: Explicitly typing 'next' to match Record<string, 'yellow' | 'red' | 'green'> prevents type widening where string literals become generic strings
    setVvgDoneStatus(prev => {
      const next: Record<string, 'yellow' | 'red' | 'green'> = { ...prev, [id]: 'green' };
      // Check if all subsections are green to update main bullet
      const subKeys = ['intro', 'vault', ...Array.from({ length: 14 }, (_, i) => String(i + 1))];
      const allDone = subKeys.every(k => (k === id ? 'green' : next[k]) === 'green');
      if (allDone) next.main = 'green';
      return next;
    });
    alert(`Module ${id.toUpperCase()} verified.`);
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col font-sans text-white relative">
      <header className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 h-24 items-center">
        <button onClick={onBack} className="hover:scale-105 transition-transform"><img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 w-auto" /></button>
      </header>
      <div className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto p-6 lg:p-16 pb-48">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center">Production App</h1>
        
        <ShimmerDropdown title={<div className="flex items-center"><span>GAME PLAY</span><PageDoneBullet status={gamePlayDoneStatus} /></div>} isOpen={openSections.gameplay} onToggle={() => setOpenSections(p => ({...p, gameplay: !p.gameplay}))}>
          <div className="p-4 space-y-12">
            <div className="bg-vault-panel/40 border-2 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <header onClick={() => setOpenSections(p => ({...p, control: !p.control}))} className="p-8 md:p-10 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
                <h3 className="text-xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-[0.3em] transition-colors group-hover:text-white">LIVE GAME CONTROL</h3>
                <svg className={`w-8 h-8 text-vault-gold transition-transform duration-300 ${openSections.control ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 15l7-7 7-7" /></svg>
              </header>
              <div className={`transition-all duration-500 overflow-hidden ${openSections.control ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-8 md:p-12 md:pt-0 space-y-12">
                  <div className="space-y-8">
                    <p className="text-[11px] md:text-[13px] font-display font-black text-white/40 uppercase tracking-[0.4em]">REAL-TIME HAPTIC MESSAGING</p>
                    <div className="space-y-4">
                      <label className="text-[11px] font-display font-black text-vault-gold uppercase tracking-[0.2em]">DIRECT MESSAGE TO PLAYER</label>
                      <div className="flex flex-col lg:flex-row gap-6">
                        <textarea value={formData.tacticalMessage} onChange={e => setFormData({...formData, tacticalMessage: e.target.value})} placeholder="Message content..." className="flex-1 h-32 bg-black/60 border-2 border-white/10 rounded-2xl p-6 font-sans text-lg focus:border-vault-gold outline-none" />
                        <button onClick={handlePushTactical} className="lg:w-[240px] bg-white text-black font-display font-black uppercase text-[13px] tracking-[0.2em] rounded-xl hover:bg-vault-gold transition-all active:scale-95 shadow-xl">PUSH TO PLAYER</button>
                      </div>
                      <p className="text-[10px] font-display text-white/40 uppercase tracking-[0.4em] italic pl-2">DEVICE WILL VIBRATE ON ARRIVAL. USE DURING LIVE SHOOT FOR CUES.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <button onClick={() => navigator.vibrate?.([200, 100, 200])} className="bg-[#151515] border-2 border-white/10 py-5 rounded-xl font-display font-black text-[13px] uppercase tracking-widest hover:border-vault-gold transition-all">TEST ADMIN DEVICE BUZZ</button>
                    <div className="bg-black/40 border-2 border-white/10 py-5 rounded-xl flex items-center justify-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] shadow-[0_0_15px_#22c55e] animate-pulse" />
                      <span className="font-display font-black text-[#22c55e] uppercase tracking-widest text-[13px]">LIVE UPLINK ACTIVE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6">
              <VaultButton onClick={() => handleSave('GAMEPLAY')}>Sync Data</VaultButton>
              <button onClick={() => setGamePlayDoneStatus('green')} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
            </div>
          </div>
        </ShimmerDropdown>

        <ShimmerDropdown title={<div className="flex items-center"><span>Vault Video Guide</span><PageDoneBullet status={vvgDoneStatus.main} /></div>} isOpen={openSections.guide} onToggle={() => setOpenSections(p => ({...p, guide: !p.guide}))}>
          <div className="flex flex-col gap-4">
            <ShimmerDropdown title={<div className="flex items-center"><span>Intro</span><PageDoneBullet status={vvgDoneStatus.intro} /></div>} isOpen={openSections.intro} onToggle={() => setOpenSections(p => ({...p, intro: !p.intro}))}>
              <div className="p-2 space-y-4">
                <InputGroup label="1st Shot" value={formData.introFirstShot} onChange={v => handleUpdateField('introFirstShot', v)} isTextArea />
                <InputGroup label="Shot 1 Creator Notes" value={formData.introCreatorNotes} onChange={v => handleUpdateField('introCreatorNotes', v)} isTextArea />
                <InputGroup label="Shot 1 Video Notes" value={formData.introVideoNotes} onChange={v => handleUpdateField('introVideoNotes', v)} isTextArea />
                <div className="flex justify-center gap-4 mt-8">
                  <VaultButton onClick={() => handleSave('INTRO')}>Sync Data</VaultButton>
                  <button onClick={() => handleVvgPageDone('intro')} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
                </div>
              </div>
            </ShimmerDropdown>

            {formData.vvgMissions.map((m: any, i: number) => (
              <ShimmerDropdown key={i} title={<div className="flex items-center"><span>Mission {i + 1}</span><PageDoneBullet status={vvgDoneStatus[String(i + 1)]} /></div>} isOpen={openSections[`mission_${i + 1}`]} onToggle={() => setOpenSections(p => ({...p, [`mission_${i + 1}`]: !p[`mission_${i + 1}`]}))}>
                <div className="p-2 space-y-4">
                  <InputGroup label={`Mission {i + 1} Game Play`} value={m.gamePlay} onChange={v => handleUpdateMission(i, 'gamePlay', v)} isTextArea />
                  <InputGroup label={`Mission {i + 1} Creator Notes`} value={m.creatorNotes} onChange={v => handleUpdateMission(i, 'creatorNotes', v)} isTextArea />
                  <InputGroup label={`Mission {i + 1} Video Notes`} value={m.videoNotes} onChange={v => handleUpdateMission(i, 'videoNotes', v)} isTextArea />
                  <div className="flex justify-center gap-4 mt-8">
                    <VaultButton onClick={() => handleSave(`M${i+1}`)}>Sync Data</VaultButton>
                    <button onClick={() => handleVvgPageDone(String(i + 1))} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
                  </div>
                </div>
              </ShimmerDropdown>
            ))}

            <ShimmerDropdown title={<div className="flex items-center"><span>The Vault</span><PageDoneBullet status={vvgDoneStatus.vault} /></div>} isOpen={openSections.vault} onToggle={() => setOpenSections(p => ({...p, vault: !p.vault}))}>
              <div className="p-2 space-y-4">
                <InputGroup label="Vault Game Play" value={formData.vaultGamePlay} onChange={v => handleUpdateField('vaultGamePlay', v)} isTextArea />
                <InputGroup label="Vault Creator Notes" value={formData.vaultCreatorNotes} onChange={v => handleUpdateField('vaultCreatorNotes', v)} isTextArea />
                <InputGroup label="Vault Video Notes" value={formData.vaultVideoNotes} onChange={v => handleUpdateField('vaultVideoNotes', v)} isTextArea />
                <div className="flex justify-center gap-4 mt-8">
                  <VaultButton onClick={() => handleSave('VAULT')}>Sync Data</VaultButton>
                  <button onClick={() => handleVvgPageDone('vault')} className="px-10 py-3 rounded-xl font-display font-black uppercase text-xs border-2 bg-vault-gold text-black border-transparent hover:bg-white transition-all shadow-lg active:scale-95">page done</button>
                </div>
              </div>
            </ShimmerDropdown>
          </div>
        </ShimmerDropdown>

        {/* Navigation Buttons Area */}
        <section className="w-full flex flex-col md:flex-row gap-6 mt-12">
          <VaultButton 
            onClick={onNavigateToHub} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Game Play Hub
          </VaultButton>
          <VaultButton 
            onClick={onNavigateToMissionCentral} 
            className="flex-1 py-6 md:py-8 rounded-xl bg-vault-panel border-2 border-vault-gold text-lg md:text-2xl font-display font-black uppercase tracking-widest shadow-[0_0_40px_rgba(212,175,55,0.1)] hover:bg-vault-gold hover:text-black transition-all text-white"
          >
            Mission Central
          </VaultButton>
        </section>

      </div>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] scanline" />
    </div>
  );
};
