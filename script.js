// Configurações da API
const API_URL = 'http://localhost:5678/webhook-test/fd061969-eb2c-4355-89da-910ec299d4ef'; // URL do webhook n8n

// Elementos DOM
const elementos = {
    tipoDiscurso: document.getElementById('tipoDiscurso'),
    tema: document.getElementById('tema'),
    informacoesAdicionais: document.getElementById('informacoesAdicionais'),
    versiculosOpicionais: document.getElementById('versiculosOpicionais'),
    topicosOpicionais: document.getElementById('topicosOpicionais'),
    loading: document.getElementById('loading'),
    resultSection: document.getElementById('resultSection'),
    errorMessage: document.getElementById('errorMessage'),
    resultTitle: document.getElementById('resultTitle'),
    resultType: document.getElementById('resultType'),
    pontosList: document.getElementById('pontosList'),
    referenciasList: document.getElementById('referenciasList'),
    btnGerarEsboco: document.getElementById('btnGerarEsboco'),
    btnDownload: document.getElementById('btnDownload')
};

// Função principal para gerar esboço
async function gerarEsboco() {
    const tipoDiscursoValue = elementos.tipoDiscurso.value;
    const temaValue = elementos.tema.value.trim();
    const informacoesAdicionaisValue = elementos.informacoesAdicionais.value.trim();
    const versiculosOpicionaisValue = elementos.versiculosOpicionais.value.trim();
    const topicosOpicionaisValue = elementos.topicosOpicionais.value.trim();

    if (!tipoDiscursoValue) {
        mostrarAlerta('Por favor, selecione o tipo de discurso!');
        return;
    }
    if (!temaValue) {
        mostrarAlerta('Por favor, insira o tema do discurso!');
        return;
    }

    // Handle "Em breve" options
    const selectedOption = elementos.tipoDiscurso.options[elementos.tipoDiscurso.selectedIndex];
    if (selectedOption.dataset.emBreve === "true") {
        mostrarInfo('Esta opção de discurso estará disponível em breve. Por favor, escolha outra.');
        return;
    }

    mostrarCarregamento(true);
    esconderElementos();
    elementos.btnDownload.style.display = 'none'; // Hide download button until results are ready

    try {
        const temaFormatado = temaValue ? encodeURIComponent(temaValue) : null;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo_discurso: tipoDiscursoValue,
                tema: temaFormatado,
                informacoes_adicionais: informacoesAdicionaisValue,
                versiculos_opicionais: versiculosOpicionaisValue,
                topicos_opicionais: topicosOpicionaisValue
            })
        });

        if (!response.ok) {
            let errorMsg = `Erro HTTP: ${response.status} - ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg += `\nDetalhes: ${JSON.stringify(errorData)}`;
            } catch (e) {
                // Ignore if error response is not JSON
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!data || typeof data !== 'object') throw new Error('Resposta inválida do servidor. O formato esperado não foi recebido.');

        mostrarResultado(data, temaValue);
        elementos.btnDownload.style.display = 'inline-block'; // Show download button

    } catch (error) {
        console.error('Erro ao gerar esboço:', error);
        mostrarErro(`Falha ao gerar esboço. Por favor, tente novamente. Detalhes: ${error.message}`);
    } finally {
        mostrarCarregamento(false);
    }
}

// Mostrar carregamento
function mostrarCarregamento(mostrar) {
    elementos.loading.style.display = mostrar ? 'flex' : 'none'; // Changed to flex for better centering if needed
    if (elementos.btnGerarEsboco) {
        elementos.btnGerarEsboco.disabled = mostrar;
        elementos.btnGerarEsboco.textContent = mostrar ? '⏳ Gerando...' : '🔍 Gerar Esboço';
    }
}

// Esconder elementos de resultado e erro
function esconderElementos() {
    elementos.resultSection.style.display = 'none';
    elementos.errorMessage.style.display = 'none';
}

// Mostrar resultado
function mostrarResultado(esboco, temaOriginal) {
    try {
        const texto = Array.isArray(esboco) && esboco.length > 0 && esboco[0].output ? esboco[0].output : esboco.output;

        if (!texto || typeof texto !== 'string') throw new Error('Esboço sem conteúdo ou em formato inválido.');

        elementos.resultTitle.textContent = temaOriginal || 'Esboço Gerado';
        elementos.resultType.textContent = obterTextoTipo(elementos.tipoDiscurso.value);

        // Limpar conteúdo anterior
        elementos.pontosList.innerHTML = ''; // Assuming this might be used in future
        elementos.referenciasList.innerHTML = '';

        // Processar e exibir o texto do esboço
        // Para "Referências Bíblicas", vamos assumir que o texto já vem formatado ou que uma formatação mais complexa (como separar em itens)
        // dependeria da estrutura exata da string 'texto'. Por agora, mantemos o <pre> para preservar a formatação.
        const pre = document.createElement('pre');
        pre.innerHTML = formatarConteudo(texto); // Usar uma função mais genérica para formatação
        pre.className = 'conteudo-esboco'; // Adicionar classe para estilização

        elementos.referenciasList.appendChild(pre);

        elementos.resultSection.style.display = 'block';
        elementos.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Erro ao processar resultado:', error);
        mostrarErro(`Erro ao exibir o esboço: ${error.message}`);
        elementos.resultSection.style.display = 'none'; // Hide section if error occurs during display
    }
}

function formatarConteudo(texto) {
    // Formatar negrito
    let html = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Adicionar mais formatações se necessário (ex: listas, itálico)
    // Exemplo simples para parágrafos (assumindo quebras de linha duplas separam parágrafos)
    // html = html.split(/\n\s*\n/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    // Por enquanto, a formatação de parágrafos será mantida pelo <pre> e CSS white-space: pre-wrap.
    return html;
}


function baixarComoWord() {
    const titulo = elementos.resultTitle.textContent || 'Esboço';
    const tipo = elementos.resultType.textContent || '';
    const conteudoEsbocoEl = elementos.referenciasList.querySelector('.conteudo-esboco');

    if (!conteudoEsbocoEl || !conteudoEsbocoEl.textContent) {
        return mostrarErro('Nenhum conteúdo para exportar.');
    }

    // Usar innerHTML do <pre> para tentar manter alguma formatação como negrito
    // e converter quebras de linha para <br> para melhor visualização no Word.
    let conteudoHtml = conteudoEsbocoEl.innerHTML.replace(/\n/g, '<br>');

    const htmlCompleto = `
        <html>
            <head>
                <meta charset="utf-8">
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.5; }
                    h1 { color: #333; }
                    p { margin-bottom: 10px; }
                    strong { font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <p><em>${tipo}</em></p>
                <hr>
                <div>${conteudoHtml}</div>
            </body>
        </html>`;

    const blob = new Blob([htmlCompleto], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${titulo.replace(/[^a-z0-9_]+/gi, '_').toLowerCase()}.doc`; // Sanitize filename

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href); // Clean up
}

// Obter texto do tipo
function obterTextoTipo(tipoValue) {
    const tipos = {
        'tesouros': 'Tesouros da Palavra de Deus',
        //'publico': 'Discurso Público'
    };
    return tipos[tipo] || 'Tipo não especificado';
}

// Mostrar erro
function mostrarErro(mensagem) {
    elementos.errorMessage.textContent = mensagem;
    elementos.errorMessage.style.display = 'block';
    elementos.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Mostrar alerta (simples, pode ser melhorado com um modal customizado no futuro)
function mostrarAlerta(mensagem) {
    alert(mensagem); // Mantido por simplicidade, mas idealmente seria um modal não bloqueante.
}

// Mostrar informação (similar ao alerta, mas para mensagens não críticas)
function mostrarInfo(mensagem) {
    // Por enquanto, usa alert. Poderia ser um toast/snackbar não bloqueante.
    alert(mensagem);
}


// Copiar texto
async function copiarTexto(texto) {
    try {
        if (!navigator.clipboard) {
            throw new Error('Clipboard API não disponível');
        }
        await navigator.clipboard.writeText(texto);
        mostrarNotificacao('Texto copiado para a área de transferência!', 'success');
    } catch (err) {
        console.error('Erro ao copiar texto:', err);
        // Fallback para execCommand (menos seguro e obsoleto, mas útil em alguns contextos)
        try {
            const textArea = document.createElement('textarea');
            textArea.value = texto;
            textArea.style.position = 'fixed'; // Prevenir scroll
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            mostrarNotificacao('Texto copiado para a área de transferência! (fallback)', 'success');
        } catch (fallbackErr) {
            console.error('Erro no fallback de copiar texto:', fallbackErr);
            mostrarNotificacao('Falha ao copiar texto.', 'error');
        }
    }
}

// Mostrar notificação (refatorada para usar classes CSS)
function mostrarNotificacao(mensagem, tipo = 'info') { // tipo pode ser 'info', 'success', 'error'
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao show ${tipo}`;
    notificacao.textContent = mensagem;

    document.body.appendChild(notificacao);

    // Forçar reflow para garantir que a transição de entrada funcione
    void notificacao.offsetWidth;
    notificacao.classList.add('visible');

    setTimeout(() => {
        notificacao.classList.remove('visible');
        // Remover o elemento após a transição de saída
        notificacao.addEventListener('transitionend', () => {
            if (notificacao.parentElement) {
                document.body.removeChild(notificacao);
            }
        });
    }, 3000);
}


// Exportar resultado (parece ser uma função para copiar, não exportar um arquivo)
// Se o objetivo é copiar o conteúdo formatado, podemos reutilizar copiarTexto.
// Se for diferente, precisaria de mais clareza sobre o que "exportarResultado" deve fazer.
// Por ora, vamos assumir que é para copiar o conteúdo da tela.
/*
function exportarResultado() {
    const titulo = elementos.resultTitle.textContent;
    const tipo = elementos.resultType.textContent;
    const texto = Array.from(elementos.referenciasList.children)
        .map(p => p.textContent)
        .join('\n');

    const conteudo = `${titulo}\n${tipo}\n\n${texto}`.trim();
    copiarTexto(conteudo);
}
*/

// Limpar formulário
function limparFormulario() {
    elementos.tipoDiscurso.value = '';
    elementos.tema.value = '';
    esconderElementos();
}

// Listeners
document.addEventListener('DOMContentLoaded', function () {
    if (elementos.btnGerarEsboco) {
        elementos.btnGerarEsboco.addEventListener('click', gerarEsboco);
    }

    if (elementos.btnDownload) {
        elementos.btnDownload.addEventListener('click', baixarComoWord);
    }

    if (elementos.tema) {
        elementos.tema.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') gerarEsboco();
        });

        elementos.tema.addEventListener('input', function () {
            if (elementos.errorMessage.style.display === 'block') {
                elementos.errorMessage.style.display = 'none';
            }
        });
    }

    if (elementos.tipoDiscurso) {
        // Inicializar o data-attribute na carga e desabilitar visualmente se desejado
        Array.from(elementos.tipoDiscurso.options).forEach(option => {
            if (option.text.includes('(Em breve ...)')) {
                option.dataset.emBreve = "true";
                // option.disabled = true; // Uncomment if options should be visually disabled
            } else {
                option.dataset.emBreve = "false";
            }
        });

        elementos.tipoDiscurso.addEventListener('change', () => {
            esconderElementos(); // Esconde resultados anteriores ao mudar tipo
            elementos.btnDownload.style.display = 'none'; // Esconde botão de download
            // No need to re-set data-em-breve here, it's set on load.
        });
    }

    // Remover a linha problemática que tenta acessar 'esbocoConteudo' que foi removido do HTML.
    // const conteudoBruto = "Este é um **exemplo em negrito** e aqui continua o texto.";
    // document.getElementById('esbocoConteudo').innerHTML = formatarNegrito(conteudoBruto);
});
