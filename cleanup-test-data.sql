-- LIMPEZA DE DADOS DE TESTE - Execute em Supabase SQL Editor
-- Remove todos os dados hardcoded e prepara o banco para produção

-- 1. Remover dados de teste hardcoded
DELETE FROM task_assignees;
DELETE FROM cards;
DELETE FROM columns;
DELETE FROM boards;
DELETE FROM team_members;
DELETE FROM teams;

-- 2. Remover usuários de teste (cuidado: não remova usuários reais!)
DELETE FROM auth.users WHERE email IN ('owner@example.com', 'member@example.com');

-- 3. Reset das sequências (se houver)
-- (UUIDs não usam sequências, então não precisa resetar)

-- 4. Verificar se o banco está limpo
SELECT 
  'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 
  'team_members' as table_name, COUNT(*) as count FROM team_members
UNION ALL
SELECT 
  'boards' as table_name, COUNT(*) as count FROM boards
UNION ALL
SELECT 
  'columns' as table_name, COUNT(*) as count FROM columns
UNION ALL
SELECT 
  'cards' as table_name, COUNT(*) as count FROM cards
UNION ALL
SELECT 
  'task_assignees' as table_name, COUNT(*) as count FROM task_assignees;

-- 5. Opcional: Inserir dados de exemplo reais (após primeiro cadastro)
-- Isso deve ser feito via app frontend após criar usuário real

-- Confirmar que RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('teams', 'team_members', 'boards', 'columns', 'cards', 'task_assignees');