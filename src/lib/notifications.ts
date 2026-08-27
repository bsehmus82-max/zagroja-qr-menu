/**
 * Native Browser & Background Push Notification Engine
 */

export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
    }
  }
  return null;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export interface NativeNotificationOptions {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

/**
 * Dispatches a native OS / Device notification (works in background & minimized tabs)
 */
export async function sendNativeNotification(options: NativeNotificationOptions) {
  if (!isNotificationSupported()) return;

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  // Mobile vibration
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch {
      // ignore
    }
  }

  const title = options.title;
  const notifOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || '/favicon.svg',
    badge: '/favicon.svg',
    tag: options.tag || `notif_${Date.now()}`,
    data: {
      url: options.url || window.location.href,
    },
    requireInteraction: true,
  };

  // 1. Try Service Worker showNotification (Best for background/PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch {
      // fallback to regular Notification
    }
  }

  // 2. Direct Notification Fallback
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notif.close();
    };
  } catch (err) {
    console.warn('Native notification trigger failed:', err);
  }
}
