// Configurações da API
// Firebase auth e db são inicializados em firebase-init.js e estão disponíveis globalmente.
// ATENÇÃO: Esta URL deve ser configurada para o ambiente de produção.
const API_URL = 'https://web-production-8bcb.up.railway.app/';


// Elementos DOM utilizados na aplicação, mapeados para fácil acesso
const elementos = {
    tipoDiscurso: document.getElementById('tipoDiscurso'), // Select do tipo de discurso
    tema: document.getElementById('tema'), // Input do tema
    tempo: document.getElementById('tempo'), // Input do tempo
    informacoesAdicionais: document.getElementById('informacoesAdicionais'), // Input de informações adicionais
    versiculosOpicionais: document.getElementById('versiculosOpicionais'), // Input de versículos opcionais
    topicosOpicionais: document.getElementById('topicosOpicionais'), // Input de tópicos opcionais
    loading: document.getElementById('loading'), // Elemento de loading
    resultSection: document.getElementById('resultSection'), // Seção de resultado
    errorMessage: document.getElementById('errorMessage'), // Mensagem de erro
    resultTitle: document.getElementById('resultTitle'), // Título do resultado
    resultType: document.getElementById('resultType'), // Tipo do resultado
    pontosList: document.getElementById('pontosList'), // Lista de pontos (não utilizado)
    referenciasList: document.getElementById('referenciasList'), // Lista de referências/resultados
    userInfo: document.getElementById('userInfo'), // Exibição do usuário logado
    historicoList: document.getElementById('historicoList'), // Lista de histórico de esboços
    sidebar: document.getElementById('sidebar'), // Menu lateral
    btnDownload: document.getElementById('btnDownload') // Botão de download
};

  

// Classe principal da aplicação, responsável por toda a lógica de geração, exibição e histórico de esboços
class GeradorEsboco {
    constructor() {
        this.usuarioAtual = null; // Usuário autenticado
        this.inicializar(); // Inicializa listeners e autenticação
    }

    // Inicializa listeners de eventos e autenticação
    inicializar() {
        this.configurarEventListeners();
        this.configurarAuthStateListener();
    }

    // Configura os listeners dos elementos do DOM para interação do usuário
    configurarEventListeners() {
        // Gera esboço ao pressionar Enter no campo tema
        elementos.tema?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.gerarEsboco();
        });

        // Esconde elementos ao mudar o tipo de discurso
        elementos.tipoDiscurso?.addEventListener('change', () => {
            this.esconderElementos();
        });

        // Esconde mensagem de erro ao digitar no campo tema
        elementos.tema?.addEventListener('input', () => {
            if (elementos.errorMessage?.style.display === 'block') {
                elementos.errorMessage.style.display = 'none';
            }
        });
    }

    // Configura o listener para mudanças no estado de autenticação do Firebase
    configurarAuthStateListener() {
        auth.onAuthStateChanged(async (user) => {
            this.usuarioAtual = user;
            
            if (user) {
                await this.carregarDadosUsuario(user);
            } else {
                this.redirecionarParaLogin();
            }
        });
    }

    // Carrega dados do usuário autenticado e exibe no layout
    async carregarDadosUsuario(user) {
        try {
            const nomeUsuario = user.displayName || user.email || "Usuário";
            
            if (elementos.userInfo) {
                elementos.userInfo.textContent = `👤 Usuário: ${nomeUsuario}`;
            }
            
            await this.carregarHistorico(user.uid); // Carrega histórico do usuário
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            this.mostrarErro("Erro ao carregar dados do usuário");
        }
    }

    // Carrega o histórico de esboços do usuário autenticado
    async carregarHistorico(uid) {
        if (!elementos.historicoList) {
            console.warn("Elemento historicoList não encontrado");
            return;
        }

        try {
            elementos.historicoList.innerHTML = '<li>Carregando histórico...</li>';

            // Consulta os últimos 10 esboços do usuário, ordenados por data de criação
            const query = db.collection("esbocos")
                .where("uid", "==", uid)
                .orderBy("criadoEm", "desc")
                .limit(10);
                
            const snapshot = await query.get();
            console.log("Query de histórico executada:", snapshot.size, "documentos");
            
            this.processarHistorico(snapshot); // Processa e exibe o histórico

        } catch (error) {
            console.error("Erro detalhado ao carregar histórico:", error);
            // O erro pode ser devido à ausência do índice mencionado acima.
            console.error("Código do erro:", error.code);
            console.error("Mensagem do erro:", error.message);
            
            // Mostra mensagem de erro específica para o usuário
            let mensagemErro = "Erro ao carregar histórico.";
            
            if (error.code === 'permission-denied') {
                mensagemErro = "Permissão negada para acessar o histórico.";
            } else if (error.code === 'failed-precondition') {
                mensagemErro = "Índice necessário não encontrado no Firestore.";
            } else if (error.code === 'unavailable') {
                mensagemErro = "Serviço temporariamente indisponível.";
            }
            
            elementos.historicoList.innerHTML = `<li style="color: red;">${mensagemErro}</li>`;
        }
    }

    // Processa o snapshot do Firestore e exibe o histórico de esboços na sidebar
    processarHistorico(snapshot) {
        elementos.historicoList.innerHTML = '';

        if (snapshot.empty) {
            elementos.historicoList.innerHTML = '<li>Você ainda não gerou esboços.</li>';
            return;
        }

        // Converte os documentos em array e ordena por data
        const docs = [];
            snapshot.forEach(doc => {
            docs.push({ id: doc.id, data: doc.data() });
        });

        // Ordena manualmente por data, caso necessário
        docs.sort((a, b) => {
            const dateA = a.data.criadoEm?.toDate() || new Date(0);
            const dateB = b.data.criadoEm?.toDate() || new Date(0);
            return dateB - dateA; // Ordem decrescente
        });

        // Cria elementos de lista para cada esboço do histórico
        docs.forEach(({ id, data }) => {
            try {
                const li = document.createElement('li');
                
                const dataFormatada = data.criadoEm?.toDate()?.toLocaleString('pt-BR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || 'Data não disponível';
                
                const tema = data.tema || 'Sem tema';
                const tipo = this.formatarTipoDiscurso(data.tipoDiscurso) || 'Tipo não especificado';
                
                li.innerHTML = `
                    <strong>${tipo}</strong><br>
                    <span style="font-size: 0.9em;">${tema}</span><br>
                    <small style="color: #666;">${dataFormatada}</small>
                `;
                
                li.style.cssText = `
                    cursor: pointer;
                    padding: 8px;
                    margin: 4px 0;
                    border-left: 3px solid #4a90e2;
                    background: #f9f9f9;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                `;
                
                // Destaca item ao passar o mouse
                li.addEventListener('mouseenter', () => {
                    li.style.backgroundColor = '#e8f4f8';
                });
                
                li.addEventListener('mouseleave', () => {
                    li.style.backgroundColor = '#f9f9f9';
                });
                
                // Permite carregar o esboço ao clicar no item
                li.addEventListener('click', () => this.carregarEsbocoDoHistorico(id));

                // Permite editar ao clicar com o botão direito
                li.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.abrirModalEdicao(id, data);
                });
                
                elementos.historicoList.appendChild(li);
            
            } catch (itemError) {
                console.error("Erro ao processar item do histórico:", itemError);
        }
        });
    }

    // Formata o tipo de discurso para exibição amigável
    formatarTipoDiscurso(tipo) {
        const tipos = {
            'estudante': 'Estudante',
            'anciao': 'Ancião',
            'servo': 'Servo Ministerial',
            'publico': 'Discurso Público',
            'assembleia': 'Assembleia'
        };
        return tipos[tipo] || tipo;
    }

    // Carrega um esboço específico do histórico ao clicar em um item
    async carregarEsbocoDoHistorico(docId) {
        try {
            console.log("Carregando esboço do histórico:", docId);
            
            const doc = await db.collection("esbocos").doc(docId).get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log("Dados do esboço carregado:", data);
                
                // Verifica se o conteúdo existe
                if (data.conteudo) {
                    this.mostrarResultado({ output: data.conteudo });
                    this.fecharMenu();
                    this.mostrarNotificacao('Esboço carregado do histórico!');
                } else {
                    this.mostrarErro('Conteúdo do esboço não encontrado.');
                }
            } else {
                this.mostrarErro('Esboço não encontrado no histórico.');
            }
        } catch (error) {
            console.error("Erro ao carregar esboço do histórico:", error);
            this.mostrarErro("Erro ao carregar esboço do histórico: " + error.message);
        }
    }

    // Função principal para gerar um novo esboço a partir do formulário
    async gerarEsboco() {
        const dadosFormulario = this.obterDadosFormulario();
        
        if (!this.validarDados(dadosFormulario)) {
            return;
        }

        this.mostrarCarregamento(true);
        this.esconderElementos();

        try {
            const response = await this.enviarRequisicao(dadosFormulario); // Chama API
            const data = await response.json();
            
            console.log('Resposta do servidor:', data);

            if (!data || typeof data !== 'object') {
                throw new Error('Resposta inválida do servidor');
            }

            await this.salvarEsbocoNoFirestore(dadosFormulario, data); // Salva no Firestore
            this.mostrarResultado(data); // Exibe resultado
            
            if (elementos.btnDownload) {
                elementos.btnDownload.style.display = 'inline-block';
            }

        } catch (error) {
            console.error('Erro ao gerar esboço:', error);
            this.mostrarErro(`Erro ao gerar esboço: ${error.message}`);
        } finally {
            this.mostrarCarregamento(false);
        }
    }

    // Obtém os dados preenchidos no formulário
    obterDadosFormulario() {
        return {
            tipoDiscurso: elementos.tipoDiscurso?.value || '',
            tempo: elementos.tempo?.value?.trim() || '',
            tema: elementos.tema?.value?.trim() || '',
            informacoesAdicionais: elementos.informacoesAdicionais?.value?.trim() || '',
            versiculosOpicionais: elementos.versiculosOpicionais?.value?.trim() || '',
            topicosOpicionais: elementos.topicosOpicionais?.value?.trim() || ''
        };
    }

    // Valida os dados do formulário antes de enviar para a API
    validarDados(dados) {
        if (!dados.tipoDiscurso) {
            this.mostrarAlerta('Por favor, selecione o tipo de discurso!');
            return false;
        }
        
        if (!dados.tema) {
            this.mostrarAlerta('Por favor, insira o tema do discurso!');
            return false;
        }
        
        if (dados.tipoDiscurso === 'publico') {
            this.mostrarAlerta('Ferramenta disponível em breve. Por favor, escolha outro tipo de discurso.');
            return false;
        }

        return true;
    }

    // Envia os dados do formulário para a API e retorna a resposta
    async enviarRequisicao(dados) {
        const temaFormatado = encodeURIComponent(dados.tema);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo_discurso: dados.tipoDiscurso,
                tempo: dados.tempo,
                tema: temaFormatado,
                informacoes_adicionais: dados.informacoesAdicionais,
                versiculos_opicionais: dados.versiculosOpicionais,
                topicos_opicionais: dados.topicosOpicionais
            })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        return response;
    }

    // Salva o esboço gerado no Firestore, vinculado ao usuário autenticado
    async salvarEsbocoNoFirestore(dadosFormulario, resultado) {
        if (!this.usuarioAtual) {
            console.warn("Usuário não autenticado, não é possível salvar");
            return;
        }

        try {
            const texto = Array.isArray(resultado) ? resultado[0].output : resultado.output;
            
            if (!texto) {
                console.warn("Conteúdo vazio, não será salvo");
                return;
            }

            const docData = {
                uid: this.usuarioAtual.uid,
                tipoDiscurso: dadosFormulario.tipoDiscurso,
                tempo: dadosFormulario.tempo,
                tema: dadosFormulario.tema,
                informacoesAdicionais: dadosFormulario.informacoesAdicionais || '',
                versiculosOpicionais: dadosFormulario.versiculosOpicionais || '',
                topicosOpicionais: dadosFormulario.topicosOpicionais || '',
                conteudo: texto,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log("Salvando esboço no Firestore:", docData);
            
            const docRef = await db.collection("esbocos").add(docData);
            console.log("Esboço salvo com ID:", docRef.id);

            // Recarrega histórico após salvar
            await this.carregarHistorico(this.usuarioAtual.uid);
            
            this.mostrarNotificacao('Esboço salvo com sucesso!');
            
        } catch (error) {
            console.error("Erro ao salvar esboço:", error);
            console.error("Código do erro:", error.code);
            console.error("Mensagem do erro:", error.message);
            
            // Não mostra erro para o usuário se for apenas problema de salvamento
            // O esboço ainda será exibido
        }
    }

    // Exibe o resultado do esboço gerado na tela
    mostrarResultado(esboco) {
        try {
            const texto = Array.isArray(esboco) ? esboco[0].output : esboco.output;

            if (!texto) {
                throw new Error('Esboço sem conteúdo');
            }

            if (elementos.resultTitle) {
                elementos.resultTitle.textContent = 'Esboço Gerado';
            }
            
            if (elementos.resultType) {
                elementos.resultType.textContent = 'Discurso Personalizado';
            }

            if (elementos.pontosList) {
                elementos.pontosList.innerHTML = '';
            }

            if (elementos.referenciasList) {
                elementos.referenciasList.innerHTML = '';

                const pre = document.createElement('pre');
                pre.innerHTML = this.formatarNegrito(texto);
                pre.style.cssText = `
                    white-space: pre-wrap;
                    font-family: inherit;
                    line-height: 1.6;
                    background: #f9f9f9;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 0;
                `;

                elementos.referenciasList.appendChild(pre);
            }

            if (elementos.resultSection) {
                elementos.resultSection.style.display = 'block';
                elementos.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

        } catch (error) {
            console.error('Erro ao processar resultado:', error);
            this.mostrarErro('Erro ao processar os dados recebidos');
        }
    }

    // Formata trechos do texto entre **negrito** para HTML <strong>
    formatarNegrito(texto) {
        return texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    // Exibe ou esconde o indicador de carregamento e desabilita o botão principal
    mostrarCarregamento(mostrar) {
        if (elementos.loading) {
            elementos.loading.style.display = mostrar ? 'block' : 'none';
        }

        const botao = document.querySelector('.btn');
        if (botao) {
            botao.disabled = mostrar;
            botao.textContent = mostrar ? '⏳ Gerando...' : '🔍 Gerar Esboço';
        }
    }

    // Esconde seções de resultado, erro e download
    esconderElementos() {
        if (elementos.resultSection) {
            elementos.resultSection.style.display = 'none';
        }
        if (elementos.errorMessage) {
            elementos.errorMessage.style.display = 'none';
        }
        if (elementos.btnDownload) {
            elementos.btnDownload.style.display = 'none';
        }
    }

    // Exibe mensagem de erro na tela
    mostrarErro(mensagem) {
        if (elementos.errorMessage) {
            elementos.errorMessage.textContent = mensagem;
            elementos.errorMessage.style.display = 'block';
            elementos.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Exibe alerta nativo do navegador
    mostrarAlerta(mensagem) {
        alert(mensagem);
    }

    // Redireciona o usuário para a tela de login
    redirecionarParaLogin() {
        window.location.href = "login.html";
    }

    // Abre o menu lateral (sidebar)
    abrirMenu() {
        if (elementos.sidebar) {
            elementos.sidebar.style.width = "300px";
        }
    }

    // Fecha o menu lateral (sidebar)
    fecharMenu() {
        if (elementos.sidebar) {
            elementos.sidebar.style.width = "0";
        }
    }

    // Realiza logout do usuário autenticado
    async logout() {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao sair:', error);
            this.mostrarErro('Erro ao fazer logout');
        }
    }

    // Copia texto para o clipboard do usuário
    async copiarTexto(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            this.mostrarNotificacao('Texto copiado!');
        } catch (err) {
            console.error('Erro ao copiar texto:', err);
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = texto;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.mostrarNotificacao('Texto copiado!');
        }
    }

    // Exibe uma notificação temporária no canto da tela
    mostrarNotificacao(mensagem) {
        const notificacao = document.createElement('div');
        notificacao.className = 'notificacao';
        notificacao.textContent = mensagem;
        notificacao.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a90e2;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(notificacao);
        
        setTimeout(() => { notificacao.style.opacity = '1'; }, 10);
        
        setTimeout(() => {
            notificacao.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notificacao)) {
                    document.body.removeChild(notificacao);
                }
            }, 300);
        }, 3000);
    }

    // Permite baixar o esboço gerado como arquivo .doc (Word)
    baixarComoWord() {
        const titulo = elementos.resultTitle?.textContent || 'Esboço';
        const tipo = elementos.resultType?.textContent || '';
        const pre = elementos.referenciasList?.querySelector('pre');

        if (!pre) {
            this.mostrarErro('Nenhum conteúdo para exportar.');
            return;
        }

        const conteudo = `${titulo}\n${tipo}\n\n${pre.textContent}`;
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${titulo}</title>
            </head>
            <body>
                <h1>${titulo}</h1>
                <h2>${tipo}</h2>
                <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${pre.textContent}</pre>
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
        this.mostrarNotificacao('Download iniciado!');
    }

    // Exporta o resultado do esboço para o clipboard
    exportarResultado() {
        const titulo = elementos.resultTitle?.textContent || '';
        const tipo = elementos.resultType?.textContent || '';
        const pre = elementos.referenciasList?.querySelector('pre');

        if (!pre) {
            this.mostrarErro('Nenhum conteúdo para exportar.');
            return;
        }

        const conteudo = `${titulo}\n${tipo}\n\n${pre.textContent}`.trim();
        this.copiarTexto(conteudo);
    }

    // Limpa todos os campos do formulário e esconde resultados
    limparFormulario() {
        if (elementos.tipoDiscurso) elementos.tipoDiscurso.value = '';
        if (elementos.tempo) elementos.tempo.value = '';
        if (elementos.tema) elementos.tema.value = '';
        if (elementos.informacoesAdicionais) elementos.informacoesAdicionais.value = '';
        if (elementos.versiculosOpicionais) elementos.versiculosOpicionais.value = '';
        if (elementos.topicosOpicionais) elementos.topicosOpicionais.value = '';
        
        this.esconderElementos();
    }
}

// Inicializa a aplicação quando o DOM estiver carregado
// Cria uma instância global de GeradorEsboco acessível pelo window
// Isso permite que funções globais chamem métodos da classe

document.addEventListener('DOMContentLoaded', () => {
    window.geradorEsboco = new GeradorEsboco();
}); 

// Funções globais para serem chamadas pelo HTML (ex: onclick nos botões)
// Cada função chama o método correspondente da instância global
function gerarEsboco() {
    window.geradorEsboco?.gerarEsboco();
}

function abrirMenu() {
    window.geradorEsboco?.abrirMenu();
}

function fecharMenu() {
    window.geradorEsboco?.fecharMenu();
}

function logout() {
    window.geradorEsboco?.logout();
}

function baixarComoWord() {
    window.geradorEsboco?.baixarComoWord();
}

function exportarResultado() {
    window.geradorEsboco?.exportarResultado();
}

function limparFormulario() {
    window.geradorEsboco?.limparFormulario();
}