const { contextBridge, ipcRenderer } = require('electron');

/**
 * RestivAdisyon POS - Secure Preload Bridge
 * Only exposes strictly required IPC bridge functions.
 * No raw Node.js or internal Electron objects are leaked to the window.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  printReceipt: (options) => ipcRenderer.invoke('print-receipt', options),
});
