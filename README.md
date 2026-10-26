# WhatsApp Eletron

Aplicativo desktop para abrir o WhatsApp Web em uma janela separada, com ajustes visuais, transparência e opções de personalização para uso no Windows.

## Repositório

https://github.com/WillyanMartinss/Whatsapp-Eletron

## Visão geral

O projeto abre o WhatsApp Web em uma janela própria com Electron, mantendo a sessão do usuário e oferecendo controles rápidos para ajustar o layout e a experiência visual da aplicação.

## Funcionalidades

- Janela transparente e ajustável
- Opção para manter a janela sempre acima das outras
- Botão para ocultar ou mostrar a lista de conversas
- Menu de personalização com ajustes rápidos
- Persistência de login com a sessão do WhatsApp
- Links externos abertos no navegador padrão do sistema
- Suporte a execução em modo portátil ou instalador
- Compatibilidade para uso em computadores Windows x64

## Atalhos do teclado

- `Alt + B` — mostrar/ocultar lista de conversas
- `Alt + N` — mostrar/ocultar barra lateral de ícones
- `Ctrl + Alt + T` — alternar transparência da janela
- `Ctrl + Alt + A` — ligar/desligar “sempre por cima”
- `Ctrl + Alt + M` — abrir o menu de personalização

## Requisitos do sistema

- Windows 10 ou Windows 11
- Processador x64
- Nenhuma dependência extra para uso básico

## Como usar

### Opção 1 — Aplicativo portátil

1. Baixe o arquivo gerado em `dist/`.
2. Execute o arquivo `.exe`.
3. O app abre diretamente e carrega o WhatsApp Web.

### Opção 2 — Instalador do Windows

1. Baixe o instalador gerado em `dist/`.
2. Execute o arquivo `.exe`.
3. Siga o processo padrão de instalação do Windows.
4. O aplicativo ficará disponível no menu Iniciar.

### Opção 3 — Execução local em desenvolvimento

```bash
npm install
npm start
```

## Como compilar o projeto

```bash
npm install
npm run build
```

Esse comando gera os artefatos finais em `dist/`.

## Estrutura do projeto

- `main.js` — janela principal do Electron
- `preload.js` — ponte segura entre a página e o processo principal
- `inject.js` — personalização do layout do WhatsApp Web
- `package.json` — dependências e scripts do aplicativo
- `start-whatsapp-eletron.bat` — atalho para abrir o app rapidamente
- `build/` — recursos visuais e ícones do projeto

## Observações importantes

- O projeto usa uma partição persistente do WhatsApp para manter o login salvo.
- A aplicação é uma interface desktop para o WhatsApp Web e não é um produto oficial do WhatsApp/Meta.
- Links externos são abertos com o navegador padrão do sistema.
- O código foi desenvolvido para melhorar a experiência visual e a organização da interface, sem interferir no protocolo, nas mensagens ou nos dados do usuário.

## Isenção de responsabilidade

Este projeto é uma aplicação desktop para uso pessoal e não é afiliado, associado, autorizado, endossado ou de qualquer forma oficialmente conectado ao WhatsApp ou a qualquer uma de suas subsidiárias ou afiliadas. O site oficial do WhatsApp pode ser encontrado em [whatsapp.com](https://whatsapp.com/).

“WhatsApp”, bem como nomes, marcas, logotipos e imagens relacionadas, são marcas registradas de seus respectivos proprietários.

Este projeto utiliza o WhatsApp Web em um ambiente desktop e não deve ser entendido como um cliente oficial ou como uma extensão suportada pela plataforma. Não há garantia de que o uso deste método será livre de bloqueios, limitações ou alterações por parte do serviço. O WhatsApp não oferece suporte oficial para clientes não autorizados ou métodos alternativos de acesso.

Portanto, o uso deste projeto deve ser considerado apenas para fins pessoais, experimentais e em conformidade com os termos e políticas aplicáveis do serviço e da plataforma.

## Licença

Direitos autorais 2026 Willyan Martins.

Este projeto é licenciado sob a Licença Apache, Versão 2.0 (“Licença”); você não pode usar este projeto, exceto em conformidade com a Licença. Uma cópia da Licença pode ser obtida em [https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0).

A menos que exigido pela lei aplicável ou acordado por escrito, o software distribuído sob a Licença é fornecido “COMO ESTÁ”, SEM GARANTIAS OU CONDIÇÕES DE QUALQUER TIPO, expressas ou implícitas, incluindo, sem limitação, garantias de comerciabilidade, adequação a um fim específico e não violação.

Consulte a Licença para obter detalhes sobre os direitos e limitações específicos aplicáveis ao uso do software.

## Download

Os artefatos finalizados podem ser gerados localmente na pasta `dist/` antes de serem enviados como release no GitHub.
