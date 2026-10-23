const { app, BrowserWindow, Menu, dialog, ipcMain, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// ---------- Chrome sempre na versão do Electron instalado ----------
// O user agent é montado a partir do Chromium embutido, então acompanha
// automaticamente a versão quando você atualiza o Electron.
const chromeMajor = process.versions.chrome.split('.')[0];
app.userAgentFallback =
  `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;

if (!app.requestSingleInstanceLock()) app.quit();

// ---------- Configurações salvas ----------
const OPACITY_LEVELS = [1, 0.85, 0.7, 0.55, 0.4, 0.25];
const DEFAULTS = {
  opacity: 0.7,
  alwaysOnTop: false,
  desktopPinned: false,
  sidebarHidden: false,
  navHidden: false,
  wallpaper: '',
  bounds: { width: 420, height: 800 },
};
const settingsFile = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) }; }
  catch { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2)); } catch (e) { console.error(e); }
}

let settings;
let win;

// ---------- Ações da janela ----------
function setOpacity(value) {
  settings.opacity = value;
  win.setOpacity(value);
  saveSettings();
}
function cycleOpacity() {
  const i = OPACITY_LEVELS.findIndex((v) => Math.abs(v - settings.opacity) < 0.01);
  setOpacity(OPACITY_LEVELS[(i + 1) % OPACITY_LEVELS.length]);
}
function setAlwaysOnTop(value) {
  settings.alwaysOnTop = value;
  if (!settings.desktopPinned) win.setAlwaysOnTop(value);
  saveSettings();
}
function setDesktopPinned(value) {
  settings.desktopPinned = !!value;
  win.setVisibleOnAllWorkspaces(settings.desktopPinned);
  win.setSkipTaskbar(settings.desktopPinned);
  win.setAlwaysOnTop(false);
  if (!settings.desktopPinned) win.setAlwaysOnTop(settings.alwaysOnTop);
  saveSettings();
}
function setSidebar(hidden) {
  settings.sidebarHidden = hidden;
  saveSettings();
  win.webContents
    .executeJavaScript(`window.__waLayout && window.__waLayout.setSidebar(${hidden})`)
    .catch(() => {});
}
function setNav(hidden) {
  settings.navHidden = hidden;
  saveSettings();
  win.webContents
    .executeJavaScript(`window.__waLayout && window.__waLayout.setNav(${hidden})`)
    .catch(() => {});
}
function setWallpaper(pathValue) {
  settings.wallpaper = pathValue || '';
  saveSettings();
  win.webContents
    .executeJavaScript(`window.__waWallpaper && window.__waWallpaper.set(${JSON.stringify(pathValue || '')})`)
    .catch(() => {});
}
function chooseWallpaper() {
  const result = dialog.showOpenDialogSync({
    title: 'Escolher wallpaper do fundo das conversas',
    properties: ['openFile'],
    filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (!result || !result.length) return;
  setWallpaper(result[0]);
}

// ---------- Menu de personalização (Ctrl+Alt+M ou botão direito no botão ☰) ----------
function popupMenu() {
  const template = [
    {
      label: 'Transparência',
      submenu: OPACITY_LEVELS.map((v) => ({
        label: `${Math.round(v * 100)}%`,
        type: 'radio',
        checked: Math.abs(v - settings.opacity) < 0.01,
        click: () => setOpacity(v),
      })),
    },
    {
      label: 'Sempre por cima (Ctrl+Alt+A)',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: (item) => setAlwaysOnTop(item.checked),
    },
    {
      label: 'Fixar na área de trabalho',
      type: 'checkbox',
      checked: settings.desktopPinned,
      click: (item) => setDesktopPinned(item.checked),
    },
    {
      label: 'Ocultar lista de conversas (Alt+B)',
      type: 'checkbox',
      checked: settings.sidebarHidden,
      click: (item) => setSidebar(item.checked),
    },
    {
      label: 'Ocultar barra de ícones (Alt+N)',
      type: 'checkbox',
      checked: settings.navHidden,
      click: (item) => setNav(item.checked),
    },
    {
      label: 'Fundo das conversas',
      submenu: [
        { label: 'Transparente', click: () => setWallpaper('') },
        { label: 'Escolher imagem...', click: () => chooseWallpaper() },
      ],
    },
    { type: 'separator' },
    { label: 'Recarregar', click: () => win.webContents.reload() },
    { label: 'Ferramentas de desenvolvedor', click: () => win.webContents.openDevTools({ mode: 'detach' }) },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ];
  Menu.buildFromTemplate(template).popup({ window: win });
}

// ---------- Janela ----------
function createWindow() {
  settings = loadSettings();

  win = new BrowserWindow({
    ...settings.bounds,
    minWidth: 280,
    minHeight: 400,
    title: 'WhatsApp',
    backgroundColor: '#111b21',
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:whatsapp', // mantém o login salvo
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  win.setOpacity(settings.opacity);
  win.setVisibleOnAllWorkspaces(settings.desktopPinned);
  win.setSkipTaskbar(settings.desktopPinned);
  win.setAlwaysOnTop(settings.desktopPinned ? false : settings.alwaysOnTop);
  win.loadURL('https://web.whatsapp.com/');

  // Salva posição e tamanho
  const saveBounds = () => {
    if (win.isMinimized() || win.isMaximized()) return;
    settings.bounds = win.getBounds();
    saveSettings();
  };
  win.on('resized', saveBounds);
  win.on('moved', saveBounds);

  // Injeta o botão e restaura o estado da sidebar
  win.webContents.on('dom-ready', async () => {
    try {
      const code = fs.readFileSync(path.join(__dirname, 'inject.js'), 'utf8');
      await win.webContents.executeJavaScript(code);
      await win.webContents.executeJavaScript(`window.__waLayout.setSidebar(${settings.sidebarHidden})`);
      await win.webContents.executeJavaScript(`window.__waLayout.setNav(${settings.navHidden})`);
      await win.webContents.executeJavaScript(`window.__waWallpaper && window.__waWallpaper.set(${JSON.stringify(settings.wallpaper || '')})`);
    } catch (e) {
      console.error('Erro ao injetar inject.js:', e);
    }
  });

  // Atalhos (só funcionam com a janela em foco)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = input.key.toLowerCase();
    const ctrlAlt = input.control && input.alt && !input.shift && !input.meta;
    const altOnly = input.alt && !input.control && !input.shift && !input.meta;

    if (ctrlAlt && key === 't') { event.preventDefault(); cycleOpacity(); }
    else if (ctrlAlt && key === 'a') { event.preventDefault(); setAlwaysOnTop(!settings.alwaysOnTop); }
    else if (ctrlAlt && key === 'm') { event.preventDefault(); popupMenu(); }
    else if (altOnly && key === 'b') { event.preventDefault(); setSidebar(!settings.sidebarHidden); }
    else if (altOnly && key === 'n') { event.preventDefault(); setNav(!settings.navHidden); }
  });

  // Só navega dentro do WhatsApp; o resto abre no navegador padrão
  const isWhatsApp = (url) => url.startsWith('https://web.whatsapp.com');
  win.webContents.on('will-navigate', (event, url) => {
    if (!isWhatsApp(url)) { event.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Permissões necessárias (notificações, microfone para áudios, etc.)
function setupPermissions() {
  const allowed = ['notifications', 'media', 'fullscreen', 'clipboard-sanitized-write'];
  session.fromPartition('persist:whatsapp').setPermissionRequestHandler((wc, permission, callback) => {
    callback(allowed.includes(permission) && wc.getURL().startsWith('https://web.whatsapp.com'));
  });
}

// ---------- IPC vindo da página ----------
ipcMain.on('sidebar-changed', (event, hidden) => {
  if (!win || event.sender !== win.webContents) return;
  settings.sidebarHidden = !!hidden;
  saveSettings();
});
ipcMain.on('nav-changed', (event, hidden) => {
  if (!win || event.sender !== win.webContents) return;
  settings.navHidden = !!hidden;
  saveSettings();
});
ipcMain.handle('choose-wallpaper', () => {
  try {
    const result = dialog.showOpenDialogSync({
      title: 'Escolher wallpaper do fundo das conversas',
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    });
    return result && result.length ? result[0] : null;
  } catch {
    return null;
  }
});
ipcMain.on('open-menu', (event) => {
  if (!win || event.sender !== win.webContents) return;
  popupMenu();
});

app.on('second-instance', () => {
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});
app.whenReady().then(() => { setupPermissions(); createWindow(); });
app.on('window-all-closed', () => app.quit());
