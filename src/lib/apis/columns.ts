import { supabase } from '@/lib/supabase-client';

export const columnsApi = {
  async getByBoardId(boardId: string) {
    const { data, error } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(boardId: string, name: string, position: number) {
    const { data, error } = await supabase
      .from('columns')
      .insert({
        name,
        board_id: boardId,
        position,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, name: string) {
    const { data, error } = await supabase
      .from('columns')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('columns').delete().eq('id', id);

    if (error) throw error;
  },

  async reorder(columnId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('columns')
      .update({ position: newPosition })
      .eq('id', columnId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
