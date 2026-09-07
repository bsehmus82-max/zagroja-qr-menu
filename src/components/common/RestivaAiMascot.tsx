import React from 'react';

interface RestivaAiMascotProps {
  size?: number;
  className?: string;
}

/**
 * RestivAdisyon AI Mascot (Gastronomy Assistant with QR Apron)
 * A sleek, friendly restaurant employee character wearing a chef's apron with a QR code badge.
 */
export const RestivaAiMascot: React.FC<RestivaAiMascotProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`shrink-0 ${className}`}
    >
      <path
        d="M10 9.5C9 9.5 8 8.5 8 7C8 5.34 9.5 4 11.5 4C12.1 4 12.66 4.14 13.15 4.4C13.8 3.55 14.83 3 16 3C17.17 3 18.2 3.55 18.85 4.4C19.34 4.14 19.9 4 20.5 4C22.5 4 24 5.34 24 7C24 8.5 23 9.5 22 9.5H10Z"
        fill="#FFFFFF"
      />
      {/* Hat Brim */}
      <rect x="9" y="8.5" width="14" height="2" rx="1" fill="#E2E8F0" />

      {/* Head / Face */}
      <rect x="9.5" y="10" width="13" height="9" rx="4.5" fill="#F8FAFC" />
      
      {/* Cheerful Friendly Digital Eyes */}
      <circle cx="13" cy="13.5" r="1.25" fill="#0F172A" />
      <circle cx="19" cy="13.5" r="1.25" fill="#0F172A" />
      {/* Eye Sparkle */}
      <circle cx="13.4" cy="13.1" r="0.4" fill="#38BDF8" />
      <circle cx="19.4" cy="13.1" r="0.4" fill="#38BDF8" />
      {/* Smile */}
      <path
        d="M14.5 15.5C15 16.2 17 16.2 17.5 15.5"
        stroke="#0F172A"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Torso / Body with Restaurant Apron (Önlük) */}
      {/* Dark Body Base */}
      <path
        d="M7 29C7 22.5 10 19 16 19C22 19 25 22.5 25 29C25 29.55 24.55 30 24 30H8C7.45 30 7 29.55 7 29Z"
        fill="#1E293B"
      />

      {/* Apron (Önlük) - Clean crisp restaurant waiter apron */}
      <path
        d="M11 20L10 30H22L21 20H11Z"
        fill="#0F172A"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Apron Halter Strap */}
      <path
        d="M12 19L13 20M20 19L19 20"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Mini QR Code Emblem on Apron Chest */}
      {/* Top Left Finder */}
      <rect x="12.5" y="22" width="2.5" height="2.5" rx="0.5" fill="#38BDF8" />
      <rect x="13.25" y="22.75" width="1" height="1" fill="#0F172A" />
      
      {/* Top Right Finder */}
      <rect x="17" y="22" width="2.5" height="2.5" rx="0.5" fill="#38BDF8" />
      <rect x="17.75" y="22.75" width="1" height="1" fill="#0F172A" />
      
      {/* Bottom Left Finder */}
      <rect x="12.5" y="26" width="2.5" height="2.5" rx="0.5" fill="#38BDF8" />
      <rect x="13.25" y="26.75" width="1" height="1" fill="#0F172A" />

      {/* QR Data Dots */}
      <rect x="17" y="26" width="1" height="1" fill="#38BDF8" />
      <rect x="18.5" y="27.5" width="1" height="1" fill="#38BDF8" />
      <rect x="15.5" y="24" width="1" height="1" fill="#38BDF8" />
    </svg>
  );
};
