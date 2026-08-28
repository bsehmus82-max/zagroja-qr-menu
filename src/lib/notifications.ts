/**
 * Native Browser & Background Push Notification Engine
 */

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost' ||
    !!(window as unknown as { chrome?: { webview?: unknown } }).chrome?.webview ||
    navigator.userAgent.includes('RestivAdisyon')
  );
}

export async function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isDesktopApp()) {
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
  if (isDesktopApp()) {
    return true; // Desktop app handles audio & printing natively on Windows
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  return false;
}

export function isNotificationSupported(): boolean {
  if (isDesktopApp()) return true;
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (isDesktopApp()) return 'granted';
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
 * Dispatches a native OS / Device notification (auto-closes cleanly after 4.5s)
 */
export async function sendNativeNotification(options: NativeNotificationOptions) {
  if (isDesktopApp()) return; // Desktop app uses native Windows beep and thermal printer engine

  if (!isNotificationSupported()) return;

  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return;
  }

  // Mobile vibration feedback
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
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
    requireInteraction: false, // Auto dismiss on modern OS!
  };

  // 1. Try Service Worker showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch {
      // fallback
    }
  }

  // 2. Direct Notification Fallback with strict 4.5s auto-close
  try {
    const notif = new Notification(title, notifOptions);
    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      try {
        notif.close();
      } catch {
        // ignore
      }
    };

    // Auto close after 4.5 seconds so notification never stays stuck on screen!
    setTimeout(() => {
      try {
        notif.close();
      } catch {
        // ignore
      }
    }, 4500);
  } catch (err) {
    console.warn('Native notification trigger failed:', err);
  }
}
