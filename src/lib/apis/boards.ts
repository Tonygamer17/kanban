import { getCurrentUser, supabase } from '@/lib/supabase-client';

export const boardsApi = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ERROR: boardsApi.getAll() failed:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('❌ ERROR: boardsApi.getAll() exception:', err);
      throw err;
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('boards')
      .select(
        `
        *,
        columns (
          *,
          tasks (*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(name: string, teamId: string, description: string = '') {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('boards')
      .insert({
        name,
        description,
        team_id: teamId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, name: string, description?: string) {
    const updateData: { name: string; description?: string } = { name };
    if (description !== undefined) {
      updateData.description = description;
    }

    const { data, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('boards').delete().eq('id', id);

    if (error) throw error;
  },
};
