
import React from 'react';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface RequirementsPageProps {
  onBack: () => void;
  onNavigateToPlayers: () => void;
}

export const RequirementsPage: React.FC<RequirementsPageProps> = ({ onBack, onNavigateToPlayers }) => {
  return (
    <div className="min-h-screen w-full relative bg-black overflow-x-hidden flex flex-col font-sans text-white">
      {/* Background Atmosphere */}
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

      {/* Header Logo */}
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button 
          onClick={onBack} 
          className="focus:outline-none hover:scale-105 transition-transform duration-300"
          aria-label="Back"
        >
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-5xl flex flex-col items-center flex-1">
        {/* Centered Headline */}
        <h1 className="text-4xl md:text-6xl font-display font-black text-vault-gold uppercase tracking-[0.2em] mb-12 text-center drop-shadow-[0_0_20px_rgba(212,175,55,0.3)] animate-[fadeInDown_0.8s_ease-out]">
          Agent<span className="text-white">Protocols</span>
        </h1>

        <div className="w-full space-y-12 mb-20">
          
          {/* Section 1: The Social Media Matrix */}
          <section className="bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] opacity-0 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 border-b border-vault-gold/20 pb-4">
              Agent Social Matrix
            </h2>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
              <p>To participate in the global leaderboard, agents must link at least one primary social handle. Our system supports deep-indexing for 12 platforms:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-display uppercase tracking-widest text-vault-gold/80">
                <span>• Instagram</span><span>• LinkedIn</span><span>• X (Twitter)</span><span>• Discord</span>
                <span>• Meta</span><span>• Reddit</span><span>• Snapchat</span><span>• Telegram</span>
                <span>• TikTok</span><span>• Twitch</span><span>• WeChat</span><span>• WhatsApp</span>
              </div>
              <p className="text-sm italic mt-4 text-white/40">Note: Linking additional platforms increases Agent Visibility and enables specialized "Drop" missions tailored to specific platform audiences.</p>
            </div>
          </section>

          {/* Section 2: Clearance Level Data Buckets */}
          <section className="bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards] opacity-0 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 border-b border-vault-gold/20 pb-4">
              Clearance Level Requirements
            </h2>
            <div className="space-y-8">
              <div className="border-l-2 border-green-500/30 pl-6">
                <h4 className="text-green-400 font-display font-black uppercase tracking-widest text-lg">Level 1: Enlisted</h4>
                <p className="text-gray-400 text-sm">Requires: Valid Email, Display Alias, and YouTube Handle. Unlocks: Basic Leaderboard access and "The Hunt" progress tracking.</p>
              </div>
              <div className="border-l-2 border-vault-gold/30 pl-6">
                <h4 className="text-vault-gold font-display font-black uppercase tracking-widest text-lg">Level 2: Verified</h4>
                <p className="text-gray-400 text-sm">Requires: Date of Birth, ISO-3 Country Code, and Region. Unlocks: SMS Gateway Alerts and regional prize eligibility. Agents under 18 trigger the <strong>Guardian Firewall</strong> protocol.</p>
              </div>
              <div className="border-l-2 border-vault-alert/30 pl-6">
                <h4 className="text-vault-alert font-display font-black uppercase tracking-widest text-lg">Level 3: Finalist</h4>
                <p className="text-gray-400 text-sm">Requires: Legal Name, AES-256 Encrypted Tax ID, and Physical Address. Unlocks: Grand Finale extraction logistics and cash prize distribution.</p>
              </div>
            </div>
          </section>

          {/* Section 3: The Guardian Firewall (Legal Compliance) */}
          <section className="bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards] opacity-0 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 border-b border-vault-gold/20 pb-4">
              The Guardian Firewall
            </h2>
            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
              <p>In strict compliance with <strong>COPPA (US)</strong> and <strong>GDPR-K (EU)</strong>, CodeKrackerXR implements an automated air-gap for minors:</p>
              <ul className="space-y-4 text-sm font-sans">
                <li className="flex gap-4">
                  <span className="text-vault-gold font-bold">A.</span>
                  <span><strong>Guardian Proxy:</strong> All SMS alerts for minors are routed to a verified legal guardian's mobile device. Direct SMS contact with minors is prohibited.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-vault-gold font-bold">B.</span>
                  <span><strong>The CC Protocol:</strong> Every mission-critical email sent to a minor agent is automatically CC'd to the registered Guardian Email address.</span>
                </li>
                <li className="flex gap-4">
                  <span className="text-vault-gold font-bold">C.</span>
                  <span><strong>Right to Erasure:</strong> Guardians retain the absolute right to request immediate deletion of a minor's data at any point during the competition.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4: Global Game Fairness */}
          <section className="bg-vault-panel/60 backdrop-blur-xl border border-vault-gold/20 rounded-3xl p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out_0.5s_forwards] opacity-0 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-widest mb-6 border-b border-vault-gold/20 pb-4">
              Global Sync & Fairness
            </h2>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
              <p><span className="text-vault-gold font-bold">• Millisecond Precision:</span> Selection for the 20 semi-finalist spots is determined by server-side timestamps. Disputes are resolved via high-resolution logs.</p>
              <p><span className="text-vault-gold font-bold">• Language Parity:</span> While missions are released in English, all ciphers are designed with universal logic to ensure players in non-English speaking regions (ISO-JPN, ISO-DEU, etc.) have equal competitive standing.</p>
              <p><span className="text-vault-gold font-bold">• "Game of Skill" (Canada/Australia):</span> Jurisdictions requiring a "Math Test" or "Secondary Skill Query" will receive an automated follow-up challenge via the Level 2 Verification gateway.</p>
            </div>
          </section>

          {/* Section 5: Legal Disclaimers */}
          <section className="bg-vault-panel/60 backdrop-blur-xl border-2 border-vault-alert/20 rounded-3xl p-8 md:p-12 animate-[fadeInUp_0.6s_ease-out_0.6s_forwards] opacity-0 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24 text-vault-alert" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-vault-alert uppercase tracking-widest mb-6">Mandatory Legal Notices</h2>
            <div className="space-y-4 text-gray-400 text-xs font-sans leading-relaxed">
              <p>1. <strong>YouTube Disclaimer:</strong> This competition is not affiliated with YouTube, LLC. YouTube is not a sponsor and bears no liability for the conduct or outcome of the CodeKrackerXR challenge.</p>
              <p>2. <strong>Taxation:</strong> Winners are responsible for all international, federal, and state taxes. Level 3 Agents must provide valid tax documentation before prizes are disbursed.</p>
              <p>3. <strong>Data Encryption:</strong> All sensitive PII (Tax IDs, Addresses) is stored using AES-256 standard encryption. CodeKrackerXR staff cannot view full Tax IDs after initial encryption.</p>
            </div>
          </section>

        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col items-center gap-6 mt-4 mb-24 relative z-50 w-full max-w-md">
           <VaultButton 
             variant="primary" 
             onClick={onBack} 
             className="w-full px-16 py-6 text-xl tracking-[0.3em] shadow-xl"
           >
             Protocol Accepted
           </VaultButton>
           <VaultButton 
             variant="secondary" 
             onClick={onNavigateToPlayers} 
             className="w-full px-16 py-6 text-xl tracking-[0.3em] bg-black/40 shadow-xl border-2"
           >
             Return to Roster
           </VaultButton>
        </div>
      </div>

      <div className="relative z-20 w-full py-8 text-center border-t border-white/10 bg-black/60 mt-auto">
        <p className="font-display text-xs text-white uppercase tracking-widest opacity-40">
           &copy; 2026 CODE KRACKER XR | AGENT COMPLIANCE MODULE
        </p>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};
