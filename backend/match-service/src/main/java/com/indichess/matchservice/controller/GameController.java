package com.indichess.matchservice.controller;

import com.indichess.common.dto.GameDTO;
import com.indichess.matchservice.model.Game;
import com.indichess.matchservice.model.TimeControl;
import com.indichess.matchservice.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/game")
@RequiredArgsConstructor
public class GameController {
    private final GameService gameService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrJoinGame(
            @RequestHeader("X-Username") String username,
            @RequestParam(defaultValue = "RAPID") String timeControl) {
        TimeControl tc = TimeControl.valueOf(timeControl.toUpperCase());
        Map<String, Object> result = gameService.createOrJoinGame(username, tc);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check-match")
    public ResponseEntity<Map<String, Object>> checkMatch(@RequestHeader("X-Username") String username) {
        Map<String, Object> result = gameService.checkForMatch(username);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/cancel-waiting")
    public ResponseEntity<Map<String, String>> cancelWaiting(@RequestHeader("X-Username") String username) {
        gameService.cancelWaiting(username);
        return ResponseEntity.ok(Map.of("status", "cancelled"));
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<GameDTO> getGame(@PathVariable Long gameId) {
        Game game = gameService.getGame(gameId);
        return ResponseEntity.ok(toDTO(game));
    }

    @PostMapping("/move/{gameId}")
    public ResponseEntity<GameDTO> makeMove(
            @PathVariable Long gameId,
            @RequestHeader("X-Username") String username,
            @RequestBody Map<String, String> moveData) {
        String from = moveData.get("from");
        String to = moveData.get("to");
        String promotion = moveData.get("promotion");

        Game game = gameService.makeMove(gameId, username, from, to, promotion);
        return ResponseEntity.ok(toDTO(game));
    }

    @PostMapping("/{gameId}/resign")
    public ResponseEntity<GameDTO> resign(
            @PathVariable Long gameId,
            @RequestHeader("X-Username") String username) {
        Game game = gameService.resignGame(gameId, username);
        return ResponseEntity.ok(toDTO(game));
    }

    private GameDTO toDTO(Game game) {
        return GameDTO.builder()
                .id(game.getId())
                .whitePlayerId(game.getWhitePlayerId())
                .blackPlayerId(game.getBlackPlayerId())
                .whitePlayerName(game.getWhitePlayerName())
                .blackPlayerName(game.getBlackPlayerName())
                .fen(game.getFen())
                .pgn(game.getPgn())
                .status(game.getStatus().name())
                .currentTurn(game.getCurrentTurn())
                .timeControl(game.getTimeControl().name())
                .whiteTimeRemaining(game.getWhiteTimeRemaining())
                .blackTimeRemaining(game.getBlackTimeRemaining())
                .statusMessage(game.getStatusMessage())
                .build();
    }
}
