package com.indichess.matchservice.controller;

import com.indichess.common.dto.UserDTO;
import com.indichess.matchservice.client.UserServiceClient;
import com.indichess.matchservice.model.Game;
import com.indichess.matchservice.model.TimeControl;
import com.indichess.matchservice.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/matchmaking")
@RequiredArgsConstructor
public class MatchmakingController {
        private final GameService gameService;
        private final UserServiceClient userServiceClient;
        private final SimpMessagingTemplate messagingTemplate;

        // Queue storage: username -> {timeControl, joinTime}
        private final ConcurrentHashMap<String, Map<String, Object>> waitingPlayers = new ConcurrentHashMap<>();

        @PostMapping("/queue")
        public ResponseEntity<Map<String, Object>> joinQueue(
                        @RequestHeader("X-Username") String username,
                        @RequestBody Map<String, String> request) {

                String timeControlStr = request.getOrDefault("timeControl", "RAPID");
                TimeControl timeControl;
                try {
                        timeControl = TimeControl.valueOf(timeControlStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                        timeControl = TimeControl.RAPID;
                }

                UserDTO user = userServiceClient.getUserByUsername(username);
                if (user == null) {
                        return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
                }

                // Check if already waiting
                if (waitingPlayers.containsKey(username)) {
                        return ResponseEntity.ok(Map.of(
                                        "status", "WAITING",
                                        "message", "Already in queue"));
                }

                // Try to find a match
                TimeControl finalTimeControl = timeControl;
                String opponent = waitingPlayers.entrySet().stream()
                                .filter(entry -> !entry.getKey().equals(username))
                                .filter(entry -> entry.getValue().get("timeControl").equals(finalTimeControl.name()))
                                .map(Map.Entry::getKey)
                                .findFirst()
                                .orElse(null);

                if (opponent != null) {
                        // Match found!
                        UserDTO opponentUser = userServiceClient.getUserByUsername(opponent);
                        waitingPlayers.remove(opponent);

                        // Create the game
                        Game game = gameService.createGame(user, opponentUser, timeControl);

                        // Notify both players via WebSocket
                        Map<String, Object> matchData = Map.of(
                                        "gameId", game.getId(),
                                        "whitePlayer", game.getWhitePlayerName(),
                                        "blackPlayer", game.getBlackPlayerName(),
                                        "timeControl", timeControl.name());

                        // Notify the opponent who was waiting
                        messagingTemplate.convertAndSendToUser(
                                        opponent, "/queue/match-found", matchData);

                        // Return match data to current user
                        return ResponseEntity.ok(Map.of(
                                        "status", "MATCHED",
                                        "gameId", game.getId(),
                                        "opponent", opponent,
                                        "color", "black", // Current user is black (joined second)
                                        "timeControl", timeControl.name()));
                }

                // No opponent found, add to queue
                waitingPlayers.put(username, Map.of(
                                "timeControl", timeControl.name(),
                                "joinTime", System.currentTimeMillis()));

                return ResponseEntity.ok(Map.of(
                                "status", "WAITING",
                                "message", "Waiting for opponent",
                                "queuePosition", waitingPlayers.size()));
        }

        @DeleteMapping("/queue")
        public ResponseEntity<Map<String, Object>> leaveQueue(
                        @RequestHeader("X-Username") String username) {
                waitingPlayers.remove(username);
                return ResponseEntity.ok(Map.of(
                                "status", "LEFT",
                                "message", "Left the queue"));
        }

        @GetMapping("/queue/status")
        public ResponseEntity<Map<String, Object>> getQueueStatus(
                        @RequestHeader("X-Username") String username) {
                if (waitingPlayers.containsKey(username)) {
                        return ResponseEntity.ok(Map.of(
                                        "status", "WAITING",
                                        "queuePosition", waitingPlayers.size()));
                }
                return ResponseEntity.ok(Map.of(
                                "status", "NOT_IN_QUEUE"));
        }
}
