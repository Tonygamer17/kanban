Kanban App

🚧 Projeto em desenvolvimento

Um aplicativo de kanban simples e eficiente construído com Next.js, TypeScript e Supabase.

Um aplicativo de kanban simples e eficiente construído com Next.js, TypeScript e Supabase.

## 🚀 Funcionalidades

- ✅ **Boards** - Crie e gerencie múltiplos boards
- ✅ **Colunas** - Organize suas tarefas em colunas personalizáveis
- ✅ **Cards** - Adicione tarefas com título e descrição
- ✅ **Drag & Drop** - Mova cards entre colunas facilmente
- ✅ **Real-time** - Atualizações em tempo real com Supabase
- ✅ **Dark Mode** - Suporte completo para tema escuro
- ✅ **Responsivo** - Funciona em desktop e mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: @dnd-kit
- **State Management**: Zustand
- **Backend**: Supabase (Database + Real-time)
- **Icons**: Lucide React

## 📋 Setup

### 1. Clonar o projeto
```bash
git clone <repository-url>
cd kanban-app
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar Supabase
1. Crie um novo projeto no [Supabase](https://supabase.com)
2. Copie as variáveis de ambiente para `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configurar o banco de dados
Execute o SQL do arquivo `supabase-schema.sql` no SQL Editor do Supabase para criar as tabelas necessárias.

### 5. Iniciar o desenvolvimento
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
├── components/
│   ├── kanban/            # Componentes do kanban
│   └── ThemeProvider.tsx  # Provider de tema
├── lib/
│   ├── supabase.ts       # Cliente Supabase
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Utilitários
└── types/
    └── kanban.ts         # Tipos TypeScript
```

## 🎯 Como Usar

1. **Criar um Board** - Clique em "Criar Primeiro Board"
2. **Adicionar Colunas** - Use o botão "Adicionar Coluna"
3. **Criar Cards** - Clique em "Adicionar card" em qualquer coluna
4. **Mover Cards** - Arraste e solte os cards entre colunas
5. **Editar** - Clique no ícone de edição para modificar cards
6. **Tema** - Alternar entre light e dark mode

## 🚀 Deploy

O projeto está pronto para deploy na Vercel ou qualquer plataforma que suporte Next.js.

## 📝 Licença

MIT License
