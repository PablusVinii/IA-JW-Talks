# Gerador de Esboços para Testemunhas de Jeová (IA)

Este projeto é uma aplicação web completa projetada para ajudar as Testemunhas de Jeová a criar esboços de discursos e apresentações de forma rápida e intuitiva, utilizando inteligência artificial. A plataforma conta com um sistema de autenticação seguro, gerenciamento de usuários, histórico de esboços, notificações e um painel administrativo.

## ✨ Visão Geral

O objetivo principal da aplicação é fornecer uma ferramenta centralizada e inteligente para a preparação de discursos. Usuários podem se cadastrar, gerar esboços com base em parâmetros específicos (como tema, tempo e tipo de discurso), salvar seu histórico, gerenciar seu perfil e receber notificações importantes.

A arquitetura foi projetada para ser segura e escalável, separando a interface do usuário (frontend) da lógica de negócios e da integração com a API de IA (backend).

## 🚀 Funcionalidades Principais

### Para Usuários
- **Autenticação Segura:** Sistema completo de cadastro, login e redefinição de senha utilizando Firebase Authentication.
- **Geração de Esboços com IA:**
    - Formulário intuitivo para inserir tema, tipo de discurso, tempo, versículos e outras informações.
    - Integração com uma API de IA para gerar conteúdo relevante e estruturado.
- **Histórico de Esboços:**
    - Os esboços gerados são salvos automaticamente no perfil do usuário.
    - Visualização, edição e exclusão de esboços antigos.
    - Funcionalidade para marcar esboços como "favoritos", que aparecem no topo da lista.
- **Gerenciamento de Perfil:**
    - Página para o usuário visualizar e atualizar suas informações (nome, senha).
    - Opção segura para exclusão da conta, removendo todos os dados associados.
- **Notificações:**
    - Sistema de notificações para receber avisos gerais do administrador ou mensagens específicas.
    - Contador de notificações não lidas e opção para marcá-las como lidas.
- **Interface Moderna:**
    - Design responsivo e amigável com um menu lateral para navegação.
    - Feedback visual durante o carregamento e em caso de erros.
- **Exportação:**
    - Opção para copiar o conteúdo do esboço ou baixá-lo como um arquivo `.doc`.

### Para Administradores
- **Painel Administrativo:**
    - Uma página `admin.html` dedicada, acessível apenas para usuários com permissão de administrador.
    - Visualização de todos os usuários cadastrados e seus detalhes (UID, email, nome).
    - Ferramentas para gerenciar usuários (promover a admin, remover permissão, excluir usuário).
    - Envio de notificações, tanto gerais (para todos) quanto específicas (para usuários selecionados).

## 🏛️ Arquitetura

O projeto é dividido em três componentes principais que trabalham em conjunto:

1.  **Frontend (Cliente Web):**
    - Construído com **HTML5, CSS3 e JavaScript (Vanilla JS)**.
    - Responsável por toda a interface do usuário: formulários, painéis, listas e interações.
    - Comunica-se diretamente com o **Firebase** para autenticação e operações de banco de dados (Firestore).
    - Para a geração de esboços, o frontend envia uma requisição para o backend seguro, garantindo que a chave da API de IA não seja exposta no cliente.

2.  **Backend (Servidor Seguro):**
    - Desenvolvido em **Python** com o framework **FastAPI**.
    - Hospedado na plataforma **Railway**.
    - Expõe um endpoint seguro (`/gerar-esboco-seguro` ou similar) que recebe as solicitações do frontend.
    - **Funções:**
        - Valida o token de autenticação do usuário (Firebase Admin SDK).
        - Interage com a API de IA para gerar o esboço.
        - Retorna o conteúdo gerado para o frontend.
    - Esta camada protege o acesso à API de IA, garantindo que apenas usuários autenticados possam usá-la.

3.  **Firebase (Backend-as-a-Service):**
    - **Authentication:** Gerencia todo o ciclo de vida do usuário (cadastro, login, sessões).
    - **Firestore:** Banco de dados NoSQL utilizado para armazenar:
        - `usuarios`: Informações de perfil, como nome e status de administrador.
        - `esbocos`: Histórico de todos os esboços gerados por cada usuário.
        - `notificacoes`: Mensagens enviadas pelo painel admin.
    - **Security Rules:** Regras de segurança robustas garantem que os usuários só possam ler e escrever seus próprios dados, protegendo a integridade da aplicação.

## 💻 Tecnologias Utilizadas

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python 3, FastAPI, Uvicorn
- **Banco de Dados e Autenticação:** Google Firebase (Authentication, Firestore)
- **Hospedagem:**
    - Frontend: Pode ser hospedado em qualquer serviço de site estático (Firebase Hosting, Netlify, Vercel).
    - Backend: Railway (para o serviço Python/FastAPI).
- **Gerenciamento de Dependências (Backend):** Poetry

## 🛠️ Como Configurar e Executar

### Pré-requisitos
- Node.js (para ferramentas de desenvolvimento, se necessário)
- Python 3.8+
- Conta no Google Firebase
- Conta na Railway (ou outra plataforma de hospedagem de backend)

### 1. Configuração do Firebase
1.  Crie um novo projeto no [console do Firebase](https://console.firebase.google.com/).
2.  Ative os serviços de **Authentication** (com o provedor de Email/Senha) e **Firestore**.
3.  Vá para as **Configurações do Projeto** > **Geral** e, na seção "Seus apps", crie um novo aplicativo da Web.
4.  Copie o objeto de configuração do Firebase e cole-o no arquivo `firebase-init.js`.
5.  **Regras de Segurança:** Copie o conteúdo de `firestore-rules.txt` e cole nas regras do Firestore para proteger o banco de dados.
6.  **Índices:** Crie os índices do Firestore conforme especificado em `INDICE_FIRESTORE.md` para permitir as consultas complexas (ex: ordenação do histórico).

### 2. Configuração do Frontend
1.  Abra os arquivos HTML (`index.html`, `login.html`, etc.) em um navegador. Para uma melhor experiência e para evitar problemas com CORS, sirva os arquivos com um servidor local (como o `Live Server` do VS Code).
2.  Certifique-se de que o `API_URL` no arquivo `script.js` aponta para a URL do seu backend implantado na Railway.
                                                                                                                                                                                                                                                                                                                                                            
### 3. Configuração do Backend
1.  **Chave de Serviço do Firebase:**
    - No console do Firebase, vá para **Configurações do Projeto** > **Contas de serviço**.
    - Clique em "Gerar nova chave privada" para baixar um arquivo JSON com as credenciais.
2.  **Implantação na Railway:**
    - Crie um novo projeto na Railway a partir de um repositório Git.
    - Adicione as seguintes variáveis de ambiente no seu projeto Railway:
        - `FIREBASE_CREDENTIALS_JSON`: Cole o **conteúdo completo** do arquivo JSON da chave de serviço que você baixou.
        - `PORT`: A Railway define esta variável automaticamente, então garanta que seu `main.py` use `os.getenv("PORT")`.
3.  O arquivo `nixpacks.toml` e `pyproject.toml` na pasta `backend/` instruirão a Railway sobre como instalar as dependências (FastAPI, Firebase Admin) e iniciar o servidor.

Com tudo configurado, a aplicação estará pronta para uso. Novos usuários podem se cadastrar, e você pode definir um usuário como administrador diretamente no banco de dados do Firestore, alterando o campo `admin` para `true` no documento do usuário correspondente na coleção `usuarios`.
