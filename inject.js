// Controles de layout do WhatsApp Web (versão nativa do app):
//  - lista de conversas (#side): ocultar/mostrar
//  - barra vertical de ícones à esquerda (nav rail): ocultar/mostrar
// Injetado pelo main.js a cada carregamento da página.
(function () {
  'use strict';
  if (window.__waLayout) return;

  const BTN_ID = 'wa-sidebar-toggle-btn';
  const HELP_BTN_ID = 'wa-help-btn';
  const HELP_MODAL_ID = 'wa-help-modal';
  const ZOOM_BADGE_ID = 'wa-zoom-badge';
  const NEON_ID = 'wa-neon-shell';
  const SIDE_CLASS = 'wa-sb-collapsed';
  const NAV_CLASS = 'wa-nav-collapsed';
  let sidebarHidden = false;
  let navHidden = false;
  let wallpaperPath = '';

  const style = document.createElement('style');
  style.textContent = `
    #side { transition: width .2s ease, min-width .2s ease, flex-basis .2s ease, opacity .2s ease; }
    #side.${SIDE_CLASS}, .${SIDE_CLASS}-parent {
      width: 0 !important; min-width: 0 !important; max-width: 0 !important;
      flex: 0 0 0 !important; overflow: hidden !important;
      opacity: 0 !important; pointer-events: none !important; border: 0 !important;
    }
    .${NAV_CLASS} { display: none !important; }
    #${BTN_ID} {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; margin: 4px auto; padding: 0;
      border: 0; border-radius: 50%; background: transparent;
      color: #8696a0; cursor: pointer; position: relative; z-index: 2;
      -webkit-app-region: no-drag;
    }
    #${BTN_ID}:hover { background: rgba(134,150,160,.2); }
    #${BTN_ID}.floating {
      position: fixed; top: 8px; left: 8px; z-index: 99999;
      width: 26px; height: 26px; margin: 0;
      background: rgba(32,44,51,.7); opacity: .8; transition: opacity .15s;
    }
    #${BTN_ID}.floating:hover { opacity: 1; }
    #${BTN_ID} svg { width: 22px; height: 22px; fill: currentColor; }
    #${BTN_ID}.floating svg { width: 16px; height: 16px; }
    #${HELP_BTN_ID} {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; margin: 4px auto; padding: 0;
      border: 1px solid rgba(134,150,160,.5); border-radius: 50%;
      background: rgba(18, 24, 30, .9); color: #d9dee3; cursor: pointer;
      font-size: 14px; font-weight: 700; line-height: 1; position: relative; z-index: 2;
      -webkit-app-region: no-drag;
    }
    #${HELP_BTN_ID}:hover { background: rgba(134,150,160,.18); }
    #${HELP_BTN_ID}.floating {
      position: fixed; top: 8px; left: 42px; z-index: 99999;
      width: 24px; height: 24px; margin: 0; background: rgba(32,44,51,.82);
    }
    body.wa-neon-mode {
      --wa-neon-1: #5af5dc;
      --wa-neon-2: #53b7ff;
      --wa-neon-3: #9d7bff;
      --wa-surface-1: rgba(8, 17, 22, 0.92);
      --wa-surface-2: rgba(12, 26, 30, 0.9);
      --wa-surface-3: rgba(9, 23, 31, 0.8);
      background: radial-gradient(circle at top, rgba(35, 79, 93, 0.7), rgba(1, 4, 6, 0.96) 48%, rgba(0, 0, 0, 1) 100%);
      overflow: hidden;
    }
    body.wa-neon-mode #${NEON_ID} {
      position: fixed;
      inset: 18px;
      border-radius: 18px;
      border: 2px solid rgba(90, 245, 220, 0.95);
      box-shadow: 0 0 0 2px rgba(90, 245, 220, 0.18), 0 0 18px rgba(90, 245, 220, 0.84), inset 0 0 18px rgba(90, 245, 220, 0.12);
      pointer-events: none;
      z-index: 2147483645;
    }
    body.wa-neon-mode #app, body.wa-neon-mode [data-testid="app"], body.wa-neon-mode .app-wrapper {
      background: linear-gradient(180deg, rgba(7, 18, 20, 0.96), rgba(3, 10, 12, 0.96));
      border: 2px solid rgba(90, 245, 220, 0.72);
      border-radius: 18px;
      box-shadow: inset 0 0 0 1px rgba(90,245,220,0.18), inset 0 0 28px rgba(90,245,220,0.1), 0 0 26px rgba(90,245,220,0.15);
      overflow: hidden;
    }
    body.wa-neon-mode #side,
    body.wa-neon-mode [data-testid="sidebar"],
    body.wa-neon-mode .sidebar {
      background: linear-gradient(180deg, rgba(8, 18, 21, 0.94), rgba(12, 25, 30, 0.9));
      border-right: 1px solid rgba(90, 245, 220, 0.15);
      box-shadow: inset -1px 0 0 rgba(90, 245, 220, 0.12);
    }
    body.wa-neon-mode [data-testid="conversation-panel"],
    body.wa-neon-mode [data-testid="conversation-container"],
    body.wa-neon-mode .conversation-panel,
    body.wa-neon-mode [data-testid="main-panel"],
    body.wa-neon-mode .main-panel {
      background: linear-gradient(180deg, rgba(10, 22, 25, 0.9), rgba(6, 14, 18, 0.86));
      border-left: 1px solid rgba(90, 245, 220, 0.12);
    }
    body.wa-neon-mode [data-testid="chatlist"],
    body.wa-neon-mode [data-testid="chat-container"],
    body.wa-neon-mode .chat-container,
    body.wa-neon-mode [data-testid="message-list"],
    body.wa-neon-mode .message-list {
      background: linear-gradient(180deg, rgba(10, 25, 29, 0.85), rgba(6, 16, 19, 0.92));
    }
    body.wa-neon-mode [data-testid="conversation-header"],
    body.wa-neon-mode [data-testid="composer"],
    body.wa-neon-mode .conversation-header,
    body.wa-neon-mode .composer {
      background: linear-gradient(180deg, rgba(12, 24, 28, 0.92), rgba(10, 20, 23, 0.9));
      border-bottom: 1px solid rgba(90, 245, 220, 0.12);
      box-shadow: inset 0 -1px 0 rgba(90, 245, 220, 0.08);
    }
    body.wa-neon-mode .message-in,
    body.wa-neon-mode .message-out,
    body.wa-neon-mode [data-testid="incoming-message"],
    body.wa-neon-mode [data-testid="outgoing-message"] {
      border-radius: 12px;
      box-shadow: 0 0 10px rgba(90, 245, 220, 0.07);
    }
    body.wa-neon-mode .message-out {
      background: linear-gradient(135deg, rgba(24, 64, 74, 0.9), rgba(18, 45, 56, 0.92));
    }
    body.wa-neon-mode .message-in {
      background: linear-gradient(135deg, rgba(13, 30, 34, 0.9), rgba(11, 22, 26, 0.92));
    }
    #app, [data-testid="app"], .app-wrapper {
      background-color: #111b21;
      background-repeat: no-repeat;
      background-position: center center;
      background-size: cover;
    }
    #${ZOOM_BADGE_ID} {
      position: fixed; top: 12px; right: 12px; z-index: 2147483646;
      display: flex; align-items: center; justify-content: center;
      min-width: 44px; height: 26px; padding: 0 8px;
      border-radius: 999px; background: rgba(17,27,33,.82);
      border: 1px solid rgba(134,150,160,.3); color: #e9edef;
      font-size: 12px; font-weight: 700; letter-spacing: .02em;
      box-shadow: 0 8px 20px rgba(0,0,0,.18); user-select: none;
      -webkit-app-region: no-drag;
    }
    #${HELP_MODAL_ID} {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(8,14,18,.56); z-index: 2147483647; padding: 16px;
    }
    #${HELP_MODAL_ID}.hidden { display: none; }
    #${HELP_MODAL_ID} .panel {
      width: min(440px, 92vw); background: #111b21; color: #e9edef;
      border: 1px solid rgba(134,150,160,.45); border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,.35); overflow: hidden;
    }
    #${HELP_MODAL_ID} .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid rgba(134,150,160,.18);
      font-weight: 700;
    }
    #${HELP_MODAL_ID} .close {
      border: 0; border-radius: 50%; background: transparent; color: #d9dee3;
      width: 28px; height: 28px; font-size: 18px; cursor: pointer;
    }
    #${HELP_MODAL_ID} .body {
      padding: 14px 16px 16px; font-size: 13px; line-height: 1.5;
    }
    #${HELP_MODAL_ID} ul {
      margin: 8px 0 0; padding-left: 18px;
    }
    #${HELP_MODAL_ID} li { margin: 6px 0; }
    #${HELP_MODAL_ID} code {
      background: rgba(255,255,255,.06); padding: 2px 6px; border-radius: 6px;
      font-family: Consolas, monospace; color: #dfe7ec;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  // Acha o contêiner da barra de ícones SEM depender de classes ofuscadas:
  // sobe a partir de header[data-tab="2"] até o filho direto do ancestral que também contém #side.
  function findRail() {
    const side = document.getElementById('side');
    const header = document.querySelector('header[data-tab="2"]');
    if (!side || !header) return null;
    let el = header;
    while (el.parentElement && !el.parentElement.contains(side)) el = el.parentElement;
    return el.contains(side) ? null : el;
  }

  function applyState() {
    const side = document.getElementById('side');
    if (side) {
      side.classList.toggle(SIDE_CLASS, sidebarHidden);
      if (side.parentElement) side.parentElement.classList.toggle(`${SIDE_CLASS}-parent`, sidebarHidden);
    }
    const rail = findRail();
    document.querySelectorAll('.' + NAV_CLASS).forEach((e) => {
      if (e !== rail || !navHidden) e.classList.remove(NAV_CLASS);
    });
    if (rail && navHidden) rail.classList.add(NAV_CLASS);
  }

  // silent = true quando a mudança vem do app (menu/atalho), para não notificar de volta
  function setSidebar(value, silent) {
    sidebarHidden = !!value;
    applyState();
    if (!silent && window.waBridge) window.waBridge.sidebarChanged(sidebarHidden);
  }
  function setNav(value, silent) {
    navHidden = !!value;
    applyState();
    place();
    if (!silent && window.waBridge) window.waBridge.navChanged(navHidden);
  }

  function toWallpaperUrl(value) {
    if (!value) return 'none';
    const normalized = value.replace(/\\/g, '/');
    const safe = normalized.startsWith('file://') ? normalized : `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
    return `url("${encodeURI(safe)}")`;
  }

  function applyWallpaper() {
    const host = document.querySelector('#app, [data-testid="app"], .app-wrapper');
    if (!host) return;
    host.style.backgroundImage = wallpaperPath ? toWallpaperUrl(wallpaperPath) : 'none';
  }

  function setWallpaper(value) {
    wallpaperPath = value || '';
    applyWallpaper();
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.title = 'Configurações do app';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.waBridge) window.waBridge.openMenu();
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (window.waBridge) window.waBridge.openMenu();
    });
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.18l-2.39.96c-.5-.38-1.04-.7-1.63-.94L14.5 2.5a.5.5 0 0 0-.5-.5h-3.99a.5.5 0 0 0-.5.5l-.25 2.45c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.61.18L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .61.18l2.39-.96c.5.38 1.04.7 1.63.94l.25 2.45a.5.5 0 0 0 .5.5h3.99a.5.5 0 0 0 .5-.5l.25-2.45c.59-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 0 0 .61-.18l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"/></svg>';
    return btn;
  }

  function createHelpButton() {
    const btn = document.createElement('button');
    btn.id = HELP_BTN_ID;
    btn.type = 'button';
    btn.title = 'Ajuda e atalhos do app';
    btn.textContent = '?';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.getElementById(HELP_MODAL_ID) || createHelpModal();
      modal.classList.remove('hidden');
    });
    return btn;
  }

  function createZoomBadge() {
    const badge = document.createElement('div');
    badge.id = ZOOM_BADGE_ID;
    badge.textContent = '100%';
    return badge;
  }

  function createNeonFrame() {
    const shell = document.createElement('div');
    shell.id = NEON_ID;
    return shell;
  }

  function createHelpModal() {
    const modal = document.createElement('div');
    modal.id = HELP_MODAL_ID;
    modal.classList.add('hidden');
    modal.innerHTML = `
      <div class="panel">
        <div class="header">
          <span>Atalhos e comandos</span>
          <button type="button" class="close" aria-label="Fechar ajuda">×</button>
        </div>
        <div class="body">
          <strong>WhatsApp App</strong>
          <ul>
            <li><code>Alt+B</code> — mostrar/ocultar lista de conversas</li>
            <li><code>Alt+N</code> — mostrar/ocultar barra de ícones</li>
            <li><code>Ctrl+Alt+T</code> — alterna transparência da janela</li>
            <li><code>Ctrl+=</code> / <code>Ctrl+-</code> — aumentar ou diminuir o zoom</li>
            <li><code>Ctrl+0</code> — restaurar o zoom para 100%</li>
            <li><code>Ctrl+Alt+A</code> — liga/desliga "sempre por cima"</li>
            <li><code>Ctrl+Alt+M</code> — abre o menu de personalização</li>
            <li>Botão direito no <code>☰</code> — abre as opções da janela</li>
          </ul>
        </div>
      </div>
    `;
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
    document.body.appendChild(modal);
    return modal;
  }

  // Mantém os controles fora da árvore do WhatsApp para não afetar cliques e abertura das conversas.
  function place() {
    if (!document.getElementById('app')) return;
    let btn = document.getElementById(BTN_ID);
    if (!btn) btn = createButton();
    let helpBtn = document.getElementById(HELP_BTN_ID);
    if (!helpBtn) helpBtn = createHelpButton();

    btn.title = 'Configurações do app';
    helpBtn.title = 'Ajuda e atalhos do app';

    if (!btn.classList.contains('floating') || btn.parentElement !== document.body) {
      btn.classList.add('floating');
      document.body.appendChild(btn);
    }
    if (!helpBtn.classList.contains('floating') || helpBtn.parentElement !== document.body) {
      helpBtn.classList.add('floating');
      document.body.appendChild(helpBtn);
    }

    let badge = document.getElementById(ZOOM_BADGE_ID);
    if (!badge) {
      badge = createZoomBadge();
      document.body.appendChild(badge);
    }

    let neonFrame = document.getElementById(NEON_ID);
    if (!neonFrame) {
      neonFrame = createNeonFrame();
      document.body.appendChild(neonFrame);
    }
  }

  let scheduled = false;
  function refresh() {
    scheduled = false;
    place();
    applyState();
  }

  new MutationObserver(() => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(refresh); }
  }).observe(document.body, { childList: true, subtree: true });

  window.__waZoomIndicator = {
    update: (value) => {
      const badge = document.getElementById(ZOOM_BADGE_ID);
      if (!badge) return;
      badge.textContent = `${Math.max(0, Number(value) || 100)}%`;
    },
  };
  window.__waTheme = {
    setNeon: (value) => {
      const enabled = !!value;
      document.body.classList.toggle('wa-neon-mode', enabled);
      const frame = document.getElementById(NEON_ID);
      if (frame) frame.style.display = enabled ? 'block' : 'none';
      if (enabled) {
        const root = document.querySelector('#app, [data-testid="app"], .app-wrapper');
        if (root) root.style.borderRadius = '18px';
      }
    },
  };
  window.__waLayout = {
    setSidebar: (v) => setSidebar(v, true),
    setNav: (v) => setNav(v, true),
    toggleSidebar: () => setSidebar(!sidebarHidden),
    toggleNav: () => setNav(!navHidden),
  };
  window.__waSidebar = {
    set: (v) => setSidebar(v, true),
    toggle: () => setSidebar(!sidebarHidden),
    get hidden() { return sidebarHidden; },
  };
  window.__waWallpaper = {
    set: (v) => setWallpaper(v),
    clear: () => setWallpaper(''),
    get path() { return wallpaperPath; },
  };
  refresh();
  applyWallpaper();
})();
