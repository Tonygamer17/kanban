-- Kanban App Database Schema - VERSÃO CORRIGIDA
-- Execute these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Team Members table
CREATE TABLE team_members (
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' NOT NULL, -- e.g., 'admin', 'member'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, profile_id)
);

-- Boards table
CREATE TABLE boards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Columns table
CREATE TABLE columns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cards table
CREATE TABLE cards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  column_id uuid REFERENCES columns(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task Assignees table (para funcionalidade futura)
CREATE TABLE task_assignees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id uuid REFERENCES cards(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(task_id, assignee_id)
);

-- Create indexes for better performance
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_columns_order ON columns(board_id, order_index);
CREATE INDEX idx_cards_order ON cards(column_id, order_index);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_profile_id ON team_members(profile_id);
CREATE INDEX idx_boards_team_id ON boards(team_id);
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_assignee_id ON task_assignees(assignee_id);

-- Enable Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS policies simplificadas com função auxiliar
CREATE OR REPLACE FUNCTION is_team_member(team_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid AND profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies para teams
CREATE POLICY "Teams: Team members can view" ON teams
  FOR SELECT USING (is_team_member(id) OR owner_id = auth.uid());

CREATE POLICY "Teams: Authenticated can create" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Teams: Owners can update" ON teams
  FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Teams: Owners can delete" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- RLS policies para team_members
CREATE POLICY "Team members: Can view own team memberships" ON team_members
  FOR SELECT USING (profile_id = auth.uid() OR is_team_member(team_id));

CREATE POLICY "Team members: Team owners can insert" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Team members: Can delete own membership" ON team_members
  FOR DELETE USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- RLS policies para boards
CREATE POLICY "Boards: Team members can view" ON boards
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY "Boards: Team members can create" ON boards
  FOR INSERT WITH CHECK (
    is_team_member(team_id) AND created_by = auth.uid()
  );

CREATE POLICY "Boards: Team members can update" ON boards
  FOR UPDATE USING (is_team_member(team_id)) WITH CHECK (is_team_member(team_id));

CREATE POLICY "Boards: Team members can delete" ON boards
  FOR DELETE USING (is_team_member(team_id));

-- RLS policies para columns
CREATE POLICY "Columns: Team members can view" ON columns
  FOR SELECT USING (is_team_member(
    (SELECT team_id FROM boards WHERE id = board_id)
  ));

CREATE POLICY "Columns: Team members can create" ON columns
  FOR INSERT WITH CHECK (
    is_team_member((SELECT team_id FROM boards WHERE id = board_id))
  );

CREATE POLICY "Columns: Team members can update" ON columns
  FOR UPDATE USING (
    is_team_member((SELECT team_id FROM boards WHERE id = board_id))
  ) WITH CHECK (
    is_team_member((SELECT team_id FROM boards WHERE id = board_id))
  );

CREATE POLICY "Columns: Team members can delete" ON columns
  FOR DELETE USING (
    is_team_member((SELECT team_id FROM boards WHERE id = board_id))
  );

-- RLS policies para cards
CREATE POLICY "Cards: Team members can view" ON cards
  FOR SELECT USING (is_team_member(
    (SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = column_id))
  ));

CREATE POLICY "Cards: Team members can create" ON cards
  FOR INSERT WITH CHECK (
    is_team_member((SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = column_id)))
  );

CREATE POLICY "Cards: Team members can update" ON cards
  FOR UPDATE USING (
    is_team_member((SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = column_id)))
  ) WITH CHECK (
    is_team_member((SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = column_id)))
  );

CREATE POLICY "Cards: Team members can delete" ON cards
  FOR DELETE USING (
    is_team_member((SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = column_id)))
  );

-- RLS policies para task_assignees
CREATE POLICY "Task assignees: Team members can view" ON task_assignees
  FOR SELECT USING (is_team_member(
    (SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = (SELECT column_id FROM cards WHERE id = task_id)))
  ));

CREATE POLICY "Task assignees: Can create for own cards" ON task_assignees
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid() AND
    is_team_member((SELECT team_id FROM boards WHERE id = (SELECT board_id FROM columns WHERE id = (SELECT column_id FROM cards WHERE id = task_id))))
  );

CREATE POLICY "Task assignees: Can delete own assignments" ON task_assignees
  FOR DELETE USING (
    assigned_by = auth.uid() OR assignee_id = auth.uid()
  );

-- Functions para automatic updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_board_timestamp
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_column_timestamp
  BEFORE UPDATE ON columns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_card_timestamp
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_team_timestamp
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Realtime subscriptions
ALTER TABLE teams REPLICA IDENTITY FULL;
ALTER TABLE team_members REPLICA IDENTITY FULL;
ALTER TABLE boards REPLICA IDENTITY FULL;
ALTER TABLE columns REPLICA IDENTITY FULL;
ALTER TABLE cards REPLICA IDENTITY FULL;
ALTER TABLE task_assignees REPLICA IDENTITY FULL;

-- Publicar alterações para realtime
PUBLICATION supabase_realtime FOR TABLE teams, team_members, boards, columns, cards, task_assignees;