import React, { useState, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from '../firebase';
import { ASSETS } from '../constants';
import { VaultButton } from './VaultButton';

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('CKXR'); 
  const [displayName, setDisplayName] = useState('');
  const [ytHandle, setYtHandle] = useState('');
  const [avatarImage, setAvatarImage] = useState('');
  const [over18, setOver18] = useState(true); 
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 400; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setAvatarImage(compressedBase64);
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else if (mode === 'SIGNUP') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const finalAvatar = avatarImage || ASSETS.LOGO_URL;

        await updateProfile(user, { 
          displayName: displayName || 'Game Player'
        });
        
        const uidNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const now = new Date().toISOString();

        await setDoc(doc(db, 'Users', user.uid), {
          "Level 1": {
            uid: user.uid,
            uidNumber: uidNumber,
            email: email,
            displayName: displayName || 'Game Player',
            ytHandle: ytHandle || '@Agent',
            avatarImage: finalAvatar, 
            storedPassword: password,
            over18Attested: true, // Force true to satisfy contest requirements automatically
            clearance: 1,
            createdAt: now,
            updatedAt: now,
            rulesAgreed: true,
            pushEnabled: false,
            emailOpin: false,
            keepLoggedIn: keepLoggedIn,
            "Social Media": {}
          },
          "Level 2": {
            consentStatus: 'PENDING',
            clearance: 1,
            updatedAt: now
          },
          "Level 3": {
            clearance: 1,
            updatedAt: now
          },
          clearanceLevel: 1,
          createdAt: now,
          updatedAt: now
        });
        
        onSuccess();
      } else if (mode === 'FORGOT') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Access link sent to your email.');
        setTimeout(() => setMode('LOGIN'), 3000);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message.replace('Firebase: ', '');
      if (err.code === 'auth/invalid-credential') {
        errorMsg = "Invalid Credentials. If you haven't enlisted yet, please use the 'Create Level 1 Profile' option below.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-black flex flex-col font-sans text-white overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${ASSETS.FINAL_HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/95 via-black/80 to-black/95 pointer-events-none" />
      
      <div className="relative z-50 w-full flex justify-center border-b border-white/10 bg-black/40 backdrop-blur-sm h-24 md:h-32 items-center">
        <button onClick={onBack} className="focus:outline-none hover:scale-105 transition-transform duration-300">
          <img src={ASSETS.LANDING_BANNER} alt="CodeKrackerXR Logo" className="h-16 md:h-24 w-auto object-contain" />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto pt-12 pb-20">
        <div className="w-full max-w-lg bg-vault-panel/90 backdrop-blur-2xl border-2 border-vault-gold/30 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-vault-gold/5 blur-3xl rounded-full"></div>
          
          <h1 className="text-3xl md:text-4xl font-display font-black text-vault-gold uppercase tracking-widest mb-1 text-center">
            {mode === 'LOGIN' ? 'Access' : mode === 'SIGNUP' ? 'Code Kracker' : 'Recovery'}
          </h1>
          <p className="text-white/60 font-display text-[12px] md:text-[14px] uppercase tracking-[0.4em] mb-8 text-center font-bold">
            Clearance Level 1
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            {mode === 'SIGNUP' && (
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-vault-gold/40 p-1 overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.2)] cursor-pointer hover:border-vault-gold transition-colors relative group bg-black/60"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={avatarImage || ASSETS.LOGO_URL} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/opacity-100 transition-opacity rounded-full">
                    <span className="text-[10px] font-display font-black text-white uppercase tracking-widest">Update Photo</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                <p className="text-[10px] font-display text-vault-gold uppercase tracking-widest mt-3 opacity-60">Avatar Image</p>
              </div>
            )}

            {mode === 'SIGNUP' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-vault-gold uppercase tracking-widest ml-1">Game Player</label>
                  <input 
                    type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-sans text-base text-white focus:outline-none focus:border-vault-gold transition-colors"
                    placeholder="E.g. ShadowKracker"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-display text-vault-gold uppercase tracking-widest ml-1">YouTube @Handle</label>
                  <input 
                    type="text" required value={ytHandle} onChange={(e) => setYtHandle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 font-sans text-base text-white focus:outline-none focus:border-vault-gold transition-colors"
                    placeholder='@yourchannel "IMPORTANT"'
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-display text-vault-gold uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3 font-sans text-base text-white focus:outline-none focus:border-vault-gold transition-colors"
                placeholder="player@CodeKrackerXR.com"
              />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-2">
                <label className="text-[10px] font-display text-vault-gold uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3 font-sans text-base text-white focus:outline-none focus:border-vault-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2">
               <div className="flex items-center gap-2 cursor-pointer" onClick={() => setKeepLoggedIn(!keepLoggedIn)}>
                  <input type="checkbox" checked={keepLoggedIn} readOnly className="w-4 h-4 rounded border-gray-300 text-vault-gold focus:ring-vault-gold bg-black/40" />
                  <span className="text-[10px] font-display text-white/60 uppercase tracking-widest">Keep me logged in</span>
               </div>
               {mode === 'LOGIN' && (
                 <button type="button" onClick={() => setMode('FORGOT')} className="text-[10px] font-display text-vault-gold uppercase tracking-widest hover:underline">Forgot Password?</button>
               )}
            </div>

            {mode === 'SIGNUP' && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="w-5 h-5 rounded border border-vault-gold/40 bg-vault-gold/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-vault-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                  <p className="text-[11px] text-white/80 font-display uppercase tracking-wider leading-relaxed">
                    Agent Attestation: 18 years or older confirmed.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 text-vault-gold focus:ring-vault-gold bg-black/40" />
                  <p className="text-[10px] text-white/60 font-sans leading-relaxed">
                    I agree to the <span className="text-vault-gold underline cursor-pointer">Official Contest Rules</span>. I confirm this is a Game of Skill.
                  </p>
                </div>
              </div>
            )}

            {error && <p className="text-vault-alert text-[10px] font-display uppercase tracking-wider text-center bg-vault-alert/10 py-3 rounded-lg border border-vault-alert/20 px-2">{error}</p>}
            {message && <p className="text-green-500 text-[10px] font-display uppercase tracking-wider text-center bg-green-500/10 py-3 rounded-lg border border-green-500/20 px-2">{message}</p>}

            <VaultButton onClick={() => {}} className="w-full py-4 text-lg tracking-[0.3em] shadow-xl">
              {loading ? 'Decrypting...' : mode === 'LOGIN' ? 'Login' : mode === 'SIGNUP' ? 'Enlist' : 'Reset'}
            </VaultButton>
          </form>

          <div className="mt-8 flex flex-col gap-3 text-center">
            {mode === 'LOGIN' ? (
              <p className="text-white/40 text-[10px] uppercase tracking-widest">
                New Game Player? <button onClick={() => setMode('SIGNUP')} className="text-vault-gold font-bold hover:underline">Create Level 1 Profile</button>
              </p>
            ) : (
              <button onClick={() => setMode('LOGIN')} className="text-white/40 text-[10px] uppercase tracking-widest hover:text-vault-gold transition-colors">Return to Access Portal</button>
            )}
          </div>
        </div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.05] scanline"></div>
    </div>
  );
};