const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  resizeToSetup: () => ipcRenderer.send('resize-to-setup'),
  resizeToWidget: (config) => ipcRenderer.send('resize-to-widget', config),
  resizeToExpanded: () => ipcRenderer.send('resize-to-expanded'),
  setStartup: (enabled) => ipcRenderer.send('set-startup', enabled),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  onOpenSetup: (callback) => ipcRenderer.on('open-setup', () => callback()),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
