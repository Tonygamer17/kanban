import { supabase } from '@/lib/supabase-client';

export const teamsApi = {
  async getAllForUser(userId: string) {
    const { data: ownedTeams, error: ownerError } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', userId);

    if (ownerError) throw ownerError;

    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(
        `
        team_id,
        role,
        teams (*)
      `
      )
      .eq('profile_id', userId);

    if (memberError) throw memberError;

    const memberTeams = (memberData || [])
      .flatMap((member: { teams: unknown }) =>
        Array.isArray(member.teams) ? member.teams : [member.teams]
      )
      .filter(Boolean);
    const allTeams = [...(ownedTeams || []), ...memberTeams];

    const uniqueTeams = allTeams.filter(
      (team, index, self) =>
        Boolean((team as { id?: string })?.id) &&
        index ===
          self.findIndex((t) => (t as { id?: string })?.id === (team as { id?: string })?.id)
    );

    return uniqueTeams;
  },

  async createTeam(name: string, ownerId: string) {
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (teamError) throw teamError;

    const { error: memberError } = await supabase.from('team_members').insert({
      team_id: team.id,
      profile_id: ownerId,
      role: 'owner',
    });

    if (memberError) throw memberError;

    return team;
  },
};
