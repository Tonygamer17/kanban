# 🔧 Como Diagnosticar e Corrigir Erro ao Criar Board

## 🚨 **Prováveis Causas do Erro:**

1. **RLS (Row Level Security) bloqueando inserção**
2. **Tabela não existe no Supabase**
3. **Permissões incorretas no banco**
4. **Variáveis de ambiente inválidas**

## 📋 **Passo a Passo para Diagnosticar:**

### **Passo 1: Verificar Environment Variables**
```bash
# Confirme que .env.local tem as credenciais corretas
cat .env.local
```

### **Passo 2: Testar Conexão com Supabase**
1. Abra o console do navegador (F12)
2. Tente criar um board
3. Procure por estes logs:
   - `🔍 DEBUG: Testing Supabase connection...`
   - `🔍 DEBUG: Connection test result:`
   - `🔍 DEBUG: Attempting to insert board...`

### **Passo 3: Verificar se o Erro é RLS**
Se vir logs como:
```
❌ ERROR: boardsApi.create() failed: {
  message: "new row violates row-level security policy",
  code: "42501"
}
```
**Solução:** Execute o SQL abaixo no painel do Supabase

### **Passo 4: Executar Debug SQL (se necessário)**
Copie e cole o conteúdo do arquivo `debug-rls.sql` no SQL Editor do Supabase:

```sql
-- Disable RLS temporariamente para testar
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;  
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;

-- Testar insert manual
INSERT INTO boards (title) VALUES ('Test Board') RETURNING *;
```

### **Passo 5: Recriar Policies RLS Corretamente**
Se o problema for RLS, execute:

```sql
-- Remover policies existentes
DROP POLICY IF EXISTS "Enable insert access for all users" ON boards;
DROP POLICY IF EXISTS "Enable read access for all users" ON boards;

-- Criar policies corrigidas
CREATE POLICY "Enable read access for all users" ON boards FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON boards FOR INSERT WITH CHECK (true);
```

## 🔍 **Logs Esperados para Funcionamento Correto:**
```
🔍 DEBUG: boardsApi.create() called with title: "Meu Board"
🔍 DEBUG: Testing Supabase connection...
🔍 DEBUG: Connection test result: { success: true }
🔍 DEBUG: Attempting to insert board...
🔍 DEBUG: boardsApi.create() result: { 
  data: { id: "...", title: "Meu Board", ... },
  error: null 
}
```

## ⚡ **Solução Rápida (MVP):**

Se precisar do app funcionando agora, **desabilite RLS temporariamente**:

```sql
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
```

**Execute isso no SQL Editor do Supabase e o app deve funcionar imediatamente!**

## 📱 **Ação Imediata:**

1. **Abra** http://localhost:3001
2. **Tente criar um board** 
3. **Cole os logs do console aqui** para análise exata
4. **Se for erro RLS**, execute o SQL acima para corrigir