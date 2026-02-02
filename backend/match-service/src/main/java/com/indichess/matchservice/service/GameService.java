package com.indichess.matchservice.service;

import com.indichess.common.dto.UserDTO;
import com.indichess.common.exception.GameStateException;
import com.indichess.common.exception.InvalidMoveException;
import com.indichess.common.exception.ResourceNotFoundException;
import com.indichess.matchservice.client.UserServiceClient;
import com.indichess.matchservice.model.Game;
import com.indichess.matchservice.model.GameStatus;
import com.indichess.matchservice.model.Move;
import com.indichess.matchservice.model.TimeControl;
import com.indichess.matchservice.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GameService {
    private final GameRepository gameRepository;
    private final GameEngineService gameEngineService;
    private final UserServiceClient userServiceClient;

    // In-memory waiting queue (for simple matchmaking)
    private final ConcurrentHashMap<String, Long> waitingPlayers = new ConcurrentHashMap<>();

    // Track matched games for players who were waiting so they can be notified via
    // polling
    private final ConcurrentHashMap<String, Long> matchedGames = new ConcurrentHashMap<>();

    @Transactional
    public Map<String, Object> createOrJoinGame(String username, TimeControl timeControl) {
        UserDTO user = userServiceClient.getUserByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User", "username", username);
        }

        // Check if already waiting
        if (waitingPlayers.containsKey(username)) {
            return Map.of("matchId", -1L, "message", "Already in queue");
        }

        // Try to find a waiting player
        String opponent = waitingPlayers.keySet().stream()
                .filter(name -> !name.equals(username))
                .findFirst()
                .orElse(null);

        if (opponent != null) {
            // Match found! Create game
            UserDTO opponentUser = userServiceClient.getUserByUsername(opponent);
            waitingPlayers.remove(opponent);

            Game game = createGame(user, opponentUser, timeControl);

            // Store the game ID so the opponent (who is polling) can find it
            matchedGames.put(opponent, game.getId());

            return Map.of("matchId", game.getId(), "message", "Match found");
        }

        // No opponent found, add to queue
        waitingPlayers.put(username, System.currentTimeMillis());
        return Map.of("matchId", -1L, "message", "Waiting for opponent");
    }

    public Map<String, Object> checkForMatch(String username) {
        // First check if a match was found for this user while they were waiting
        if (matchedGames.containsKey(username)) {
            Long gameId = matchedGames.remove(username);
            return Map.of("matchId", gameId, "message", "Match found");
        }

        if (waitingPlayers.containsKey(username)) {
            return Map.of("matchId", -1L, "message", "Still waiting");
        }
        return Map.of("matchId", -2L, "message", "Not in queue");
    }

    public void cancelWaiting(String username) {
        waitingPlayers.remove(username);
        matchedGames.remove(username);
    }

    @Transactional
    public Game createGame(UserDTO whitePlayer, UserDTO blackPlayer, TimeControl timeControl) {
        long initialTime = timeControl.getInitialTimeSeconds() * 1000L;

        Game game = Game.builder()
                .whitePlayerId(whitePlayer.getId())
                .whitePlayerName(whitePlayer.getUsername())
                .blackPlayerId(blackPlayer.getId())
                .blackPlayerName(blackPlayer.getUsername())
                .fen(gameEngineService.getInitialFen())
                .pgn("")
                .status(GameStatus.IN_PROGRESS)
                .currentTurn("WHITE")
                .timeControl(timeControl)
                .whiteTimeRemaining(initialTime)
                .blackTimeRemaining(initialTime)
                .lastMoveTime(System.currentTimeMillis())
                .build();

        return gameRepository.save(game);
    }

    @Transactional
    public Game makeMove(Long gameId, String username, String from, String to, String promotion) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", gameId));

        // Validate game state
        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new GameStateException("Game is not in progress");
        }

        // Validate player's turn
        boolean isWhite = username.equals(game.getWhitePlayerName());
        boolean isBlack = username.equals(game.getBlackPlayerName());

        if (!isWhite && !isBlack) {
            throw new GameStateException("You are not a player in this game");
        }

        if ((game.getCurrentTurn().equals("WHITE") && !isWhite) ||
                (game.getCurrentTurn().equals("BLACK") && !isBlack)) {
            throw new GameStateException("It's not your turn");
        }

        // Update time
        long now = System.currentTimeMillis();
        long elapsed = now - game.getLastMoveTime();

        if (isWhite) {
            game.setWhiteTimeRemaining(game.getWhiteTimeRemaining() - elapsed);
            if (game.getWhiteTimeRemaining() <= 0) {
                game.setStatus(GameStatus.COMPLETED);
                game.setStatusMessage("Black wins on time");
                return gameRepository.save(game);
            }
        } else {
            game.setBlackTimeRemaining(game.getBlackTimeRemaining() - elapsed);
            if (game.getBlackTimeRemaining() <= 0) {
                game.setStatus(GameStatus.COMPLETED);
                game.setStatusMessage("White wins on time");
                return gameRepository.save(game);
            }
        }

        // Save previous FEN for undo
        game.setPreviousFen(game.getFen());

        // Make the move
        String newFen;
        try {
            newFen = gameEngineService.makeMove(game.getFen(), from, to, promotion);
        } catch (Exception e) {
            throw new InvalidMoveException("Invalid move: " + e.getMessage());
        }

        game.setFen(newFen);
        game.setLastMoveTime(now);
        game.setCurrentTurn(isWhite ? "BLACK" : "WHITE");

        // Record move
        Move move = Move.builder()
                .game(game)
                .playerId(isWhite ? game.getWhitePlayerId() : game.getBlackPlayerId())
                .playerName(username)
                .notation(from + to + (promotion != null ? promotion : ""))
                .fenAfter(newFen)
                .moveNumber(game.getMoves().size() + 1)
                .build();
        game.getMoves().add(move);

        // Update PGN
        String currentPgn = game.getPgn() != null ? game.getPgn() : "";
        game.setPgn(currentPgn + " " + move.getNotation());

        // Check game end conditions
        if (gameEngineService.isCheckmate(newFen)) {
            game.setStatus(GameStatus.COMPLETED);
            game.setStatusMessage(isWhite ? "White wins by checkmate" : "Black wins by checkmate");
        } else if (gameEngineService.isStalemate(newFen)) {
            game.setStatus(GameStatus.DRAW);
            game.setStatusMessage("Draw by stalemate");
        } else if (gameEngineService.isDraw(newFen)) {
            game.setStatus(GameStatus.DRAW);
            game.setStatusMessage("Draw");
        }

        return gameRepository.save(game);
    }

    public Game getGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game", "id", gameId));
    }

    @Transactional
    public Game resignGame(Long gameId, String username) {
        Game game = getGame(gameId);

        if (game.getStatus() != GameStatus.IN_PROGRESS) {
            throw new GameStateException("Game is not in progress");
        }

        boolean isWhite = username.equals(game.getWhitePlayerName());
        game.setStatus(GameStatus.COMPLETED);
        game.setStatusMessage(isWhite ? "Black wins by resignation" : "White wins by resignation");

        return gameRepository.save(game);
    }
}
