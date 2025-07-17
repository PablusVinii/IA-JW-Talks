# 📖 Gerador de Esboços para Testemunhas de Jeová (Frontend com Firebase)

Este projeto é uma aplicação web front-end projetada para auxiliar as Testemunhas de Jeová na preparação de discursos para suas reuniões. A ferramenta permite gerar esboços automáticos baseados em temas e tipos de discurso, buscando informações relevantes e organizando-as de forma prática. Esta versão integra autenticação de usuários e armazenamento de histórico de esboços utilizando Firebase.

Edição 2.0 

## ✨ Funcionalidades Principais

-   **Autenticação de Usuários (Firebase Authentication):**
    -   Cadastro seguro de novos usuários (nome, e-mail, senha).
    -   Login para usuários existentes.
    -   Logout seguro.
    -   Persistência de sessão entre visitas.
    -   Página principal protegida, acessível apenas após login.
-   **Geração de Esboços Dinâmicos:**
    -   Formulário para especificar: tipo de discurso, tempo estimado, tema, versículos e tópicos opcionais, e informações adicionais.
    -   Comunicação com uma **API Backend externa** (configurável) para processar a solicitação e gerar o conteúdo do esboço.
-   **Visualização e Interação com Resultados:**
    -   Exibição clara do esboço gerado, com formatação de negrito.
    -   Opção para copiar o texto completo do esboço para a área de transferência.
    -   Funcionalidade para baixar o esboço como um arquivo `.doc` (Word).
-   **Histórico de Esboços (Cloud Firestore):**
    -   Salvamento automático de cada esboço gerado no Cloud Firestore, associado ao usuário logado.
    -   Visualização do histórico dos últimos 10 esboços na sidebar, ordenados por data.
    -   Possibilidade de carregar um esboço salvo anteriormente a partir do histórico.
-   **Interface Responsiva e Intuitiva:**
    -   Design moderno e adaptável a diferentes tamanhos de tela (desktop, tablet, mobile).
    -   Sidebar para navegação, acesso ao histórico, informações do usuário e logout.
    -   Feedback visual para o usuário (loading, mensagens de erro, notificações de sucesso).
-   **Landing Page Informativa:**
    -   Página inicial (`home.html`) que apresenta o projeto e direciona para login/cadastro.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:**
    -   **HTML5:** Estruturação semântica do conteúdo.
    -   **CSS3:** Estilização, responsividade (Flexbox, Grid, Media Queries), variáveis CSS, animações.
    -   **JavaScript (ES6+):** Lógica da aplicação, manipulação de DOM, eventos, requisições `fetch` (assíncronas), programação orientada a objetos (classes).
-   **Backend & Banco de Dados (Serviços Firebase):**
    -   **Firebase Authentication:** Para gerenciamento de usuários (cadastro, login, logout, sessões).
    -   **Cloud Firestore:** Banco de dados NoSQL para armazenar perfis de usuários e histórico de esboços.
-   **API Externa (Dependência):**
    -   A aplicação consome uma API externa (URL configurável em `script.js`) para a lógica de processamento e geração do conteúdo dos esboços. **Esta API não faz parte deste repositório e precisa ser implementada e hospedada separadamente.**

## 📁 Estrutura do Projeto

```
.
├── index.html              # Página principal da aplicação (gerador de esboços)
├── home.html               # Landing page/página inicial do projeto
├── login.html              # Página de login de usuários
├── cadastro.html           # Página de cadastro de novos usuários
├── style.css               # Folha de estilo principal (global e para index.html)
├── auth.css                # Folha de estilo para as páginas de login e cadastro
├── home.css                # Folha de estilo para a página home.html
├── utils.css               # CSS com classes utilitárias (ex: .visually-hidden)
├── script.js               # Lógica JavaScript principal para index.html
├── auth.js                 # Lógica JavaScript para login.html e cadastro.html
├── firebase-init.js        # Script para configuração e inicialização do Firebase
└── README.md               # Este arquivo de documentação
```

## 🚀 Como Executar o Projeto (Frontend)

1.  **Pré-requisitos:**
    *   Um navegador web moderno (Chrome, Firefox, Edge, Safari).
    *   Conexão com a internet (para carregar SDKs do Firebase).
    *   **Projeto Firebase Configurado:**
        *   Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
        *   Obtenha as credenciais de configuração do seu projeto (apiKey, authDomain, etc.).
        *   No console do Firebase:
            *   Habilite o **Firebase Authentication** com o provedor "E-mail/Senha".
            *   Configure o **Cloud Firestore** (crie um banco de dados).
            *   Adicione as [Regras de Segurança do Firestore](#%EF%B8%8F-configura%C3%A7%C3%B5es-importantes) sugeridas.
            *   Crie o [Índice do Firestore](#%EF%B8%8F-configura%C3%A7%C3%B5es-importantes) necessário para a consulta do histórico.

2.  **Configuração Local:**
    *   Clone este repositório.
    *   Atualize o arquivo `firebase-init.js` com as credenciais do seu projeto Firebase:
        ```javascript
        // firebase-init.js
        const firebaseConfig = {
          apiKey: "SUA_API_KEY",
          authDomain: "SEU_AUTH_DOMAIN",
          projectId: "SEU_PROJECT_ID",
          storageBucket: "SEU_STORAGE_BUCKET",
          messagingSenderId: "SEU_MESSAGING_SENDER_ID",
          appId: "SEU_APP_ID",
          measurementId: "SEU_MEASUREMENT_ID" // Opcional
        };
        firebase.initializeApp(firebaseConfig);
        // ...
        ```

3.  **Servindo os Arquivos:**
    *   Devido a restrições de segurança do navegador (CORS, módulos JS), você não pode simplesmente abrir os arquivos `*.html` diretamente (via `file:///`).
    *   Use um servidor web local. Se você tem Python:
        ```bash
        # Navegue até a pasta raiz do projeto no terminal
        python -m http.server
        ```
        Ou, com Node.js e `npx` (vem com npm 5.2+):
        ```bash
        # Navegue até a pasta raiz do projeto no terminal
        npx serve
        ```
    *   Acesse `http://localhost:8000` (ou a porta indicada) no seu navegador. Comece pela `home.html` ou `login.html`.

4.  **API Backend (Dependência Externa):**
    *   A funcionalidade de geração de esboços em `script.js` faz uma requisição para a `API_URL` (atualmente `http://localhost:5678/webhook-test/...`).
    *   **Importante:** Para que a geração de conteúdo funcione, você precisará ter um serviço backend rodando nesta URL que receba um POST com os dados do formulário e retorne um JSON no formato esperado (ex: `{ "output": "Conteúdo do esboço..." }`).
    *   Sem este backend, a interface do usuário funcionará, mas a geração de conteúdo do esboço falhará.

## ⚙️ Configurações Importantes

### Firebase (`firebase-init.js`)
Este arquivo é crucial. Ele contém o objeto `firebaseConfig` com as chaves e IDs do seu projeto Firebase. Substitua os valores de exemplo pelos do seu projeto para que a autenticação e o banco de dados funcionem.

### API Endpoint (`script.js`)
A constante `API_URL` em `script.js` define para onde as solicitações de geração de esboço são enviadas.
```javascript
const API_URL = 'http://localhost:5678/webhook-test/fd061969-eb2c-4355-89da-910ec299d4ef'; // AJUSTE ESTA URL
```
Você **deve** ajustar esta URL para o endpoint do seu serviço de backend que processa os pedidos de esboço.

### Índice do Firestore Necessário
Para que o histórico de esboços funcione corretamente e ordenado por data, é **essencial** criar o seguinte índice composto no seu Cloud Firestore:
-   **Coleção:** `esbocos`
-   **Campos para indexar:**
    1.  `uid` (Ascendente)
    2.  `criadoEm` (Descendente)
-   **Escopo da Consulta:** Coleta

*Como criar:* No console do Firebase > Firestore Database > Índices > Criar índice. O Firebase pode inclusive fornecer um link direto no console de erros do navegador se o índice estiver faltando durante a execução da query.

### Regras de Segurança do Firestore (Sugeridas)
No console do Firebase (Firestore Database > Regras), configure regras para proteger seus dados. Um exemplo básico:
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários: só podem ler e atualizar seus próprios dados.
    // Criação permitida se o UID do documento for o mesmo do usuário autenticado.
    match /usuarios/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId && request.resource.data.uid == request.auth.uid;
    }
    // Esboços: só podem ser criados, lidos, atualizados e deletados pelo dono (UID correspondente).
    match /esbocos/{esbocoId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```
**Atenção:** Estas são regras básicas. Adapte-as e teste-as conforme a necessidade do seu projeto, especialmente se precisar de validações de dados mais complexas.

## 🖥️ Layout da Aplicação

-   **`home.html`**: A página de entrada do projeto. Apresenta uma visão geral das funcionalidades e links para `login.html` e `cadastro.html`.
-   **`login.html`**: Permite que usuários já cadastrados acessem a plataforma.
-   **`cadastro.html`**: Formulário para novos usuários criarem suas contas.
-   **`index.html`**: O coração da aplicação. Acessível apenas por usuários autenticados. Contém:
    -   Uma **sidebar** para navegação, exibição de informações do usuário, lista de histórico de esboços e botão de logout.
    -   A seção principal com o **formulário** para configurar e solicitar a geração de um novo esboço.
    -   Uma área para exibir o **resultado** do esboço gerado, com opções de copiar e baixar.
    -   Indicadores de **loading** e mensagens de **erro/sucesso**.

## 📜 Scripts Principais

-   **`firebase-init.js`**:
    -   Contém o objeto de configuração do Firebase (`firebaseConfig`).
    -   Inicializa os serviços do Firebase (Authentication e Firestore), disponibilizando as instâncias `auth` e `db` globalmente para os outros scripts.
-   **`auth.js`**:
    -   Gerencia toda a lógica de autenticação para as páginas `login.html` e `cadastro.html`.
    -   **Login:** Trata do `signInWithEmailAndPassword`, feedback ao usuário e redirecionamento para `index.html` em caso de sucesso.
    -   **Cadastro:** Trata do `createUserWithEmailAndPassword`, atualização do perfil do usuário (`displayName`) e criação de um documento na coleção `usuarios` do Firestore com os dados do novo usuário. Também fornece feedback e redireciona.
-   **`script.js`**:
    -   É o motor da página `index.html`.
    -   Verifica o estado de autenticação do usuário ao carregar a página; redireciona para `login.html` se não estiver logado.
    -   Carrega e exibe os dados do usuário logado e o histórico de esboços (buscando do Firestore) na sidebar.
    -   Controla a abertura/fechamento da sidebar e a função de logout.
    -   Gerencia o formulário de geração de esboço: coleta os dados, valida, exibe estado de loading.
    -   Envia a requisição (via `fetch`) para a `API_URL` externa com os dados do formulário.
    -   Processa a resposta da API: exibe o esboço gerado na área de resultados.
    -   Salva uma cópia do esboço gerado (junto com os parâmetros de entrada) na coleção `esbocos` do Firestore.
    -   Implementa as funcionalidades "Copiar Texto" e "Baixar como Word".
    -   Exibe notificações e mensagens de erro.

## 🎨 Estilização (CSS)

-   **`style.css`**:
    -   Define estilos globais, variáveis CSS (cores, sombras, gradientes, etc.) e a aparência base do `body`.
    -   Estiliza os principais componentes da `index.html`: layout geral, header, sidebar, formulário de geração, seção de resultados, rodapé, e elementos de feedback como loading e notificações.
    -   Inclui media queries para responsividade.
-   **`auth.css`**:
    -   Estilos específicos para as páginas `login.html` e `cadastro.html`.
    -   Focado no container centralizado, campos de formulário, botões e mensagens de feedback para o processo de autenticação.
-   **`home.css`**:
    -   Estilos dedicados à landing page (`home.html`).
    -   Define a aparência do header, seção de apresentação de funcionalidades e rodapé da página inicial.
-   **`utils.css`**:
    -   Contém classes CSS utilitárias, como `.visually-hidden` para melhorar a acessibilidade ocultando elementos visualmente mas mantendo-os para leitores de tela.

## 💡 Pontos de Melhoria Futuros (Sugestões)

-   Implementar um backend real e robusto para a `API_URL` (ex: usando Cloud Functions, Node.js/Express, Python/Flask, etc.).
-   Adicionar paginação ou scroll infinito para o histórico de esboços se o volume crescer muito.
-   Implementar as funcionalidades "Em breve" nos tipos de discurso.
-   Permitir edição de esboços salvos.
-   Adicionar temas de interface personalizáveis.
-   Melhorar o tratamento de erros da API de geração de esboços, com mensagens mais específicas.
-   Considerar a implementação de um Progressive Web App (PWA) para funcionalidades offline básicas.

## 🐛 Problemas Conhecidos (do README anterior)

-   *Atualização do Nome do Usuário:* Após o cadastro, o nome do usuário na sidebar do `index.html` pode não atualizar imediatamente, exigindo um recarregamento manual da página. (Verificar se ainda persiste e, se sim, investigar `onAuthStateChanged` e `updateProfile`.)
-   *Dependência de API Externa:* A geração de conteúdo do esboço depende criticamente de um serviço funcional na `API_URL`. Sem ele, a funcionalidade principal de geração fica inoperante.

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1.  Faça um fork do projeto.
2.  Crie uma branch para sua funcionalidade (`git checkout -b feature/MinhaNovaFeature`).
3.  Faça commit de suas mudanças (`git commit -m 'feat: Adiciona MinhaNovaFeature'`).
4.  Faça push para a branch (`git push origin feature/MinhaNovaFeature`).
5.  Abra um Pull Request.

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes (se houver um, caso contrário, pode-se adicionar um arquivo `LICENSE` com o texto da licença MIT).

## 👨‍💻 Autor Original (Base do Projeto)

Pablus Vinii
GitHub: [@PablusVinii](https://github.com/PablusVinii)
