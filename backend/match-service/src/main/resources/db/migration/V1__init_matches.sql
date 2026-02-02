-- V1__init_matches.sql
-- Initial schema for match service
-- Games table
CREATE TABLE IF NOT EXISTS games (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    white_player_id BIGINT,
    black_player_id BIGINT,
    white_player_name VARCHAR(50),
    black_player_name VARCHAR(50),
    fen VARCHAR(100),
    pgn TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    current_turn VARCHAR(10) DEFAULT 'WHITE',
    time_control VARCHAR(20),
    white_time_remaining BIGINT,
    black_time_remaining BIGINT,
    last_move_time BIGINT,
    status_message VARCHAR(255),
    previous_fen VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- Moves table
CREATE TABLE IF NOT EXISTS moves (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id BIGINT NOT NULL,
    player_id BIGINT,
    player_name VARCHAR(50),
    notation VARCHAR(10) NOT NULL,
    fen_after VARCHAR(100),
    move_number INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);
-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_moves_game_id ON moves(game_id);