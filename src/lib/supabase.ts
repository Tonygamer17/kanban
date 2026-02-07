import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Missing Supabase environment variables');
  throw new Error('Supabase URL and Anon Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para pegar usuário autenticado
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('User not authenticated');
  return user;
}

// Teams API
export const teamsApi = {
  async getAllForUser(userId: string) {
    // Get teams where user is owner
    const { data: ownedTeams, error: ownerError } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', userId);
    
    if (ownerError) throw ownerError;
    
    // Get teams where user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        role,
        teams (*)
      `)
      .eq('profile_id', userId);
    
    if (memberError) throw memberError;
    
    // Combine and deduplicate
    const memberTeams = memberData?.map(m => m.teams).filter(Boolean) || [];
    const allTeams = [...(ownedTeams || []), ...memberTeams];
    
    // Remove duplicates by ID
    const uniqueTeams = allTeams.filter((team, index, self) =>
      index === self.findIndex((t) => t.id === team.id)
    );
    
    return uniqueTeams;
  },

  async createTeam(name: string, ownerId: string) {
    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ 
        name, 
        owner_id: ownerId 
      })
      .select()
      .single();

    if (teamError) throw teamError;
    
    // Add owner as team member with role 'owner'
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ 
        team_id: team.id, 
        profile_id: ownerId, 
        role: 'owner' 
      });

    if (memberError) throw memberError;

    return team;
  }
};

// Boards API
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
      .select(`
        *,
        columns (
          *,
          tasks (*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(name: string, teamId: string, description: string = '') {
    // Get current user
    const user = await getCurrentUser();
    
    const { data, error } = await supabase
      .from('boards')
      .insert({
        name,
        description,
        team_id: teamId,
        created_by: user.id
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
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Columns API
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
        position
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
    const { error } = await supabase
      .from('columns')
      .delete()
      .eq('id', id);
    
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
  }
};

// Tasks API (substitui cards)
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
      position
    };

    if (dueDate) {
      insertData.due_date = dueDate;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();
    
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
    }
  ) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async move(taskId: string, targetColumnId: string, newPosition: number) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        column_id: targetColumnId,
        position: newPosition
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Team Members API
export const teamMembersApi = {
  async getByTeamId(teamId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) throw error;
    return data || [];
  },

  async addMember(teamId: string, profileId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        profile_id: profileId,
        role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removeMember(teamId: string, profileId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('profile_id', profileId);
    
    if (error) throw error;
  }
};

// Realtime subscriptions
export const subscribeToBoard = (boardId: string, callback: (payload: unknown) => void) => {
  return supabase
    .channel(`board-${boardId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'boards',
        filter: `id=eq.${boardId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'columns',
        filter: `board_id=eq.${boardId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      callback
    )
    .subscribe();
};

// Exporta tasksApi como cardsApi para compatibilidade
export const cardsApi = tasksApi;
