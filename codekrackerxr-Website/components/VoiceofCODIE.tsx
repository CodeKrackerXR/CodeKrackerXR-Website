import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, onSnapshot, serverTimestamp, collection, addDoc, query, orderBy, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';
import { GoogleGenAI, Modality } from "@google/genai";

const CREATOR_DOC_ID = 'MasterCreatorFolder';

const NEURAL_VOICE_MAP: Record<string, string> = {
  'Despina': 'Zephyr',
  'Kore': 'Kore',
  'Leda': 'Puck',
  'Aoede': 'Kore',
  'Autonoe': 'Puck',
  'Zephe': 'Zephyr'
};

const MOODS = [
  { id: 'HAPPY', label: 'HAPPY', emoji: '😊' },
  { id: 'SAD', label: 'SAD', emoji: '😢' },
  { id: 'ANGRY', label: 'ANGRY', emoji: '😤' },
  { id: 'SURPRISED', label: 'SURPRISED', emoji: '😲' },
  { id: 'FUNNY', label: 'FUNNY', emoji: '😂' },
  { id: 'TIRED', label: 'TIRED', emoji: '😴' },
  { id: 'MAD', label: 'MAD', emoji: '😡' },
  { id: 'PROUD', label: 'PROUD', emoji: '🦸' },
];

const NEURAL_VOICE_KEYS = Object.keys(NEURAL_VOICE_MAP);
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const PRESETS: Record<string, number[]> = {
  'Acoustic': [4, 3, 2, 0, 1, 2, 4, 5, 4, 2],
  'Treble Boost': [0, 0, 0, 0, 0, 1, 3, 6, 8, 10],
  'Mid Range': [-2, -1, 1, 4, 6, 5, 3, 1, 0, -2],
  'Bass Boost': [10, 8, 6, 3, 1, 0, 0, 0, 0, 0]
};

const SIDEBAR_WIDTH = 200;
const SEPARATOR_WIDTH = 20;

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

async function bufferToWavAsync(buffer: AudioBuffer, onProgress?: (p: number) => void): Promise<Blob> {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  let pos = 0;
  let offset = 0;
  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // length of fmt chunk
  setUint16(1);          // format (1 = PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);                    // block align
  setUint16(16);                                // bits per sample
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);
  const channels = [];
  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
  const chunkSize = 15000; 
  while (offset < buffer.length) {
    const end = Math.min(offset + chunkSize, buffer.length);
    for (let j = offset; j < end; j++) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][j]));
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF) | 0;
        view.setInt16(pos, sample, true); 
        pos += 2;
      }
    }
    offset = end;
    if (onProgress) onProgress(offset / buffer.length);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  return new Blob([bufferArray], { type: "audio/wav" });
}

const ShimmerDropdown: React.FC<{
  title: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode; className?: string; noShimmer?: boolean;
}> = ({ title, isOpen, onToggle, children, className = "mb-6", noShimmer }) => (
  <div className={`w-full bg-vault-panel/80 border border-white/10 rounded-[2rem] p-4 md:p-6 ${className} shadow-xl transition-all relative overflow-hidden cursor-pointer hover:border-vault-gold/40 group`} onClick={onToggle}>
    {!noShimmer && <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/5 to-transparent -translate-x-full ${!isOpen ? 'group-hover:animate-[shimmer_2s_infinite]' : ''} pointer-events-none`} />}
    <div className="relative z-10 w-full flex items-center justify-between">
      <div className="text-[18px] md:text-[32px] font-display font-black text-vault-gold uppercase tracking-[0.3em] flex items-center group-hover:text-white transition-colors">{title}</div>
      <svg className={`w-6 h-6 text-vault-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7-7-7-7" /></svg>
    </div>
    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[25000px] mt-8 opacity-100 pb-4' : 'max-h-0 opacity-0'}`} onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

const Waveform: React.FC<{ buffer: AudioBuffer; color?: string }> = ({ buffer, color = '#d4af37' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    if (!buffer || typeof buffer.getChannelData !== 'function') return;
    const data = buffer.getChannelData(0); const width = canvas.width; const height = canvas.height;
    const step = Math.ceil(data.length / width); const amp = height / 2;
    ctx.clearRect(0, 0, width, height); ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let i = 0; i < width; i++) {
      let min = 1.0; let max = -1.0;
      for (let j = 0; j < step; j++) { const datum = data[i * step + j]; if (datum < min) min = datum; if (datum > max) max = datum; }
      ctx.moveTo(i, (1 + min) * amp); ctx.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke();
  }, [buffer, color]);
  return <canvas ref={canvasRef} width={800} height={100} className="w-full h-full block" />;
};

const LevelMeter: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const [levels, setLevels] = useState({ L: 0, R: 0 });
  const requestRef = useRef<number | null>(null);
  const animate = useCallback(() => {
    if (!isPlaying) { setLevels({ L: 0, R: 0 }); return; }
    setLevels(prev => ({
      L: Math.random() > 0.5 ? Math.min(100, prev.L + Math.random() * 30) : Math.max(10, prev.L - Math.random() * 30),
      R: Math.random() > 0.5 ? Math.min(100, prev.R + Math.random() * 30) : Math.max(10, prev.R - Math.random() * 30)
    }));
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying]);
  useEffect(() => {
    if (isPlaying) requestRef.current = requestAnimationFrame(animate);
    else { if (requestRef.current) cancelAnimationFrame(requestRef.current); setLevels({ L: 0, R: 0 }); }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, animate]);
  const renderBar = (height: number) => (
    <div className="relative flex-1 w-full bg-black rounded-sm overflow-hidden h-full border border-white/5">
      <div className="absolute inset-0 z-10 opacity-60 pointer-events-none" style={{ background: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, #000 2px, #000 4px)' }} />
      <div className="absolute bottom-0 left-0 right-0 transition-all duration-75 ease-out" style={{ height: `${height}%`, background: 'linear-gradient(to top, #22c55e 0%, #22c55e 50%, #eab308 70%, #f97316 85%, #ef4444 100%)', boxShadow: isPlaying && height > 10 ? '0 0 15px rgba(212,175,55,0.3)' : 'none' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none z-20" />
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-3 bg-vault-panel/95 border-2 border-vault-gold/20 rounded-2xl p-4 h-full min-w-[95px] shadow-[0_0_50px_rgba(0,0,0,0.9)]">
      <div className="flex-1 flex items-end gap-3 w-full px-1">{renderBar(levels.L)}{renderBar(levels.R)}</div>
      <div className="flex justify-between w-full px-1 font-display font-black text-[12px] text-vault-gold uppercase tracking-[0.2em] opacity-80"><span>L</span><span>R</span></div>
    </div>
  );
};

const EqualizerModal: React.FC<{ 
  isOpen: boolean; onClose: () => void; eqBands: number[]; setEqBands: (bands: number[]) => void; preamp: number; setPreamp: (val: number) => void; eqEnabled: boolean; setEqEnabled: (val: boolean) => void;
  isPlaying: boolean; onPlay: () => void; onStop: () => void; activePresets: string[]; togglePreset: (name: string) => void;
}> = ({ isOpen, onClose, eqBands, setEqBands, preamp, setPreamp, eqEnabled, setEqEnabled, isPlaying, onPlay, onStop, activePresets, togglePreset }) => {
  if (!isOpen) return null;
  const handleBandChange = (index: number, value: number) => { const newBands = [...eqBands]; newBands[index] = value; setEqBands(newBands); };
  const handlePreampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value); const delta = newVal - preamp; setPreamp(newVal);
    const newBands = eqBands.map(b => Math.max(-12, Math.min(12, b + delta))); setEqBands(newBands);
  };
  
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-fadeIn p-4 md:p-6">
      <div className="bg-vault-panel w-full max-w-4xl rounded-[2.5rem] shadow-2xl border-2 border-vault-gold/30 overflow-hidden flex flex-col relative group">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] scanline" />
        <header className="px-8 py-6 flex items-center justify-between border-b border-white/10 relative z-10">
          <div className="flex flex-col gap-1"><h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-[0.2em] drop-shadow-[0_0_100px_rgba(212,175,55,0.4)]">Digital Equalizer</h3><div className="h-0.5 w-24 bg-vault-gold rounded-full" /></div>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-vault-gold hover:bg-vault-alert hover:text-white hover:border-white transition-all transform hover:scale-105"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </header>
        <div className="px-8 py-8 flex flex-col md:flex-row items-stretch gap-8 relative z-10 bg-black/20">
          <div className="flex flex-col justify-center items-center gap-3 border-r border-white/10 pr-8">
            <span className="text-[10px] font-display font-black text-vault-alert uppercase tracking-widest">Master Bypass</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={eqEnabled} onChange={e => setEqEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-16 h-8 bg-black/60 rounded-full border border-white/10 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white/40 after:rounded-full after:h-6 after:w-7 after:transition-all peer-checked:after:bg-[#22c55e] peer-checked:border-[#22c55e]/40 peer-checked:shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
            </label>
            <span className={`text-[10px] font-display font-black uppercase tracking-widest transition-colors ${eqEnabled ? 'text-[#22c55e]' : 'text-white/40'}`}>{eqEnabled ? 'Active' : 'Offline'}</span>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <span className="text-[10px] font-display font-black text-white uppercase tracking-[0.3em] text-center">Audio Calibration Settings</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(PRESETS).map(name => {
                const isActive = activePresets.includes(name);
                const showAsPowered = isActive && eqEnabled;
                return (
                  <button 
                    key={name}
                    onClick={() => togglePreset(name)}
                    className={`py-4 px-2 rounded-xl font-display font-black text-[11px] uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2 relative overflow-hidden group/btn 
                      ${showAsPowered ? 'bg-vault-gold/10 border-vault-gold text-white' : 'bg-black/40 border-white/5 text-white/30 hover:border-vault-gold/40'} 
                      ${!eqEnabled ? 'opacity-40 grayscale' : 'opacity-100'}`}
                  >
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${showAsPowered ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e]' : 'bg-vault-alert/40'}`} />
                    <span>{name}</span>
                    <span className={`text-[7px] px-2 py-0.5 rounded transition-colors ${showAsPowered ? 'bg-[#22c55e] text-black' : 'bg-white/5 text-white/20'}`}>
                      {!eqEnabled ? 'BYPASSED' : (isActive ? 'ENABLED' : 'OFFLINE')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8 flex flex-row items-end justify-start gap-1 overflow-x-auto scrollbar-hide relative z-10 bg-black/40">
          <div className="flex flex-col items-center gap-6 min-w-[70px]"><div className="relative h-64 md:h-80 w-12 flex flex-col items-center group/slider"><div className="absolute inset-y-0 w-3 bg-white/5 rounded-full" /><input type="range" min="-12" max="12" step="0.5" value={preamp} onChange={handlePreampChange} className="absolute inset-0 cursor-pointer h-full w-full opacity-0 z-10" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} /><div className="absolute w-3 bg-[#3b82f6] rounded-full transition-all" style={{ bottom: 0, top: `calc(100% - ${((preamp + 12) / 24) * 100}%)` }} /><div className="absolute w-12 h-6 bg-black border-2 border-[#3b82f6] rounded shadow-[0_0_15px_rgba(59,130,246,0.3)] z-0 pointer-events-none flex items-center justify-center transition-all group-hover/slider:scale-110" style={{ bottom: `calc(${((preamp + 12) / 24) * 100}% - 12px)` }} ><div className="w-8 h-0.5 bg-[#3b82f6] rounded-full animate-pulse" /></div><div className="absolute -left-10 top-0 text-[12px] font-mono text-[#3b82f6] font-black">+12</div><div className="absolute -left-10 top-1/2 -translate-y-1/2 text-[12px] font-mono text-white font-black">0</div><div className="absolute -left-10 bottom-0 text-[12px] font-mono text-[#3b82f6] font-black">-12</div></div><span className="text-[12px] font-display font-black text-[#3b82f6] uppercase tracking-widest mt-2">Preamp</span></div>
          <div className="w-1 h-72 md:h-96 bg-white/10 ml-4 mr-2 rounded-full flex-shrink-0" />
          <div className="flex-1 flex justify-between gap-1 min-w-[620px] pr-4">
            {EQ_FREQUENCIES.map((freq, idx) => (
              <div key={freq} className="flex flex-col items-center gap-6 flex-1 group/band min-w-[50px]"><div className="relative h-64 md:h-80 w-10 flex flex-col items-center"><div className="absolute inset-y-0 w-2.5 bg-white/5 rounded-full group-hover/band:bg-white/10 transition-colors" /><input type="range" min="-12" max="12" step="0.5" value={eqBands[idx]} onChange={e => handleBandChange(idx, parseFloat(e.target.value))} className="absolute inset-0 cursor-pointer h-full w-full opacity-0 z-10" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} /><div className="absolute w-2.5 bg-vault-gold/60 rounded-full" style={{ bottom: 0, top: `calc(100% - ${((eqBands[idx] + 12) / 24) * 100}%)` }} /><div className="absolute w-10 h-5 bg-vault-panel border-2 border-vault-gold rounded shadow-xl z-0 pointer-events-none flex items-center justify-center transition-all group-hover/band:brightness-125" style={{ bottom: `calc(${((eqBands[idx] + 12) / 24) * 100}% - 10px)` }} ><div className="w-6 h-0.5 bg-vault-gold rounded-full" /></div><div className="absolute w-full h-1 bg-white/5 top-0" /><div className="absolute w-full h-1 bg-white/10 top-1/2" /><div className="absolute w-full h-1 bg-white/5 bottom-0" /></div><div className="flex flex-col items-center"><span className="text-[12px] font-display font-black text-white">{freq >= 1000 ? `${freq/1000}K` : freq}</span><span className="text-[9px] font-display font-black text-white/40 uppercase tracking-widest">Hertz</span></div></div>
            ))}
          </div>
        </div>
        <footer className="p-8 border-t border-white/5 flex justify-center items-center gap-6 bg-black/20">
          <button 
            onClick={isPlaying ? onStop : onPlay}
            className={`px-12 py-4 rounded-xl font-display font-black uppercase tracking-widest text-lg transition-all shadow-lg active:scale-95 border-2 flex items-center justify-center gap-3 bg-vault-alert text-white border-transparent hover:border-white`}
          >
            {isPlaying ? (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" /></svg>
                Stop Sequence
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>
                Play Sequence
              </>
            )}
          </button>
          <button 
            onClick={onClose} 
            className="px-16 py-4 rounded-xl font-display font-black uppercase tracking-widest text-lg transition-all shadow-lg active:scale-95 border-2 flex items-center justify-center bg-[#22c55e] text-black border-transparent hover:bg-white"
          >
            Commit Settings
          </button>
        </footer>
      </div>
    </div>
  );
};

interface BackgroundUploadTask { id: string; label: string; folder: string; progress: number; }
interface TrackEffectState { hollow: boolean; reverb: boolean; aiConstruct: boolean; vocoder: boolean; hollowFreq: number; reverbMix: number; vocoderAmount: number; }
interface Track { id: string; buffer: AudioBuffer; label: string; startTime: number; volume: number; isMuted: boolean; isSoloed: boolean; effects: TrackEffectState; sourceType?: 'neural' | 'upload' | 'shifter' | 'duplicate'; isSelected?: boolean; rowId: number; }
interface RowState { id: number; volume: number; isMuted: boolean; isSoloed: boolean; }
interface HistoryState { tracks: Track[]; rows: RowState[]; }

export const VoiceofCODIE: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ audioHub: true, voices: false, lab: true, library: false });
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [ttsInput, setTtsInput] = useState('');
  const [ttsInstruction, setTtsInstruction] = useState('Speak in a clear but strong confident voice');
  const [selectedVoice, setSelectedVoice] = useState('Despina');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isHearingVoice, setIsHearingVoice] = useState(false);
  const [isSavingPhrase, setIsSavingPhrase] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [phraseArchive, setPhraseArchive] = useState<any[]>([]);
  const [codexLibrary, setCodexLibrary] = useState<any[]>([]);
  const [neuralSettings, setNeuralSettings] = useState({ authority: 80, glitch: 56, resonance: 90 });
  const [selectedArchiveItem, setSelectedArchiveItem] = useState<any | null>(null);
  const [backgroundUploads, setBackgroundUploads] = useState<BackgroundUploadTask[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0); 
  const [timelineZoom, setTimelineZoom] = useState(100); 
  const [isLibrarySaveModalOpen, setIsLibrarySaveModalOpen] = useState(false);
  const [librarySaveName, setLibrarySaveName] = useState('');
  const [librarySaveLocation, setLibrarySaveLocation] = useState<'Outside the Vault' | 'Inside the Vault'>('Outside the Vault');
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [eqBands, setEqBands] = useState<number[]>(new Array(10).fill(0));
  const [preamp, setPreamp] = useState(0);
  const [eqEnabled, setEqEnabled] = useState(true);
  const [activePresets, setActivePresets] = useState<string[]>([]);
  const [pendingLabAction, setPendingLabAction] = useState<{ text: string; instructions: string; personality: string; settings: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'archive' | 'library'; label: string } | null>(null);
  const [isProcessingLab, setIsProcessingLab] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [backgroundSimulationProgress, setBackgroundSimulationProgress] = useState<Record<string, number>>({});

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  const timelineOffset = useMemo(() => isSidebarVisible ? (SIDEBAR_WIDTH + SEPARATOR_WIDTH) : SEPARATOR_WIDTH, [isSidebarVisible]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<{source: AudioBufferSourceNode; nodes: AudioNode[]}[]>([]);
  const playbackStartTimeRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const longPressTimerRef = useRef<number | null>(null);

  // Reference for the textarea to manage cursor-based insertion
  const ttsTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev, { tracks: [...tracks], rows: [...rows] }].slice(-20));
    setRedoStack([]);
  }, [tracks, rows]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, { tracks: [...tracks], rows: [...rows] }]);
    const nextTracks: Track[] = previous.tracks;
    const nextRows: RowState[] = previous.rows;
    setTracks(nextTracks);
    setRows(nextRows);
    setHistory(prev => prev.slice(0, -1));
  }, [history, tracks, rows]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, { tracks: [...tracks], rows: [...rows] }]);
    const nextTracks: Track[] = next.tracks;
    const nextRows: RowState[] = next.rows;
    setTracks(nextTracks);
    setRows(nextRows);
    setRedoStack(prev => prev.slice(0, -1));
  }, [redoStack, tracks, rows]);

  const applyTrackEffects = (ctx: BaseAudioContext, input: AudioNode, effects: TrackEffectState) => {
    const nodes: AudioNode[] = []; let current: AudioNode = input;
    if (effects.hollow) { const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = effects.hollowFreq; filter.Q.value = 1.2; current.connect(filter); current = filter; nodes.push(filter); }
    if (effects.aiConstruct) { const delay = ctx.createDelay(); delay.delayTime.value = 0.005; const feedback = ctx.createGain(); feedback.gain.value = 0.6; current.connect(delay); delay.connect(feedback); feedback.connect(current); nodes.push(delay, feedback); }
    if (effects.vocoder) { const filter = ctx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 800; const shaper = ctx.createWaveShaper(); const n = 44100; const curve = new Float32Array(n); const k = effects.vocoderAmount * 100; for (let i = 0; i < n; ++i) { const x = (i * 2) / n - 1; curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x)); } shaper.curve = curve; current.connect(filter); filter.connect(shaper); current = shaper; nodes.push(filter, shaper); }
    if (effects.reverb) { const reverbGain = ctx.createGain(); reverbGain.gain.value = effects.reverbMix; const delay = ctx.createDelay(); delay.delayTime.value = 0.15; const feedback = ctx.createGain(); feedback.gain.value = 0.4; current.connect(delay); delay.connect(feedback); feedback.connect(delay); delay.connect(reverbGain); const output = ctx.createGain(); current.connect(output); reverbGain.connect(output); current = output; nodes.push(reverbGain, delay, feedback, output); }
    return { output: current, nodes };
  };

  const createEqChain = (ctx: BaseAudioContext, input: AudioNode, destination: AudioNode) => {
    if (!eqEnabled) { input.connect(destination); return []; }
    const nodes: AudioNode[] = []; const preampGain = ctx.createGain(); preampGain.gain.value = Math.pow(10, preamp / 20); input.connect(preampGain); nodes.push(preampGain);
    let current: AudioNode = preampGain;
    
    // Sum gains: Manual bands + all active presets
    const finalGains = eqBands.map((base, i) => {
      let extra = 0;
      activePresets.forEach(p => {
        if (PRESETS[p]) extra += PRESETS[p][i];
      });
      return base + extra;
    });

    finalGains.forEach((gainValue, i) => { if (gainValue === 0) return; const filter = ctx.createBiquadFilter(); filter.type = 'peaking'; filter.frequency.value = EQ_FREQUENCIES[i]; filter.gain.value = gainValue; filter.Q.value = 1.0; current.connect(filter); current = filter; nodes.push(filter); });
    current.connect(destination); return nodes;
  };

  useEffect(() => {
    const unsubPhrases = onSnapshot(query(collection(db, "codie_phrases"), orderBy("createdAt", "desc")), (snap) => setPhraseArchive(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }))));
    const libQuery = query(collection(db, `creators/${CREATOR_DOC_ID}/Voices of Codie`), orderBy("createdAt", "desc"));
    const unsubLib = onSnapshot(libQuery, { includeMetadataChanges: true }, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
      docs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis() || Date.now();
        const tB = b.createdAt?.toMillis() || Date.now();
        return tB - tA;
      });
      setCodexLibrary(docs);
    });
    return () => { unsubPhrases(); unsubLib(); };
  }, []);

  const getAudioContext = () => { if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }); return audioContextRef.current; };
  const stopAllTracks = useCallback(() => { 
    if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    activeSourcesRef.current.forEach(item => { try { item.source.stop(); } catch (e) {} item.nodes.forEach(n => { try { n.disconnect(); } catch(e) {} }); }); 
    activeSourcesRef.current = []; setIsPlaying(false); 
  }, []);

  const animatePlayhead = useCallback(() => { 
    if (!isPlaying) return; 
    const ctx = getAudioContext(); const elapsed = ctx.currentTime - playbackStartTimeRef.current; 
    const maxDuration = tracks.reduce((acc, t) => Math.max(acc, t.startTime + t.buffer.duration), 0); 
    if (elapsed >= maxDuration && maxDuration > 0) { stopAllTracks(); setPlayheadTime(0); return; } 
    setPlayheadTime(elapsed); requestRef.current = requestAnimationFrame(animatePlayhead); 
  }, [isPlaying, tracks, stopAllTracks]);

  useEffect(() => { if (isPlaying) requestRef.current = requestAnimationFrame(animatePlayhead); else if (requestRef.current) cancelAnimationFrame(requestRef.current); return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); }; }, [isPlaying, animatePlayhead]);

  const scrubAtTime = useCallback((time: number) => {
    const ctx = getAudioContext();
    const scrubGain = ctx.createGain(); scrubGain.gain.value = 0.5; scrubGain.connect(ctx.destination);
    tracks.forEach(track => {
      const row = rows.find(r => r.id === track.rowId); if (row?.isMuted) return;
      if (time >= track.startTime && time < track.startTime + track.buffer.duration) {
        const source = ctx.createBufferSource(); source.buffer = track.buffer; source.connect(scrubGain);
        source.start(0, time - track.startTime, 0.1); scrubGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      }
    });
  }, [tracks, rows]);

  const playTimeline = useCallback((startTimeSeconds: number = playheadTime) => {
    if (isPlaying) stopAllTracks();
    const ctx = getAudioContext(); if (ctx.state === 'suspended') ctx.resume();
    playbackStartTimeRef.current = ctx.currentTime - startTimeSeconds;
    const activeItems: {source: AudioBufferSourceNode; nodes: AudioNode[]}[] = []; 
    const masterGain = ctx.createGain();
    tracks.forEach(track => {
      const row = rows.find(r => r.id === track.rowId); if (row?.isMuted) return;
      const trackEnd = track.startTime + track.buffer.duration; if (startTimeSeconds >= trackEnd) return;
      const source = ctx.createBufferSource(); source.buffer = track.buffer; 
      const gainNode = ctx.createGain(); gainNode.gain.value = (row?.volume || 1) * track.volume; 
      source.connect(gainNode); const { output: fxOutput, nodes: fxNodes } = applyTrackEffects(ctx, gainNode, track.effects);
      fxOutput.connect(masterGain); let startOffset = Math.max(0, startTimeSeconds - track.startTime); let scheduleTime = Math.max(0, track.startTime - startTimeSeconds);
      source.start(ctx.currentTime + scheduleTime, startOffset); activeItems.push({ source, nodes: [gainNode, ...fxNodes] });
    });
    const eqNodes = createEqChain(ctx, masterGain, ctx.destination); activeItems.forEach(item => item.nodes.push(masterGain, ...eqNodes));
    activeSourcesRef.current = activeItems; setIsPlaying(true);
  }, [isPlaying, playheadTime, tracks, rows, eqBands, preamp, eqEnabled, activePresets, stopAllTracks, applyTrackEffects, createEqChain]);

  const handleSeek = useCallback((time: number, isDragging: boolean = false) => { 
    const wasPlaying = isPlaying; if (wasPlaying) stopAllTracks(); 
    const safeTime = Math.max(0, time); setPlayheadTime(safeTime); 
    if (isDragging || !wasPlaying) scrubAtTime(safeTime);
    if (wasPlaying && !isDragging) playTimeline(safeTime); 
  }, [isPlaying, stopAllTracks, playTimeline, scrubAtTime]);

  const handleTrackSelection = (id: string, isShift: boolean) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, isSelected: !t.isSelected } : isShift ? t : { ...t, isSelected: false }));
  };

  const removeRow = (id: number) => {
    saveToHistory();
    setRows(prev => prev.filter(r => r.id !== id));
    setTracks(prev => prev.filter(t => t.rowId !== id));
  };

  const handleSplit = () => {
    const splitPoint = playheadTime;
    setTracks(prev => {
      const selected = prev.filter(t => t.isSelected);
      if (selected.length === 0) return prev;
      saveToHistory();
      let next = [...prev];
      selected.forEach(t => {
        if (splitPoint > t.startTime && splitPoint < t.startTime + t.buffer.duration) {
          const splitOffset = splitPoint - t.startTime;
          const splitSample = Math.floor(splitOffset * t.buffer.sampleRate);
          const ctx = getAudioContext();
          const buf1 = ctx.createBuffer(t.buffer.numberOfChannels, splitSample, t.buffer.sampleRate);
          const buf2 = ctx.createBuffer(t.buffer.numberOfChannels, t.buffer.length - splitSample, t.buffer.sampleRate);
          for (let i = 0; i < t.buffer.numberOfChannels; i++) {
            buf1.copyToChannel(t.buffer.getChannelData(i).slice(0, splitSample), i);
            buf2.copyToChannel(t.buffer.getChannelData(i).slice(splitSample), i);
          }
          const t1 = { ...t, id: Math.random().toString(36).substring(7), buffer: buf1, isSelected: false };
          const t2 = { ...t, id: Math.random().toString(36).substring(7), buffer: buf2, startTime: splitPoint, isSelected: false };
          next = next.filter(item => item.id !== t.id).concat([t1, t2]);
        }
      });
      return next;
    });
  };

  const handleDeleteSelected = () => {
    saveToHistory();
    setTracks(prev => prev.filter(t => !t.isSelected));
  };

  const handleRippleDelete = () => {
    saveToHistory();
    setTracks(prev => {
      const selected = prev.find(t => t.isSelected); if (!selected) return prev;
      const duration = selected.buffer.duration;
      return prev.filter(t => t.id !== selected.id).map(t => (t.rowId === selected.rowId && t.startTime > selected.startTime) ? { ...t, startTime: t.startTime - duration } : t);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      const active = document.activeElement; if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true')) return; 
      if (e.code === 'Space') { e.preventDefault(); if (isPlaying) stopAllTracks(); else playTimeline(); } 
      else if (e.code === 'KeyC') handleSplit();
      else if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (e.code === 'KeyY' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); redo(); }
      else if (e.code === 'Backspace' || e.code === 'Delete') { if (e.shiftKey) handleRippleDelete(); else handleDeleteSelected(); }
      // Playhead Navigation Keys
      else if (e.code === 'ArrowUp' && e.shiftKey) { e.preventDefault(); stopAllTracks(); setPlayheadTime(0); }
      else if (e.code === 'ArrowLeft' && e.shiftKey) { e.preventDefault(); handleSeek(playheadTime - 0.1); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); handleSeek(playheadTime - 0.01); }
      else if (e.code === 'ArrowRight' && e.shiftKey) { e.preventDefault(); handleSeek(playheadTime + 0.1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); handleSeek(playheadTime + 0.01); }
    };
    window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, tracks, playheadTime, undo, redo, stopAllTracks, handleSeek]);

  const handleTTS = async (text: string, instructions: string, personality: string, settings: any = neuralSettings, addToTimeline: boolean = false, clearExisting: boolean = false, silent: boolean = false) => {
    if (!text.trim()) return; 
    setIsGeneratingVoice(true); if (!addToTimeline && !silent) setIsHearingVoice(true); 
    else if (addToTimeline) { setIsTransforming(true); setIsProcessingLab(true); }
    const apiVoiceName = NEURAL_VOICE_MAP[personality] || 'Zephyr';
    const ctx = getAudioContext();
    
    // Performance Layer V2 Directing Logic
    const systemPrompt = `System Role: You are a theatrical Voice Director. You are directing "Codie," a character who must always remain clear and confident, but whose emotions are extreme and vivid.

The Emoji Performance Map: When you see a bracketed tag, you must push the performance to a 10/10 intensity. Do not be subtle.

[HAPPY] 😊: Speak with overflowing, ecstatic joy. Use a bright, "smiling" tone, high pitch [pitch=high], and a rapid, breathless pace.
[SAD] 😢: Speak with gut-wrenching, sobbing despair. Slow down significantly [speed=0.7], add heavy sighs, and use a shaky, breaking voice.
[ANGRY] 😤: Speak with explosive, red-faced rage. Sharp, biting emphasis on every word. Use a harsh, growling texture.
[MAD] 😡: Speak with cold, simmering, calculated venom. Use a low, menacing pitch [pitch=low] and a slow, rhythmic delivery that sounds like a threat.
[SURPRISED] 😲: Speak with total, jaw-dropping shock. High-pitched gasps and wide dynamic shifts in volume.
[FUNNY] 😂: Speak with zany, slapstick energy. Exaggerated, "cartoony" inflections and a playful, bouncy rhythm.
[TIRED] 😴: Speak with absolute, bone-weary exhaustion. Mumble slightly, drag out your vowels, and sound as if you are about to fall asleep mid-sentence.
[PROUD] 🦸: Speak with triumphant, booming heroism. Broad chest-voice resonance and a powerful, "main character" projection.

Execution Rules:
1. Seamless Transitions: Shift the mood instantly the moment a tag appears.
2. Never Speak the Tags: Treat [TAGS] as silent acting cues only.
3. Clarity Guardrail: Ensure every syllable is understandable for kids and seniors.
4. Voice consistency: Maintain the core persona of Codie (authoritative women's voice).

Current Tuning Specs: Authority:${settings.authority}%, Glitch:${settings.glitch}%, Resonance:${settings.resonance}%. Custom Context: ${instructions}`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${systemPrompt} Text to speak: ${text}` }] }],
        config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: apiVoiceName } } } },
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        const buffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
        if (addToTimeline) {
          saveToHistory();
          const nextRowId = rows.length === 0 ? 0 : Math.max(...rows.map(r => r.id)) + 1;
          setRows(prev => [...prev, { id: nextRowId, volume: 1, isMuted: false, isSoloed: false }]);
          const newTrack: Track = { id: Math.random().toString(36).substring(7), buffer, label: text.substring(0, 20) + '...', startTime: playheadTime, volume: 1, isMuted: false, isSoloed: false, effects: { hollow: false, reverb: false, aiConstruct: false, vocoder: false, hollowFreq: 1575, reverbMix: 0.4, vocoderAmount: 0.5 }, sourceType: 'neural', isSelected: false, rowId: nextRowId };
          setTracks(prev => { if (clearExisting) return [newTrack]; return [...prev, newTrack]; }); 
          setOpenSections(prev => ({ ...prev, lab: true }));
          setIsProcessingLab(false);
        } else if (!silent) { 
          const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination); source.onended = () => setIsHearingVoice(false); source.start(); 
        }
        return buffer;
      } else { setIsHearingVoice(false); setIsProcessingLab(false); }
    } catch (e) { alert("Audio Uplink Interrupted."); setIsHearingVoice(false); setIsProcessingLab(false); } finally { setIsGeneratingVoice(false); setIsTransforming(false); }
  };

  const handleMoodClick = (mood: string) => { 
    const textarea = ttsTextAreaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? ttsInput.length;
      const end = textarea.selectionEnd ?? ttsInput.length;
      const before = ttsInput.substring(0, start);
      const after = ttsInput.substring(end);
      const tag = `[${mood}] `;
      const newValue = before + tag + after;
      
      setTtsInput(newValue);
      
      // Use requestAnimationFrame to ensure the focus and selection update after React rerender
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      });
    } else {
      setTtsInput(prev => `${prev} [${mood}] `); 
    }
  };

  const handleDownloadArchive = async (item: any) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // Regenerate the buffer silently for high-fidelity export
      const buffer = await handleTTS(item.text, item.instruction, item.voiceName, item.settings, false, false, true);
      if (buffer) {
        const blob = await bufferToWavAsync(buffer);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codie_data_${item.label.replace(/\s+/g, '_')}.wav`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert("Neural export handshake failure.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcessMaster = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (tracks.length === 0) return;
    setIsProcessingLab(true);
    setExportProgress(0);
    
    try {
      const maxDuration = tracks.reduce((acc, t) => Math.max(acc, t.startTime + t.buffer.duration), 0);
      const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(2, Math.ceil(maxDuration * 24000), 24000);
      
      const masterGain = offlineCtx.createGain();
      
      tracks.forEach(track => {
        const row = rows.find(r => r.id === track.rowId);
        if (row?.isMuted) return;
        
        const source = offlineCtx.createBufferSource();
        source.buffer = track.buffer;
        
        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = (row?.volume || 1) * track.volume;
        
        source.connect(gainNode);
        const { output: fxOutput } = applyTrackEffects(offlineCtx, gainNode, track.effects);
        fxOutput.connect(masterGain);
        source.start(track.startTime);
      });
      
      createEqChain(offlineCtx, masterGain, offlineCtx.destination);
      
      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = await bufferToWavAsync(renderedBuffer, (p) => setExportProgress(p));
      
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codie_master_export_${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Neural Master Synthesis failed.");
    } finally {
      setIsProcessingLab(false);
      setExportProgress(0);
    }
  };

  const handleArchivePhrase = async (text: string, instruction: string, voiceName: string, settings: any, isAuto: boolean = false) => {
    if (!text.trim()) return; setIsSavingPhrase(true);
    try { await addDoc(collection(db, "codie_phrases"), { label: text.substring(0, 20) + (text.length > 20 ? '...' : ''), text, instruction, voiceName, settings, isAuto, isFavorite: false, createdAt: serverTimestamp() }); if (!isAuto) alert("Voice parameters archived."); } catch (err) { if (!isAuto) alert("Neural sequence storage failed."); } finally { setIsSavingPhrase(false); }
  };

  const handleHubSendToLab = async () => { 
    if (!ttsInput.trim()) return; 
    await handleArchivePhrase(ttsInput, ttsInstruction, selectedVoice, neuralSettings, true); 
    if (tracks.length > 0) setPendingLabAction({ text: ttsInput, instructions: ttsInstruction, personality: selectedVoice, settings: neuralSettings }); 
    else handleTTS(ttsInput, ttsInstruction, selectedVoice, neuralSettings, true); 
  };
  
  const handleRecordToggle = async () => { if (!isRecording) { const SR = (window as any).SpeechRecognition || (window as any).webkitRecognition; if (!SR) return; const recognition = new SR(); recognition.continuous = true; recognition.interimResults = true; recognition.onresult = (event: any) => { let ct = ''; for (let i = event.resultIndex; i < event.results.length; ++i) if (event.results[i].isFinal) ct += event.results[i][0].transcript; if (ct) setTtsInput(p => p + (p ? ' ' : '') + ct); }; recognition.onerror = () => setIsRecording(false); recognition.onend = () => setIsRecording(false); try { recognition.start(); recognitionRef.current = recognition; setIsRecording(true); } catch (err) { setIsRecording(false); } } else { if (recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); } };
  
  const handleLabConfirmed = (append: boolean) => {
    if (!pendingLabAction) return;
    handleTTS(pendingLabAction.text, pendingLabAction.instructions, pendingLabAction.personality, pendingLabAction.settings, true, !append);
    setPendingLabAction(null);
  };

  const performDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'archive') {
        await deleteDoc(doc(db, "codie_phrases", deleteConfirm.id));
      } else {
        await deleteDoc(doc(db, `creators/${CREATOR_DOC_ID}/Voices of Codie`, deleteConfirm.id));
      }
    } catch (e) {
      alert("Purge Failure.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const togglePreset = (name: string) => {
    setActivePresets(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const renderArchiveList = (limit?: number) => {
    const list = limit ? phraseArchive.slice(0, limit) : phraseArchive;
    if (list.length === 0) return <div className="py-20 text-center text-white/20 uppercase text-xs italic tracking-widest">Awaiting Neural Sequences</div>;
    return list.map(p => (
      <div key={p.id} onClick={() => setSelectedArchiveItem(p)} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-vault-gold/40 hover:bg-vault-gold/5 transition-all cursor-pointer flex justify-between items-center mb-3 group select-none">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${p.isFavorite ? 'bg-[#22c55e]' : 'bg-white/10'}`} />
          <div>
            <span className="text-lg font-display font-black text-vault-gold uppercase tracking-widest block">{p.label}</span>
            <span className="text-[8px] text-white/40 uppercase font-black">{p.voiceName}</span>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-white/5 text-[#3b82f6] rounded-lg text-[9px] font-black uppercase hover:bg-[#3b82f6] hover:text-white transition-colors">LOAD</button>
      </div>
    ));
  };

  const handleRecover = (item: any) => {
    alert("Neural Sequence Recovery Protocol initiated. Restoring session specs from Cloud Storage...");
  };

  const renderLibraryItem = (item: any) => {
    const simProgress = backgroundSimulationProgress[item.id];
    const isInside = item.folder === 'Inside the Vault';
    const accentColor = isInside ? '#3b82f6' : '#22c55e';
    return (
      <div 
        key={item.id} 
        className="p-5 bg-black/60 border border-white/10 rounded-2xl flex flex-col gap-4 group cursor-default hover:border-vault-gold/40 select-none"
      >
         <div className="flex justify-between items-center">
           <div className="min-w-0 flex-1">
             <span className="text-white font-display font-black uppercase text-lg tracking-widest block truncate">{item.label}</span>
             <span className="text-[9px] text-white/30 uppercase font-black">{item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Pending...'}</span>
             {item.isVirtual && <span className="ml-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded border border-white/20" style={{ color: accentColor }}>METADATA SYNC</span>}
           </div>
           <div className="flex items-center gap-2">
             <button 
               onClick={(e) => e.stopPropagation()}
               className="px-3 py-2 bg-transparent border border-vault-gold/40 text-vault-gold rounded-lg text-[9px] font-black uppercase hover:bg-vault-gold hover:text-black transition-all"
             >
               Save to
             </button>
             <button 
               onClick={(e) => e.stopPropagation()}
               className="px-3 py-2 bg-transparent border border-vault-alert/40 text-vault-alert rounded-lg text-[9px] font-black uppercase hover:bg-vault-alert hover:text-black transition-all"
             >
               Play
             </button>
             <button 
               onClick={(e) => e.stopPropagation()} 
               className={`px-3 py-2 border border-white/10 rounded-lg text-[9px] font-black uppercase transition-all`}
               style={{ color: accentColor, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
             >
               Recover
             </button>
             <button 
               onClick={(e) => e.stopPropagation()}
               className="px-3 py-2 bg-transparent border border-white/20 text-white rounded-lg text-[9px] font-black uppercase hover:bg-vault-gold hover:text-black hover:border-vault-gold transition-all"
             >
               Download
             </button>
             <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: item.id, type: 'library', label: item.label }); }} className="p-2 text-white/40 hover:text-vault-alert transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
           </div>
         </div>
         {(simProgress !== undefined || item.syncStatus === 'processing') && (
           <div className="w-full space-y-1">
              <div className="flex justify-between text-[8px] font-black uppercase" style={{ color: accentColor }}>
                <span>Simulated Processing...</span>
                <span>{Math.round(simProgress || 0)}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className="h-full transition-all duration-500" style={{ width: `${simProgress || 0}%`, backgroundColor: accentColor }}></div>
              </div>
         </div>
         )}
      </div>
    );
  };

  const handleSaveToLibrary = async () => {
    if (!librarySaveName.trim()) return;
    const projectName = librarySaveName;
    const folder = librarySaveLocation;
    setIsLibrarySaveModalOpen(false);
    
    const sessionMetadata = {
      projectName: projectName,
      tracks: tracks.map(t => ({ id: t.id, label: t.label, startTime: t.startTime, volume: t.volume, effects: t.effects, rowId: t.rowId })),
      rows: rows.map(r => ({ id: r.id, volume: r.volume, muted: r.isMuted, soloed: r.isSoloed })),
      equalizer: { bands: eqBands, preamp: preamp, enabled: eqEnabled },
      systemNote: "Presentation Bypass Mode: Active",
      cloudReady: false
    };

    try {
      const docRef = await addDoc(collection(db, `creators/${CREATOR_DOC_ID}/Voices of Codie`), { 
        label: projectName, 
        folder: folder, 
        metadata: sessionMetadata,
        syncStatus: 'processing',
        isVirtual: true,
        createdAt: serverTimestamp() 
      });

      const docId = docRef.id;
      setOpenSections(prev => ({ ...prev, library: true })); 
      setLibrarySaveName('');

      const startTime = Date.now();
      const duration = 30000;
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / duration) * 100);
        setBackgroundSimulationProgress(prev => ({ ...prev, [docId]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
          updateDoc(doc(db, `creators/${CREATOR_DOC_ID}/Voices of Codie`, docId), { syncStatus: 'synced' });
          setBackgroundSimulationProgress(prev => { const next = { ...prev }; delete next[docId]; return next; });
        }
      }, 500);
    } catch (e) { alert(`Uplink Failed.`); }
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden pb-48">
      <style>{`.custom-vault-scrollbar::-webkit-scrollbar { width: 8px; } .custom-vault-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.4); border-radius: 10px; } .custom-vault-scrollbar::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; border: 2px solid rgba(0,0,0,0.4); } .custom-vault-scrollbar::-webkit-scrollbar-thumb:hover { background: #f1d18a; }`}</style>
      <header className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 items-center"><button onClick={onBack} className="hover:scale-105 transition-transform"><img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 w-auto object-contain" /></button></header>
      <div className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto p-6 lg:p-12 flex flex-col gap-8">
        <ShimmerDropdown title="CODIE Audio Hub" isOpen={openSections.audioHub} onToggle={() => setOpenSections(p => ({...p, audioHub: !p.audioHub}))}>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 bg-black/40 rounded-3xl p-8 border border-white/10">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-8">{NEURAL_VOICE_KEYS.map(v => (<button key={v} onClick={() => setSelectedVoice(v)} className={`py-4 text-[12px] md:text-[16px] font-display font-black rounded border-2 transition-all ${selectedVoice === v ? 'bg-vault-gold text-black border-white' : 'border-white/5 text-white/40 hover:border-vault-gold/30'}`}>{v}</button>))}</div>
                
                {/* Mood Matrix Performance Layer Migrated from V2 */}
                <div className="mb-10 bg-vault-panel/50 p-6 rounded-2xl border border-vault-gold/20">
                   <h4 className="text-[12px] md:text-[14px] font-display font-black text-vault-gold uppercase tracking-[0.4em] mb-6 text-center">Mood Matrix Performance Layer</h4>
                   <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                      {MOODS.map(m => (
                        <button 
                          key={m.id} 
                          onClick={() => handleMoodClick(m.id)}
                          className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-vault-gold/20 hover:border-vault-gold transition-all group"
                        >
                          <span className="text-2xl md:text-3xl group-hover:scale-125 transition-transform">{m.emoji}</span>
                          <span className="text-[8px] font-display font-black tracking-widest text-white/40 group-hover:text-white uppercase">{m.label}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-1">
                    <label className="text-[14px] md:text-[18px] font-display font-black uppercase tracking-[0.2em] text-vault-gold ml-1">The Voice of CODIE</label>
                    <textarea 
                      ref={ttsTextAreaRef}
                      value={ttsInput} 
                      onChange={e => setTtsInput(e.target.value)} 
                      placeholder="What CODIE says" 
                      className="w-full bg-black/60 border-2 border-white/5 rounded-2xl px-6 py-5 text-2xl font-sans min-h-[140px]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] md:text-[18px] font-display font-black uppercase tracking-[0.2em] text-vault-gold ml-1">SET CODIES Tone</label>
                    <textarea 
                      value={ttsInstruction} 
                      onChange={e => setTtsInstruction(e.target.value)} 
                      placeholder="Speak in a clear but strong confident voice" 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-6 py-4 text-2xl text-white" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">{['authority', 'glitch', 'resonance'].map(key => (<div key={key} className="flex flex-col gap-2"><div className="flex justify-between text-[10px] md:text-[14px] font-display font-black uppercase text-white"><span>{key}</span><span>{(neuralSettings as any)[key]}%</span></div><input type="range" min="0" max="100" value={(neuralSettings as any)[key]} onChange={e => setNeuralSettings({...neuralSettings, [key]: parseInt(e.target.value)})} className="w-full accent-vault-gold h-1 bg-white/5 rounded-full" /></div>))}</div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleRecordToggle} className={`py-6 md:text-[18px] border-2 transition-all rounded-xl font-black uppercase flex items-center justify-center gap-3 ${isRecording ? 'bg-vault-alert text-white border-white animate-pulse' : 'bg-black/40 border-vault-alert text-vault-alert hover:bg-vault-alert hover:text-black'}`}><div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-vault-alert'}`} />Record Voice</button>
                  <button onClick={() => handleTTS(ttsInput, ttsInstruction, selectedVoice, neuralSettings)} disabled={isGeneratingVoice || !ttsInput.trim()} className={`py-6 md:text-[18px] border-2 rounded-xl font-black uppercase transition-all flex items-center justify-center gap-3 ${isHearingVoice ? 'bg-[#22c55e] text-white border-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-black/40 border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black'}`}>{isGeneratingVoice ? <span className="animate-pulse">Generating...</span> : 'Hear Voice'}</button>
                  <button onClick={handleHubSendToLab} disabled={isGeneratingVoice || !ttsInput.trim()} className="py-6 md:text-[18px] bg-black/40 border-2 border-[#3b82f6] text-[#3b82f6] rounded-xl font-black uppercase hover:bg-[#3b82f6] hover:text-white transition-all">Send to LAB</button>
                  <button onClick={() => handleArchivePhrase(ttsInput, ttsInstruction, selectedVoice, neuralSettings)} disabled={isSavingPhrase || !ttsInput.trim()} className="py-6 md:text-[18px] bg-black/40 border-2 border-vault-gold text-vault-gold rounded-xl font-black uppercase hover:bg-vault-gold hover:text-black transition-all">Archive Voice</button>
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col"><div className="flex justify-between items-center mb-6"><h4 className="text-xl font-display font-black text-white uppercase tracking-widest">Recent Voices</h4></div><div className="flex-1 bg-black/40 rounded-3xl border border-white/5 p-6 h-auto">{renderArchiveList(7)}</div></div>
           </div>
        </ShimmerDropdown>

        <ShimmerDropdown title="CODIE Voices" isOpen={openSections.voices} onToggle={() => setOpenSections(p => ({...p, voices: !p.voices}))}>
          <div className="max-w-4xl mx-auto h-[500px] overflow-y-auto custom-vault-scrollbar border-2 border-vault-gold/20 rounded-2xl p-6 bg-black/40 shadow-inner">{renderArchiveList()}</div>
        </ShimmerDropdown>

        <ShimmerDropdown title="Multi-track lab" isOpen={openSections.lab} onToggle={() => setOpenSections(p => ({...p, lab: !p.lab}))}>
           <div className="flex flex-col gap-10">
              <header className="flex items-center justify-end border-b border-white/10 pb-8 gap-6">{isGeneratingVoice && <span className="text-vault-gold animate-pulse font-display font-black uppercase text-[12px]">SYNCHRONIZING NEURAL STREAM...</span>}</header>
              <div className="relative flex items-start gap-4">
                <div className="flex-1 overflow-x-auto pb-10 custom-vault-scrollbar select-none min-h-[300px]" id="lab-timeline">
                  <div style={{ width: `${timelineOffset + Math.max(20, (tracks.reduce((acc, t) => Math.max(acc, t.startTime + t.buffer.duration), 0) + 10)) * timelineZoom}px`, minWidth: '100%' }}>
                    <div className="h-14 border-b border-white/10 relative w-full flex items-center">
                      {/* Time Position Readout moved from footer to here, tracking the playhead */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-[110]"
                        style={{ 
                          left: 0, 
                          width: isSidebarVisible ? `${SIDEBAR_WIDTH}px` : '0px',
                          visibility: isSidebarVisible ? 'visible' : 'hidden',
                          opacity: isSidebarVisible ? 1 : 0,
                          transition: 'opacity 0.5s ease-in-out'
                        }}
                      >
                        <span className="text-xl md:text-2xl font-mono text-vault-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] leading-none">
                          {Math.floor(playheadTime/60)}:{(playheadTime%60).toFixed(2).padStart(5,'0')}
                        </span>
                      </div>
                      {Array.from({length: 120}).map((_, i) => (
                        <React.Fragment key={i}><div className="absolute h-full border-l border-white/20" style={{ left: `${timelineOffset + i * timelineZoom}px` }}><span className="text-[12px] text-white ml-1 font-display font-black leading-none">{i}s</span></div></React.Fragment>
                      ))}
                    </div>
                    <div className={`flex flex-col pt-4 relative transition-all duration-500 ${isSidebarVisible ? 'gap-8' : 'gap-2'}`}>
                      <div className="absolute top-0 bottom-0 w-1 bg-red-600 z-[100] shadow-[0_0_20px_rgba(255,0,0,0.8)] cursor-ew-resize pointer-events-auto" style={{ left: `${timelineOffset + playheadTime * timelineZoom}px` }} onMouseDown={(e) => { const onMove = (me: MouseEvent) => { const el = document.getElementById('lab-timeline'); if (!el) return; const rect = el.getBoundingClientRect(); const x = me.clientX - rect.left + el.scrollLeft - timelineOffset; handleSeek(Math.max(0, x / timelineZoom), true); }; const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); }}><div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-4 h-4 bg-red-600 rotate-45 border border-white shadow-xl" /></div>
                      {rows.length === 0 ? <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-white/5 rounded-3xl opacity-20"><span className="font-display uppercase tracking-[0.5em] text-sm">Awaiting Multi-Track Sequence</span></div> : rows.map((row, rowIdx) => {
                        const rowClips = tracks.filter(t => t.rowId === row.id);
                        return (
                          <div key={row.id} className="bg-black/60 rounded-2xl border border-white/5 flex flex-col shadow-xl relative overflow-hidden group">
                            <div className={`flex h-full transition-all duration-500 ${isSidebarVisible ? 'min-h-[380px]' : 'min-h-[160px]'}`}>
                              <div className={`flex flex-col gap-3 p-6 transition-all duration-500 ease-in-out border-r border-white/5 ${isSidebarVisible ? 'w-[200px] opacity-100' : 'w-0 opacity-0 p-0 overflow-hidden border-r-0'}`}>
                                  <div className="flex items-center justify-between"><span className="text-[12px] font-display font-black text-white uppercase tracking-widest">Track {rowIdx + 1}</span></div>
                                  <div className="flex gap-1"><button onClick={() => setRows(p => p.map(r => r.id === row.id ? { ...r, isMuted: !r.isMuted } : r))} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${row.isMuted ? 'bg-[#3b82f6] text-white' : 'bg-transparent text-[#3b82f6] border border-[#3b82f6]/40 hover:bg-[#3b82f6]'}`}>MUTE</button><button onClick={() => setRows(p => p.map(r => r.id === row.id ? { ...r, isSoloed: !r.isSoloed } : r))} className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${row.isSoloed ? 'bg-[#22c55e] text-white' : 'bg-transparent text-[#22c55e] border border-[#22c55e]/40 hover:bg-[#22c55e]'}`}>SOLO</button></div>
                                  <div className="flex flex-col gap-1"><span className="text-[10px] font-display text-white/40 uppercase font-black">Gain</span><input type="range" min="0" max="2" step="0.1" value={row.volume} onChange={e => setRows(p => p.map(r => r.id === row.id ? { ...r, volume: parseFloat(e.target.value) } : r))} className="w-full accent-vault-gold h-1" /></div>
                                  <button onClick={() => { if (rowClips.length === 0) return; saveToHistory(); const nextRowId = Math.max(...rows.map(r => r.id), -1) + 1; const duplicatedTracks: Track[] = rowClips.map(clip => ({ ...clip, id: Math.random().toString(36).substring(7), rowId: nextRowId, label: `${clip.label} (Phase)`, startTime: clip.startTime + 0.05, effects: { ...clip.effects, aiConstruct: true }, sourceType: 'shifter', isSelected: false })); setRows(prev => [...prev, { id: nextRowId, volume: 1, isMuted: false, isSoloed: false }]); setTracks(prev => [...prev, ...duplicatedTracks]); }} className="w-full py-1.5 bg-transparent border border-vault-alert text-vault-alert text-[10px] font-black uppercase rounded clip-path-slant hover:bg-vault-alert hover:text-white transition-all">Add Phase Shifter</button>
                                  <button onClick={() => { if (rowClips.length === 0) return; saveToHistory(); const nextRowId = Math.max(...rows.map(r => r.id), -1) + 1; const duplicatedTracks: Track[] = rowClips.map(clip => ({ ...clip, id: Math.random().toString(36).substring(7), rowId: nextRowId, label: `${clip.label} (Copy)`, sourceType: 'duplicate', isSelected: false })); setRows(prev => [...prev, { id: nextRowId, volume: 1, isMuted: false, isSoloed: false }]); setTracks(prev => [...prev, ...duplicatedTracks]); }} className="w-full py-1.5 bg-transparent border border-vault-gold text-vault-gold text-[10px] font-black uppercase rounded clip-path-slant hover:bg-vault-gold hover:text-black transition-all">Duplicate Track</button>
                                  <button onClick={() => { const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.onchange = async (e:any) => { const f = e.target.files[0]; if(!f) return; const buf = await (getAudioContext().decodeAudioData(await f.arrayBuffer())); const nextRowId = Math.max(...rows.map(r => r.id), -1) + 1; setRows(prev => [...prev, { id: nextRowId, volume: 1, isMuted: false, isSoloed: false }]); setTracks(prev => [...prev, { id: Math.random().toString(36).substring(7), buffer: buf, label: f.name, startTime: playheadTime, volume: 1, isMuted: false, isSoloed: false, effects: { hollow: false, reverb: false, aiConstruct: false, vocoder: false, hollowFreq: 1575, reverbMix: 0.4, vocoderAmount: 0.5 }, rowId: nextRowId, isSelected: false, sourceType: 'upload' as const }]); }; fileInput.click(); }} className="w-full py-1.5 bg-transparent border border-white text-white text-[10px] font-black uppercase rounded clip-path-slant hover:bg-white hover:text-black transition-all">Add Track</button>
                                  <div className="flex flex-col gap-1 mt-1"><span className="text-[10px] font-display text-white/40 uppercase font-black">Zoom</span><input type="range" min="50" max="300" value={timelineZoom} onChange={e => setTimelineZoom(parseInt(e.target.value))} className="accent-vault-gold w-full h-1" /></div>
                                  <button onClick={() => removeRow(row.id)} className="w-full mt-1 text-vault-alert hover:text-white transition-all text-[9px] font-black uppercase text-center">Delete Track</button>
                              </div>
                              <div onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="w-5 flex-shrink-0 bg-vault-gold/5 hover:bg-vault-gold/20 cursor-pointer border-r border-vault-gold/30 flex items-center justify-center transition-colors group/separator relative"><div className="flex flex-col gap-1 opacity-20 group-hover/separator:opacity-100 transition-opacity"><div className="w-1 h-1 bg-vault-gold rounded-full" /><div className="w-1 h-1 bg-vault-gold rounded-full" /><div className="w-1 h-1 bg-vault-gold rounded-full" /></div><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><svg className={`w-4 h-4 text-vault-gold transition-transform duration-300 ${isSidebarVisible ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></div></div>
                              <div className="flex-1 flex flex-col relative transition-all duration-500 overflow-hidden">
                                  <div className="absolute top-2 right-4 z-20 pointer-events-none">{rowClips[0] && <span className="text-xl md:text-2xl font-display font-black uppercase tracking-[0.2em] pointer-events-none text-vault-gold drop-shadow-lg">{rowClips[0].label}</span>}</div>
                                  <div className="flex-1 relative min-h-[140px]">{rowClips.map((clip) => (
                                      <div 
                                        key={clip.id}
                                        className={`absolute top-2 bottom-2 rounded-xl overflow-hidden border-2 transition-shadow group/clip cursor-move ${clip.isSelected ? 'border-white ring-2 ring-white/20 z-50 shadow-[0_0_25px_rgba(255,255,255,0.1)]' : 'border-white/10 z-10'}`} 
                                        style={{ left: `${clip.startTime * timelineZoom}px`, width: `${clip.buffer.duration * timelineZoom}px` }}
                                        onMouseDown={(e) => { 
                                          e.stopPropagation(); handleTrackSelection(clip.id, e.shiftKey); const sx = e.clientX; const is = clip.startTime; const otherClips = tracks.filter(t => t.rowId === clip.rowId && t.id !== clip.id);
                                          const onMove = (me: MouseEvent) => {
                                            let ns = Math.max(0, is + (me.clientX - sx) / timelineZoom); const duration = clip.buffer.duration;
                                            otherClips.forEach(o => { if (ns < o.startTime + o.buffer.duration && ns + duration > o.startTime) { if (ns < o.startTime) ns = o.startTime - duration; else ns = o.startTime + o.buffer.duration; } });
                                            setTracks(p => p.map(t => t.id === clip.id ? { ...t, startTime: ns } : t));
                                          };
                                          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); 
                                        }}
                                      ><Waveform buffer={clip.buffer} color={clip.isSelected || clip.sourceType === 'upload' ? '#ffffff' : (clip.effects.aiConstruct ? '#ef4444' : '#d4af37')} /></div>
                                    ))}</div>
                                  <div className="relative mt-auto pt-1 pb-2">
                                    <div className="sticky left-0 z-20 w-full flex justify-center" style={{ maxWidth: isSidebarVisible ? 'calc(100vw - 320px)' : 'calc(100vw - 120px)' }}>
                                      <div className={`flex flex-col items-center gap-0.5 bg-black/40 rounded-xl border border-white/5 backdrop-blur-md transition-all duration-500 ${isSidebarVisible ? 'pt-1 pb-1 px-6' : 'p-1 scale-90'}`}>
                                        {isSidebarVisible && <div className="flex flex-col items-center"><span className="text-[10px] font-display font-black text-vault-gold uppercase tracking-[0.4em] leading-none">Digital Rack</span></div>}
                                        <div className={`w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 items-start ${isSidebarVisible ? 'gap-4 md:gap-8' : 'gap-1'}`}>
                                          {rowClips[0] && (
                                            <>
                                              <div className="flex flex-col gap-1 items-center"><button onClick={() => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, hollow: !t.effects.hollow }} : t))} className={`w-full py-1 rounded text-[9px] font-black border transition-all uppercase tracking-widest ${rowClips[0].effects.hollow ? 'bg-blue-600 border-white text-white shadow-lg' : 'border-white/10 text-white/30 hover:border-vault-gold/40'}`}>Hollow Mask</button><div className="w-full flex flex-col gap-0.5 px-2"><div className="flex justify-between text-[7px] font-black uppercase text-white/40"><span>Freq</span><span className="text-vault-gold">{rowClips[0].effects.hollowFreq}Hz</span></div><input type="range" min="500" max="4000" step="10" disabled={!rowClips[0].effects.hollow} value={rowClips[0].effects.hollowFreq} onChange={e => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, hollowFreq: parseInt(e.target.value) }} : t))} className="w-full accent-blue-500 h-1 bg-white/5 rounded-full" /></div></div>
                                              <div className="flex flex-col gap-1 items-center"><button onClick={() => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, reverb: !t.effects.reverb }} : t))} className={`w-full py-1 rounded text-[9px] font-black border transition-all uppercase tracking-widest ${rowClips[0].effects.reverb ? 'bg-purple-600 border-white text-white shadow-lg' : 'border-white/10 text-white/30 hover:border-vault-gold/40'}`}>Room Reverb</button><div className="w-full flex flex-col gap-0.5 px-2"><div className="flex justify-between text-[7px] font-black uppercase text-white/40"><span>Mix</span><span className="text-vault-gold">{Math.round(rowClips[0].effects.reverbMix * 100)}%</span></div><input type="range" min="0" max="1" step="0.01" disabled={!rowClips[0].effects.reverb} value={rowClips[0].effects.reverbMix} onChange={e => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, reverbMix: parseFloat(e.target.value) }} : t))} className="w-full accent-purple-500 h-1 bg-white/5 rounded-full" /></div></div>
                                              <div className="flex flex-col gap-1 items-center"><button onClick={() => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, vocoder: !t.effects.vocoder }} : t))} className={`w-full py-1 rounded text-[9px] font-black border transition-all uppercase tracking-widest ${rowClips[0].effects.vocoder ? 'bg-orange-600 border-white text-white shadow-lg' : 'border-white/10 text-white/30 hover:border-vault-gold/40'}`}>Vocoder</button><div className="w-full flex flex-col gap-0.5 px-2"><div className="flex justify-between text-[7px] font-black uppercase text-white/40"><span>Level</span><span className="text-vault-gold">{Math.round(rowClips[0].effects.vocoderAmount * 100)}%</span></div><input type="range" min="0" max="1" step="0.01" disabled={!rowClips[0].effects.vocoder} value={rowClips[0].effects.vocoderAmount} onChange={e => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, vocoderAmount: parseFloat(e.target.value) }} : t))} className="w-full accent-orange-500 h-1 bg-white/5 rounded-full" /></div></div>
                                              <div className="flex flex-col gap-1 items-center"><button onClick={() => setTracks(p => p.map(t => t.id === rowClips[0].id ? { ...t, effects: { ...t.effects, aiConstruct: !t.effects.aiConstruct }} : t))} className={`w-full h-[28px] flex flex-col items-center justify-center rounded border transition-all ${rowClips[0].effects.aiConstruct ? 'bg-red-600 border-white text-white shadow-lg' : 'border-white/10 text-white/30 hover:border-vault-gold/40'}`}><span className="text-[9px] font-black uppercase tracking-widest leading-none">AI Resonance</span><span className="text-[6px] font-bold opacity-60 uppercase mt-0.5">Phase Shifter</span></button></div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="sticky right-0 flex-shrink-0 h-[300px] mt-14"><LevelMeter isPlaying={isPlaying} /></div>
              </div>
              <div className="p-8 bg-black/80 border-t border-vault-gold/20 flex flex-col gap-10 rounded-b-[2rem]">
                <div className="relative w-full flex items-center justify-center">
                  <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                    <button onClick={undo} disabled={history.length === 0} className="w-12 h-12 bg-white/5 border border-vault-gold/40 rounded-xl hover:bg-vault-gold hover:text-black transition-all flex items-center justify-center shadow-lg group disabled:opacity-20" title="Revert Back (Undo)"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
                    <button onClick={redo} disabled={redoStack.length === 0} className="w-12 h-12 bg-white/5 border border-vault-gold/40 rounded-xl hover:bg-vault-gold hover:text-black transition-all flex items-center justify-center shadow-lg group disabled:opacity-20" title="Revert Forward (Redo)"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m-6-6l-6-6" /></svg></button>
                    <div className="h-10 w-0.5 bg-vault-gold mx-2" />
                    <button onClick={() => { stopAllTracks(); setPlayheadTime(0); }} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90" title="Start"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h2v12H4V6zm15 12V6l-8.5 6 8.5 6zm-6.5-6l8.5 6V6l-8.5 6z" /></svg></button>
                    <button onClick={() => handleSeek(playheadTime - 0.1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90" title="Back"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 12l-4.5 4.5v-9l4.5 4.5zM11 12l-4.5 4.5v-9l4.5 4.5z" /></svg></button>
                    <button onClick={() => handleSeek(playheadTime - 0.01)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90" title="Nudge Back"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg></button>
                    <button onClick={() => isPlaying ? stopAllTracks() : playTimeline()} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${isPlaying ? 'bg-vault-alert text-white' : 'bg-white text-black ring-4 ring-vault-gold/40'}`} title="Play/Pause">{isPlaying ? <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" /></svg> : <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 2.691l11 7.309-11 7.309v-14.618z" /></svg>}</button>
                    <button onClick={() => handleSeek(playheadTime + 0.01)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90" title="Nudge Forward"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /></svg></button>
                    <button onClick={() => handleSeek(playheadTime + 0.1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90" title="Forward"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 12l4.5 4.5v-9L8.5 12zM9 12l4.5 4.5v-9L9 12z" /></svg></button>
                    <div className="h-10 w-0.5 bg-vault-gold mx-2" />
                    <button onClick={handleSplit} className="w-12 h-12 bg-white/5 border border-vault-gold/40 rounded-xl hover:bg-vault-gold hover:text-black transition-all flex items-center justify-center shadow-lg group" title="Split Clip (C)"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 11-4.243 4.243 3 3 0 014.243-4.243zm0-5.758a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z" /></svg></button>
                    <button onClick={handleDeleteSelected} className="w-12 h-12 bg-white/5 border border-vault-alert/40 rounded-xl hover:bg-vault-alert hover:text-white transition-all flex items-center justify-center shadow-lg group" title="Delete Selected (Del)"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    <button onClick={handleRippleDelete} className="w-12 h-12 bg-white/5 border border-[#3b82f6]/40 rounded-xl hover:bg-[#3b82f6] hover:text-white transition-all flex items-center justify-center shadow-lg group relative" title="Ripple Delete (Shift + Del)"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><div className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <button onClick={() => setIsEqOpen(true)} className="px-10 py-4 bg-black/40 border-2 border-[#3b82f6] text-[#3b82f6] rounded-xl text-xs font-black uppercase hover:bg-[#3b82f6] hover:text-white transition-all shadow-lg active:scale-95">Master Equalizer</button>
                  <button onClick={handleProcessMaster} disabled={tracks.length === 0 || isProcessingLab} className="px-10 py-4 bg-black/40 border-2 border-[#22c55e] text-[#22c55e] rounded-xl text-xs font-black uppercase hover:bg-[#22c55e] hover:text-black transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 disabled:opacity-20">Final Export</button>
                  <button onClick={() => setIsLibrarySaveModalOpen(true)} disabled={tracks.length === 0} className="px-10 py-4 bg-black/40 border-2 border-vault-gold/40 text-vault-gold rounded-xl text-xs font-black uppercase hover:bg-vault-gold hover:text-black transition-all disabled:opacity-20 active:scale-95">Save to Library</button>
                  <button onClick={() => { saveToHistory(); setTracks([]); }} className="px-10 py-4 bg-black/40 border-2 border-vault-alert text-vault-alert rounded-xl text-xs font-black uppercase hover:bg-vault-alert hover:text-white transition-all shadow-lg active:scale-95">Clear Master Console</button>
                </div>
              </div>
           </div>
        </ShimmerDropdown>

        <ShimmerDropdown title="Voices of CODIE Library" isOpen={openSections.library} onToggle={() => setOpenSections(p => ({...p, library: !p.library}))}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-h-[800px] overflow-y-auto custom-vault-scrollbar border-2 border-vault-gold/20 rounded-2xl p-6 bg-black/40">
              <div className="space-y-6">
                <h4 className="text-xl font-display font-black text-[#22c55e] uppercase tracking-widest border-b border-white/10 pb-2">Outside the Vault</h4>
                <div className="space-y-4">{codexLibrary.filter(i => i.folder === 'Outside the Vault').map(renderLibraryItem)}</div>
              </div>
              <div className="space-y-6">
                <h4 className="text-xl font-display font-black text-[#3b82f6] uppercase tracking-widest border-b border-white/10 pb-2">Inside the Vault</h4>
                <div className="space-y-4">{codexLibrary.filter(i => i.folder === 'Inside the Vault').map(renderLibraryItem)}</div>
              </div>
           </div>
        </ShimmerDropdown>
      </div>

      {isLibrarySaveModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
          <div className="w-full max-xl bg-vault-panel border-4 border-vault-gold p-10 rounded-[3rem] text-center shadow-2xl relative">
             <h3 className="text-3xl font-display font-black text-vault-gold uppercase tracking-widest mb-4">Final Audio Processing</h3>
             <input type="text" value={librarySaveName} onChange={e => setLibrarySaveName(e.target.value)} placeholder="Add file name" className="w-full bg-black/60 border-2 border-vault-gold/30 rounded-xl px-6 py-5 text-white font-sans text-2xl md:text-3xl mb-10 text-center focus:border-vault-gold outline-none placeholder:text-white/40" />
             <div className="grid grid-cols-2 gap-6 mb-10">
               <button onClick={() => setLibrarySaveLocation('Outside the Vault')} className={`py-6 rounded-2xl font-display font-black uppercase text-xl transition-all border-4 ${librarySaveLocation === 'Outside the Vault' ? 'bg-vault-gold text-black border-white shadow-lg scale-105' : 'bg-transparent text-vault-gold border-vault-gold/40'}`}>Outside</button>
               <button onClick={() => setLibrarySaveLocation('Inside the Vault')} className={`py-6 rounded-2xl font-display font-black uppercase text-xl transition-all border-4 ${librarySaveLocation === 'Inside the Vault' ? 'bg-[#3b82f6] text-white border-white shadow-lg scale-105' : 'bg-transparent text-[#3b82f6] border-[#3b82f6]/40'}`}>Inside</button>
             </div>
             <div className="flex flex-col gap-4">
               <VaultButton onClick={handleSaveToLibrary} disabled={!librarySaveName.trim()} className="w-full py-4 text-lg">Confirm Sync</VaultButton>
               <button onClick={() => setIsLibrarySaveModalOpen(false)} className="py-2 text-[10px] font-black uppercase text-white/30">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {selectedArchiveItem && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-fadeIn">
          <div className="w-full max-w-4xl bg-vault-panel border-[3px] border-vault-gold rounded-[3.5rem] p-10 md:p-14 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
             <header className="mb-10 flex items-start justify-between"><div className="flex flex-col gap-2"><h3 className="text-4xl md:text-5xl font-display font-black text-vault-gold uppercase tracking-[0.1em]">Voice Data Link</h3></div><button onClick={() => setSelectedArchiveItem(null)} className="p-4 text-white/30 hover:text-white transition-all transform hover:scale-110"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" /></svg></button></header>
             <div className="h-px w-full bg-white/10 mb-12" />
             <div className="relative mb-10"><span className="absolute -top-3 left-8 px-4 bg-vault-panel text-vault-gold font-display font-bold text-sm md:text-base uppercase tracking-[0.3em] z-10">Transcript</span><div className="p-10 bg-black/60 rounded-[2rem] border border-white/5 min-h-[160px] flex items-center shadow-inner"><p className="text-2xl md:text-4xl text-white italic font-sans leading-snug">"{selectedArchiveItem.text}"</p></div></div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1 shadow-md"><span className="text-[11px] md:text-[13px] font-display font-bold text-white/30 uppercase tracking-widest">Voice</span><span className="text-xl font-display font-black text-vault-gold uppercase tracking-widest">{selectedArchiveItem.voiceName}</span></div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1 shadow-md"><span className="text-[11px] md:text-[13px] font-display font-bold text-white/30 uppercase tracking-widest">Authority</span><span className="text-xl font-display font-black text-vault-gold uppercase tracking-widest">{selectedArchiveItem.settings?.authority || 0}%</span></div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1 shadow-md"><span className="text-[11px] md:text-[13px] font-display font-bold text-white/30 uppercase tracking-widest">Glitch</span><span className="text-xl font-display font-black text-vault-gold uppercase tracking-widest">{selectedArchiveItem.settings?.glitch || 0}%</span></div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center gap-1 shadow-md"><span className="text-[11px] md:text-[13px] font-display font-bold text-white/30 uppercase tracking-widest">Resonance</span><span className="text-xl font-display font-black text-vault-gold uppercase tracking-widest">{selectedArchiveItem.settings?.resonance || 0}%</span></div>
             </div>
             <div className="relative mb-14"><span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-vault-panel text-white/40 font-display font-bold text-[11px] md:text-[13px] uppercase tracking-[0.3em] z-10">Neural Tuning Context</span><div className="p-8 bg-black/40 rounded-2xl border border-white/5 shadow-inner"><p className="text-[22px] md:text-[34px] text-white font-sans italic text-center leading-relaxed font-medium">{selectedArchiveItem.instruction || "No tuning parameters provided."}</p></div></div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <button onClick={() => handleTTS(selectedArchiveItem.text, selectedArchiveItem.instruction, selectedArchiveItem.voiceName, selectedArchiveItem.settings)} disabled={isGeneratingVoice} className="py-6 rounded-2xl font-display font-black uppercase text-2xl bg-[#22c55e] text-black active:scale-95 transition-all shadow-xl hover:bg-white clip-path-slant">{isGeneratingVoice ? '...' : 'PLAY'}</button>
                <button onClick={() => { if (tracks.length > 0) setPendingLabAction({ text: selectedArchiveItem.text, instructions: selectedArchiveItem.instruction, personality: selectedVoice, settings: neuralSettings }); else { handleTTS(selectedArchiveItem.text, selectedArchiveItem.instruction, selectedArchiveItem.voiceName, selectedArchiveItem.settings, true); setSelectedArchiveItem(null); } }} className="py-6 rounded-2xl font-display font-black uppercase text-xl bg-[#3b82f6] text-white active:scale-95 shadow-xl hover:bg-white hover:text-black">SEND TO LAB</button>
                <button onClick={() => { setDeleteConfirm({ id: selectedArchiveItem.id, type: 'archive', label: selectedArchiveItem.label }); setSelectedArchiveItem(null); }} className="py-6 rounded-2xl font-display font-black uppercase text-xl bg-transparent border-2 border-vault-alert text-vault-alert hover:bg-vault-alert hover:text-white transition-all shadow-lg">DELETE</button>
                <button onClick={() => handleDownloadArchive(selectedArchiveItem)} disabled={isDownloading} className="py-6 rounded-2xl font-display font-black uppercase text-xl text-vault-gold hover:bg-vault-gold hover:text-black border-2 border-vault-gold transition-all shadow-lg">{isDownloading ? '...' : 'DOWNLOAD'}</button>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      {pendingLabAction && (
        <div className="fixed inset-0 z-[850] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-lg bg-vault-panel border-4 border-vault-gold p-10 rounded-[3rem] text-center shadow-[0_0_100px_rgba(212,175,55,0.4)] relative overflow-hidden">
             <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-6">Lab Sequence Confirmation</h3>
             <p className="text-vault-gold font-sans text-xl mb-10 italic">"Did want to add a track to the existing sequence?"</p>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleLabConfirmed(true)} className="py-4 bg-[#22c55e] text-black font-display font-black uppercase text-lg rounded-xl shadow-lg active:scale-95 hover:bg-white transition-all">YES</button>
                <button onClick={() => handleLabConfirmed(false)} className="py-4 bg-vault-alert text-white font-display font-black uppercase text-lg rounded-xl shadow-lg active:scale-95 hover:bg-white hover:text-black transition-all">NO</button>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="w-full max-md bg-vault-panel border-4 border-vault-alert p-10 rounded-3xl text-center shadow-[0_0_120px_rgba(255,51,51,0.5)] relative overflow-hidden">
             <h3 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-widest mb-6">Delete from Database</h3>
             <p className="text-vault-gold font-sans text-2xl md:text-3xl mb-10 italic font-black uppercase">
               {deleteConfirm.label}
             </p>
             <div className="flex flex-col md:flex-row justify-center gap-4">
                <button onClick={performDelete} className="px-10 py-4 bg-vault-alert text-white font-display font-black uppercase text-lg rounded-xl shadow-lg active:scale-95 hover:bg-white hover:text-black transition-all">Delete Audio File</button>
                <button onClick={() => setDeleteConfirm(null)} className="px-10 py-4 bg-white/10 text-white/60 font-display font-black uppercase text-lg rounded-xl shadow-lg active:scale-95 hover:bg-white hover:text-black transition-all">Cancel request</button>
             </div>
             <div className="absolute inset-0 pointer-events-none opacity-[0.1] scanline" />
          </div>
        </div>
      )}

      {isProcessingLab && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fadeIn">
          <div className="flex flex-col items-center gap-8 max-w-lg w-full px-6">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-vault-gold/20 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 border-t-4 border-vault-gold rounded-full animate-spin"></div></div>
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-3 h-3 bg-vault-gold rounded-full animate-pulse shadow-[0_0_15px_#d4af37]"></div></div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-2xl md:text-3xl font-display font-black text-vault-gold uppercase tracking-[0.4em] animate-pulse text-center">Processing Audio File</h3>
              <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
                {exportProgress > 0 ? `Uplinking Synthesized Waveform: ${Math.round(exportProgress * 100)}%` : "Initializing Multi-Track Core Interface..."}
              </p>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <div className="h-full bg-vault-gold transition-all duration-300" style={{ width: `${Math.round((exportProgress || 0) * 100)}%` }}></div>
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
        </div>
      )}
      <EqualizerModal 
        isOpen={isEqOpen} 
        onClose={() => setIsEqOpen(false)} 
        eqBands={eqBands} 
        setEqBands={setEqBands} 
        preamp={preamp} 
        setPreamp={setPreamp} 
        eqEnabled={eqEnabled} 
        setEqEnabled={setEqEnabled}
        isPlaying={isPlaying}
        onPlay={() => playTimeline()}
        onStop={stopAllTracks}
        activePresets={activePresets}
        togglePreset={togglePreset}
      />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] scanline" />
      <style>{` @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin-slow { animation: spin-slow 8s linear infinite; } `}</style>
    </div>
  );
};