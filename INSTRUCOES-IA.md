# Instruções para a IA (VS Code): app pessoal WhatsApp Web em Electron

> Dica: renomeie/copie este arquivo para `AGENTS.md` (ou `.github/copilot-instructions.md`) na raiz do projeto para a IA lê-lo automaticamente. Ou cole o prompt abaixo no chat.

## Prompt para colar

```
Leia INSTRUCOES-IA.md e monte o projeto nesta pasta. Os arquivos main.js, preload.js,
inject.js e package.json já existem: NÃO reescreva do zero, apenas valide, corrija
erros e faça rodar. Siga as regras e o checklist do arquivo. Ao terminar, me diga o que
você alterou e o que eu preciso testar manualmente.
```

## Objetivo

App de desktop (Windows) que abre `https://web.whatsapp.com/` num Chromium próprio (Electron), com:

- janela translúcida (`win.setOpacity`), ajustável e persistente;
- opção "sempre por cima";
- botão nativo (☰) para ocultar/mostrar a lista de conversas (`#side`);
- opção para ocultar a barra vertical de ícones à esquerda (conversas, ligações, status, canais, comunidades, perfil); quando oculta, o ☰ vira um botão flutuante pequeno no canto superior esquerdo para restaurá-la;
- menu de personalização da janela;
- Chromium na versão mais recente disponível (via Electron mais recente).

## Arquivos

| Arquivo | Função |
|---|---|
| `package.json` | Dependência `electron` (tag `latest`) e script `npm start` |
| `main.js` | Processo principal: janela, user agent, configurações, atalhos, menu, IPC, permissões |
| `preload.js` | `contextBridge` expondo `waBridge.sidebarChanged` e `waBridge.openMenu` |
| `inject.js` | Injetado na página: botão ☰, recolhe/expande a lista de conversas (`#side`) e a barra vertical de ícones (nav rail), expõe `window.__waLayout` |

Configurações do usuário ficam em `app.getPath('userData')/settings.json` (opacidade, sempre por cima, sidebar oculta, posição/tamanho da janela).

## Passos para montar

1. Verifique o Node.js: `node -v` (precisa de LTS atual). Se faltar, peça ao usuário para instalar em nodejs.org.
2. Na pasta do projeto: `npm install`.
3. Garanta o Electron mais recente: `npm install --save-dev electron@latest` (isso grava a versão real no `package.json`).
4. Rode `npm start`. Na primeira vez o usuário lê o QR code com o celular; o login fica salvo na partição `persist:whatsapp`.
5. Confirme a versão do Chromium: abra o menu (Ctrl+Alt+M) > "Ferramentas de desenvolvedor" e rode `navigator.userAgent` no console. O número de `Chrome/` deve ser o major do Electron instalado.

## Regras que não podem ser quebradas

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Nada de `remote`, `enableRemoteModule` ou `nodeIntegration`.
- O user agent é montado de `process.versions.chrome`. **Nunca** colocar a versão do Chrome fixa no código.
- Manter `partition: 'persist:whatsapp'` (senão o login se perde a cada abertura).
- Usar só seletores estáveis do WhatsApp Web: `#side` e `header[data-tab="2"]`. **Nunca** depender de classes CSS ofuscadas (mudam a cada deploy).
- Atalhos via `before-input-event` (só com a janela em foco), não `globalShortcut`.
- Atalhos atuais: `Alt+B` (lista de conversas), `Alt+N` (barra de ícones), `Ctrl+Alt+T` (troca transparência), `Ctrl+Alt+A` (sempre por cima), `Ctrl+Alt+M` (menu). Botão direito no botão ☰ também abre o menu.
- O app só muda a aparência da janela e da interface. **Não** ler conversas, **não** enviar mensagens automaticamente, **não** interceptar o protocolo nem coletar dados.
- Links externos abrem no navegador padrão (`shell.openExternal`, apenas `http`/`https`).

## Checklist de aceitação

- [ ] `npm install` e `npm start` rodam sem erro
- [ ] WhatsApp Web carrega sem a mensagem "navegador não suportado"
- [ ] Login persiste depois de fechar e abrir o app
- [ ] Botão ☰ aparece na barra esquerda; clicar oculta/mostra a lista de conversas
- [ ] `Alt+B` faz o mesmo e o estado é lembrado ao reabrir
- [ ] `Alt+N` oculta/mostra a barra vertical de ícones; com ela oculta, o botão flutuante (canto superior esquerdo) a restaura; estado lembrado ao reabrir
- [ ] `Ctrl+Alt+T` percorre 100/85/70/55/40/25% e o nível é lembrado
- [ ] `Ctrl+Alt+A` liga/desliga "sempre por cima"
- [ ] `Ctrl+Alt+M` e o botão direito no ☰ abrem o menu com as opções marcadas corretamente
- [ ] Posição e tamanho da janela são lembrados
- [ ] Notificações do Windows funcionam; áudio/microfone pedem permissão normalmente

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| "Atualize o Chrome" / navegador não suportado | Atualizar o Electron (`npm install --save-dev electron@latest`) e conferir o user agent |
| Botão ☰ não aparece | Inspecionar o DOM: ver se `header[data-tab="2"]` ainda existe. O fallback cria um botão flutuante no canto superior esquerdo; ajustar o seletor se o WhatsApp mudou |
| Barra de ícones não some ou some demais | `findRail()` em `inject.js` sobe de `header[data-tab="2"]` até o filho direto do ancestral que também contém `#side`; inspecionar o DOM e ajustar essa lógica |
| Sidebar não recolhe direito | Conferir se o pai de `#side` ainda é o contêiner flex que define a largura; ajustar `inject.js` |
| Transparência não muda | `setOpacity` funciona em Windows/macOS; no Linux depende do compositor |
| Atalho Ctrl+Alt+letra não responde | Em teclados com AltGr, Ctrl+Alt equivale a AltGr; trocar a combinação |
| Login não persiste | Verificar a `partition` e permissão de escrita em `userData` |

## Empacotar (opcional, só se o usuário pedir)

Usar `electron-builder` com alvo `nsis` (instalador) ou `portable` para gerar um `.exe`. Incluir `main.js`, `preload.js`, `inject.js` e `package.json` nos arquivos empacotados.

## Fora de escopo (não implementar)

- Transparência só do fundo com `transparent: true` (no Windows impede redimensionar a janela e exige reescrever o CSS do WhatsApp).
- Tampermonkey ou extensões do Chrome dentro do app: a lógica já está nativa em `inject.js`.
