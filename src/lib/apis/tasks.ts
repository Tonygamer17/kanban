import { supabase } from '@/lib/supabase-client';

export const tasksApi = {
  async getByColumnId(columnId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('column_id', columnId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(
    columnId: string,
    title: string,
    description: string = '',
    priority: string = 'medium',
    status: string = 'todo',
    position: number = 0,
    dueDate?: string
  ) {
    const insertData: {
      column_id: string;
      title: string;
      description: string;
      priority: string;
      status: string;
      position: number;
      due_date?: string;
    } = {
      column_id: columnId,
      title,
      description,
      priority,
      status,
      position,
    };

    if (dueDate) {
      insertData.due_date = dueDate;
    }

    const { data, error } = await supabase.from('tasks').insert(insertData).select().single();

    if (error) throw error;
    return data;
  },

  async update(
    id: string,
    updates: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      position?: number;
      due_date?: string | null;
      updated_at?: string;
    }
  ) {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("SUPABASE UPDATE TASK ERROR FULL:", error);
      alert(error.message);
      throw error;
    }

    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) throw error;
  },

  async move(taskId: string, targetColumnId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        column_id: targetColumnId,
        position: newPosition,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
