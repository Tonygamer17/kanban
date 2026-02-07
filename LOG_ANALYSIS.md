# 🚀 Como Usar os Logs para Diagnosticar o Problema

## ✅ **Logs Adicionados:**

1. **Environment Variables** - Verifica se as credenciais Supabase estão carregadas
2. **Store Initialization** - Mostra quando o Zustand store é inicializado
3. **API Calls** - Log detalhado de cada chamada ao Supabase
4. **Component Lifecycle** - Mostra quando cada componente renderiza
5. **Error Handlers** - Captura global de erros JavaScript
6. **State Changes** - Mostra mudanças de estado na aplicação

## 🔍 **Como Diagnosticar:**

### **Passo 1: Abrir o App**
1. Acesse: **http://localhost:3001**
2. Pressione **F12** para abrir DevTools
3. Vá para a aba **Console**

### **Passo 2: Analisar os Logs**
Procure por estes padrões:

- ✅ Logs verdes com `✅` indicam sucesso
- 🔍 Logs azuis com `🔍` mostram o fluxo da aplicação  
- ❌ Logs vermelhos com `❌` indicam erros
- 🚨 Logs amarelos com `🚨` capturam erros globais

### **Passo 3: O Que Procurar**

#### **Se vir erros de Supabase:**
```
❌ ERROR: Missing Supabase environment variables
```
→ **Solução:** Verifique `.env.local`

#### **Se vir erros de API:**
```
❌ ERROR: boardsApi.getAll() failed: Database error...
```
→ **Solução:** Problema na tabela `boards`

#### **Se vir erros de Componente:**
```
🚨 GLOBAL ERROR: Cannot read property 'map' of undefined
```
→ **Solução:** Props faltando ou dados incorretos

#### **Se não ver nenhum erro:**
```
✅ DEBUG: HomePage rendering...
🔍 DEBUG: Store state: { boardsCount: 0, loading: false }
```
→ **Diagnóstico:** App está funcionando mas sem dados

## 📋 **Fluxo Esperado dos Logs:**

1. `🔍 DEBUG: Layout.tsx loading...`
2. `🔍 DEBUG: Supabase config...` 
3. `🔍 DEBUG: Initializing store...`
4. `🔍 DEBUG: ThemeProvider loading...`
5. `🔍 DEBUG: HomePage rendering...`
6. `🔍 DEBUG: useEffect - fetching boards...`
7. `🔍 DEBUG: boardsApi.getAll() called`
8. `🔍 DEBUG: boardsApi.getAll() result: { data: [...], error: null }`

## 🛠️ **Ações Com base nos Logs:**

### **Se logs mostram "Missing Supabase environment variables":**
```bash
# Verifique se .env.local existe
cat .env.local
# Deve conter:
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
```

### **Se logs mostram erro de banco:**
```sql
-- Execute no SQL Editor do Supabase
-- Verifique se as tabelas existem
SELECT * FROM boards LIMIT 1;
SELECT * FROM columns LIMIT 1;  
SELECT * FROM cards LIMIT 1;
```

### **Se logs mostram erro de componente:**
- O erro mostrará qual componente está falhando
- Geralmente é import/export incorreto
- Ou props faltando

Agora abra **http://localhost:3001** e cole os logs que aparecer no console para eu analisar!