
import React, { useState, useEffect, useRef } from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface ESPDevice {
  id: string;
  name: string;
  type: 'BT' | 'WIFI';
  ip?: string;
  btDevice?: any;
  btCharacteristic?: any;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  profile: 'LED' | 'SOUND' | 'FOGGER' | 'LL' | 'TESTVOICE' | 'AI_CORE';
}

// Global protocol constants - SYNCED WITH ARDUINO SKETCH
const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
const PRIMARY_STATIC_IP = "192.168.0.55";

interface CommandCenterPageProps {
  onBack: () => void;
}

// Map profiles to cleaner UI labels
const profileDisplayNames: Record<string, string> = {
  'LED': 'LED Control',
  'SOUND': 'Audio Matrix',
  'FOGGER': 'Fog Deployment',
  'LL': 'Lava Lamps',
  'TESTVOICE': 'Voice Engine',
  'AI_CORE': 'RPi5 Core'
};

export const CommandCenterPage: React.FC<CommandCenterPageProps> = ({ onBack }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(false);
  const [isConnectionExpanded, setIsConnectionExpanded] = useState(true);
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [scanFilter, setScanFilter] = useState('CKXR');
  const [manualIp, setManualIp] = useState(PRIMARY_STATIC_IP);
  const [isScanning, setIsScanning] = useState(false);
  
  const [hwLogs, setHwLogs] = useState<string[]>([]);
  const [devices, setDevices] = useState<ESPDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [piIp, setPiIp] = useState<string | null>(null);
  const [visionRepaired, setVisionRepaired] = useState(false);

  const [soundMode, setSoundMode] = useState<'OUTSIDE' | 'INSIDE'>('OUTSIDE');
  const [relayStates, setRelayStates] = useState<Record<string, boolean>>({}); 
  const [activeMomentaryPins, setActiveMomentaryPins] = useState<Record<string, boolean>>({}); 
  
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const isSelectedDeviceOnline = selectedDevice?.status === 'CONNECTED';

  // --- Profile Control Definitions ---
  const ledPins = [
    { label: "Fogger LED's", subLabel: 'V1', borderColor: 'border-vault-gold', textColor: 'text-vault-gold', activeColor: 'bg-vault-gold', isPersistent: true },
    { label: "Inside LED's", subLabel: 'V2', borderColor: 'border-vault-gold', textColor: 'text-vault-gold', activeColor: 'bg-vault-gold', isPersistent: true },
    { label: "TNT LED's", subLabel: 'V3', borderColor: 'border-vault-gold', textColor: 'text-vault-gold', activeColor: 'bg-vault-gold', isPersistent: true },
    { label: "Lava Lamps LED's", subLabel: 'V4', borderColor: 'border-vault-gold', textColor: 'text-vault-gold', activeColor: 'bg-vault-gold', isPersistent: true },
    { label: "Start Game", subLabel: 'V5', borderColor: 'border-[#22c55e]', textColor: 'text-[#22c55e]', activeColor: 'bg-[#22c55e]', isPersistent: false },
    { label: "Pause Game", subLabel: 'V6', borderColor: 'border-vault-gold', textColor: 'text-vault-gold', activeColor: 'bg-vault-gold', isPersistent: false },
    { label: "Stop Game", subLabel: 'V7', borderColor: 'border-vault-alert', textColor: 'text-vault-alert', activeColor: 'bg-vault-alert', isPersistent: false },
    { label: "Reset Game", subLabel: 'V8', borderColor: 'border-[#3b82f6]', textColor: 'text-[#3b82f6]', activeColor: 'bg-[#3b82f6]', isPersistent: false },
  ];

  const testVoicePins = [
    { label: "HELLO ROBOT", pin: "V2" },
    { label: "SMILE", pin: "V103" },
    { label: "INTRO", pin: "V104" },
    { label: "BIO SCAN", pin: "V97" },
    { label: "VOLUME DOWN", pin: "V98" },
    { label: "DIM LIGHTS", pin: "V106" },
    { label: "BRIGHTEN LIGHTS", pin: "V105" },
    { label: "COOLING MODE", pin: "V128" },
    { label: "HEATING MODE", pin: "V129" },
    { label: "OPEN WINDOW", pin: "V137" },
    { label: "CLOSE WINDOW", pin: "V138" },
    { label: "OPEN CURTAINS", pin: "V139" },
    { label: "CLOSE CURTAINS", pin: "V140" },
    { label: "OPEN DOOR", pin: "V141" },
    { label: "CLOSE DOOR", pin: "V142" },
    { label: "LEARNING MODE", pin: "V201", isCritical: true },
  ];

  const foggerPins = [
    { label: "Heater", subLabel: "V1", borderColor: "border-blue-500", textColor: "text-blue-400", activeColor: "bg-blue-600", isPersistent: true },
    { label: "Fogger", subLabel: "V2", borderColor: "border-red-600", textColor: "text-red-400", activeColor: "bg-red-600", isPersistent: false },
    { label: "Heater & Fogger", subLabel: "V3", borderColor: "border-green-600", textColor: "text-green-400", activeColor: "bg-green-600", isPersistent: false },
  ];

  const llPins = [
    { label: "Left Pump", subLabel: "V1", borderColor: "border-blue-500", textColor: "text-blue-400", activeColor: "bg-blue-600", isPersistent: true },
    { label: "Right Pump", subLabel: "V2", borderColor: "border-red-600", textColor: "text-red-400", activeColor: "bg-red-600", isPersistent: true },
    { label: "Both Pumps", subLabel: "V3", borderColor: "border-green-600", textColor: "text-green-400", activeColor: "bg-green-600", isPersistent: true },
  ];

  const outsideVoices = Array.from({ length: 20 }, (_, i) => {
    const labels: Record<number, string> = { 0: "Intro", 1: "Game", 2: "End" };
    return { label: labels[i] || `Voice ${i + 1}`, pin: `V${(i + 1)}` };
  });

  const insideVoices = Array.from({ length: 12 }, (_, i) => ({ 
    label: `Voice ${i + 1}`, 
    pin: `V${(i + 8)}` 
  }));

  const addLog = (msg: string) => {
    setHwLogs(prev => [`[${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}] ${msg}`, ...prev].slice(0, 15));
  };

  useEffect(() => {
    if (isAuthorized && hwLogs.length === 0) {
      const sequence = [
        "SYSTEM_BOOT: Initializing Neural Core...",
        "REGISTRY_SYNC: v7.4-STABLE",
        "DIAGNOSTIC: Beacon Mode ACTIVE (192.168.0.55)",
        "UPLINK_READY: Awaiting UUID Handshake..."
      ];
      sequence.forEach((msg, i) => {
        setTimeout(() => addLog(msg), i * 300);
      });
    }
  }, [isAuthorized]);

  const sendCommand = async (pin: string, state: boolean) => {
    if (!selectedDevice || selectedDevice.status !== 'CONNECTED') return;
    
    // Use "V-pin" string format exclusively to match the Arduino parser provided in chat
    const command = `${pin}:${state ? 1 : 0}\n`;

    if (selectedDevice.btCharacteristic) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(command);
        await selectedDevice.btCharacteristic.writeValue(data);
        addLog(`TX >> "${command.trim()}"`);
        if ("vibrate" in navigator) navigator.vibrate(20);
      } catch (err: any) {
        addLog(`TX_ERR: Hardware Busy`);
      }
    } else if (selectedDevice.profile === 'AI_CORE') {
      addLog(`WIFI_CMD: ${pin} to ${piIp || PRIMARY_STATIC_IP}`);
    }
  };

  const handleTogglePersistent = async (pin: string) => {
    const newState = !relayStates[pin];
    setRelayStates(prev => ({ ...prev, [pin]: newState }));
    await sendCommand(pin, newState);
  };

  const handleToggleSoundRelay = async (mode: 'OUTSIDE' | 'INSIDE') => {
    setSoundMode(mode);
    const pin = mode === 'OUTSIDE' ? 'V5' : 'V6';
    const otherPin = mode === 'OUTSIDE' ? 'V6' : 'V5';
    const isCurrentlyActive = !!relayStates[pin];
    
    if (!isCurrentlyActive) {
      setRelayStates(prev => ({ ...prev, [pin]: true, [otherPin]: false }));
      await sendCommand(pin, true);
      await sendCommand(otherPin, false);
    } else {
      setRelayStates(prev => ({ ...prev, [pin]: false }));
      await sendCommand(pin, false);
    }
  };

  const handleTriggerMomentary = async (pin: string, duration: number = 800) => {
    if (activeMomentaryPins[pin]) return;
    setActiveMomentaryPins(prev => ({ ...prev, [pin]: true }));
    await sendCommand(pin, true);
    setTimeout(async () => {
      await sendCommand(pin, false);
      setActiveMomentaryPins(prev => ({ ...prev, [pin]: false }));
    }, duration);
  };

  const updateDeviceStatus = (id: string, status: ESPDevice['status'], extra?: Partial<ESPDevice>) => {
    setDevices(prev => {
      const existing = prev.find(d => d.id === id);
      if (existing) {
        return prev.map(d => d.id === id ? { ...d, status, ...extra } : d);
      }
      
      const name = extra?.name || 'AWAITING_ID';
      let profile: ESPDevice['profile'] = 'LED';
      const upperName = name.toUpperCase();
      
      if (upperName.includes('PI') || upperName.includes('CORE') || upperName.includes('CODEKRACKER') || upperName.includes('RPI5')) {
        // If it includes CORE it might be AI_CORE, but if it has VOICE it's TESTVOICE
        if (upperName.includes('VOICE')) {
           profile = 'TESTVOICE';
        } else {
           profile = 'AI_CORE';
           if (!piIp) setPiIp(PRIMARY_STATIC_IP);
        }
      }
      else if (upperName.includes('VOICE') || upperName.includes('TEST') || upperName.includes('FRONT') || upperName.includes('OUTSIDE')) profile = 'TESTVOICE';
      else if (upperName.includes('SOUND')) profile = 'SOUND';
      else if (upperName.includes('FOGGER')) profile = 'FOGGER';
      else if (upperName.includes('LL')) profile = 'LL';
      else if (upperName.includes('LED')) profile = 'LED';

      return [...prev, { id, name, type: 'BT', status, profile, ...extra }];
    });
  };

  const connectBluetooth = async () => {
    if (!(navigator as any).bluetooth) { addLog("ERR: Browser No-BT Support."); return; }
    setIsScanning(true);
    addLog(`SCAN: Initializing Neural Protocol...`);
    try {
      const options: any = { 
        filters: [
          { namePrefix: scanFilter },
          { namePrefix: "ESP32" },
          { namePrefix: "CKXR" },
          { namePrefix: "CKXR_Front" },
          { namePrefix: "CKXR_VOICE_CORE" }
        ],
        optionalServices: [SERVICE_UUID] 
      };
      
      addLog(`LINK: Awaiting user to select ESP32 chip...`);
      const device = await (navigator as any).bluetooth.requestDevice(options);
      const upperName = (device.name || '').toUpperCase();
      const isPi = (upperName.includes('PI') || upperName.includes('CORE') || upperName.includes('CODEKRACKER') || upperName.includes('RPI5')) && !upperName.includes('VOICE');

      setSelectedDeviceId(device.id);
      updateDeviceStatus(device.id, 'CONNECTING', { name: device.name || 'ESP32_UNNAMED' });
      
      try {
        addLog(`GATT: Handshaking with ${device.name}...`);
        const server = await device.gatt?.connect();
        
        let service;
        try {
          service = await server.getPrimaryService(SERVICE_UUID);
        } catch (e) {
          const services = await server.getPrimaryServices();
          service = services.find((s: any) => s.uuid === SERVICE_UUID) || services[0];
        }

        let characteristic;
        if (service) {
          try {
            characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
          } catch (e) {
            const chars = await service.getCharacteristics();
            characteristic = chars.find((c: any) => c.uuid === CHARACTERISTIC_UUID) || chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          }
        }

        if (characteristic) {
          updateDeviceStatus(device.id, 'CONNECTED', { 
            name: device.name, 
            btDevice: device, 
            btCharacteristic: characteristic 
          });
          addLog(`READY: ${device.name} LINK SECURED.`);
          if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);
        } else {
          if (isPi) throw new Error("BEACON_ONLY");
          else throw new Error("NO_CHARACTERISTIC");
        }
      } catch (gattErr: any) {
        if (isPi) {
          addLog(`READY: ${device.name} IDENTIFIED (Beacon Mode)`);
          updateDeviceStatus(device.id, 'CONNECTED', { 
            name: device.name, 
            btDevice: device,
            ip: PRIMARY_STATIC_IP
          });
          setPiIp(PRIMARY_STATIC_IP);
        } else {
          updateDeviceStatus(device.id, 'DISCONNECTED');
          addLog(`ERR: Handshake Timeout on ${device.name}.`);
        }
      }
      
      device.addEventListener('gattserverdisconnected', () => { 
        updateDeviceStatus(device.id, 'DISCONNECTED'); 
        addLog(`WARN: Node ${device.name} Offline.`); 
      });
    } catch (err: any) { 
      addLog(`ABORT: Matrix Signal Dropped or Refused.`); 
    } finally { 
      setIsScanning(false); 
    }
  };

  const handleManualWiFiConnect = () => {
    const id = `WIFI_${manualIp.replace(/\./g, '_')}`;
    setPiIp(manualIp);
    updateDeviceStatus(id, 'CONNECTED', { 
      name: `MANUAL_RPI5_${manualIp}`, 
      profile: 'AI_CORE', 
      type: 'WIFI',
      ip: manualIp
    });
    setSelectedDeviceId(id);
    addLog(`FAILSAFE: Route configured to ${manualIp}`);
    setIsNamingModalOpen(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 font-display">
        <div className="relative z-10 w-full max-sm md:max-w-xl lg:max-w-2xl bg-vault-panel/80 border-2 border-vault-gold/30 p-10 md:p-16 rounded-[2.5rem] backdrop-blur-xl shadow-2xl overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vault-gold/5 blur-3xl rounded-full"></div>
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-16 md:h-24 mx-auto mb-8 object-contain" />
          <form onSubmit={(e) => { e.preventDefault(); if(accessCode.toUpperCase() === 'CKXR') setIsAuthorized(true); else setError(true); }} className="space-y-6 md:space-y-10">
            <h2 className="text-xl md:text-3xl text-vault-gold uppercase tracking-[0.3em] font-black">Command Core Access</h2>
            <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className={`w-full bg-black/60 border-2 ${error ? 'border-vault-alert' : 'border-vault-gold/20'} rounded-xl px-4 py-4 text-center text-2xl md:text-4xl text-white focus:outline-none focus:border-vault-gold`} placeholder="••••" />
            <VaultButton onClick={() => {}} className="w-full py-4 text-lg">Initialize Terminal</VaultButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-x-hidden">
      <div className="relative z-50 w-full flex flex-col items-center pt-6 px-6 bg-black/80 backdrop-blur-lg border-b border-white/5">
        <button onClick={onBack} className="mb-4 hover:scale-105 transition-transform">
          <img src={ASSETS.LANDING_BANNER} alt="Logo" className="h-12 md:h-16 object-contain" />
        </button>
      </div>

      <div className="relative z-10 flex-1 w-full max-w-[1400px] mx-auto flex flex-col gap-6 p-6 pb-24">
        
        <section className="bg-vault-panel/60 border border-vault-gold/30 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden">
          <header onClick={() => setIsConnectionExpanded(!isConnectionExpanded)} className="p-6 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className={`w-3.5 h-3.5 rounded-full ${isSelectedDeviceOnline ? 'bg-[#22c55e] animate-pulse shadow-[0_0_15px_#22c55e]' : 'bg-vault-alert shadow-[0_0_15px_#ff3333]'}`}></div>
              <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-widest leading-none">Hardware Control Center</h3>
            </div>
            <VaultButton onClick={() => setIsNamingModalOpen(true)} variant="secondary" className="py-1.5 px-4 text-[10px]">Discovery Center</VaultButton>
          </header>
          {isConnectionExpanded && (
            <div className="p-6 pt-0 border-t border-white/5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                <div className="space-y-6">
                  <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="w-full bg-black/80 border-2 border-vault-gold/20 rounded-xl px-4 py-4 font-display text-sm text-vault-gold uppercase focus:outline-none transition-all shadow-inner">
                    {devices.length === 0 ? <option value="">No Active Nodes</option> : <><option value="">-- SELECT BROADCAST NODE --</option>{devices.map(d => <option key={d.id} value={d.id}>{d.name} {d.status === 'CONNECTED' ? ' (ONLINE ●)' : d.status === 'CONNECTING' ? ' (HANDSHAKING...)' : ' (OFFLINE)'}</option>)}</>}
                  </select>
                  <div className="flex flex-col">
                    <button onClick={connectBluetooth} disabled={isScanning} className={`py-5 rounded-xl font-display font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl active:scale-95 border-2 ${isScanning ? 'bg-white/10 text-white border-white/20 animate-pulse' : 'bg-[#3b82f6] text-white border-transparent hover:bg-vault-gold hover:text-black'}`}>{isScanning ? 'SCANNING...' : 'Scan for CKXR Hardware'}</button>
                  </div>
                </div>
                <div className="bg-black/60 border-2 border-white/5 rounded-2xl p-5 flex flex-col min-h-[160px] relative overflow-hidden">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-display text-vault-gold uppercase tracking-[0.4em] flex items-center gap-2">hardware terminal logs</span>
                      {piIp && <span className="text-[9px] font-mono text-vault-gold">CORE: {piIp}</span>}
                   </div>
                   <div className="flex-1 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[140px] scrollbar-hide">
                     {hwLogs.map((log, i) => <div key={i} className={`flex gap-3 ${i === 0 ? "text-vault-gold font-bold" : "opacity-60"}`}><span className="text-white/20">>></span><span>{log}</span></div>)}
                     {piIp && <div className="text-vault-alert text-[9px] font-bold uppercase mt-2 animate-pulse font-display">Authorizing mixed content for HD Feed...</div>}
                   </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const dev = devices[idx];
            const active = dev && selectedDeviceId === dev.id;
            return (
              <button key={idx} disabled={!dev} onClick={() => dev && setSelectedDeviceId(dev.id)} className={`relative rounded-2xl border-2 p-6 transition-all min-h-[140px] flex flex-col items-center justify-center gap-3 ${dev ? active ? 'border-vault-gold bg-vault-gold/10 scale-[1.02]' : 'border-white/10 bg-vault-panel/60 hover:border-vault-gold/40' : 'border-white/5 opacity-40 grayscale cursor-default'}`}>
                {dev && <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${dev.status === 'CONNECTED' ? 'bg-[#22c55e] shadow-[0_0_100px_#22c55e]' : dev.status === 'CONNECTING' ? 'bg-vault-gold animate-ping' : 'bg-vault-alert'}`} />}
                <span className="text-[16px] font-display font-black uppercase tracking-widest leading-tight text-center">{dev ? dev.name : `Chip ${idx + 1}`}</span>
                {dev && <span className="text-[10px] font-display uppercase tracking-widest text-vault-gold font-bold">{profileDisplayNames[dev.profile] || dev.profile}</span>}
              </button>
            );
          })}
        </div>

        <section className="bg-vault-panel/40 border border-vault-gold/40 rounded-3xl flex flex-col shadow-2xl overflow-hidden min-h-[400px]">
          <div className="w-full bg-vault-gold px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isSelectedDeviceOnline ? 'bg-black animate-pulse' : 'bg-black/20'}`} />
              <h2 className="text-black font-display font-black uppercase tracking-[0.3em] text-sm md:text-base">VIRTUAL COMMAND GRID</h2>
            </div>
          </div>
          
          <div className="p-6 md:p-12 lg:p-16">
            {selectedDevice ? (
              <div className="flex flex-col gap-12 animate-fadeIn">
                
                {selectedDevice.profile === 'AI_CORE' && (
                  <div className="flex flex-col gap-12">
                    <div className="flex flex-col items-center gap-4">
                       <h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-[0.6em] text-center">MISSION RPi5 CORE</h3>
                       <div className="h-1 w-48 bg-vault-gold/40 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="bg-black/60 border-2 border-vault-gold/20 rounded-3xl overflow-hidden flex flex-col relative group">
                        <div className="bg-vault-gold/10 px-6 py-3 border-b border-vault-gold/20 flex justify-between items-center">
                          <span className="text-[12px] font-display font-black text-vault-gold uppercase tracking-widest">Neural Visual Uplink</span>
                          <div className="flex gap-2">
                             <div className={`w-2 h-2 rounded-full ${relayStates['V3'] ? 'bg-vault-alert animate-ping' : 'bg-white/20'}`} />
                             <span className={`text-[9px] font-display uppercase font-black tracking-widest ${relayStates['V3'] ? 'text-vault-alert' : 'text-white/20'}`}>Live HD Feed</span>
                          </div>
                        </div>
                        <div className="aspect-video bg-[#050505] relative flex items-center justify-center overflow-hidden">
                           {relayStates['V3'] && piIp ? (
                             !visionRepaired ? (
                               <div className="flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a] w-full h-full animate-fadeIn">
                                 <div className="w-16 h-16 border-2 border-vault-alert rounded-full flex items-center justify-center mb-6">
                                   <svg className="w-10 h-10 text-vault-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                   </svg>
                                 </div>
                                 <h3 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-widest mb-3 leading-none">PROTOCOL INTERCEPTED</h3>
                                 <p className="text-[10px] md:text-xs text-white/60 uppercase max-w-xs mb-8 leading-relaxed font-black">
                                   BROWSER SECURITY IS BLOCKING THE INSECURE HTTP STREAM ON THIS HTTPS SITE.
                                 </p>
                                 <button 
                                   onClick={() => { window.open(`http://${piIp}:8080/stream.mjpg`, '_blank'); setVisionRepaired(true); }}
                                   className="bg-vault-alert text-white px-8 py-4 rounded-xl font-display font-black uppercase text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,51,51,0.4)] mb-4 active:scale-95"
                                 >
                                   1. REPAIR NEURAL LINK
                                 </button>
                                 <p className="text-[9px] text-white/30 italic uppercase font-medium">
                                   Clicking this opens the stream in a new tab. After it loads there, come back here.
                                 </p>
                               </div>
                             ) : (
                               <img 
                                 src={`http://${piIp}:8080/stream.mjpg`} 
                                 alt="Neural Visual Uplink" 
                                 className="w-full h-full object-cover"
                                 onError={() => { setVisionRepaired(false); addLog("ERR: Connection Lost. Security protocol re-engaged."); }}
                               />
                             )
                           ) : (
                             <div className="relative w-full h-full flex items-center justify-center border-4 border-white/5 m-2 rounded-2xl overflow-hidden bg-black">
                               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-vault-gold/30 rounded-full animate-ping opacity-10" />
                               <div className="flex flex-col items-center gap-4 opacity-40">
                                 <svg className="w-16 h-16 text-vault-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                 <span className="text-[10px] font-display font-black uppercase tracking-[0.5em] text-vault-gold">{!piIp ? 'AWAITING UPLINK' : 'Standby for feed'}</span>
                               </div>
                             </div>
                           )}
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                          <button 
                            onClick={() => { 
                              const s = !relayStates['V3']; 
                              setRelayStates(p=>({...p, V3:s})); 
                              addLog(s ? 'Vision: Initializing...':'Vision: Disabled'); 
                            }} 
                            className={`py-4 rounded-xl border-2 font-display font-black uppercase text-[11px] transition-all ${relayStates['V3'] ? 'bg-[#22c55e] border-white text-white shadow-[0_0_20px_#22c55e]' : 'bg-transparent border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/10'}`}
                          >
                            {relayStates['V3'] ? 'Optical Link Active' : 'Initialize Vision Link'}
                          </button>
                          {relayStates['V3'] && !visionRepaired && (
                            <button onClick={() => setVisionRepaired(true)} className="text-[10px] font-display uppercase tracking-widest text-white/40 hover:text-white underline text-center">Bypass UI: Force Direct Image Frame</button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        <div className="bg-black/60 border-2 border-vault-gold/20 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden flex-1">
                           <div className="flex justify-between items-center">
                             <span className="text-[12px] font-display font-black text-white/40 uppercase tracking-[0.4em]">Analytics Module</span>
                             <div className="flex items-center gap-2">
                               <span className="text-[10px] font-mono text-[#3b82f6] uppercase animate-pulse">Neural Path Open</span>
                             </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4 flex-1">
                              {piIp ? (
                                <>
                                  <div className="aspect-square bg-black border border-white/10 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-vault-gold transition-all">
                                     <img src={`http://${piIp}:8080/files/shot_1.jpg?t=${Date.now()}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="RPi Still" />
                                  </div>
                                  <div className="aspect-square bg-black border border-white/10 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-vault-gold transition-all">
                                     <img src={`http://${piIp}:8080/files/burst_1.jpg?t=${Date.now()}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="RPi Burst" />
                                  </div>
                                </>
                              ) : (
                                <div className="col-span-2 h-full flex flex-col items-center justify-center opacity-20 gap-4 border-2 border-dashed border-white/10 rounded-3xl">
                                   <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                   <span className="text-[10px] font-display uppercase tracking-widest">Connectivity Pending</span>
                                </div>
                              )}
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => addLog("Diagnostic Start...")} className={`p-8 rounded-2xl border-4 font-display font-black uppercase tracking-widest text-[16px] transition-all active:scale-95 bg-black/60 border-vault-gold text-vault-gold hover:bg-vault-gold/10`}>Calibration</button>
                          <button onClick={() => addLog("Reset Protocol Initiate")} className={`p-8 rounded-2xl border-4 font-display font-black uppercase tracking-widest text-[16px] transition-all active:scale-95 bg-black/60 border-vault-alert text-vault-alert hover:bg-vault-alert/10`}>Emergency Reset</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDevice.profile === 'TESTVOICE' && (
                  <div className="flex flex-col gap-12">
                     <div className="flex flex-col items-center gap-4"><h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-[0.6em] text-center">VOICE ENGINE</h3><div className="h-1 w-48 bg-vault-gold/40 rounded-full"></div></div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {testVoicePins.map((item, i) => (
                          <button key={i} onClick={() => handleTriggerMomentary(item.pin)} disabled={!isSelectedDeviceOnline} className={`relative rounded-2xl border-4 p-8 flex flex-col items-center justify-center min-h-[140px] transition-all duration-300 active:scale-95 ${activeMomentaryPins[item.pin] ? (item.isCritical ? 'bg-vault-alert border-white text-white shadow-[0_0_40px_rgba(255,51,51,0.4)] animate-pulse' : 'bg-[#22c55e] border-white text-white shadow-[0_0_40px_rgba(34,197,94,0.4)] animate-pulse') : (item.isCritical ? 'bg-black/80 border-vault-alert text-vault-alert hover:bg-vault-alert/10' : 'bg-black/60 border-vault-gold text-vault-gold hover:bg-vault-gold/10')}`}>
                             <span className="text-[10px] md:text-[12px] font-display font-bold uppercase tracking-[0.3em] opacity-60 mb-2">{item.pin}</span><span className="text-[16px] md:text-[18px] font-display font-black uppercase tracking-widest text-center leading-tight">{item.label}</span>
                          </button>
                        ))}
                     </div>
                  </div>
                )}

                {selectedDevice.profile === 'SOUND' && (
                  <div className="flex flex-col gap-12">
                     <div className="flex flex-col items-center gap-4"><h3 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-[0.6em] text-center">AUDIO ROUTING</h3><div className="h-1 w-48 bg-vault-gold/40 rounded-full"></div></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="flex flex-col gap-6">
                           <button onClick={() => handleToggleSoundRelay('OUTSIDE')} className={`group relative p-10 rounded-[2rem] border-4 transition-all duration-500 overflow-hidden flex flex-col items-center gap-4 active:scale-95 ${soundMode === 'OUTSIDE' && relayStates['V5'] ? 'bg-vault-gold border-white shadow-[0_0_50px_rgba(212,175,55,0.4)]' : 'bg-black/40 border-vault-gold/20 hover:border-vault-gold/50'}`}><span className={`font-display font-black uppercase tracking-[0.4em] text-xl ${soundMode === 'OUTSIDE' && relayStates['V5'] ? 'text-black' : 'text-vault-gold'}`}>OUTSIDE MATRIX</span><span className={`text-[10px] font-bold uppercase tracking-widest ${soundMode === 'OUTSIDE' && relayStates['V5'] ? 'text-black/60' : 'text-white/20'}`}>Virtual Pin V5</span></button>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{outsideVoices.map((v, i) => (<button key={i} onClick={() => handleTriggerMomentary(v.pin)} className={`py-4 rounded-xl border-2 font-display font-black uppercase text-[11px] transition-all active:scale-95 ${activeMomentaryPins[v.pin] ? 'bg-[#22c55e] border-white text-white' : 'bg-black/60 border-vault-gold/40 text-vault-gold hover:bg-vault-gold/10'}`}>{v.label}</button>))}</div>
                        </div>
                        <div className="flex flex-col gap-6">
                           <button onClick={() => handleToggleSoundRelay('INSIDE')} className={`group relative p-10 rounded-[2rem] border-4 transition-all duration-500 overflow-hidden flex flex-col items-center gap-4 active:scale-95 ${soundMode === 'INSIDE' && relayStates['V6'] ? 'bg-[#3b82f6] border-white shadow-[0_0_50px_rgba(59,130,246,0.4)]' : 'bg-black/40 border-[#3b82f6]/20 hover:border-[#3b82f6]/50'}`}><span className={`font-display font-black uppercase tracking-[0.4em] text-xl ${soundMode === 'INSIDE' && relayStates['V6'] ? 'text-white' : 'text-[#3b82f6]'}`}>INSIDE MATRIX</span><span className={`text-[10px] font-bold uppercase tracking-widest ${soundMode === 'INSIDE' && relayStates['V6'] ? 'text-white/60' : 'text-white/20'}`}>Virtual Pin V6</span></button>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{insideVoices.map((v, i) => (<button key={i} onClick={() => handleTriggerMomentary(v.pin)} className={`py-4 rounded-xl border-2 font-display font-black uppercase text-[11px] transition-all active:scale-95 ${activeMomentaryPins[v.pin] ? 'bg-[#22c55e] border-white text-white' : 'bg-black/60 border-[#3b82f6]/40 text-[#3b82f6] hover:bg-[#3b82f6]/10'}`}>{v.label}</button>))}</div>
                        </div>
                     </div>
                  </div>
                )}

                {(selectedDevice.profile === 'LED' || selectedDevice.profile === 'FOGGER' || selectedDevice.profile === 'LL') && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {(selectedDevice.profile === 'LED' ? ledPins : selectedDevice.profile === 'FOGGER' ? foggerPins : llPins).map((pin, i) => (
                       <button key={i} onClick={() => pin.isPersistent ? handleTogglePersistent(pin.subLabel) : handleTriggerMomentary(pin.subLabel)} className={`relative rounded-3xl border-4 p-8 flex flex-col items-center justify-center min-h-[160px] transition-all duration-300 active:scale-95 ${relayStates[pin.subLabel] || activeMomentaryPins[pin.subLabel] ? `${pin.activeColor} border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.2)]` : `bg-black/60 ${pin.borderColor} ${pin.textColor}`}`}><span className="text-[11px] font-display font-bold uppercase tracking-[0.3em] opacity-60 mb-2">{pin.subLabel}</span><span className="text-[18px] font-display font-black uppercase tracking-widest text-center leading-tight">{pin.label}</span></button>
                     ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-20"><svg className="w-24 h-24 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><p className="font-display text-xl uppercase tracking-[0.4em]">Select Node to Initialize Terminal</p></div>
            )}
          </div>
        </section>
      </div>

      {isNamingModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl">
           <div className="w-full max-w-2xl bg-vault-panel border-2 border-vault-gold rounded-3xl p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-display font-black text-vault-gold uppercase tracking-widest mb-6">Discovery Center</h3>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-display uppercase tracking-widest text-white/40 ml-1">Bluetooth Identification Prefix</label>
                  <input type="text" value={scanFilter} onChange={(e) => setScanFilter(e.target.value)} className="w-full bg-black/60 border-2 border-vault-gold/20 rounded-xl px-4 py-4 text-white font-display text-xl focus:border-vault-gold outline-none" placeholder="CKXR" />
                </div>

                <div className="h-px bg-white/10 w-full" />

                <div className="space-y-4">
                  <label className="text-[10px] font-display uppercase tracking-widest text-vault-alert ml-1">Manual Network Link (Target IP)</label>
                  <div className="flex gap-4">
                    <input type="text" value={manualIp} onChange={(e) => setManualIp(e.target.value)} className="flex-1 bg-black/60 border-2 border-vault-alert/30 rounded-xl px-4 py-4 text-white font-mono text-xl focus:border-vault-alert outline-none" placeholder="192.168.0.55" />
                    <button onClick={handleManualWiFiConnect} className="bg-vault-alert text-white px-8 py-4 rounded-xl font-display font-black uppercase text-sm hover:bg-white hover:text-vault-alert transition-all">UPLINK</button>
                  </div>
                </div>

                <div className="bg-vault-alert/10 border border-vault-alert/30 rounded-2xl p-6 space-y-4">
                  <h4 className="text-[11px] font-display font-black text-vault-alert uppercase tracking-widest">CRITICAL: Mixed Content Authorization</h4>
                  <p className="text-[11px] text-white/70 leading-relaxed uppercase italic">The browser blocks HTTP video streams on HTTPS sites. You MUST click below to authorize the route in a new tab first.</p>
                  <button 
                    onClick={() => window.open(`http://${piIp || PRIMARY_STATIC_IP}:8080/stream.mjpg`, '_blank')}
                    className="w-full py-3 bg-vault-alert text-white font-display font-black uppercase text-xs rounded-lg hover:bg-white hover:text-vault-alert transition-all"
                  >
                    1. AUTHORIZE STREAM ROUTE
                  </button>
                  <p className="text-[9px] text-white/40 italic">Wait for video to load in new tab, then return here.</p>
                </div>

                <div className="flex gap-4 pt-6">
                  <VaultButton onClick={() => setIsNamingModalOpen(false)} className="flex-1">Close System Hub</VaultButton>
                </div>
              </div>
           </div>
        </div>
      )}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.05] scanline"></div>
    </div>
  );
};
