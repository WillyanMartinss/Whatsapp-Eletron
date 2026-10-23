# Privacy

Privacy é um app desktop para abrir o WhatsApp Web em uma janela própria, com aparência mais discreta e opções de personalização.

## Funcionalidades

- Janela translúcida e ajustável
- Opção para manter sempre por cima
- Botão para ocultar/mostrar a sidebar
- Menu de personalização da janela
- Login do WhatsApp preservado por sessão persistente
- Compatível com Chromium embutido do Electron
- Sem interceptação de mensagens, protocolo ou dados do WhatsApp

## Requisitos

- Windows 10 ou superior
- Node.js LTS

## Como rodar no desenvolvimento

```bash
npm install
npm start
```

## Como gerar o executável

No terminal da pasta do projeto, execute:

```bash
npm install
npm run dist
```

O executável portátil será gerado em `dist/win-unpacked/Privacy.exe`.

### Opção rápida para uso

- Clique no arquivo `start-privacy.bat` na raiz do projeto para abrir em um clique.
- Ou abra diretamente `dist/win-unpacked/Privacy.exe`.
- O app abrirá diretamente o WhatsApp Web em uma janela própria.

## Estrutura principal

- `main.js` — janela principal do Electron
- `preload.js` — ponte segura entre a página e o processo principal
- `inject.js` — injeções de layout e botões visuais na interface do WhatsApp
- `package.json` — dependências e scripts do projeto

## Observações

- O app usa `partition: 'persist:whatsapp'` para manter o login salvo.
- Links externos são abertos com o navegador padrão via `shell.openExternal`.
- O projeto foi pensado para não interceptar mensagens ou dados do WhatsApp.

## Licença

Este projeto pode ser usado para uso pessoal e adaptações locais.
