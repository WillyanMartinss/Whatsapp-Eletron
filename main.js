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
const ZOOM_BASE = { width: 980, height: 760, min: 0.78, max: 1.2 };
const WINDOW_PRESETS = {
  mobile: { label: 'Mobile', width: 390, height: 844 },
  tablet: { label: 'Tablet', width: 768, height: 1024 },
  small: { label: 'Pequena', width: 360, height: 640 },
  medium: { label: 'Média', width: 520, height: 820 },
  desktop: { label: 'Desktop', width: 980, height: 760 },
  large: { label: 'Grande', width: 1200, height: 860 },
};
const DEFAULTS = {
  opacity: 0.7,
  alwaysOnTop: false,
  desktopPinned: false,
  sidebarHidden: false,
  navHidden: false,
  wallpaper: '',
  zoomLevel: 0,
  neonMode: false,
  windowPreset: 'desktop',
  bounds: { width: 980, height: 760 },
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
function getZoomValue() {
  return Math.round((Math.pow(1.12, settings.zoomLevel || 0) * 100));
}
function getZoomLabel() {
  return `${getZoomValue()}%`;
}
function updateZoomBadge() {
  if (!win || !win.webContents) return;
  win.webContents.executeJavaScript(`window.__waZoomIndicator && window.__waZoomIndicator.update(${getZoomValue()})`).catch(() => {});
}
function cycleOpacity() {
  const i = OPACITY_LEVELS.findIndex((v) => Math.abs(v - settings.opacity) < 0.01);
  setOpacity(OPACITY_LEVELS[(i + 1) % OPACITY_LEVELS.length]);
}
function adjustOpacityByWheel(deltaY) {
  const currentIndex = OPACITY_LEVELS.findIndex((v) => Math.abs(v - settings.opacity) < 0.01);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const direction = deltaY < 0 ? 1 : -1;
  const nextIndex = Math.min(OPACITY_LEVELS.length - 1, Math.max(0, safeIndex + direction));
  setOpacity(OPACITY_LEVELS[nextIndex]);
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
function getAutoFitZoomFactor() {
  if (!win || !win.getBounds) return 1;
  const { width, height } = win.getBounds();
  const proportionalWidth = width / ZOOM_BASE.width;
  const proportionalHeight = height / ZOOM_BASE.height;
  const ratio = Math.min(proportionalWidth, proportionalHeight, 1.2);
  return Math.min(ZOOM_BASE.max, Math.max(ZOOM_BASE.min, ratio));
}
function applyZoom() {
  if (!win || !win.webContents) return;
  const autoFit = getAutoFitZoomFactor();
  const manualFactor = Math.pow(1.12, settings.zoomLevel || 0);
  const finalFactor = Math.min(1.6, Math.max(0.68, autoFit * manualFactor));
  win.webContents.setZoomFactor(finalFactor);
}
function setZoomLevel(level) {
  settings.zoomLevel = Number(level) || 0;
  if (win && win.webContents) {
    applyZoom();
    updateZoomBadge();
  }
  saveSettings();
}
function zoomIn() {
  setZoomLevel(Math.min(5, settings.zoomLevel + 1));
}
function zoomOut() {
  setZoomLevel(Math.max(-5, settings.zoomLevel - 1));
}
function resetZoom() {
  setZoomLevel(0);
}
function applyWindowPreset(name) {
  const preset = WINDOW_PRESETS[name];
  if (!preset || !win) return;
  settings.windowPreset = name;
  win.setSize(preset.width, preset.height);
  win.center();
  settings.bounds = win.getBounds();
  saveSettings();
}
function setNeonMode(value) {
  settings.neonMode = !!value;
  saveSettings();
  if (win && win.webContents) {
    win.webContents.executeJavaScript(`window.__waTheme && window.__waTheme.setNeon(${settings.neonMode})`).catch(() => {});
  }
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
  const zoomCurrent = getZoomLabel();
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
      label: `Zoom da página (${zoomCurrent})`,
      submenu: [
        { label: 'Aumentar', accelerator: 'CmdOrCtrl+=', click: () => zoomIn() },
        { label: 'Diminuir', accelerator: 'CmdOrCtrl+-', click: () => zoomOut() },
        { label: 'Restaurar 100%', accelerator: 'CmdOrCtrl+0', click: () => resetZoom() },
        { type: 'separator' },
        { label: '90%', click: () => setZoomLevel(-1) },
        { label: '100%', click: () => setZoomLevel(0) },
        { label: '110%', click: () => setZoomLevel(1) },
        { label: '125%', click: () => setZoomLevel(2) },
      ],
    },
    {
      label: 'Tema neon',
      type: 'checkbox',
      checked: settings.neonMode,
      click: (item) => setNeonMode(item.checked),
    },
    {
      label: 'Tamanho da janela',
      submenu: Object.entries(WINDOW_PRESETS).map(([presetName, preset]) => ({
        label: preset.label,
        type: 'radio',
        checked: settings.windowPreset === presetName,
        click: () => applyWindowPreset(presetName),
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
    minWidth: 340,
    minHeight: 520,
    title: 'WhatsApp Eletron',
    backgroundColor: '#111b21',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      partition: 'persist:whatsapp', // mantém o login salvo
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      disableBlinkFeatures: 'Auxclick',
    },
  });

  Menu.setApplicationMenu(null);
  win.setOpacity(settings.opacity);
  applyZoom();
  updateZoomBadge();
  win.setVisibleOnAllWorkspaces(settings.desktopPinned);
  win.setSkipTaskbar(settings.desktopPinned);
  win.setAlwaysOnTop(settings.desktopPinned ? false : settings.alwaysOnTop);
  win.loadURL('https://web.whatsapp.com/');

  // Salva posição e tamanho
  const saveBounds = () => {
    if (win.isMinimized() || win.isMaximized()) return;
    settings.bounds = win.getBounds();
    applyZoom();
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
      await win.webContents.executeJavaScript(`window.__waTheme && window.__waTheme.setNeon(${settings.neonMode})`);
    } catch (e) {
      console.error('Erro ao injetar inject.js:', e);
    }
  });

  // Atalhos (só funcionam com a janela em foco)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseWheel') {
      if (input.control && !input.alt && !input.meta && !input.shift) {
        event.preventDefault();
        if (input.deltaY < 0) zoomIn(); else zoomOut();
      }
      else if (input.alt && !input.control && !input.meta && !input.shift) {
        event.preventDefault();
        adjustOpacityByWheel(input.deltaY);
      }
      return;
    }
    if (input.type !== 'keyDown') return;
    const key = input.key.toLowerCase();
    const ctrlOnly = input.control && !input.alt && !input.shift && !input.meta;
    const ctrlAlt = input.control && input.alt && !input.shift && !input.meta;
    const altOnly = input.alt && !input.control && !input.shift && !input.meta;

    if (ctrlAlt && key === 't') { event.preventDefault(); cycleOpacity(); }
    else if (ctrlAlt && key === 'a') { event.preventDefault(); setAlwaysOnTop(!settings.alwaysOnTop); }
    else if (ctrlAlt && key === 'm') { event.preventDefault(); popupMenu(); }
    else if (ctrlOnly && (key === '=' || key === '+' || input.code === 'NumpadAdd')) { event.preventDefault(); zoomIn(); }
    else if (ctrlOnly && (key === '-' || input.code === 'NumpadSubtract')) { event.preventDefault(); zoomOut(); }
    else if (ctrlOnly && key === '0') { event.preventDefault(); resetZoom(); }
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
ipcMain.on('zoom-in', () => { if (win) zoomIn(); });
ipcMain.on('zoom-out', () => { if (win) zoomOut(); });
ipcMain.on('zoom-reset', () => { if (win) resetZoom(); });
ipcMain.on('window-preset', (_, preset) => { if (win) applyWindowPreset(preset); });
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
