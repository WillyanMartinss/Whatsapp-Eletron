// Ponte mínima e segura entre a página do WhatsApp e o processo principal.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('waBridge', {
  sidebarChanged: (hidden) => ipcRenderer.send('sidebar-changed', !!hidden),
  navChanged: (hidden) => ipcRenderer.send('nav-changed', !!hidden),
  openMenu: () => ipcRenderer.send('open-menu'),
});
