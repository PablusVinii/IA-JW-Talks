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
    referenciasList: document.getElementById('referenciasList')
};

// Função principal para gerar esboço
async function gerarEsboco() {
    const tipoDiscurso = elementos.tipoDiscurso.value;
    const tema = elementos.tema.value.trim();
    const informacoesAdicionais = elementos.informacoesAdicionais.value.trim();
    const versiculosOpicionais = elementos.versiculosOpicionais.value.trim();
    const topicosOpicionais = elementos.topicosOpicionais.value.trim();

    if (!tipoDiscurso) {
        mostrarAlerta('Por favor, selecione o tipo de discurso!');
        return;
    }
    if (!tema) {
        mostrarAlerta('Por favor, insira o tema do discurso!');
        return;
    }
    if (tipoDiscurso === 'publico') {
        mostrarAlerta('Ferramenta disponivel em breve. Por favor, escolha outro tipo de discurso.');
        return;
    }

    mostrarCarregamento(true);
    esconderElementos();

    try {
        const temaFormatado = tema ? encodeURIComponent(tema) : null;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo_discurso: tipoDiscurso, tema: temaFormatado, informacoes_adicionais: informacoesAdicionais, versiculos_opicionais: versiculosOpicionais, topicos_opicionais: topicosOpicionais })
        });

        if (!response.ok) throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (!data || typeof data !== 'object') throw new Error('Resposta inválida do servidor');

        mostrarResultado(data);

    } catch (error) {
        console.error('Erro ao gerar esboço:', error);
        mostrarErro(`Erro ao gerar esboço: ${error.message}`);
    } finally {
        mostrarCarregamento(false);
    }
    document.getElementById('btnDownload').style.display = 'inline-block';

}

// Mostrar carregamento
function mostrarCarregamento(mostrar) {
    elementos.loading.style.display = mostrar ? 'block' : 'none';
    const botao = document.querySelector('.btn');
    botao.disabled = mostrar;
    botao.textContent = mostrar ? '⏳ Gerando...' : '🔍 Gerar Esboço';
}

// Esconder elementos
function esconderElementos() {
    elementos.resultSection.style.display = 'none';
    elementos.errorMessage.style.display = 'none';
}

// Mostrar resultado (versão adaptada)
function mostrarResultado(esboco) {
    try {
        const texto = Array.isArray(esboco) ? esboco[0].output : esboco.output;

        if (!texto) throw new Error('Esboço sem conteúdo');

        elementos.resultTitle.textContent = 'Esboço Gerado';
        elementos.resultType.textContent = 'Discurso Personalizado';
        elementos.pontosList.innerHTML = '';
        elementos.referenciasList.innerHTML = '';

        // Criar um <pre> para preservar a formatação original
        const pre = document.createElement('pre');
        pre.innerHTML = formatarNegrito(texto);
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'inherit';
        pre.style.lineHeight = '1.6';
        pre.style.background = '#f9f9f9';
        pre.style.padding = '15px';
        pre.style.borderRadius = '8px';

        elementos.referenciasList.appendChild(pre);

        elementos.resultSection.style.display = 'block';
        elementos.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Erro ao processar resultado:', error);
        mostrarErro('Erro ao processar os dados recebidos');
    }
}
function baixarComoWord() {
    const titulo = elementos.resultTitle.textContent || 'Esboço';
    const tipo = elementos.resultType.textContent || '';
    const pre = elementos.referenciasList.querySelector('pre');

    if (!pre) return mostrarErro('Nenhum conteúdo para exportar.');

    const conteudo = `${titulo}\n${tipo}\n\n${pre.textContent}`;

    const blob = new Blob(
        [`<html><head><meta charset="utf-8"></head><body><pre>${conteudo}</pre></body></html>`],
        { type: 'application/msword' }
    );

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${titulo.replace(/\s+/g, '_')}.doc`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function formatarNegrito(texto) {
    return texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
const conteudoBruto = "Este é um **exemplo em negrito** e aqui continua o texto.";
document.getElementById('esbocoConteudo').innerHTML = formatarNegrito(conteudoBruto);


// Obter texto do tipo
function obterTextoTipo(tipo) {
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

// Mostrar alerta
function mostrarAlerta(mensagem) {
    alert(mensagem);
}

// Copiar texto
async function copiarTexto(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        mostrarNotificacao('Texto copiado!');
    } catch (err) {
        console.error('Erro ao copiar texto:', err);
        const textArea = document.createElement('textarea');
        textArea.value = texto;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        mostrarNotificacao('Texto copiado!');
    }
}

// Mostrar notificação
function mostrarNotificacao(mensagem) {
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
        setTimeout(() => document.body.removeChild(notificacao), 300);
    }, 3000);
}

// Exportar resultado
function exportarResultado() {
    const titulo = elementos.resultTitle.textContent;
    const tipo = elementos.resultType.textContent;
    const texto = Array.from(elementos.referenciasList.children)
        .map(p => p.textContent)
        .join('\n');

    const conteudo = `${titulo}\n${tipo}\n\n${texto}`.trim();
    copiarTexto(conteudo);
}

// Limpar formulário
function limparFormulario() {
    elementos.tipoDiscurso.value = '';
    elementos.tema.value = '';
    esconderElementos();
}

// Listeners
document.addEventListener('DOMContentLoaded', function () {
    elementos.tema.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') gerarEsboco();
    });

    elementos.tipoDiscurso.addEventListener('change', esconderElementos);

    elementos.tema.addEventListener('input', function () {
        if (elementos.errorMessage.style.display === 'block') {
            elementos.errorMessage.style.display = 'none';
        }
    });
});
