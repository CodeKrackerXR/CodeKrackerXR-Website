import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

const CREATOR_DOC_ID = 'MasterCreatorFolder';
const AUTHORIZED_UID = '51H7yItLU9WMMiXl10xE';

const HIDING_ITEMS_LIST = [
  "Drill", "Listening Device", "Impact Driver", "EndoScope", "Stud Finder",
  "Headphones", "SpraySmoke", "Key 1 Solis", "Key 1 Noctis", "CodeX Ring"
];

interface TheHuntToolsPageProps {
  user: any;
  onBack: () => void;
  onNavigateToItem: (item: string) => void;
  onNavigateToHub?: (section?: string) => void;
  onNavigateToTheHunt: () => void;
  lastGPItem?: string | null;
}

export const TheHuntToolsPage: React.FC<TheHuntToolsPageProps> = ({ user, onBack, onNavigateToItem, onNavigateToHub, onNavigateToTheHunt, lastGPItem }) => {
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, seterror] = useState<string | null>(null);

  const isAuthorized = user?.uid === AUTHORIZED_UID;

  useEffect(() => {
    const fetchAllClues = async () => {
      if (!isAuthorized) {
        setLoading(false);
        return;
      }

      try {
        const creatorRef = doc(db, 'creators', CREATOR_DOC_ID);
        const snapshot = await getDoc(creatorRef);
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          const h10 = data?.TheHunt?.["Hunt 10 Items"] || {};
          const gpi = h10["Game Play Images"] || {};
          
          const mappedData = HIDING_ITEMS_LIST.map((item, index) => {
            // Mapping logic: The Hub saves "Key 1 Solis" data as "Key1" and "Key 1 Noctis" as "Key2"
            let dbKey = item.replace(/\s+/g, '');
            if (item === "Key 1 Solis") dbKey = "Key1";
            if (item === "Key 1 Noctis") dbKey = "Key2";

            return {
              id: index + 1,
              name: item,
              clue: h10[`${dbKey}Clue`] || "",
              notes: h10[`${dbKey}FilmingNotes`] || "No filming notes logged.",
              image: gpi[`GP${dbKey}Image`] || null
            };
          });

          setItemsData(mappedData);
        } else {
          seterror("DATABASE_OFFLINE");
        }
      } catch (err: any) {
        console.error("Clue Fetch Error:", err?.message || err);
        seterror("NEURAL_LINK_FAILURE");
      } finally {
        setLoading(false);
      }
    };

    fetchAllClues();
  }, [isAuthorized]);

  const handleReturnToHunt = () => {
    onNavigateToTheHunt();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-display">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-vault-gold border-t-transparent rounded-full animate-spin"></div>
          <div className="text-vault-gold animate-pulse tracking-[0.5em] uppercase text-xs">Accessing Intel...</div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-vault-alert/10 rounded-full flex items-center justify-center mb-8 border-2 border-vault-alert">
           <svg className="w-10 h-10 text-vault-alert" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-3xl font-display font-black text-vault-alert uppercase tracking-widest mb-4">Unauthorized Access</h1>
        <VaultButton variant="secondary" onClick={onBack} className="mt-8">Return</VaultButton>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-display font-black text-vault-gold uppercase tracking-widest mb-4">Data Link Error</h1>
        <p className="text-white/40 font-mono text-[10px] uppercase">{error}</p>
        <VaultButton onClick={onBack} className="mt-8">Retry</VaultButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button 
          onClick={onBack} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
          aria-label="Back"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 max-w-6xl flex flex-col items-center flex-1">
        <h1 className="text-3xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-16 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          The Hunt <span className="text-white">Tools</span>
        </h1>

        <div className="w-full">
          <div className="flex flex-col gap-4 mb-20">
            {itemsData.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => onNavigateToItem(item.name)}
                className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 p-3 md:p-5 bg-vault-panel/40 backdrop-blur-md border border-white/5 rounded-2xl transition-all duration-300 group shadow-xl animate-[fadeInUp_0.6s_ease-out_forwards] opacity-0 cursor-pointer hover:border-vault-gold/40 hover:bg-vault-panel/60 overflow-hidden"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-center gap-3 md:gap-6 flex-1 w-full min-w-0">
                  <div className="flex-shrink-0 flex items-center gap-3 md:gap-6">
                    <span className="font-display font-black text-2xl md:text-5xl w-8 md:w-12 text-center drop-shadow-lg transition-colors duration-300 text-white/20 group-hover:text-white">
                      {item.id}
                    </span>
                    <div className="w-14 h-14 md:w-24 md:h-24 rounded-xl border-2 border-vault-gold p-0.5 overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-full bg-black/60 flex items-center justify-center rounded-lg text-white/10">
                           <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row items-center justify-between flex-1 gap-2 md:gap-6 min-w-0">
                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <h3 className="font-display font-black text-sm md:text-2xl uppercase tracking-wider text-white group-hover:text-vault-gold transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="font-sans text-[10px] md:text-base text-white/60 group-hover:text-white/80 transition-colors line-clamp-1 md:line-clamp-2 italic mt-0.5 md:mt-1">
                        {item.notes}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right ml-1">
                       <span className="font-display font-black text-2xl md:text-5xl text-vault-gold uppercase drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                         {item.clue || "?"}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 mt-12 mb-24 relative z-50">
             <VaultButton 
               variant="secondary" 
               onClick={handleReturnToHunt} 
               className="w-full md:w-auto px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
             >
               Return to Hunt
             </VaultButton>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | CREATOR INTEL CORE
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
