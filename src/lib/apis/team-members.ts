import { supabase } from '@/lib/supabase-client';

export const teamMembersApi = {
  async getByTeamId(teamId: string) {
    const { data, error } = await supabase.from('team_members').select('*').eq('team_id', teamId);

    if (error) throw error;
    return data || [];
  },

  async addMember(teamId: string, profileId: string, role: string = 'member') {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        profile_id: profileId,
        role,
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
  },
};
