# 🔧 Aplicar Regras do Firestore para Notificações Gerais

## 📋 Instruções para Aplicar as Novas Regras

### 1. Acessar o Console do Firebase

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto `ia-jw-44d10`
3. No menu lateral, clique em **"Firestore Database"**
4. Clique na aba **"Rules"**

### 2. Substituir as Regras Atuais

1. **Copie todo o conteúdo** do arquivo `firestore-rules.txt`
2. **Cole no editor de regras** do Firebase Console
3. **Substitua completamente** as regras existentes
4. Clique em **"Publish"**

### 3. Verificar a Aplicação

Após publicar, aguarde alguns segundos e verifique se:

- ✅ As regras foram aplicadas sem erros
- ✅ O status mostra "Rules published successfully"
- ✅ Não há erros de sintaxe

## 🔍 Principais Mudanças nas Regras

### Coleção `notificacoes` - ATUALIZADA

```javascript
// ANTES (regras antigas)
allow read: if request.auth != null && 
  resource.data.destinatarios.hasAny([request.auth.uid]);

// DEPOIS (novas regras)
allow read: if request.auth != null && (
  request.auth.uid in resource.data.destinatarios ||
  resource.data.geral == true
);
```

### Novas Funcionalidades

1. **Leitura de Notificações Gerais**
   - Usuários podem ler notificações com `geral == true`
   - Usuários podem ler suas notificações específicas

2. **Atualização de Status de Leitura**
   - Usuários podem marcar notificações como lidas
   - Apenas campos `lida` e `lidaEm` podem ser atualizados

3. **Criação Restrita**
   - Apenas admins podem criar notificações
   - Usuários comuns não podem criar notificações

4. **Exclusão por Admins**
   - Apenas admins podem deletar notificações

## 🧪 Testar o Sistema

### 1. Teste de Notificação Geral

1. **Acesse o painel admin**
2. **Clique em "Enviar Notificação Geral"**
3. **Digite título e mensagem**
4. **Confirme o envio**
5. **Verifique se não há erros de permissão**

### 2. Teste de Leitura

1. **Acesse a página principal** com qualquer usuário
2. **Abra o menu lateral**
3. **Verifique se a notificação geral aparece**
4. **Clique na notificação para marcar como lida**

### 3. Teste de Debug

1. **Abra o console do navegador** (F12)
2. **Execute**: `debugNotificacoes()`
3. **Verifique se mostra notificações gerais e específicas**

## ⚠️ Possíveis Problemas e Soluções

### Erro: "Missing or insufficient permissions"

**Causa**: Regras não foram aplicadas corretamente
**Solução**: 
1. Verificar se as regras foram publicadas
2. Aguardar alguns minutos para propagação
3. Recarregar a página

### Erro: "Permission denied on collection"

**Causa**: Regra de leitura muito restritiva
**Solução**: Verificar se a regra permite:
```javascript
allow read: if request.auth != null && (
  request.auth.uid in resource.data.destinatarios ||
  resource.data.geral == true
);
```

### Erro: "Cannot update document"

**Causa**: Regra de atualização não permite marcar como lida
**Solução**: Verificar se a regra permite atualizar campos `lida` e `lidaEm`

## 📊 Estrutura das Notificações

### Notificação Específica
```javascript
{
  titulo: "Título",
  mensagem: "Mensagem",
  destinatarios: ["uid1", "uid2"],
  geral: false,
  lida: false,
  lidaEm: null
}
```

### Notificação Geral
```javascript
{
  titulo: "Título Geral",
  mensagem: "Mensagem para todos",
  destinatarios: ["todos"],
  geral: true,
  totalDestinatarios: 15,
  lida: false,
  lidaEm: null
}
```

## 🔒 Segurança

### O que as regras garantem:

- ✅ **Usuários só veem suas notificações específicas**
- ✅ **Usuários veem todas as notificações gerais**
- ✅ **Apenas admins criam notificações**
- ✅ **Usuários só atualizam status de leitura**
- ✅ **Apenas admins deletam notificações**

### O que as regras impedem:

- ❌ **Usuários não podem criar notificações**
- ❌ **Usuários não podem ver notificações de outros**
- ❌ **Usuários não podem modificar conteúdo das notificações**
- ❌ **Usuários não podem deletar notificações**

## 📞 Suporte

Se encontrar problemas:

1. **Verifique o console do navegador** para erros
2. **Execute `debugNotificacoes()`** para diagnóstico
3. **Verifique as regras no Firebase Console**
4. **Teste com usuário admin e usuário comum**

---

**Desenvolvido por Pablus Vinii** | **Versão 2.0** | **IA-JW-Talks** 