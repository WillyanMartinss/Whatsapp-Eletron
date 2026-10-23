# Privacy — WhatsApp Web Desktop

Privacy é um aplicativo desktop para abrir o WhatsApp Web em uma janela separada, com visual mais limpo, personalização, transparência e uma experiência mais focada no uso diário no Windows.

Ele foi pensado para funcionar como uma janela leve e prática, mantendo o WhatsApp acessível de forma simples, bonita e mais confortável para uso pessoal.

## Visão geral

O app abre o WhatsApp Web em um Chromium próprio do Electron, mantendo a sessão do usuário e oferecendo controles rápidos para personalizar a janela e o layout.

## Funcionalidades

- Janela transparente e ajustável
- Opção para manter a janela sempre acima das outras
- Botão para ocultar/mostrar a lista de conversas
- Ocultar ou restaurar a barra lateral de ícones
- Menu de personalização com ajustes rápidos
- Persistência de login com sessão do WhatsApp
- Links externos abertos no navegador padrão do sistema
- Suporte a execução em modo instalador ou portátil
- App leve e pronto para uso em computadores Windows x64

## Atalhos do teclado

- `Alt + B` — mostrar/ocultar lista de conversas
- `Alt + N` — mostrar/ocultar barra lateral de ícones
- `Ctrl + Alt + T` — alterna transparência da janela
- `Ctrl + Alt + A` — liga/desliga “sempre por cima”
- `Ctrl + Alt + M` — abre o menu de personalização

## Requisitos do sistema

- Windows 10 ou Windows 11
- Processador x64
- Nenhuma dependência extra necessária para uso normal

## Como usar

### Opção 1 — Executável portátil

1. Baixe o arquivo `Privacy-Portable-2.2.0.exe` da pasta `dist`.
2. Clique duas vezes no arquivo.
3. O app abre diretamente e carrega o WhatsApp Web.

### Opção 2 — Instalador Windows

1. Baixe o arquivo `Privacy-Setup-2.2.0.exe`.
2. Execute o instalador.
3. Siga o processo de instalação padrão do Windows.
4. O aplicativo ficará disponível no menu Iniciar e no desktop.

### Opção 3 — Execução local em desenvolvimento

```bash
npm install
npm start
```

## Como compilar o projeto

```bash
npm install
npm run dist
```

Esse comando gera os artefatos finais em `dist/`:

- `Privacy-Setup-2.2.0.exe` — instalador completo
- `Privacy-Portable-2.2.0.exe` — executável portátil
- `Privacy-Windows-Installers.zip` — pacote com os dois arquivos

## Estrutura do projeto

- `main.js` — janela principal do Electron
- `preload.js` — ponte segura entre a página e o processo principal
- `inject.js` — personalização do layout do WhatsApp Web
- `package.json` — dependências e scripts do app
- `start-privacy.bat` — atalho para abrir em um clique
- `build/` — arquivos de ícone e recursos visuais do instalador

## Observações importantes

- O app usa uma partição persistente do WhatsApp para manter o login salvo.
- O projeto foi pensado para abrir o WhatsApp Web em uma janela própria, sem interceptar mensagens, dados ou protocolo.
- Links externos são abertos no navegador padrão do sistema.
- Este projeto é uma aplicação desktop baseada no WhatsApp Web e não é um produto oficial do WhatsApp/Meta.

## Licença

Este projeto está disponível para uso pessoal, estudo e adaptação local.

## Download

Os executáveis finais podem ser encontrados na pasta `dist` ou no pacote compactado `Privacy-Windows-Installers.zip`.

## Observação sobre release no GitHub

O projeto pode ser publicado com os arquivos `.exe` como assets de release para facilitar o download por qualquer pessoa usando Windows.
