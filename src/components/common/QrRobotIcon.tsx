import React from 'react';

interface QrRobotIconProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}

/**
 * RestivAdisyon AI Master Logo:
 * - Google Gemini & Wix AI standartlarında, lüks çift 4-noktalı zeka parıltısı (Gemini Sparkles)
 * - Hem büyük yıldız hem de sağ üstteki uydu yıldız birebir aynı keskin, kavisli, zarif 4-nokta geometriye sahiptir.
 * - 22px ve 24px Lucide React stroke standartlarıyla %100 uyumlu, pürüzsüz ve ultra nettir.
 */
export const QrRobotIcon: React.FC<QrRobotIconProps> = ({
  size = 22,
  className = '',
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* 1. Ana Büyük Gemini Zeka Yıldızı */}
      <path d="M10.5 3.5C10.5 8.5 6.5 12.5 1.5 12.5C6.5 12.5 10.5 16.5 10.5 21.5C10.5 16.5 14.5 12.5 19.5 12.5C14.5 12.5 10.5 8.5 10.5 3.5Z" />

      {/* 2. Sağ Üst Küçük Keskin Gemini Zeka Yıldızı */}
      <path d="M18.5 1.5C18.5 3.7 16.7 5.5 14.5 5.5C16.7 5.5 18.5 7.3 18.5 9.5C18.5 7.3 20.3 5.5 22.5 5.5C20.3 5.5 18.5 3.7 18.5 1.5Z" />
    </svg>
  );
};


