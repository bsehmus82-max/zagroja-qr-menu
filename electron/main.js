const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// Single instance lock for POS terminals
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const LIVE_URL = 'https://restivadisyon.org';
const DEV_URL = 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    title: 'RestivAdisyon POS',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#0C1017',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      // Uncomment to inspect during development if needed
      // mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Load target URL
  const targetUrl = isDev ? DEV_URL : LIVE_URL;
  mainWindow.loadURL(targetUrl);

  // Open external links in user's default browser safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes('localhost:5173') && !url.includes('restivadisyon.org')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC: Silent Thermal Receipt Printing
ipcMain.handle('print-receipt', async (event, options) => {
  try {
    const { html, deviceName, silent = true } = options || {};

    const printSettings = {
      silent: silent !== false,
      printBackground: true,
      margins: { marginType: 'none' },
      ...(deviceName ? { deviceName } : {}),
    };

    if (html) {
      // Offscreen window dedicated to rendering and silently printing HTML receipts
      const printWindow = new BrowserWindow({
        show: false,
        width: 400,
        height: 600,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const encodedHtml = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      await printWindow.loadURL(encodedHtml);

      return new Promise((resolve) => {
        // Small delay to ensure styles and fonts render before printing
        setTimeout(() => {
          printWindow.webContents.print(printSettings, (success, failureReason) => {
            printWindow.destroy();
            resolve({ success, failureReason: failureReason || undefined });
          });
        }, 100);
      });
    } else {
      // Print from the current caller webContents
      return new Promise((resolve) => {
        event.sender.print(printSettings, (success, failureReason) => {
          resolve({ success, failureReason: failureReason || undefined });
        });
      });
    }
  } catch (err) {
    return { success: false, failureReason: err.message || 'Yazdırma sırasında bir hata oluştu.' };
  }
});

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.restivadisyon.pos');
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
