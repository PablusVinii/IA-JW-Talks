# 🔧 Resolver Erro de Permissão - Notificações

## ❌ Problema Identificado

**Erro**: `FirebaseError: Missing or insufficient permissions`

**Causa**: As regras do Firestore não foram aplicadas corretamente ou há um problema de permissão.

## ✅ Soluções

### 1. Aplicar as Regras do Firestore

#### Passo a Passo:

1. **Acesse o Firebase Console**
   - Vá para [Firebase Console](https://console.firebase.google.com/)
   - Selecione seu projeto `ia-jw-44d10`
   - Clique em **"Firestore Database"**
   - Clique na aba **"Rules"**

2. **Substitua as Regras**
   - **Copie todo o conteúdo** do arquivo `firestore-rules.txt`
   - **Cole no editor de regras**
   - **Substitua completamente** as regras existentes
   - Clique em **"Publish"**

3. **Aguarde a Propagação**
   - As regras podem levar alguns minutos para propagar
   - Recarregue a página após alguns minutos

### 2. Testar as Regras

#### Use o Botão "🔧 Testar Regras"

1. **Acesse a página principal**
2. **Abra o menu lateral**
3. **Clique em "🔧 Testar Regras"**
4. **Abra o console do navegador** (F12)
5. **Verifique os resultados**

#### Resultados Esperados:

```
=== TESTE DE REGRAS FIRESTORE ===
✅ Usuário autenticado: seu-email@exemplo.com
UID: seu-uid-aqui
Status Admin: true/false
✅ Teste 1 - Ler notificações específicas: OK
✅ Teste 2 - Ler notificações gerais: OK
✅ Teste 3 - Criar notificação (admin): OK
✅ Teste 4 - Ler logs: OK
✅ Teste 5 - Criar log: OK
=== FIM DOS TESTES ===
```

### 3. Verificar Status de Admin

#### Se você é admin:

1. **Verifique se o campo `admin` está definido**
   - No Firebase Console → Firestore → `usuarios/{seu-uid}`
   - Deve ter: `admin: true`

2. **Se não estiver definido:**
   ```javascript
   // No console do Firebase, execute:
   db.collection('usuarios').doc('SEU-UID').update({
     admin: true
   });
   ```

### 4. Debug Detalhado

#### Use o Botão "🔍 Debug Notificações"

1. **Clique em "🔍 Debug Notificações"**
2. **Verifique no console:**

```
=== DEBUG NOTIFICAÇÕES ===
UID do usuário atual: seu-uid
Notificações específicas para este usuário: 0
Notificações gerais disponíveis: 0
Resumo: {total: 0, especificas: 0, gerais: 0, naoLidas: 0}
```

### 5. Criar Notificação de Teste

#### Se você é admin:

1. **Clique em "🧪 Testar Notificação"**
2. **Verifique se a notificação é criada**
3. **Verifique se aparece na sidebar**

## 🔍 Verificações Adicionais

### 1. Verificar Autenticação

```javascript
// No console do navegador:
console.log('Usuário atual:', window.geradorEsboco?.usuarioAtual);
console.log('Status admin:', window.geradorEsboco?.isAdmin);
```

### 2. Verificar Regras Atuais

No Firebase Console → Firestore → Rules, verifique se as regras incluem:

```javascript
// Coleção de notificações
match /notificacoes/{notificacaoId} {
  allow read: if request.auth != null && (
    request.auth.uid in resource.data.destinatarios ||
    resource.data.geral == true
  );
  // ... outras regras
}
```

### 3. Verificar Estrutura das Notificações

No Firebase Console → Firestore → `notificacoes`, verifique se as notificações têm:

```javascript
// Notificação específica
{
  destinatarios: ["uid-do-usuario"],
  geral: false
}

// Notificação geral
{
  destinatarios: ["todos"],
  geral: true
}
```

## 🚨 Problemas Comuns

### 1. Regras Não Aplicadas

**Sintoma**: Todos os testes falham
**Solução**: Aplicar as regras novamente

### 2. Usuário Não é Admin

**Sintoma**: Erro ao criar notificação
**Solução**: Definir `admin: true` no documento do usuário

### 3. Estrutura Incorreta

**Sintoma**: Notificações não aparecem
**Solução**: Verificar se têm campos `geral` e `destinatarios` corretos

### 4. Cache do Navegador

**Sintoma**: Mudanças não aparecem
**Solução**: 
- Ctrl+F5 (recarregar sem cache)
- Limpar cache do navegador
- Testar em aba anônima

## 📞 Suporte

Se o problema persistir:

1. **Execute `testarRegrasFirestore()`**
2. **Copie os resultados do console**
3. **Verifique se as regras foram aplicadas**
4. **Teste com usuário admin e usuário comum**

---

**Desenvolvido por Pablus Vinii** | **Versão 2.0** | **IA-JW-Talks** 