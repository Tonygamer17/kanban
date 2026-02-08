import { supabase } from '@/lib/supabase-client';

export const subscribeToBoard = (boardId: string, callback: (payload: unknown) => void) => {
  return supabase
    .channel(`board-${boardId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boards',
        filter: `id=eq.${boardId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'columns',
        filter: `board_id=eq.${boardId}`,
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      callback
    )
    .subscribe();
};
