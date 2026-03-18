import React from 'react';

export interface CustomizationOptions {
  // Typography
  globalFont?: string;
  profileFont?: string;
  fontScale?: number; // 0.8 to 1.5
  
  // Username Styling
  usernameColor?: string;
  usernameGradient?: {
    from: string;
    to: string;
    direction: string; // 'to right', 'to bottom', etc.
  };
  usernameGlow?: {
    color: string;
    intensity: number; // 0 to 20
  };
  usernameAnimation?: 'none' | 'neon-flicker' | 'float' | 'bounce' | 'spin-slow' | 'color-cycle' | 'text-reveal';
  
  // Profile Styling
  profileBgType?: 'color' | 'gradient' | 'image' | 'animated';
  profileBgValue?: string; // Hex, CSS gradient, or URL
  profileBgAnimation?: string; // 'mesh', 'stars', 'waves', etc.
  
  // Under-banner background (the part underneath the banner)
  subBannerBg?: string;
  subBannerGradient?: string;
  
  // Borders
  profileBorderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  profileBorderColor?: string;
  profileBorderWidth?: number;
  profileBorderGlow?: {
    color: string;
    intensity: number; // 0 to 20
  };
  profileBorderRadius?: number;
  
  // Music
  profileMusicUrl?: string;
  profileMusicTitle?: string;
  profileMusicAutoPlay?: boolean;
  
  // Badges & Effects
  nitroBadge?: boolean;
  profileEffect?: 'none' | 'confetti' | 'snow' | 'fireworks' | 'glitch';
  
  // Custom CSS (for the "better than nitro" feel)
  customCss?: string;
}

export const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  profileFont: 'Inter',
  fontScale: 1,
  usernameColor: '#ffffff',
  usernameAnimation: 'none',
  profileBgType: 'color',
  profileBgValue: 'rgba(255,255,255,0.05)',
  profileBorderStyle: 'none',
  profileBorderWidth: 1,
  profileBorderRadius: 16,
  profileBorderGlow: { color: '#ffffff', intensity: 0 },
};

export const getUsernameStyles = (custom?: CustomizationOptions) => {
  if (!custom) return {};
  
  const styles: React.CSSProperties = {
    color: custom.usernameColor || '#ffffff',
    fontFamily: custom.profileFont || 'inherit',
  };
  
  if (custom.usernameGlow && custom.usernameGlow.intensity > 0) {
    styles.textShadow = `0 0 ${custom.usernameGlow.intensity}px ${custom.usernameGlow.color || custom.usernameColor || '#ffffff'}`;
  }
  
  return styles;
};

export const getProfileStyles = (custom?: CustomizationOptions) => {
  if (!custom) return {};
  
  const styles: React.CSSProperties = {
    borderRadius: `${custom.profileBorderRadius ?? 16}px`,
    borderStyle: custom.profileBorderStyle || 'none',
    borderColor: custom.profileBorderColor || 'rgba(255,255,255,0.1)',
    borderWidth: `${custom.profileBorderWidth ?? (custom.profileBorderStyle && custom.profileBorderStyle !== 'none' ? 1 : 0)}px`,
  };
  
  if (custom.profileBgType === 'color') {
    styles.backgroundColor = custom.profileBgValue || 'rgba(255,255,255,0.05)';
  } else if (custom.profileBgType === 'gradient') {
    styles.background = custom.profileBgValue;
  } else if (custom.profileBgType === 'image') {
    styles.backgroundImage = `url(${custom.profileBgValue})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
  }
  
  if (custom.profileBorderGlow && custom.profileBorderGlow.intensity > 0) {
    styles.boxShadow = `0 0 ${custom.profileBorderGlow.intensity}px ${custom.profileBorderGlow.color || 'rgba(255,255,255,0.5)'}`;
  }
  
  return styles;
};

export const getGlobalStyles = (custom?: CustomizationOptions) => {
  if (!custom) return {};
  
  return {
    fontSize: `${(custom.fontScale || 1) * 100}%`,
  };
};

export const getMessageStyles = (custom?: CustomizationOptions) => {
  if (!custom) return {};
  
  return {
    fontFamily: custom.profileFont || 'inherit',
  };
};
