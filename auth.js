// auth.js - Lógica para login.html e cadastro.html

// --- Lógica de LOGIN (originalmente em login.html) ---
function setupLoginForm() {
    const formLogin = document.getElementById("form-login");
    const msgLogin = document.getElementById("mensagem");

    if (formLogin) {
        formLogin.onsubmit = async (e) => {
            e.preventDefault();
            if (!auth) {
                msgLogin.textContent = "Erro de inicialização. Tente recarregar a página.";
                msgLogin.style.color = "red";
                return;
            }
            const email = formLogin.email.value;
            const senha = formLogin.senha.value;

            try {
                await auth.signInWithEmailAndPassword(email, senha);
                msgLogin.textContent = "Login bem-sucedido! Redirecionando...";
                msgLogin.style.color = "green";
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } catch (error) {
                msgLogin.textContent = "E-mail ou senha inválidos!";
                msgLogin.style.color = "red";
                console.error("Erro no login:", error);
            }
        };
    }
}

// --- Lógica de CADASTRO (originalmente em cadastro.html) ---
function setupCadastroForm() {
    const formCadastro = document.getElementById("form-cadastro");
    const msgCadastro = document.getElementById("mensagem");
    const loadingCadastro = document.getElementById("loading");
    const btnCadastro = document.getElementById("btn-cadastro");

    if (formCadastro) {
        function showMessage(text, type) {
            msgCadastro.textContent = text;
            msgCadastro.className = `msg ${type}`;
            msgCadastro.style.display = 'block';

            setTimeout(() => {
                msgCadastro.style.display = 'none';
            }, 5000);
        }

        function showLoading(show) {
            if (loadingCadastro) loadingCadastro.style.display = show ? 'block' : 'none';
            if (btnCadastro) btnCadastro.disabled = show;
        }

        function validateForm(nome, sobrenome, email, senha) {
            if (!nome || !sobrenome) {
                showMessage("Por favor, preencha o nome e sobrenome", "error");
                return false;
            }
            if (senha.length < 6) {
                showMessage("A senha deve ter pelo menos 6 caracteres", "error");
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage("Por favor, insira um email válido", "error");
                return false;
            }
            return true;
        }

        formCadastro.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!auth || !db) {
                showMessage("Erro de inicialização. Tente recarregar a página.", "error");
                return;
            }

            const nome = document.getElementById("nome").value.trim();
            const sobrenome = document.getElementById("sobrenome").value.trim();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;

            if (!validateForm(nome, sobrenome, email, senha)) {
                return;
            }

            const nomeCompleto = `${nome} ${sobrenome}`;
            showLoading(true);
            if(msgCadastro) msgCadastro.style.display = 'none';

            try {
                const cred = await auth.createUserWithEmailAndPassword(email, senha);
                await cred.user.updateProfile({
                    displayName: nomeCompleto
                });
                await db.collection('usuarios').doc(cred.user.uid).set({
                    uid: cred.user.uid,
                    nome: nomeCompleto,
                    email: email,
                    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
                showMessage("Cadastro realizado com sucesso! Redirecionando...", "success");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 2000);
            } catch (error) {
                let errorMessage = "Erro ao criar conta. Tente novamente.";
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = "Este email já está sendo usado por outra conta.";
                        break;
                    case 'auth/invalid-email':
                        errorMessage = "Email inválido.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "A senha é muito fraca.";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "Erro de conexão. Verifique sua internet.";
                        break;
                }
                showMessage(errorMessage, "error");
                console.error("Erro no cadastro:", error);
            } finally {
                showLoading(false);
            }
        });
    }
}

// Inicializa os formulários dependendo da página atual
// Isso garante que 'auth' e 'db' de 'firebase-init.js' estejam disponíveis.
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-login')) {
        setupLoginForm();
    }
    if (document.getElementById('form-cadastro')) {
        setupCadastroForm();
    }
});
