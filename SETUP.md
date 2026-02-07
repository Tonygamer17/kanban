# 🚨 INSTRUÇÕES PARA CONFIGURAR O SUPABASE

## Passo 1: Executar o SQL no Supabase

1. Acesse seu projeto Supabase: https://emzuhbsmtgmfmnscmjml.supabase.co
2. Vá para **SQL Editor**
3. Clique em **New query**
4. Copie e cole todo o conteúdo do arquivo `supabase-schema.sql`
5. Clique em **Run** para executar

## Passo 2: Verificar se as tabelas foram criadas

1. Vá para **Table Editor**
2. Você deve ver as tabelas:
   - `boards`
   - `columns` 
   - `cards`

## Passo 3: Iniciar a aplicação

```bash
npm run dev
```

Acesse: http://localhost:3001

## Se ainda não funcionar:

1. Verifique o console do navegador (F12) por erros
2. Verifique se as variáveis de ambiente estão corretas
3. Confirme que as tabelas foram criadas no Supabase

## Dados de exemplo

O SQL já insere dados de teste:
- 1 board: "Meu Primeiro Board"
- 3 colunas: "A Fazer", "Em Progresso", "Concluído"
- 3 cards de exemplo

---

# 🎯 O que o app faz:

- ✅ Criar boards
- ✅ Adicionar colunas aos boards
- ✅ Criar cards nas colunas
- ✅ Arrastar cards entre colunas
- ✅ Editar/deletar cards e colunas
- ✅ Dark mode
- ✅ Real-time updates