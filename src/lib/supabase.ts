export { supabase, getCurrentUser } from '@/lib/supabase-client';
export { teamsApi } from '@/lib/apis/teams';
export { boardsApi } from '@/lib/apis/boards';
export { columnsApi } from '@/lib/apis/columns';
export { tasksApi } from '@/lib/apis/tasks';
export { teamMembersApi } from '@/lib/apis/team-members';
export { subscribeToBoard } from '@/lib/apis/realtime';

// Exporta tasksApi como cardsApi para compatibilidade
export { tasksApi as cardsApi } from '@/lib/apis/tasks';
