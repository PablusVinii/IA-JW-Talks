function abrirMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.add('open');
    }
}

function fecharMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
}

function logout() {
    if (window.geradorEsboco && typeof window.geradorEsboco.logout === 'function') {
        window.geradorEsboco.logout();
    } else {
        window.location.href = 'login.html';
    }
}

function marcarTodasComoLidas() {
    if (window.geradorEsboco && typeof window.geradorEsboco.marcarTodasComoLidas === 'function') {
        window.geradorEsboco.marcarTodasComoLidas();
    }
}

function excluirEsboco(docId, tema) {
    if (window.geradorEsboco && typeof window.geradorEsboco.excluirEsboco === 'function') {
        window.geradorEsboco.excluirEsboco(docId, tema);
    }
}

async function gerarEsboco() {
    const user = window.geradorEsboco && window.geradorEsboco.usuarioAtual;
    if (!user) {
        alert('Você precisa estar logado para gerar um esboço.');
        return;
    }

    try {
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists) {
            alert('Usuário não encontrado no banco de dados.');
            return;
        }

        const userData = userDoc.data();
        const limite = userData.limiteEsbocos !== undefined ? userData.limiteEsbocos : 0; 

        if (limite <= 0) {
            alert(`Você não tem esboços restantes. Para gerar mais, entre em contato com o administrador.`);
            return;
        }

    } catch (error) {
        console.error('Erro ao verificar o limite de esboços:', error);
        alert('Ocorreu um erro ao verificar suas permissões. Tente novamente.');
        return;
    }


    // Coletar dados do formulário
    const tipoDiscurso = elementos.tipoDiscurso ? elementos.tipoDiscurso.value : '';
    const tempo = elementos.tempo ? elementos.tempo.value : '';
    const tema = elementos.tema ? elementos.tema.value.trim() : '';
    const versiculos = elementos.versiculosOpicionais ? elementos.versiculosOpicionais.value.trim() : '';
    const topicos = elementos.topicosOpicionais ? elementos.topicosOpicionais.value.trim() : '';
    const informacoes = elementos.informacoesAdicionais ? elementos.informacoesAdicionais.value.trim() : '';

    // Validação básica
    if (!tipoDiscurso || !tema || !tempo) {
        if (elementos.errorMessage) {
            elementos.errorMessage.textContent = 'Preencha todos os campos obrigatórios (Tipo, Tema e Tempo).';
            elementos.errorMessage.style.display = 'block';
        }
        return;
    }
    if (elementos.errorMessage) elementos.errorMessage.style.display = 'none';

    // Exibir loading e esconder formulário
    if (elementos.loading) elementos.loading.style.display = 'block';
    if (elementos.formSection) elementos.formSection.style.display = 'none';
    if (elementos.resultSection) elementos.resultSection.style.display = 'none';
    if (elementos.btnDownload) elementos.btnDownload.style.display = 'none';

    // Montar payload
    const payload = {
        tipoDiscurso,
        tempo,
        tema,
        versiculos,
        topicos,
        informacoes
    };

    // Requisição para API
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(async (response) => {
        if (!response.ok) {
            // Tenta obter mais detalhes do corpo da resposta em caso de erro.
            const errorBody = await response.text().catch(() => 'Não foi possível ler o corpo do erro.');
            throw new Error(`A requisição falhou com status ${response.status}. Resposta: ${errorBody}`);
        }
        
        const responseText = await response.text();
        if (!responseText) {
            // Se a resposta estiver vazia, joga um erro claro.
            throw new Error('O servidor retornou uma resposta vazia, o que pode indicar um erro interno.');
        }

        try {
            // Tenta analisar o texto como JSON
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Falha ao analisar JSON:', responseText);
            throw new Error('A resposta do servidor não é um JSON válido.');
        }
    })
    .then((data) => {
        // Se vier como array, pega o primeiro objeto
        if (Array.isArray(data)) {
            data = data[0] || {};
        }
        if (elementos.loading) elementos.loading.style.display = 'none';
        if (elementos.formSection) elementos.formSection.style.display = 'none'; // Manter formulário escondido
        if (elementos.resultSection) elementos.resultSection.style.display = 'block';
        if (elementos.btnDownload) elementos.btnDownload.style.display = 'inline-block';

        // Título e tipo do esboço
        if (elementos.resultTitle) elementos.resultTitle.textContent = tema || 'Esboço Gerado';
        if (elementos.resultType) elementos.resultType.textContent = tipoDiscurso || 'Discurso Personalizado';

        // Carrega o conteúdo no editor Quill
        if (window.quill) {
            window.quill.root.innerHTML = formatarConteudo(data.output || '');
        }

        window.ultimoEsbocoGerado = data;

        // Salvar no Firestore se usuário autenticado
        let dbInstance = null;
        try {
            dbInstance = db || firebase.firestore();
        } catch (e) {
            dbInstance = firebase.firestore();
        }
        const user = window.geradorEsboco && window.geradorEsboco.usuarioAtual;
        if (user && dbInstance) {
            dbInstance.collection('esbocos').add({
                uid: user.uid,
                tema: tema,
                tipoDiscurso: tipoDiscurso,
                conteudo: data.output || '',
                tempo: tempo,
                versiculos: versiculos,
                topicos: topicos,
                informacoes: informacoes,
                favorito: false, // Adicionado para garantir que o campo exista na criação
                criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
                pasta: 'Caixa de Entrada', // Novo campo para pastas
                tags: [] // Novo campo para tags
            }).then(async () => {
                // Decrementa o limite de esboços para TODOS os usuários
                await dbInstance.collection('usuarios').doc(user.uid).update({
                    limiteEsbocos: firebase.firestore.FieldValue.increment(-1)
                });

                // Recarregar histórico
                if (window.geradorEsboco && typeof window.geradorEsboco.carregarHistorico === 'function') {
                    window.geradorEsboco.carregarHistorico(user.uid);
                }
                // Atualiza a contagem de esboços na tela
                if (window.geradorEsboco && typeof window.geradorEsboco.carregarDadosUsuario === 'function') {
                    window.geradorEsboco.carregarDadosUsuario(user);
                }
            }).catch((err) => {
                console.error('Erro ao salvar esboço ou atualizar limite:', err);
                alert('Erro ao salvar esboço no banco de dados: ' + (err.message || err));
            });
        } else {
            alert('Usuário não autenticado ou Firestore não inicializado!');
        }
    })
    .catch((err) => {
        if (elementos.loading) elementos.loading.style.display = 'none';
        if (elementos.formSection) elementos.formSection.style.display = 'block'; // Mostrar formulário no erro
        if (elementos.resultSection) elementos.resultSection.style.display = 'none';
        if (elementos.errorMessage) {
            elementos.errorMessage.textContent = err.message || 'Erro ao gerar esboço.';
            elementos.errorMessage.style.display = 'block';
        }
    });
}

function mostrarFormulario() {
    if (elementos.formSection) elementos.formSection.style.display = 'block';
    if (elementos.resultSection) elementos.resultSection.style.display = 'none';
}

function formatarConteudo(texto) {
    if (!texto) return '';
    // Substitui **texto** por <strong>texto</strong> para renderizar como negrito.
    // A flag 'g' garante que todas as ocorrências sejam substituídas.
    return texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function baixarComoWord() {
    if (!window.quill) {
        alert('Editor não inicializado.');
        return;
    }
    const titulo = elementos.resultTitle ? elementos.resultTitle.textContent : 'Esboco';
    const conteudo = window.quill.root.innerHTML;

    if (!conteudo.trim() || conteudo === '<p><br></p>') {
        alert('Não há esboço gerado para baixar.');
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${titulo}</title>
            <style>
                body { font-family: 'Times New Roman', Times, serif; }
                pre { white-space: pre-wrap; font-family: inherit; }
            </style>
        </head>
        <body>
            <h1>${titulo}</h1>
            <pre>${conteudo}</pre>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function exportarResultado() {
    if (!window.quill) {
        alert('Editor não inicializado.');
        return;
    }
    const conteudo = window.quill.getText();

    if (!conteudo.trim()) {
        alert('Não há esboço gerado para copiar.');
        return;
    }

    navigator.clipboard.writeText(conteudo).then(() => {
        alert('Texto do esboço copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar texto: ', err);
        alert('Não foi possível copiar o texto. Tente novamente.');
    });
}   

// Configurações da API
const API_URL = 'https://primary-production-5b08.up.railway.app/webhook/fd061969-eb2c-4355-89da-910ec299d4ef';

const elementos = {
    tipoDiscurso: document.getElementById('tipoDiscurso'),
    tema: document.getElementById('tema'),
    tempo: document.getElementById('tempo'),
    informacoesAdicionais: document.getElementById('informacoesAdicionais'),
    versiculosOpicionais: document.getElementById('versiculosOpicionais'),
    topicosOpicionais: document.getElementById('topicosOpicionais'),
    loading: document.getElementById('loading'),
    formSection: document.getElementById('formSection'), // Adicionado
    resultSection: document.getElementById('resultSection'),
    errorMessage: document.getElementById('errorMessage'),
    resultTitle: document.getElementById('resultTitle'),
    resultType: document.getElementById('resultType'),
    pontosList: document.getElementById('pontosList'),
    referenciasList: document.getElementById('referenciasList'),
    userInfo: document.getElementById('userInfo'),
    historicoList: document.getElementById('historicoList'),
    sidebar: document.getElementById('sidebar'),
    btnDownload: document.getElementById('btnDownload')
};

// Inicializa o editor Quill
var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    },
    placeholder: 'O conteúdo do seu esboço aparecerá aqui...'
});
window.quill = quill;

// Classe principal da aplicação
class GeradorEsboco {
    constructor() {
        this.usuarioAtual = null;
        this.inicializar();
    }

    inicializar() {
        this.configurarAuthStateListener();
    }

    // Listener de autenticação
    configurarAuthStateListener() {
        auth.onAuthStateChanged(async (user) => {
            this.usuarioAtual = user;
            if (user) {
                await this.carregarDadosUsuario(user);
            } else {
                window.location.href = 'login.html';
            }
        });

        // Listener para o botão de gerenciar pastas
        const btnGerenciar = document.getElementById('btnGerenciarPastas');
        if (btnGerenciar) {
            btnGerenciar.addEventListener('click', () => this.gerenciarPastas());
        }
    }

    // Atualizar menu para mostrar/esconder link do admin
    atualizarMenuAdmin() {
        const adminLink = document.getElementById('adminLink');
        const userInfo = document.getElementById('userInfo'); // Ponto de referência

        if (this.isAdmin) {
            // Se o usuário é admin e o link não existe, cria e adiciona
            if (!adminLink && userInfo) {
                const adminLinkElement = document.createElement('a');
                adminLinkElement.href = "admin.html";
                adminLinkElement.id = 'adminLink';
                adminLinkElement.textContent = '🔒 Painel Admin';
                adminLinkElement.className = 'btn btn-secondary';
                adminLinkElement.style.width = '100%';
                adminLinkElement.style.marginBottom = '20px';
                
                // Inserir depois do userInfo e antes do botão de perfil, usando nextElementSibling
                userInfo.parentNode.insertBefore(adminLinkElement, userInfo.nextElementSibling);
            }
        } else {
            // Se o usuário não é admin e o link existe, remove
            if (adminLink) {
                adminLink.remove();
            }
        }
    }

    // A função abaixo está obsoleta e será removida.
    // O HTML para as notificações agora existe diretamente no index.html
    /*
    // Criar e exibir a seção de notificações no menu
    criarSecaoNotificacoes() {
        if (document.getElementById('notificacoesSection')) return; // Já existe

        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const notificacoesSection = document.createElement('div');
        notificacoesSection.id = 'notificacoesSection';
        notificacoesSection.innerHTML = `
            <hr>
            <h3>
                <span role="img" aria-label="Sino">🔔</span> Notificações
                <span id="notificacaoCount" class="notification-badge" style="display:none;">0</span>
            </h3>
            <ul id="notificacoesList">
                <!-- Notificações serão carregadas aqui -->
            </ul>
            <button id="btnMarcarLidas" class="btn" style="width:100%; margin-top:10px;">Marcar todas como lidas</button>
        `;

        // Inserir antes do botão de logout, se existir
        const logoutBtn = sidebar.querySelector('.sair-btn');
        if (logoutBtn) {
            logoutBtn.parentNode.insertBefore(notificacoesSection, logoutBtn);
        } else {
            sidebar.appendChild(notificacoesSection);
        }

        const btnMarcarLidas = document.getElementById('btnMarcarLidas');
        if (btnMarcarLidas) {
            btnMarcarLidas.addEventListener('click', () => this.marcarTodasComoLidas());
        }
    }
    */

    // Carregar dados do usuário e atualizar menu
    async carregarDadosUsuario(user) {
        try {
            const nomeUsuario = user.displayName || user.email || "Usuário";
            if (elementos.userInfo) {
                elementos.userInfo.textContent = `👤 Usuário: ${nomeUsuario}`;
            }
            
            const userDoc = await db.collection("usuarios").doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.isAdmin = userData.admin === true;
                
                const esbocosRestantesEl = document.getElementById('esbocosRestantes');
                if (esbocosRestantesEl) {
                    const limite = userData.limiteEsbocos !== undefined ? userData.limiteEsbocos : 0;
                    esbocosRestantesEl.innerHTML = `✨ Esboços Restantes: <strong>${limite}</strong>`;
                }
            } else {
                this.isAdmin = false;
            }
            
            this.atualizarMenuAdmin();
            await this.carregarPastas(user.uid); // Carrega as pastas primeiro
            await this.carregarHistorico(user.uid, 'Caixa de Entrada'); // Carrega a caixa de entrada por padrão
            await this.carregarNotificacoes(user.uid);

        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
        }
    }

    // Verificar se o usuário é admin
    async verificarAdminStatus(uid) {
        try {
            const doc = await db.collection("usuarios").doc(uid).get();
            this.isAdmin = doc.exists && doc.data().admin === true;
        } catch (error) {
            console.error("Erro ao verificar status de admin:", error);
            this.isAdmin = false;
        }
        this.atualizarMenuAdmin(); // Chamar aqui garante que execute após a verificação
    }

    // Atualizar menu para mostrar/esconder link do admin
    atualizarMenuAdmin() {
        const adminLink = document.getElementById('adminLink');
        const userInfo = document.getElementById('userInfo');

        if (this.isAdmin) {
            if (!adminLink && userInfo) {
                const adminLinkElement = document.createElement('a');
                adminLinkElement.href = "admin.html";
                adminLinkElement.id = 'adminLink';
                adminLinkElement.textContent = '🔒 Painel Admin';
                adminLinkElement.className = 'btn btn-secondary';
                adminLinkElement.style.width = '100%';
                adminLinkElement.style.marginBottom = '20px';
                userInfo.parentNode.insertBefore(adminLinkElement, userInfo.nextElementSibling);
            }
        } else {
            if (adminLink) {
                adminLink.remove();
            }
        }
    }

    // Carregar pastas do usuário
    async carregarPastas(uid) {
        const filtroPasta = document.getElementById('filtroPasta');
        if (!filtroPasta) return;

        try {
            const pastasRef = db.collection('usuarios').doc(uid).collection('pastas');
            const snapshot = await pastasRef.orderBy("nome", "asc").get();

            if (snapshot.empty) {
                const batch = db.batch();
                batch.set(pastasRef.doc(), { nome: 'Caixa de Entrada', criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
                batch.set(pastasRef.doc(), { nome: 'Arquivo', criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
                await batch.commit();
                return this.carregarPastas(uid);
            }

            filtroPasta.innerHTML = '';
            snapshot.forEach(doc => {
                const pasta = doc.data();
                const option = document.createElement('option');
                option.value = pasta.nome;
                option.textContent = pasta.nome;
                filtroPasta.appendChild(option);
            });

            filtroPasta.removeEventListener('change', this.filtrarPorPasta.bind(this));
            filtroPasta.addEventListener('change', this.filtrarPorPasta.bind(this));

        } catch (error) {
            console.error("Erro ao carregar pastas:", error);
            filtroPasta.innerHTML = '<option>Erro ao carregar</option>';
        }
    }

    filtrarPorPasta(event) {
        const nomePasta = event.target.value;
        this.carregarHistorico(this.usuarioAtual.uid, nomePasta);
    }

    // Gerenciar pastas
    async gerenciarPastas() {
        const nomeNovaPasta = prompt("Digite o nome da nova pasta que deseja criar (ou deixe em branco para cancelar):");
        if (nomeNovaPasta && nomeNovaPasta.trim() !== '') {
            try {
                const pastasRef = db.collection('usuarios').doc(this.usuarioAtual.uid).collection('pastas');
                const snapshot = await pastasRef.where("nome", "==", nomeNovaPasta.trim()).get();
                if (!snapshot.empty) {
                    alert("Uma pasta com este nome já existe.");
                    return;
                }
                await pastasRef.add({
                    nome: nomeNovaPasta.trim(),
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Pasta "${nomeNovaPasta.trim()}" criada com sucesso!`);
                await this.carregarPastas(this.usuarioAtual.uid);
            } catch (error) {
                console.error("Erro ao criar pasta:", error);
                alert("Não foi possível criar a pasta.");
            }
        }
    }

    // Carregar histórico de esboços do usuário
    async carregarHistorico(uid, filtroPasta = null) {
        if (!elementos.historicoList) return;
        
        elementos.historicoList.innerHTML = '<li style="color:#666;font-style:italic;">Carregando histórico...</li>';
        
        try {
            let query = db.collection("esbocos").where("uid", "==", uid);

            if (filtroPasta) {
                query = query.where("pasta", "==", filtroPasta);
            }

            query = query.orderBy("favorito", "desc")
                .orderBy("criadoEm", "desc")
                .limit(20);
                
            const snapshot = await query.get();
            elementos.historicoList.innerHTML = '';
            if (snapshot.empty) {
                elementos.historicoList.innerHTML = '<li style="color:#666;font-style:italic;">Nenhum esboço encontrado nesta pasta.</li>';
                return;
            }
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const li = document.createElement('li');
                
                li.style.cssText = `
                    cursor: pointer;
                    padding: 12px;
                    margin: 8px 0;
                    border-left:3px solid #4a90e2;
                    background: #f9f9f9;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                const star = document.createElement('span');
                star.innerHTML = data.favorito ? '⭐' : '☆';
                star.title = data.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
                star.style.cssText = 'font-size: 1.3em; margin-right: 10px; cursor: pointer; user-select: none;';
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFavorito(doc.id, data.favorito);
                });
                
                const info = document.createElement('div');
                info.innerHTML = `
                    <strong>${this.formatarTipoDiscurso(data.tipoDiscurso) || 'Tipo não especificado'}</strong><br>
                    <span style="font-size: 0.9em;">${data.tema || 'Sem tema'}</span><br>
                    <small style="color: #666;">${data.criadoEm?.toDate ? data.criadoEm.toDate().toLocaleString('pt-BR', {
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit'
                    }) : 'Data não disponível'}</small>
                    <div class="tags-container" style="margin-top: 5px;">
                        ${(data.tags && data.tags.length) ? data.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                    </div>
                `;
                info.style.flex = '1';
                
                li.appendChild(info);
                li.appendChild(star);
                
                li.addEventListener('mouseenter', () => {
                    li.style.backgroundColor = '#e8f4f8';
                });
                
                li.addEventListener('mouseleave', () => {
                    li.style.backgroundColor = '#f9f9f9';
                });
                
                // Clique abre modal detalhado
                li.addEventListener('click', () => {
                    this.abrirModalDetalheEsboco(data, doc.id);
                });
                
                // Edição ao clicar com botão direito
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.abrirModalEdicao(doc.id, data);
                });
                
                elementos.historicoList.appendChild(li);
            });
            
        } catch (error) {
            elementos.historicoList.innerHTML = '<li style="color:red;">Erro ao carregar histórico</li>';
            console.error("Erro ao carregar histórico:", error);
        }
    }

    // Formatar tipo de discurso para exibição
    formatarTipoDiscurso(tipo) {
        const tipos = {
            estudante: 'Estudante',
            anciao: 'Ancião',
            servo: 'Servo Ministerial',
            publico: 'Discurso Público',
            assembleia: 'Assembleia',
            tesouros: 'Tesouros da Palavra',
            pesquisa: 'Pesquisa Bíblica'
        };
        return tipos[tipo] || tipo;
    }

    // Alternar favorito
    async toggleFavorito(docId, favoritoAtual) {
        try {
            await db.collection("esbocos").doc(docId).update({ favorito: !favoritoAtual });
            await this.carregarHistorico(this.usuarioAtual.uid);
            alert(!favoritoAtual ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!');
        } catch (error) {
            console.error('Erro ao alternar favorito:', error);
            alert('Erro ao atualizar favorito.');
        }
    }

    // Abrir modal de visualização detalhada
    abrirModalDetalheEsboco(data, docId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;

        modal.innerHTML = `
            <div style="background:white;padding:30px;border-radius:12px;max-width:600px;width:95vw;position:relative;max-height:90vh;overflow-y:auto;">
                <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
                <h2 style="margin-bottom:10px;color:#333;">${data.tema || 'Esboço'}</h2>
                <div style="color:#666;margin-bottom:20px;">
                    <strong>Tipo:</strong> ${this.formatarTipoDiscurso(data.tipoDiscurso)}<br>
                    <strong>Data:</strong> ${data.criadoEm?.toDate ? data.criadoEm.toDate().toLocaleString('pt-BR') : 'Data não disponível'}<br>
                    <strong>Tempo:</strong> ${data.tempo || 'Não especificado'} minutos
                </div>
                <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin-bottom:20px;white-space:pre-wrap;line-height:1.6;">
                    ${formatarConteudo(data.conteudo || 'Conteúdo não disponível')}
                </div>
                <div style="margin-bottom: 20px;">
                    <strong>Tags:</strong> 
                    <span id="tags-display">${(data.tags && data.tags.length) ? data.tags.join(', ') : 'Nenhuma'}</span>
                </div>
                <div style="text-align:right;">
                    <button id="btnMoverPasta" class="btn" style="background:#8e44ad;color:white;">Mover Pasta</button>
                    <button id="btnEditarTags" class="btn" style="background:#f39c12;color:white;">Editar Tags</button>
                    <button id="btnCopiarModal" class="btn" style="margin-right:10px;">📋 Copiar</button>
                    <button id="btnExportarModal" class="btn">⬇️ Exportar</button>
                    <button id="btnEditar" class="btn" style="background:#ffc17c;color:#333;">✏️ Editar</button>
                    <button id="btnExcluir" class="btn" style="background:#dc3545;color:white;margin-left:10px;">🗑️ Excluir</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar eventos para os novos botões
        modal.querySelector('#btnEditarTags').addEventListener('click', () => {
            const novasTags = prompt('Edite as tags (separadas por vírgula):', (data.tags || []).join(', '));
            if (novasTags !== null) {
                const tagsArray = novasTags.split(',').map(tag => tag.trim()).filter(Boolean);
                this.atualizarEsboco(docId, { tags: tagsArray });
                modal.remove();
            }
        });

        modal.querySelector('#btnMoverPasta').addEventListener('click', async () => {
            this.abrirModalMoverPasta(docId, data.pasta);
            modal.remove(); // Fecha o modal de detalhes
        });

        // Adicionar evento de clique seguro para o botão de cópia
        modal.querySelector('#btnCopiarModal').addEventListener('click', () => {
            navigator.clipboard.writeText(data.conteudo || '')
                .then(() => alert('Esboço copiado para a área de transferência!'))
                .catch(err => console.error('Erro ao copiar:', err));
        });

        // Adicionar evento de clique seguro para o botão de exportar
        modal.querySelector('#btnExportarModal').addEventListener('click', () => {
            this.exportarEsboco(data.tema || 'Esboço', data.conteudo || '');
        });
        
        // Adicionar evento de clique no botão de edição
        const btnEditar = modal.querySelector('#btnEditar');
        btnEditar.addEventListener('click', () => {
            modal.remove();
            this.abrirModalEdicao(docId, data);
        });
        
        // Adicionar evento de clique no botão de exclusão
        const btnExcluir = modal.querySelector('#btnExcluir');
        btnExcluir.addEventListener('click', () => this.excluirEsboco(docId, data.tema || 'Esboço'));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Abrir modal para mover esboço para outra pasta
    async abrirModalMoverPasta(docId, pastaAtual) {
        try {
            const pastasRef = db.collection('usuarios').doc(this.usuarioAtual.uid).collection('pastas');
            const snapshot = await pastasRef.orderBy("nome", "asc").get();

            const modal = document.createElement('div');
            modal.id = 'modalMoverPasta';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width:100%; height:100%;
                background: rgba(0,0,0,0.6); display: flex; align-items: center;
                justify-content: center; z-index: 4000;
            `;

            let pastasHTML = '';
            snapshot.forEach(doc => {
                const pasta = doc.data();
                if (pasta.nome !== pastaAtual) { // Não mostra a pasta atual como opção
                    pastasHTML += `<button class="pasta-option-btn" data-pasta-nome="${pasta.nome}">${pasta.nome}</button>`;
                }
            });

            modal.innerHTML = `
                <div style="background:white;padding:30px;border-radius:12px;max-width:400px;width:90vw;">
                    <h3 style="margin-top:0; margin-bottom:20px; text-align:center;">Mover Esboço Para...</h3>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${pastasHTML}
                    </div>
                </div>
                <style>
                    .pasta-option-btn {
                        padding: 12px 20px;
                        border: 1px solid #ddd;
                        background: #f9f9f9;
                        border-radius: 8px;
                        cursor: pointer;
                        text-align: left;
                        font-size: 1em;
                        transition: background-color 0.2s, border-color 0.2s;
                    }
                    .pasta-option-btn:hover {
                        background: #e9e9e9;
                        border-color: #ccc;
                    }
                </style>
            `;

            document.body.appendChild(modal);

            modal.querySelectorAll('.pasta-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const nomePasta = btn.getAttribute('data-pasta-nome');
                    this.atualizarEsboco(docId, { pasta: nomePasta });
                    modal.remove();
                });
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });

        } catch (error) {
            console.error("Erro ao carregar pastas para mover:", error);
            alert("Não foi possível carregar as pastas.");
        }
    }

    // Função genérica para atualizar campos do esboço
    async atualizarEsboco(docId, dados) {
        try {
            await db.collection("esbocos").doc(docId).update(dados);
            // Recarrega a visualização atual para refletir a mudança
            const filtroPasta = document.getElementById('filtroPasta');
            this.carregarHistorico(this.usuarioAtual.uid, filtroPasta.value);
            alert('Esboço atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar esboço:', error);
            alert('Erro ao atualizar o esboço.');
        }
    }

    // Exportar esboço
    exportarEsboco(titulo, conteudo) {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${titulo}</title>
            </head>
            <body>
                <h1>${titulo}</h1>
                <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${conteudo}</pre>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${titulo.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        alert('Download iniciado!');
    }

    // Abrir modal de edição
    abrirModalEdicao(docId, data) {
        const modal = document.createElement('div');
        modal.id = 'modalEdicao';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width:100%;
            height:100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;

        modal.innerHTML = `
            <div style="background:white;padding:30px;border-radius:12px;max-width:600px;width:95vw;position:relative;max-height:90vh;overflow-y:auto;">
                <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
                <h2 style="margin-bottom:20px;color:#333;">Editar Esboço</h2>
                
                <form id="formEdicaoEsboco">
                    <div style="margin-bottom:15px;">
                        <label for="edicaoTema" style="display:block;margin-bottom:5px;font-weight:600;">Tema:</label>
                        <input type="text" id="edicaoTema" value="${data.tema || ''}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;" />
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label for="edicaoTipo" style="display:block;margin-bottom:5px;font-weight:600;">Tipo de Discurso:</label>
                        <select id="edicaoTipo" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;" required>
                            <option value="">Escolha uma opção...</option>
                            <option value="tesouros" ${data.tipoDiscurso === 'tesouros' ? 'selected' : ''}>Tesouros da Palavra</option>
                            <option value="pesquisa" ${data.tipoDiscurso === 'pesquisa' ? 'selected' : ''}>Pesquisa Bíblica</option>
                            <option value="estudante" ${data.tipoDiscurso === 'estudante' ? 'selected' : ''}>Estudante</option>
                            <option value="anciao" ${data.tipoDiscurso === 'anciao' ? 'selected' : ''}>Ancião</option>
                            <option value="servo" ${data.tipoDiscurso === 'servo' ? 'selected' : ''}>Servo Ministerial</option>
                            <option value="publico" ${data.tipoDiscurso === 'publico' ? 'selected' : ''}>Discurso Público</option>
                            <option value="assembleia" ${data.tipoDiscurso === 'assembleia' ? 'selected' : ''}>Assembleia</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label for="edicaoTempo" style="display:block;margin-bottom:5px;font-weight:600;">Tempo (minutos):</label>
                        <input type="number" id="edicaoTempo" value="${data.tempo || '1'}" min="1" max="60" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;" />
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label for="edicaoConteudo" style="display:block;margin-bottom:5px;font-weight:600;">Conteúdo:</label>
                        <textarea id="edicaoConteudo" rows="12" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;resize:vertical;font-family:inherit;" required>${data.conteudo || ''}</textarea>
                    </div>
                    
                    <div style="text-align:right;">
                        <button type="button" onclick="this.closest('#modalEdicao').remove()" style="margin-right:10px;padding:10px 20px;border:1px solid #ddd;background:#f8f9fa;border-radius:4px;cursor:pointer;">Cancelar</button>
                        <button type="submit" style="padding:10px 20px;background:#4a90e2;color:white;border:none;border-radius:4px;cursor:pointer;">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Configurar evento de submit do formulário
        const form = modal.querySelector('#formEdicaoEsboco');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEdicaoEsboco(docId);
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Salvar edição do esboço
    async salvarEdicaoEsboco(docId) {
        try {
            const tema = document.getElementById('edicaoTema').value.trim();
            const tipo = document.getElementById('edicaoTipo').value;
            const tempo = document.getElementById('edicaoTempo').value;
            const conteudo = document.getElementById('edicaoConteudo').value.trim();

            // Busca o documento original para garantir que não perca campos obrigatórios
            const docRef = db.collection("esbocos").doc(docId);
            const docSnap = await docRef.get();
            const original = docSnap.exists ? docSnap.data() : {};

            // Atualiza apenas os campos editáveis, mantendo os obrigatórios se não forem editados
            const dadosAtualizados = {
                tema: tema || original.tema || "Sem tema",
                tipoDiscurso: tipo || original.tipoDiscurso || "não especificado",
                tempo: tempo || original.tempo || "",
                conteudo: conteudo || original.conteudo || "",
                editadoEm: firebase.firestore.FieldValue.serverTimestamp()
            };

            await docRef.update(dadosAtualizados);

            // Fechar modal
            document.getElementById('modalEdicao').remove();

            // Recarregar histórico
            await this.carregarHistorico(this.usuarioAtual.uid);

            alert('Esboço editado com sucesso!');

        } catch (error) {
            console.error('Erro ao editar esboço:', error);
            alert('Erro ao salvar edição:' + error.message);
        }
    }

    // Carregar notificações do usuário
    async carregarNotificacoes(uid) {
        const notificacoesList = document.getElementById('notificacoesList');
        if (!notificacoesList) return;
        
        notificacoesList.innerHTML = '<li style="color:#666;font-style:italic;">Carregando notificações...</li>';
        
        try {
            // Unsubscribe de listeners anteriores para evitar duplicação
            if (this.unsubscribeNotificacoes) {
                this.unsubscribeNotificacoes();
            }
    
            this.unsubscribeNotificacoes = db.collection("notificacoes")
                .where("destinatarios", "array-contains", uid)
                .onSnapshot(async (snapshotEspecificas) => {
                    
                    const snapshotGerais = await db.collection("notificacoes").where("geral", "==", true).get();
                    
            const todasNotificacoes = [];
                    snapshotEspecificas.docs.forEach(doc => todasNotificacoes.push({ id: doc.id, ...doc.data() }));
            snapshotGerais.docs.forEach(doc => {
                        // Evita duplicatas se uma notificação for geral e específica
                        if (!todasNotificacoes.some(n => n.id === doc.id)) {
                    todasNotificacoes.push({ id: doc.id, ...doc.data() });
                }
            });

            if (todasNotificacoes.length === 0) {
                notificacoesList.innerHTML = '<li style="color:#666;font-style:italic;">Nenhuma notificação</li>';
                this.atualizarContadorNotificacoes(0);
                return;
            }

                    // Ordena por data, mais recente primeiro
                    todasNotificacoes.sort((a, b) => (b.data?.toDate() || 0) - (a.data?.toDate() || 0));

            notificacoesList.innerHTML = '';
            let naoLidas = 0;

                    todasNotificacoes.forEach(data => {
                        if (!data.lida) naoLidas++;
                
                const li = document.createElement('li');
                li.style.cssText = `
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 8px;
                    background: ${data.lida ? '#f8fa' : '#e3f2fd'};
                    border-left: 4px solid ${data.lida ? '#6c757d' : '#007bff'};
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                `;

                const indicadorGeral = data.geral ? '<span style="background:#ff6b6b;color:white;padding:2px 6px;border-radius:10px;font-size:10px;margin-left:5px;">GERAL</span>' : '';

                li.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="font-weight:600;color:#333;margin-bottom:4px;">
                                ${data.titulo || 'Sem título'}
                                ${indicadorGeral}
                            </div>
                            <div style="font-size:0.9em;color:#666;margin-bottom:4px;">${data.mensagem || 'Sem mensagem'}</div>
                            <div style="font-size:0.8em;color:#666;">${data.data?.toDate ? data.data.toDate().toLocaleString('pt-BR') : 'Data não disponível'}
                                ${data.geral && data.totalDestinatarios ? ` | Para ${data.totalDestinatarios} usuários` : ''}
                            </div>
                        </div>
                        ${!data.lida ? '<span style="background:#ff4757;color:white;padding:2px 6px;border-radius:10px;font-size:10px;">NOVA</span>' : ''}
                    </div>
                `;

                li.addEventListener('click', () => {
                            this.marcarNotificacaoComoLida(data.id, data);
                    this.mostrarDetalhesNotificacao(data);
                });

                li.addEventListener('mouseenter', () => {
                    li.style.transform = 'translateX(5px)';
                    li.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                });

                li.addEventListener('mouseleave', () => {
                    li.style.transform = 'translateX(0)';
                    li.style.boxShadow = 'none';
                });

                notificacoesList.appendChild(li);
            });

            this.atualizarContadorNotificacoes(naoLidas);
                }, (error) => {
                    console.error("Erro no listener de notificações:", error);
                    notificacoesList.innerHTML = '<li style="color:red;">Erro ao carregar notificações.</li>';
                });

        } catch (error) {
            console.error("Erro ao configurar listener de notificações:", error);
            notificacoesList.innerHTML = '<li style="color:red;">Erro fatal ao carregar notificações.</li>';
        }
    }

    // Atualizar contador de notificações
    async atualizarContadorNotificacoes(count = null) {
        try {
            let naoLidas = count;
            
            if (count === null) {
                // Contar notificações específicas não lidas
                const snapshotEspecificas = await db.collection("notificacoes")
                    .where("destinatarios", "array-contains", this.usuarioAtual.uid)
                    .where("geral", "==", false)
                    .where("lida", "==", false)
                    .get();

                // Contar notificações gerais não lidas
                const snapshotGerais = await db.collection("notificacoes")
                    .where("geral", "==", true)
                    .where("lida", "==", false)
                    .get();

                naoLidas = snapshotEspecificas.size + snapshotGerais.size;
            }

            const badge = document.getElementById('menuNotificacaoBadge');
            const countElement = document.getElementById('notificacaoCount');
            
            if (badge) {
                if (naoLidas > 0) {
                    badge.style.display = 'flex';
                    badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
                } else {
                    badge.style.display = 'none';
                }
            }
            
            if (countElement) {
                if (naoLidas > 0) {
                    countElement.style.display = 'inline';
                    countElement.textContent = naoLidas;
                } else {
                    countElement.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("Erro ao atualizar contador:", error);
        }
    }

    // Marcar notificação como lida
    async marcarNotificacaoComoLida(docId, notificacao) {
        try {
            await db.collection("notificacoes").doc(docId).update({
                lida: true,
                lidaEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Recarregar notificações
            await this.carregarNotificacoes(this.usuarioAtual.uid);
            
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
        }
    }

    // Marcar todas as notificações como lidas
    async marcarTodasComoLidas() {
        try {
            if (!this.usuarioAtual) {
                alert('Usuário não autenticado');
                return;
            }

            // Marcar notificações específicas como lidas
            const snapshotEspecificas = await db.collection("notificacoes")
                .where("destinatarios", "array-contains", this.usuarioAtual.uid)
                .where("geral", "==", false)
                .where("lida", "==", false)
                .get();

            // Marcar notificações gerais como lidas
            const snapshotGerais = await db.collection("notificacoes")
                .where("geral", "==", true)
                .where("lida", "==", false)
                .get();

            const batch = db.batch();
            
            // Adicionar notificações específicas ao batch
            snapshotEspecificas.docs.forEach(doc => {
                batch.update(doc.ref, {
                    lida: true,
                    lidaEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            // Adicionar notificações gerais ao batch
            snapshotGerais.docs.forEach(doc => {
                batch.update(doc.ref, {
                    lida: true,
                    lidaEm: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
            
            // Recarregar notificações
            await this.carregarNotificacoes(this.usuarioAtual.uid);
            
            alert('Todas as notificações foram marcadas como lidas!');
            
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas:', error);
            alert('Erro ao marcar notificações como lidas:' + error.message);
        }
    }

    // Mostrar detalhes da notificação
    mostrarDetalhesNotificacao(notificacao) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        `;

        const tipoNotificacao = notificacao.geral ? 
            `<span style="background:#ff6b6b;color:white;padding:4px 8px;border-radius:12px;font-size:12px;">NOTIFICAÇÃO GERAL</span>` : 
            `<span style="background:#4a90e2;color:white;padding:4px 8px;border-radius:12px;font-size:12px;">NOTIFICAÇÃO ESPECÍFICA</span>`;

        modal.innerHTML = `
            <div style="background:white;padding:30px;border-radius:12px;max-width:500px;width:90vw;position:relative;">
                <button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:10px;right:15px;background:none;border:none;font-size:24px;cursor:pointer;">×</button>
                <div style="margin-bottom:15px;">
                    ${tipoNotificacao}
                </div>
                <h2 style="margin-bottom:15px;color:#333;">${notificacao.titulo || 'Sem título'}</h2>
                <div style="margin-bottom:20px;color:#666;font-size:1em;line-height:1.6;white-space:pre-wrap;">${notificacao.mensagem || 'Sem mensagem'}</div>
                <div style="font-size:0.9em;color:#999;margin-bottom:20px;">
                    <strong>Enviada em:</strong> ${notificacao.data?.toDate ? notificacao.data.toDate().toLocaleString('pt-BR') : 'Data não disponível'}<br>
                    <strong>Por:</strong> ${notificacao.admin || 'Sistema'}<br>
                    ${notificacao.geral && notificacao.totalDestinatarios ? `<strong>Para:</strong> ${notificacao.totalDestinatarios} usuários<br>` : ''}
                    <strong>Status:</strong> ${notificacao.lida ? 'Lida' : 'Não lida'}                </div>
                <div style="text-align: right; margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                    ${notificacao.link ? `<a href="${notificacao.link}" target="_blank" class="btn" style="text-decoration:none;">🔗 Ver mais</a>` : ''}
                    <button id="btnExcluirNotificacao" class="btn" style="background:#dc3545;color:white;border:none;">🗑️ Apagar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar evento de clique no botão de apagar
        const btnExcluir = modal.querySelector('#btnExcluirNotificacao');
        if (btnExcluir) {
            btnExcluir.addEventListener('click', () => {
                modal.remove(); // Fecha o modal antes de apagar
                this.excluirNotificacao(notificacao.id);
            });
        }
        
        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Excluir (ocultar) uma notificação para o usuário
    async excluirNotificacao(notifId) {
        if (!notifId) return;

        const confirmacao = confirm('Tem certeza que deseja apagar esta notificação?\n\nEla não aparecerá mais para você.');
        if (confirmacao) {
            try {
                const user = this.usuarioAtual;
                if (!user) {
                    alert('Usuário não autenticado.');
                    return;
                }

                // Adiciona o ID da notificação a uma subcoleção para "ocultá-la"
                await db.collection('usuarios').doc(user.uid).collection('notificacoesOcultas').doc(notifId).set({
                    ocultaEm: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Notificação apagada com sucesso.');
                await this.carregarNotificacoes(user.uid);

            } catch (error) {
                console.error('Erro ao apagar notificação:', error);
                alert('Ocorreu um erro ao apagar a notificação.');
            }
        }
    }

    // Logout
    async logout() {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    }

    // Excluir esboço
    async excluirEsboco(docId, tema) {
        const confirmacao = confirm(`Tem certeza que deseja excluir o esboço ${tema}"?\n\nEsta ação não pode ser desfeita.`);
        
        if (confirmacao) {
            try {
                await db.collection("esbocos").doc(docId).delete();
                
                // Fechar modal de detalhes se estiver aberto
                const modalDetalhes = document.querySelector('div[style*="z-index: 3000"]');
                if (modalDetalhes) {
                    modalDetalhes.remove();
                }
                
                // Recarregar histórico
                await this.carregarHistorico(this.usuarioAtual.uid);
                
                alert('Esboço excluído com sucesso!');
                
            } catch (error) {
                console.error('Erro ao excluir esboço:', error);
                alert('Erro ao excluir esboço:' + error.message);
            }
        }
    }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.geradorEsboco = new GeradorEsboco();
}); 