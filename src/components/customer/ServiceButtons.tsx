import React, { useState } from 'react';
import { BellRing, Receipt, Wifi, CheckCircle2, CreditCard, Banknote, X } from 'lucide-react';

interface ServiceButtonsProps {
  tableNumber: number;
  onCallWaiter: () => void;
  onRequestBill: (paymentType: 'cash' | 'credit_card') => void;
  onOpenWifi: () => void;
  hasWifi?: boolean;
}

export const ServiceButtons: React.FC<ServiceButtonsProps> = ({
  tableNumber,
  onCallWaiter,
  onRequestBill,
  onOpenWifi,
  hasWifi = true,
}) => {
  const [showBillModal, setShowBillModal] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [billRequested, setBillRequested] = useState(false);

  const handleWaiterClick = () => {
    onCallWaiter();
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  const handleBillSelect = (type: 'cash' | 'credit_card') => {
    onRequestBill(type);
    setShowBillModal(false);
    setBillRequested(true);
    setTimeout(() => setBillRequested(false), 5000);
  };

  return (
    <>
      <div className={`grid ${hasWifi ? 'grid-cols-3' : 'grid-cols-2'} gap-2 px-3 py-2 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 my-2`}>
        {/* Garson Çağır */}
        <button
          onClick={handleWaiterClick}
          disabled={waiterCalled}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
            waiterCalled
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'hover:bg-slate-800 active:scale-95 text-slate-200'
          }`}
        >
          {waiterCalled ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
          ) : (
            <BellRing className="w-5 h-5 text-amber-400 mb-1 animate-pulse-subtle" />
          )}
          <span className="text-[11px] font-semibold">
            {waiterCalled ? 'Garson Geliyor' : 'Garson Çağır'}
          </span>
        </button>

        {/* Hesap İste */}
        <button
          onClick={() => setShowBillModal(true)}
          disabled={billRequested}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
            billRequested
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'hover:bg-slate-800 active:scale-95 text-slate-200'
          }`}
        >
          {billRequested ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" />
          ) : (
            <Receipt className="w-5 h-5 text-orange-400 mb-1" />
          )}
          <span className="text-[11px] font-semibold">
            {billRequested ? 'Hesap İstendi' : 'Hesap İste'}
          </span>
        </button>

        {/* Wi-Fi Bilgisi */}
        {hasWifi && (
          <button
            onClick={onOpenWifi}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center hover:bg-slate-800 active:scale-95 text-slate-200 transition-all"
          >
            <Wifi className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-[11px] font-semibold">Wi-Fi Bilgisi</span>
          </button>
        )}
      </div>

      {/* Bill Choice Modal */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 text-center animate-slide-up">
            <button
              onClick={() => setShowBillModal(false)}
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-2.5">
              <Receipt className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">Hesap Talebi (Masa {tableNumber})</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Lütfen ödeme yönteminizi seçin:</p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleBillSelect('credit_card')}
                className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 flex flex-col items-center text-slate-800 transition-all active:scale-95"
              >
                <CreditCard className="w-6 h-6 text-orange-500 mb-1.5" />
                <span className="text-xs font-bold">Kredi / Banka Kartı</span>
                <span className="text-[10px] text-slate-400 mt-0.5">POS Cihazı ile</span>
              </button>

              <button
                onClick={() => handleBillSelect('cash')}
                className="p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center text-slate-800 transition-all active:scale-95"
              >
                <Banknote className="w-6 h-6 text-emerald-500 mb-1.5" />
                <span className="text-xs font-bold">Nakit Ödeme</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Masa Başında</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
