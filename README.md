# 📖 Gerador de Pesquisa - Testemunhas de Jeová

Sistema automatizado para gerar esboços de discursos das reuniões das Testemunhas de Jeová, utilizando n8n para automação e interface web responsiva.

Versão 1.1
## 🚀 Funcionalidades

- ✅ Geração automática de esboços para "Tesouros da Palavra de Deus"
- ✅ Geração automática de esboços para "Discursos Públicos" (Interface indica "Em Breve" para esta e outras opções futuras)
- ✅ Busca automática na biblioteca JW.org
- ✅ Interface responsiva e moderna
- ✅ Extração de pontos principais e referências bíblicas
- ✅ Cópia rápida de referências
- ✅ Exportação de resultados (Formato Word aprimorado)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: n8n (Node.js automation)
- **Scraping**: Cheerio.js
- **API**: RESTful webhooks
- **Fonte de dados**: wol.jw.org

## 📋 Pré-requisitos

- Node.js (versão 18.10+)
- n8n instalado globalmente
- Navegador moderno
- Conexão com internet

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/gerador-esboco-tj.git
cd gerador-esboco-tj
```

### 2. Instale o n8n (se não tiver)
```bash
npm install -g n8n
```

### 3. Instale dependências do n8n
```bash
npm install cheerio
```

### 4. Configure o n8n
- Inicie o n8n: `n8n`
- Acesse: http://localhost:5678
- Importe o workflow do arquivo `n8n-workflow.json`
- Ative o workflow

### 5. Configure o frontend
- Ajuste a URL da API no arquivo `script.js`
- Abra o `index.html` no navegador

## 📁 Estrutura do Projeto

```
gerador-esboco-tj/
├── index.html          # Interface principal
├── style.css           # Estilos e layout
├── script.js           # Lógica JavaScript
├── n8n-workflow.json   # Workflow do n8n
├── .gitignore          # Arquivos ignorados
├── README.md           # Documentação
└── docs/               # Documentação adicional
    ├── instalacao.md
    ├── uso.md
    └── api.md
```

## 🎯 Como Usar

1. **Selecione o tipo de discurso**:
   - Tesouros da Palavra de Deus
   - Discurso Público

2. **Digite um tema** (opcional)

3. **Clique em "Gerar Esboço"**

4. **Visualize o resultado**:
   - Pontos principais organizados
   - Referências bíblicas
   - Clique nas referências para copiar

## 🔄 Workflow do n8n

O sistema utiliza o seguinte fluxo:

1. **Webhook** → Recebe requisição do frontend
2. **Condição** → Verifica tipo de discurso
3. **HTTP Request** → Busca na biblioteca JW.org
4. **Code** → Processa HTML com Cheerio
5. **Response** → Retorna JSON formatado

## 🌐 API

### Endpoint Principal
```
POST http://localhost:5678/webhook/gerar-esboco
```

### Payload
```json
{
  "tipo_discurso": "tesouros|publico",
  "tema": "tema opcional"
}
```

### Resposta
```json
{
  "titulo": "Título do esboço",
  "tipo": "tesouros",
  "pontos": ["Ponto 1", "Ponto 2", "..."],
  "referencias": ["João 3:16", "Salmo 23:1", "..."]
}
```

## 🔧 Desenvolvimento

### Comandos Git Úteis
```bash
# Adicionar mudanças
git add .

# Commit com mensagem
git commit -m "feat: nova funcionalidade"

# Push para o repositório
git push origin main

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Merge de branches
git merge feature/nova-funcionalidade
```

### Convenção de Commits
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

## 🚀 Roadmap

- [ ] Cache de resultados
- [ ] Modo offline
- [ ] Exportação em PDF
- [ ] Histórico de esboços
- [ ] Temas personalizados
- [ ] Integração com Watchtower Library
- [ ] App mobile (PWA)

## 🐛 Problemas Conhecidos

- Algumas páginas do JW.org podem ter estruturas diferentes
- Rate limiting pode ocorrer com muitas requisições
- Conteúdo pode variar dependendo do idioma

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua funcionalidade
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor


- GitHub: [@PablusVinii](https://github.com/PablusVinii)
- Email: pablus.vinicius@live.com

## 🙏 Agradecimentos

- Comunidade das Testemunhas de Jeová
- Desenvolvedores do n8n
- Biblioteca JW.org

---

⭐ **Se este projeto te ajudou, considere dar uma estrela!**