import React from 'react';
import { X, Globe, ShieldCheck } from 'lucide-react';
import { Business } from '../../types';
import { FoodPlatformsManager } from '../business/FoodPlatformsManager';

interface FoodPlatformSuperAdminModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FoodPlatformSuperAdminModal: React.FC<FoodPlatformSuperAdminModalProps> = ({
  business,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !business) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#0C1017] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06] bg-[#111622]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C2433] flex items-center justify-center text-white border border-white/[0.08]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base text-white">
                  {business.name} — Yemek Platformları Kurulumu
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                  Superadmin Yönetimi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                İşletme adına Yemeksepeti, Trendyol, Getir ve Migros Yemek API anahtarlarını ve webhook bağlantılarını yapılandırın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#1C2433] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 scrollbar-none">
          <FoodPlatformsManager business={business} />
        </div>
      </div>
    </div>
  );
};
