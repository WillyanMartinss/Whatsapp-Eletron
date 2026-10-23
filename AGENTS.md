# Instruções para a IA

Leia este arquivo e siga as regras do projeto antes de qualquer alteração.

## Objetivo

App desktop em Electron para abrir o WhatsApp Web em uma janela própria com:
- janela translúcida e ajustável
- opção sempre por cima
- botão de ocultar/mostrar a sidebar
- menu de personalização
- Chromium conforme a versão do Electron instalado

## Regras

- Não reescrever do zero os arquivos principais já existentes.
- Mantém `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- O user agent deve ser montado com `process.versions.chrome`.
- Mantém `partition: 'persist:whatsapp'`.
- Use seletores estáveis: `#side` e `header[data-tab="2"]`.
- Atalhos por `before-input-event`.
- Não interceptar mensagens, dados ou protocolo do WhatsApp.
- Links externos abrem com `shell.openExternal`.

## Checklist

- `npm install` e `npm start` sem erro
- WhatsApp Web abre corretamente
- Login persiste
- Botão `☰` aparece e alterna a sidebar
- `Alt+B`, `Ctrl+Alt+T`, `Ctrl+Alt+A`, `Ctrl+Alt+M` funcionam
- Posição/tamanho e opacidade são salvos
