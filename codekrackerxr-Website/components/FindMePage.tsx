import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

const CREATOR_DOC_ID = 'MasterCreatorFolder';
const HIDING_ITEMS_LIST = [
  "Drill", "Listening Device", "Impact Driver", "EndoScope", "Stud Finder",
  "Headphones", "SpraySmoke", "Key 1 Solis", "Key 1 Noctis", "CodeX Ring"
];

interface FindMePageProps {
  onNavigateToHunt: () => void;
  user: any;
  onNavigateToItem: (item: string) => void;
}

export const FindMePage: React.FC<FindMePageProps> = ({ onNavigateToHunt, user, onNavigateToItem }) => {
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [directions, setDirections] = useState<string>('');
  const [showTrackerAlert, setShowTrackerAlert] = useState<{show: boolean, itemName: string}>({ show: false, itemName: '' });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch items for the dropdown including clues and GPS data
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
        const snapshot = await getDoc(creatorRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const h10 = data?.TheHunt?.["Hunt 10 Items"] || {};
          const gpi = h10["Game Play Images"] || {};
          
          const mappedData = HIDING_ITEMS_LIST.map((item, index) => {
            let dbKey = item.replace(/\s+/g, '');
            if (item === "Key 1 Solis") dbKey = "Key1";
            if (item === "Key 1 Noctis") dbKey = "Key2";

            return {
              id: index + 1,
              name: item,
              clue: h10[`${dbKey}Clue`] || "",
              gps: h10[`${dbKey}GPS`] || "",
              image: gpi[`GP${dbKey}Image`] || null
            };
          });
          setItemsData(mappedData);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    fetchItems();
  }, []);

  // Geolocation logic
  useEffect(() => {
    if (trackingEnabled) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserLocation(null);
    }
  }, [trackingEnabled]);

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
    if (trackingEnabled) setDirections('');
  };

  const handleGoFind = (e: React.MouseEvent, item: any) => {
    e.stopPropagation(); 
    if (!trackingEnabled) {
      setShowTrackerAlert({ show: true, itemName: item.name });
      return;
    }

    setIsDropdownOpen(false);
    
    // For now, use the specific copy requested for directions
    setDirections(`Walk .2 miles to the end of your street, Saint Andrews Court. Turn right on Clubhouse Drive and walk .5 miles. Turn left into the parking lot when you see Discovery Bay Golf and Country Club. Look in the flower bed next to the flag pole for the ${item.name}`);
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-y-auto scrollbar-hide">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-mesh opacity-30 pointer-events-none" />

      {/* Header with Clickable Logo */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/60 backdrop-blur-md h-24 md:h-32 items-center px-4 flex-shrink-0">
        <button 
          onClick={onNavigateToHunt}
          className="focus:outline-none hover:scale-105 transition-transform duration-300 active:scale-95"
          aria-label="Navigate to The Hunt"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      {/* Main Content Area - pb-32 ensures content isn't hidden by the closed drawer */}
      <div className="relative z-10 flex flex-col items-center p-4 pb-32">
        {/* Map View Area */}
        <div 
          ref={mapContainerRef}
          className="w-full h-[50vh] md:h-[60vh] max-w-6xl bg-vault-panel/80 rounded-3xl border-2 border-vault-gold/40 shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden flex items-center justify-center group mb-6 flex-shrink-0"
        >
          {/* Map Simulation / Visual */}
          <div className="absolute inset-0 z-0">
             <div className="w-full h-full bg-[#111] opacity-50 flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
                   {Array.from({length: 144}).map((_, i) => (
                     <div key={i} className="border border-vault-gold/20" />
                   ))}
                </div>
                {/* Visual radar animation */}
                {trackingEnabled && (
                  <div className="relative">
                    <div className="w-64 h-64 border-2 border-vault-gold/30 rounded-full animate-ping opacity-20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-vault-gold rounded-full shadow-[0_0_20px_#d4af37] animate-pulse" />
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Map UI Overlays */}
          <div className="relative z-10 text-center space-y-6 px-4">
            {!trackingEnabled ? (
              <div className="animate-fadeInUp">
                <h2 className="text-2xl md:text-4xl font-display font-black text-white uppercase tracking-widest mb-4">Tracking Offline</h2>
                <p className="text-vault-gold/60 font-mono text-sm uppercase tracking-[0.2em] mb-8">Initialize neural link to locate mission assets</p>
                <VaultButton onClick={toggleTracking} className="px-12 py-5 text-xl tracking-[0.3em] shadow-2xl">
                  Turn On Tracker
                </VaultButton>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="bg-black/60 backdrop-blur-xl border border-vault-gold/40 p-6 rounded-2xl shadow-2xl">
                   <div className="flex flex-col gap-2">
                      <span className="text-vault-gold font-display font-black text-xs uppercase tracking-widest animate-pulse">Uplink Active</span>
                      <div className="text-2xl md:text-4xl font-mono text-white tracking-widest">
                        {userLocation ? `${userLocation.lat.toFixed(4)}°N | ${userLocation.lng.toFixed(4)}°W` : 'CALIBRATING...'}
                      </div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2 italic">Scanning for local discrepancies in the matrix</p>
                   </div>
                </div>
                <button 
                  onClick={toggleTracking}
                  className="mt-8 text-vault-alert font-display font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
                >
                  Terminate Uplink
                </button>
              </div>
            )}
          </div>
          <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] scanline" />
        </div>

        {/* Directions Text Box */}
        <div className="w-full max-w-6xl animate-[fadeInUp_0.5s_ease-out] flex-shrink-0">
          <div className="bg-vault-panel/60 backdrop-blur-md border border-vault-gold/20 rounded-2xl p-6 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden group hover:border-vault-gold/40 transition-all min-h-[140px] flex items-center justify-center">
             {!directions ? (
               <p className="text-white/20 font-display font-black uppercase tracking-[0.2em] text-sm md:text-lg text-center">Awaiting Destination Selection...</p>
             ) : (
               <div className="flex flex-col items-center gap-4 md:gap-6">
                 <span className="text-[10px] md:text-xs font-display text-vault-gold uppercase tracking-[0.4em] font-black opacity-60">Mission Guidance</span>
                 <p className="text-white font-sans text-lg md:text-4xl lg:text-5xl text-center leading-tight md:leading-snug lg:leading-relaxed italic animate-fadeIn px-2 md:px-6 max-w-5xl">
                    "{directions}"
                 </p>
               </div>
             )}
             <div className="absolute inset-0 pointer-events-none opacity-[0.02] scanline" />
          </div>
        </div>
      </div>

      {/* Bottom Dropdown Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-vault-panel/95 backdrop-blur-2xl border-t-2 border-vault-gold/40 rounded-t-[2.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] transition-all duration-500 ease-out ${
          isDropdownOpen ? 'translate-y-0' : 'translate-y-[calc(100%-80px)]'
        }`}
      >
        {/* Handle bar */}
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex flex-col items-center pt-4 pb-8 group"
        >
          <div className="w-12 h-1.5 bg-vault-gold/40 rounded-full group-hover:bg-vault-gold transition-colors" />
          <span className="text-[14px] md:text-[18px] font-display font-black text-vault-gold uppercase tracking-[0.4em] mt-4 group-hover:text-white transition-colors">
            Tools to be Found
          </span>
        </button>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-2 md:px-6 pb-12 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-3">
            {itemsData.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => onNavigateToItem(item.name)}
                className="flex items-center justify-between p-2 md:p-3 bg-black/40 border border-white/5 rounded-2xl transition-all group cursor-pointer hover:border-vault-gold/60 hover:bg-vault-gold/5 shadow-lg active:scale-[0.99] w-full overflow-hidden"
              >
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                  <span className="font-display font-black text-lg md:text-3xl text-white/20 group-hover:text-white transition-colors w-6 md:w-10 text-center flex-shrink-0">
                    {idx + 1}
                  </span>

                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl border border-vault-gold/20 overflow-hidden bg-black flex-shrink-0 group-hover:border-vault-gold/40 transition-colors">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12px] md:text-[20px] font-display font-black text-white uppercase tracking-wider truncate group-hover:text-vault-gold transition-colors">
                      {item.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
                  <div className="flex flex-col items-center flex-shrink-0 min-w-[32px] md:min-w-[48px]">
                    <span className="font-display font-black text-base md:text-3xl text-vault-gold drop-shadow-[0_0_100px_rgba(212,175,55,0.3)]">
                      {item.clue || "-"}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => handleGoFind(e, item)}
                    className="px-3 md:px-6 py-1.5 md:py-2 bg-white text-black font-display font-black uppercase text-[9px] md:text-[12px] tracking-widest rounded-lg hover:bg-vault-gold hover:text-black transition-all active:scale-95 shadow-lg border border-transparent whitespace-nowrap"
                  >
                    Go find
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracker Alert Modal */}
      {showTrackerAlert.show && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-sm bg-vault-panel border-2 border-vault-alert p-10 rounded-3xl text-center relative overflow-hidden shadow-[0_0_80px_rgba(255,51,51,0.2)]">
             <div className="mb-6">
                <svg className="w-16 h-16 text-vault-alert mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h3 className="text-xl font-display font-black text-white uppercase tracking-widest mb-4 leading-tight">Neural Link Required</h3>
             <p className="text-vault-gold font-sans text-lg mb-8 leading-relaxed italic">
               "Turn on your Tracker to find the {showTrackerAlert.itemName}"
             </p>
             <VaultButton 
               onClick={() => setShowTrackerAlert({ show: false, itemName: '' })}
               className="w-full py-4 text-sm bg-vault-alert text-white border-vault-alert hover:bg-white hover:text-black"
             >
               Acknowledge Protocol
             </VaultButton>
             <div className="absolute inset-0 pointer-events-none opacity-[0.05] scanline" />
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.05] scanline" />
    </div>
  );
};
