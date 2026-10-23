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
    #app, [data-testid="app"], .app-wrapper {
      background-color: #111b21;
      background-repeat: no-repeat;
      background-position: center center;
      background-size: cover;
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
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navHidden) setNav(false);          // botão flutuante: restaura a barra de ícones
      else setSidebar(!sidebarHidden);       // botão na barra: alterna a lista de conversas
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (window.waBridge) window.waBridge.openMenu();
    });
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>';
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

    btn.title = navHidden
      ? 'Mostrar barra de ícones (Alt+N)'
      : 'Mostrar/ocultar conversas (Alt+B) • Botão direito: opções da janela';
    helpBtn.title = 'Ajuda e atalhos do app';

    if (!btn.classList.contains('floating') || btn.parentElement !== document.body) {
      btn.classList.add('floating');
      document.body.appendChild(btn);
    }
    if (!helpBtn.classList.contains('floating') || helpBtn.parentElement !== document.body) {
      helpBtn.classList.add('floating');
      document.body.appendChild(helpBtn);
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
