
// Types definition file

export type AppView = 'LANDING' | 'AUTH' | 'YOUTUBER' | 'CODE_CIPHER' | 'CAESAR_CIPHER_WHEEL' | 'THE_HUNT' | 'THE_BREAK_IN' | 'LEVEL2_BREAK_IN' | 'YOUTUBE_PLAYERS' | 'VIGENERE' | 'LEADERBOARD' | 'USER_PROFILE' | 'HOW_TO_PLAY' | 'GAME_RULES' | 'REQUIREMENTS' | 'QUARTER_FINALS' | 'DIGITAL_COIN' | 'CONGRATS_CC' | 'PRIVACY_POLICY' | 'TERMS_OF_SERVICE' | 'COMMAND_CENTER' | 'GAME_PLAY_HUB' | 'GAMEPLAY_APP' | 'CODIE_CHAT' | 'THE_HUNT_TOOLS' | 'GP_DRILL' | 'GP_LISTENING_DEVICE' | 'GP_IMPACT_DRIVER' | 'GP_ENDO_SCOPE' | 'GP_STUD_FINDER' | 'GP_HEADPHONES' | 'GP_SPRAY_SMOKE' | 'GP_KEY1' | 'GP_KEY2' | 'GP_KEYS1' | 'GP_KEYS2' | 'GP_CODE_X_RING' | 'QUARTER_FINAL_READY' | 'FIND_ME' | 'MISSION_CENTRAL' | 'VOICE_OF_CODIE' | 'RPI5_ARCHIVE' |
  'CX_OPENING' | 'CX_M1' | 'CX_M2' | 'CX_M3' | 'CX_M4' | 'CX_M5' | 'CX_M6' | 'CX_M7' | 'CX_M8' | 'CX_M9' | 'CX_M10' | 'CX_M11' | 'CX_M12' | 'CX_M13' | 'CX_M14' | 'CX_VAULT';

export type ClearanceLevel = 1 | 2 | 3;

// Explicit Social Media Object - 12 Specific Platforms
export interface UserSocials {
  instagram?: string;
  linkedin?: string;
  x?: string;
  discord?: string;
  meta?: string;
  reddit?: string;
  snapchat?: string;
  telegram?: string;
  tiktok?: string;
  twitch?: string;
  wechat?: string;
  whatsapp?: string;
  youtube?: string; // Main platform for CKXR
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  ytHandle: string;
  over18Attested: boolean;
  clearanceLevel: ClearanceLevel;
  
  // Communication Prefs (Stage 1 & 2)
  emailOptIn: boolean;
  pushEnabled: boolean;
  smsOptIn: boolean;
  socials?: UserSocials;

  // Stage 2 Fields (Verified)
  dob?: string;
  countryCode?: string; // ISO-3
  region?: string; // State/Province/County
  isMinor?: boolean;
  
  // The Guardian Firewall
  guardianEmail?: string;
  guardianPhone?: string; 
  
  // Personal Contact (Level 2/3)
  phoneNumber?: string;
  phonePrefix?: string;
  
  // Stage 3 Fields (Finalist)
  legalFirstName?: string;
  legalLastName?: string;
  physicalAddress?: string;
  postalCode?: string;
  taxIdType?: string; // SSN, SIN, NI, etc.
  taxIdEncrypted?: string;
  hasPassport?: boolean;
  
  // Progress & Metadata
  verifiedHunts: string[]; 
  verifiedBreakIns: string[]; 
  totalPoints: number;
  bestTimeMs: number;
  agreedToRules: boolean;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}
