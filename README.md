# 📖 Gerador de Esboços para Testemunhas de Jeová (Versão com Firebase)

Este projeto é uma aplicação web front-end projetada para auxiliar as Testemunhas de Jeová na preparação de discursos para suas reuniões. A ferramenta permite gerar esboços automáticos baseados em temas e tipos de discurso, buscando informações relevantes e organizando-as de forma prática. Esta versão integra autenticação de usuários e armazenamento de histórico de esboços utilizando Firebase.

## ✨ Funcionalidades Principais

-   **Autenticação de Usuários:**
    -   Cadastro e Login seguros utilizando Firebase Authentication.
    -   Sessões de usuário persistentes.
-   **Geração de Esboços:**
    -   Seleção de tipo de discurso (ex: "Tesouros da Palavra de Deus").
    -   Entrada de tema específico, tempo estimado, versículos e tópicos opcionais.
    -   Comunicação com uma API backend (atualmente configurada para `http://localhost:5678/webhook-test/...`) para processar a solicitação e buscar dados.
-   **Visualização de Resultados:**
    -   Exibição clara dos pontos principais do esboço.
    -   Apresentação do conteúdo completo das referências.
-   **Interatividade:**
    -   Opção para copiar o texto do esboço gerado.
    -   Funcionalidade para baixar o esboço como um arquivo `.doc` (Word).
-   **Histórico de Esboços:**
    -   Salvamento automático de cada esboço gerado no Cloud Firestore, associado ao usuário.
    -   Visualização do histórico de esboços na sidebar.
    -   Possibilidade de carregar um esboço salvo anteriormente a partir do histórico.
-   **Interface Responsiva:**
    -   Design moderno e adaptável a diferentes tamanhos de tela (desktop, tablet, mobile).
    -   Sidebar para navegação e acesso ao histórico e informações do usuário.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:**
    -   HTML5 (com foco em semântica e acessibilidade)
    -   CSS3 (com variáveis CSS, Flexbox, Grid, media queries para responsividade)
    -   JavaScript (ES6+) (orientado a objetos, manipulação de DOM, requisições `fetch`)
-   **Backend & Banco de Dados (Firebase):**
    -   **Firebase Authentication:** Para gerenciamento de usuários (cadastro, login, logout).
    -   **Cloud Firestore:** Banco de dados NoSQL para salvar perfis de usuários e histórico de esboços.
-   **API Externa (Configurável):**
    -   O frontend está configurado para se comunicar com um endpoint (ver `API_URL` em `script.js`) que seria responsável pela lógica de scraping e processamento dos dados da JW.org.

## 📁 Estrutura do Projeto

. ├── index.html # Página principal da aplicação (gerador de esboços) ├── home.html # Landing page/página inicial do projeto ├── login.html # Página de login de usuários ├── cadastro.html # Página de cadastro de novos usuários ├── style.css # Folha de estilo principal (para index.html e estilos globais) ├── auth.css # Folha de estilo para as páginas de login e cadastro ├── home.css # Folha de estilo para a página home.html ├── utils.css # CSS com classes utilitárias (ex: .visually-hidden) ├── script.js # Lógica JavaScript principal para index.html ├── auth.js # Lógica JavaScript para login.html e cadastro.html ├── firebase-init.js # Script centralizado para configuração e inicialização do Firebase ├── README.md # Este arquivo de documentação └── (outros arquivos como .gitignore, se aplicável)


## 🚀 Como Executar o Projeto (Frontend)

1.  **Pré-requisitos:**
    *   Um navegador web moderno (Chrome, Firefox, Edge, Safari).
    *   Conexão com a internet (para carregar fontes e SDKs do Firebase).
    *   **Firebase Configurado:**
        *   Você precisa ter um projeto Firebase criado.
        *   A configuração do seu projeto Firebase (apiKey, authDomain, etc.) deve estar corretamente preenchida no arquivo `firebase-init.js`.
        *   No console do Firebase, habilite o **Firebase Authentication** com o provedor "E-mail/Senha".
        *   Configure o **Cloud Firestore** e certifique-se de que as [Regras de Segurança](#regras-de-segurança-do-firestore-sugeridas) estejam adequadas.
        *   Crie o [Índice do Firestore](#índice-do-firestore-necessário) para a funcionalidade de histórico.

2.  **Servindo os Arquivos:**
    *   Como o projeto utiliza JavaScript para interagir com o Firebase e fazer requisições, simplesmente abrir os arquivos `*.html` diretamente no navegador (via `file:///`) pode não funcionar corretamente devido a restrições de segurança (CORS, etc.).
    *   A maneira mais simples de rodar é utilizando um servidor web local. Se você tem Python instalado, pode usar:
        ```bash
        # Navegue até a pasta raiz do projeto no terminal
        python -m http.server
        ```
        Ou, se tiver Node.js e `npx` (que vem com npm 5.2+):
        ```bash
        # Navegue até a pasta raiz do projeto no terminal
        npx serve
        ```
    *   Após iniciar o servidor, acesse `http://localhost:8000` (ou a porta indicada pelo `serve`) no seu navegador. Comece pela `home.html` ou `login.html`.

3.  **API Backend (Simulada/Externa):**
    *   A funcionalidade de geração de esboços em `script.js` faz uma requisição para a `API_URL` (atualmente `http://localhost:5678/webhook-test/...`).
    *   Para que esta parte funcione, você precisaria ter um serviço rodando nesta URL que responda às requisições POST com o formato JSON esperado (contendo uma chave `output` com o texto do esboço).
    *   Sem este backend, a interface ainda funcionará, mas a geração de conteúdo real do esboço falhará (o `fetch` retornará um erro).

## 🔥 Configurações Importantes

### Firebase (`firebase-init.js`)
Este arquivo contém o objeto `firebaseConfig` com as chaves e IDs do seu projeto Firebase. Certifique-se de que está correto, substituindo os valores de exemplo pelos do seu projeto.

### API Endpoint (`script.js`)
A constante `API_URL` em `script.js` define para onde as solicitações de geração de esboço são enviadas. **Importante:** Esta URL deve ser ajustada para o seu endpoint de produção ou o serviço que você está usando para a lógica de backend.

### Índice do Firestore Necessário
Para que o histórico de esboços funcione corretamente (ordenado por data), é **essencial** criar o seguinte índice composto no seu Cloud Firestore:
-   **Coleção:** `esbocos`
-   **Campos:**
    1.  `uid` (Ascendente)
    2.  `criadoEm` (Descendente)
-   **Escopo da Consulta:** Coleta

*Como criar:* No console do Firebase > Firestore Database > Índices > Criar índice.

### Regras de Segurança do Firestore (Sugeridas)
No console do Firebase, na seção Firestore Database > Regras, configure regras para proteger seus dados. Exemplo básico:
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários: só podem ler e modificar seus próprios dados
    match /usuarios/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId && request.resource.data.uid == request.auth.uid;
    }
    // Esboços: só podem ser criados, lidos e modificados pelo dono
    match /esbocos/{esbocoId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
Atenção: Estas são regras básicas. Adapte-as e teste-as conforme a necessidade do seu projeto, especialmente se precisar de validações de dados mais complexas.

💡 Pontos de Melhoria Futuros
Implementar um backend real para a API_URL (ex: usando Cloud Functions, n8n hospedado, ou outro serviço).
Cache de resultados da API externa.
Modo offline (Progressive Web App - PWA).
Exportação em PDF.
Temas personalizados para a interface.
Melhorar tratamento de erro da API de geração de esboços.
Correção do problema de atualização do nome do usuário na sidebar imediatamente após o cadastro.
🐛 Problemas Conhecidos (Atuais)
Atualização do Nome do Usuário: Após o cadastro, o nome do usuário na sidebar do index.html pode não atualizar imediatamente, exigindo um recarregamento manual da página.
Dependência de API Externa: A geração de conteúdo do esboço depende de um serviço funcional na API_URL. Sem ele, a funcionalidade principal de geração fica limitada.
🤝 Contribuindo
Contribuições são bem-vindas! Siga os passos:

Faça um fork do projeto.
Crie uma branch para sua funcionalidade (git checkout -b feature/MinhaNovaFeature).
Faça commit de suas mudanças (git commit -m 'feat: Adiciona MinhaNovaFeature').
Faça push para a branch (git push origin feature/MinhaNovaFeature).
Abra um Pull Request.
📄 Licença
Este projeto é distribuído sob a licença MIT (ou especifique a sua, se houver).

👨‍💻 Autor Original (da base do projeto)
Pablus Vinii
GitHub: @PablusVinii