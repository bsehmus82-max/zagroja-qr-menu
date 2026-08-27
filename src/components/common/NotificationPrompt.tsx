import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check } from 'lucide-react';
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus, 
  sendNativeNotification,
  isNotificationSupported
} from '../../lib/notifications';
import { useToast } from '../../context/ToastContext';

export const NotificationPrompt: React.FC = () => {
  const toast = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
  }, []);

  if (!isNotificationSupported() || permission === 'granted') {
    return null; // Already granted or not supported
  }

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());

    if (granted) {
      toast.success('Bildirim izni başarıyla açıldı! Tarayıcı arka plandayken bile anlık uyarı alacaksınız.');
      sendNativeNotification({
        title: 'Restiva Bildirimleri Aktif',
        body: 'Yeni sipariş ve çağrılarda cihazınıza anlık bildirim iletilecektir.',
      });
    } else {
      toast.warning('Bildirim izni verilmedi. Tarayıcı ayarlarından bildirimlere izin verebilirsiniz.');
    }
  };

  return (
    <button
      onClick={handleEnableNotifications}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold transition animate-pulse"
      title="Arka Plan Bildirimlerini Aç"
    >
      <BellRing className="w-3.5 h-3.5 text-amber-400" />
      <span className="hidden sm:inline">Bildirimleri Aç</span>
      <span className="sm:hidden">Bildirim</span>
    </button>
  );
};
