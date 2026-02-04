
import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
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
          Privacy<span className="text-white">Protocol</span>
        </h1>

        <div className="w-full bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 space-y-10 shadow-2xl">
          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">1. Data Collection Architecture</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              CodeKrackerXR operates on a three-tier "Clearance Level" data collection model. We only collect the minimum information required for each stage of the hunt. Stage 1 (Enlisted) involves public social handles and basic identity. Stage 3 (Finalist) involves legal PII for prize distribution and taxation.
            </p>
          </section>

          <section className="space-y-4 border-l-2 border-vault-alert/40 pl-6">
            <h2 className="text-xl font-display font-bold text-vault-alert uppercase tracking-widest">2. Minor Protection & Guardian Firewall</h2>
            <p className="text-gray-400 leading-relaxed text-sm italic">
              In compliance with COPPA and GDPR-K, users under the age of 18 are automatically routed through the "Guardian Firewall." We do not store phone numbers for minors; instead, we require a verified Guardian Phone Number for all tactical "Drop" alerts and prize extraction logistics.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">3. Encryption Standards</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              All sensitive PII, including government-issued IDs for finalists, is encrypted using AES-256 standard before being committed to our high-scale database. Staff members cannot access raw Tax IDs or decrypted physical addresses without multi-factor legal authorization.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-display font-bold text-vault-gold uppercase tracking-widest">4. Third-Party Integration</h2>
            <p className="text-gray-300 leading-relaxed text-sm">
              This site utilizes YouTube API Services to verify Agent Handles and track mission progress. By using this site, you are also bound by the Google Privacy Policy (google.com/privacy). We do not sell your personal matrix data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-4 pt-6 border-t border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
              Last Updated: Summer 2026 Protocol | Protocol ID: CK-ALPHA-01
            </p>
          </section>
        </div>

        <VaultButton variant="primary" onClick={onBack} className="mt-12 px-12 py-5 text-lg">
          Acknowledge Protocol
        </VaultButton>
      </div>

      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
