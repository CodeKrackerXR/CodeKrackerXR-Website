
import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface TermsOfServicePageProps {
  onBack: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-mesh opacity-20 pointer-events-none" />

      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBack} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-4xl flex flex-col items-center flex-1">
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-12 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          Agent<span className="text-white">Charter</span>
        </h1>

        <div className="w-full bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl">
          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">1. Acceptance of Operation</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              By accessing the CodeKrackerXR terminal, you agree to comply with this Agent Charter. This is a global "Game of Skill" competition. Any attempt to manipulate mission data, bypass ciphers via unauthorized automation, or falsify regional verification will result in immediate termination of your Agent Profile and forfeiture of all points.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">2. Intellectual Property</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              All visual assets, vault designs, AI logic (CODIE), and cryptographic wheels are the exclusive property of CodeKrackerXR. User-generated content submitted via the Social Matrix remains yours, but you grant us a perpetual license to display your Agent Alias on the Global Leaderboard.
            </p>
          </section>

          <section className="space-y-4 border-l-2 border-vault-alert/40 pl-6">
            <h2 className="text-xl font-display font-bold text-vault-alert uppercase tracking-widest">3. Limitation of Liability</h2>
            <p className="text-gray-400 leading-relaxed text-sm font-bold">
              WE ARE NOT LIABLE FOR TACTICAL FAILURES. Participation is at your own risk. CodeKrackerXR is not responsible for server lag, localized internet outages during "The Drop," or any physical injury sustained while pursuing the Crystal Cube in the real-world finale.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">4. Governing Jurisdiction</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              This charter is governed by the laws of the State of California, United States. Agents in specialized regions (e.g. Canada/Australia) must also pass a secondary Skill-Testing Question to comply with regional contest laws.
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-white/5">
             <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
              Agent Agreement v1.0 | Global Deployment Summer 2026
            </p>
          </section>
        </div>

        <VaultButton variant="primary" onClick={onBack} className="mt-12 px-12 py-5 text-lg">
          Agree to Charter
        </VaultButton>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
