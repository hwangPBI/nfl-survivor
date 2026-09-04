-- Create game_state table
CREATE TABLE IF NOT EXISTS game_state (
  id BIGSERIAL PRIMARY KEY,
  current_week INTEGER DEFAULT 1,
  season_year INTEGER DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'eliminated', 'eligible_for_buyback')),
  current_week INTEGER DEFAULT 1,
  buyback_count INTEGER DEFAULT 0,
  total_paid INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  week INTEGER NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  start_timestamp BIGINT NOT NULL,
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week, team1, team2)
);

-- Create picks table
CREATE TABLE IF NOT EXISTS picks (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  team_picked TEXT NOT NULL,
  result TEXT DEFAULT 'pending' CHECK (result IN ('pending', 'win', 'loss')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(player_id, week)
);

-- Create buybacks table
CREATE TABLE IF NOT EXISTS buybacks (
  id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_players_status ON players(status);
CREATE INDEX idx_picks_week ON picks(week);
CREATE INDEX idx_picks_player ON picks(player_id);
CREATE INDEX idx_games_week ON games(week);

-- Insert initial game_state
INSERT INTO game_state (current_week, season_year) VALUES (1, 2026)
ON CONFLICT (id) DO NOTHING;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON picks FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON games FOR SELECT USING (true);

-- Allow inserts for signup
CREATE POLICY "Allow insert for signup" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for picks" ON picks FOR INSERT WITH CHECK (true);
