# 🔔 Sistema de Notificações Gerais - IA-JW-Talks

## 📋 Visão Geral

O sistema de notificações foi atualizado para suportar **notificações gerais** que aparecem para todos os usuários, além das notificações específicas que já existiam.

## 🔄 Como Funciona

### Tipos de Notificação

1. **Notificações Específicas** (`geral: false`)
   - Enviadas para usuários específicos
   - Campo `destinatarios` contém array com UIDs específicos
   - Exemplo: `destinatarios: ["uid1", "uid2", "uid3"]`

2. **Notificações Gerais** (`geral: true`)
   - Enviadas para todos os usuários ativos
   - Campo `destinatarios` contém `["todos"]`
   - Campo `totalDestinatarios` indica quantos usuários receberam
   - Exemplo: `destinatarios: ["todos"], totalDestinatarios: 15`

### Estrutura das Notificações

```javascript
// Notificação Específica
{
    titulo: "Título da notificação",
    mensagem: "Mensagem da notificação",
    tipo: "info",
    destinatarios: ["uid1", "uid2"],
    geral: false,
    data: timestamp,
    admin: "admin@email.com",
    lida: false,
    lidaEm: null
}

// Notificação Geral
{
    titulo: "Título da notificação geral",
    mensagem: "Mensagem para todos os usuários",
    tipo: "info",
    destinatarios: ["todos"],
    geral: true,
    totalDestinatarios: 15,
    data: timestamp,
    admin: "admin@email.com",
    lida: false,
    lidaEm: null
}
```

## 🎯 Funcionalidades

### No Painel Admin

1. **Enviar Notificação Geral**
   - Cria uma única notificação visível para todos os usuários
   - Mais eficiente em termos de armazenamento
   - Campo `geral: true` identifica como notificação geral

2. **Enviar Notificação Específica**
   - Cria notificação individual para cada usuário selecionado
   - Campo `geral: false` identifica como notificação específica

3. **Histórico de Notificações**
   - Mostra indicadores visuais para notificações gerais vs específicas
   - Exibe número de destinatários para cada tipo

### Na Página Principal

1. **Carregamento de Notificações**
   - Busca notificações específicas do usuário
   - Busca notificações gerais (para todos)
   - Combina e ordena por data

2. **Indicadores Visuais**
   - Notificações gerais mostram badge "GERAL"
   - Exibe número de destinatários para notificações gerais
   - Diferenciação visual entre tipos

3. **Tempo Real**
   - Listeners separados para notificações específicas e gerais
   - Toast notifications para ambos os tipos
   - Contador atualizado automaticamente

## 🔧 Implementação Técnica

### Consultas Firestore

```javascript
// Buscar notificações específicas
db.collection("notificacoes")
    .where("destinatarios", "array-contains", uid)
    .where("geral", "==", false)

// Buscar notificações gerais
db.collection("notificacoes")
    .where("geral", "==", true)
```

### Listeners em Tempo Real

```javascript
// Listener para notificações específicas
db.collection("notificacoes")
    .where("destinatarios", "array-contains", uid)
    .where("geral", "==", false)
    .where("lida", "==", false)

// Listener para notificações gerais
db.collection("notificacoes")
    .where("geral", "==", true)
    .where("lida", "==", false)
```

## 📊 Vantagens

### Notificações Gerais
- ✅ **Eficiência**: Uma notificação para todos vs múltiplas notificações
- ✅ **Performance**: Menos documentos no Firestore
- ✅ **Simplicidade**: Gerenciamento centralizado
- ✅ **Escalabilidade**: Funciona bem com muitos usuários

### Notificações Específicas
- ✅ **Precisão**: Controle exato sobre destinatários
- ✅ **Flexibilidade**: Diferentes mensagens para diferentes usuários
- ✅ **Rastreamento**: Status individual de leitura

## 🚀 Como Usar

### Para Admins

1. **Enviar Notificação Geral**
   ```
   Painel Admin → Notificações → "Enviar Notificação Geral"
   ```

2. **Enviar Notificação Específica**
   ```
   Painel Admin → Notificações → "Notificar Usuários Específicos"
   ```

### Para Usuários

1. **Ver Notificações**
   ```
   Menu lateral → Seção "Notificações"
   ```

2. **Marcar como Lidas**
   ```
   Clicar na notificação ou "Marcar como lidas"
   ```

## 🔍 Debug e Monitoramento

### Função de Debug
```javascript
debugNotificacoes() // Mostra informações detalhadas no console
```

### Logs de Auditoria
- Todas as notificações são registradas nos logs
- Inclui tipo (geral/específica) e número de destinatários

## 📝 Regras do Firestore

As regras devem permitir:
- Leitura de notificações específicas do usuário
- Leitura de notificações gerais
- Escrita de notificações (apenas admins)
- Atualização de status de leitura

```javascript
// Exemplo de regras
collection 'notificacoes' {
  allow read: if request.auth != null && (
    resource.data.destinatarios[request.auth.uid] != null ||
    resource.data.geral == true
  );
  allow write: if request.auth != null && 
    get(/databases/$(database.name)/documents/usuarios/$(request.auth.uid)).data.admin == true;
}
```

## 🎨 Interface do Usuário

### Indicadores Visuais
- **Badge "GERAL"**: Notificações enviadas para todos
- **Badge "NOVA"**: Notificações não lidas
- **Contador**: Número total de notificações não lidas
- **Toast**: Notificações em tempo real

### Responsividade
- Interface adaptada para mobile
- Scroll horizontal em telas pequenas
- Badges responsivos

---

**Desenvolvido por Pablus Vinii** | **Versão 2.0** | **IA-JW-Talks** 