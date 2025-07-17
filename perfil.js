document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formPerfil');
    const msg = document.getElementById('msgPerfil');
    const nomeInput = document.getElementById('perfilNome');
    const emailInput = document.getElementById('perfilEmail');
    const statTotal = document.getElementById('statTotal');
    const statUltimo = document.getElementById('statUltimo');
    const statAcesso = document.getElementById('statAcesso');
    const btnExcluirConta = document.getElementById('btnExcluirConta');

    let usuarioAtual = null;

    // Função para mostrar mensagens ao usuário
    function mostrarMensagem(texto, tipo = 'info') {
        msg.textContent = texto;
        msg.className = `msg ${tipo}`; // Adiciona classes para estilização
        msg.style.display = 'block';
    }

    // Proteger página: só logado
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        usuarioAtual = user;

        // Preencher dados do perfil
        nomeInput.value = user.displayName || 'Não definido';
        emailInput.value = user.email || 'Não definido';
        statAcesso.textContent = user.metadata && user.metadata.lastSignInTime 
            ? new Date(user.metadata.lastSignInTime).toLocaleString('pt-BR') 
            : 'N/A';

        // Carregar estatísticas do Firestore
        carregarEstatisticas(user.uid);
    });

    // Carregar estatísticas de esboços
    async function carregarEstatisticas(uid) {
        try {
            const snap = await db.collection('esbocos').where('uid', '==', uid).orderBy('criadoEm', 'desc').get();
            statTotal.textContent = snap.size;
            if (!snap.empty) {
                const ultimo = snap.docs[0].data();
                statUltimo.textContent = ultimo.criadoEm && ultimo.criadoEm.toDate ? ultimo.criadoEm.toDate().toLocaleString('pt-BR') : 'N/A';
            } else {
                statUltimo.textContent = 'Nenhum esboço criado.';
            }
        } catch (e) {
            console.error('Erro ao buscar estatísticas:', e);
            statTotal.textContent = 'Erro';
            statUltimo.textContent = 'Erro';
            mostrarMensagem('Não foi possível carregar as estatísticas.', 'erro');
        }
    }

    // Salvar alterações no perfil
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = nomeInput.value.trim();
        const senha = document.getElementById('perfilSenha').value.trim();

        if (!nome) {
            mostrarMensagem('O nome não pode ficar em branco.', 'erro');
            return;
        }

        try {
            // Atualizar nome de exibição
            if (nome !== usuarioAtual.displayName) {
                await usuarioAtual.updateProfile({ displayName: nome });
                // Atualizar no Firestore também, se você armazena lá
                await db.collection('usuarios').doc(usuarioAtual.uid).set({ nome }, { merge: true });
            }

            // Atualizar senha
            if (senha) {
                if (senha.length < 6) {
                    mostrarMensagem('A nova senha deve ter pelo menos 6 caracteres.', 'erro');
                    return;
                }
                await usuarioAtual.updatePassword(senha);
                document.getElementById('perfilSenha').value = ''; // Limpar campo
            }

            mostrarMensagem('Perfil atualizado com sucesso!', 'sucesso');

        } catch (err) {
            console.error('Erro ao atualizar perfil:', err);
            mostrarMensagem(`Erro ao atualizar: ${err.message}`, 'erro');
        }
    });

    // Excluir conta
    btnExcluirConta.addEventListener('click', async () => {
        const confirmacao = prompt('ATENÇÃO: Esta ação é irreversível.\nTodos os seus dados, incluindo esboços salvos, serão PERMANENTEMENTE excluídos.\n\nPara confirmar, digite "excluir" abaixo:');

        if (confirmacao !== 'excluir') {
            mostrarMensagem('Exclusão de conta cancelada.', 'info');
            return;
        }

        try {
            const uid = usuarioAtual.uid;
            
            // 1. Excluir esboços do usuário
            const esbocosSnapshot = await db.collection('esbocos').where('uid', '==', uid).get();
            const batch = db.batch();
            esbocosSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // 2. Excluir documento do usuário (se houver)
            await db.collection('usuarios').doc(uid).delete();
            
            // 3. Excluir o usuário do Firebase Auth
            await usuarioAtual.delete();

            alert('Sua conta foi excluída com sucesso.');
            window.location.href = 'login.html';

        } catch (err) {
            console.error('Erro ao excluir conta:', err);
            mostrarMensagem(`Erro ao excluir a conta: ${err.message}. Tente fazer login novamente e repetir o processo.`, 'erro');
        }
    });
}); 