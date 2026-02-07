-- Kanban App Database Schema
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
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed from user_id to profile_id
  role text DEFAULT 'member' NOT NULL, -- e.g., 'admin', 'member'
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, profile_id) -- Changed from user_id to profile_id
);

-- Boards table
CREATE TABLE boards (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE, -- Link board to a team
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- NEW: Creator of the board
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

-- Create indexes for better performance
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_columns_order ON columns(board_id, order_index);
CREATE INDEX idx_cards_order ON cards(column_id, order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;



-- RLS policies for teams table
CREATE POLICY "Enable read access for team members" ON teams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id AND profile_id = auth.uid())
  );
CREATE POLICY "Enable insert for authenticated users" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Enable update for team owners" ON teams
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Enable delete for team owners" ON teams
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS policies for team_members table
CREATE POLICY "Enable read access for team members" ON team_members
  FOR SELECT USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid()));
CREATE POLICY "Enable insert for team owners" ON team_members
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid()));
CREATE POLICY "Enable delete for team owners or self" ON team_members
  FOR DELETE USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND owner_id = auth.uid()));

-- RLS policies for boards table
CREATE POLICY "Enable read access for team members" ON boards
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = boards.team_id AND profile_id = auth.uid())
  );
CREATE POLICY "Enable insert for team members" ON boards
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = boards.team_id AND profile_id = auth.uid())
    AND created_by = auth.uid()
  );
CREATE POLICY "Enable update for team members" ON boards
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = boards.team_id AND profile_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = boards.team_id AND profile_id = auth.uid())
  );
CREATE POLICY "Enable delete for team members" ON boards
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM team_members WHERE team_id = boards.team_id AND profile_id = auth.uid())
  );

-- RLS policies for columns table
CREATE POLICY "Enable read access for team members" ON columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE boards.id = columns.board_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable insert for team members" ON columns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE boards.id = columns.board_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable update for team members" ON columns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE boards.id = columns.board_id AND team_members.profile_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE boards.id = columns.board_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable delete for team members" ON columns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM boards
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE boards.id = columns.board_id AND team_members.profile_id = auth.uid()
    )
  );

-- RLS policies for cards table
CREATE POLICY "Enable read access for team members" ON cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE columns.id = cards.column_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable insert for team members" ON cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE columns.id = cards.column_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable update for team members" ON cards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE columns.id = cards.column_id AND team_members.profile_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE columns.id = cards.column_id AND team_members.profile_id = auth.uid()
    )
  );
CREATE POLICY "Enable delete for team members" ON cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM columns
      JOIN boards ON boards.id = columns.board_id
      JOIN team_members ON team_members.team_id = boards.team_id
      WHERE columns.id = cards.column_id AND team_members.profile_id = auth.uid()
    )
  );

-- Insert sample data for testing
-- DUMMY UUIDs for testing purposes. In a real app, these would come from auth.users
DO $$
DECLARE
  team_id_1 uuid;
  dummy_owner_id uuid := '00000000-0000-0000-0000-000000000001'; -- A dummy UUID for the owner
  dummy_member_id uuid := '00000000-0000-0000-0000-000000000002'; -- A dummy UUID for a member
  board_id_1 uuid;
  column_id_1 uuid;
  column_id_2 uuid;
  column_id_3 uuid;
BEGIN
  -- Insert dummy owner and member into auth.users if they don't exist
  -- This is a workaround for local testing if auth.users is empty
  -- In a real scenario, these would be actual authenticated users
  INSERT INTO auth.users (id, email, encrypted_password)
  VALUES
    (dummy_owner_id, 'owner@example.com', 'dummy_password_hash')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.users (id, email, encrypted_password)
  VALUES
    (dummy_member_id, 'member@example.com', 'dummy_password_hash')
  ON CONFLICT (id) DO NOTHING;

  -- Insert a sample team
  INSERT INTO teams (name, owner_id) VALUES ('Dev Team Alpha', dummy_owner_id) RETURNING id INTO team_id_1;

  -- Add owner and a member to the team
  INSERT INTO team_members (team_id, profile_id, role) VALUES -- Changed user_id to profile_id
    (team_id_1, dummy_owner_id, 'admin'),
    (team_id_1, dummy_member_id, 'member');

  -- Insert sample board for the team
  INSERT INTO boards (title, team_id) VALUES ('Projeto Kanban', team_id_1) RETURNING id INTO board_id_1;

  -- Insert columns for the board
  INSERT INTO columns (title, board_id, order_index) VALUES
    ('A Fazer', board_id_1, 0) RETURNING id INTO column_id_1,
    ('Em Progresso', board_id_1, 1) RETURNING id INTO column_id_2,
    ('Concluído', board_id_1, 2) RETURNING id INTO column_id_3;

  -- Insert cards for the columns
  INSERT INTO cards (title, description, column_id, order_index) VALUES
    ('Configurar Next.js', 'Configurar o ambiente Next.js e dependências iniciais', column_id_1, 0),
    ('Design da UI', 'Desenhar o layout principal do kanban board', column_id_1, 1),
    ('Implementar Drag & Drop', 'Adicionar a funcionalidade de arrastar e soltar', column_id_2, 0),
    ('Testar Funcionalidades', 'Realizar testes unitários e de integração', column_id_3, 0);

END $$;


-- Create functions for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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