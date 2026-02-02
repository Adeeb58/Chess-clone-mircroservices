package com.indichess.matchservice.controller;

import com.indichess.common.dto.GameStateDTO;
import com.indichess.common.dto.MoveRequest;
import com.indichess.matchservice.model.Game;
import com.indichess.matchservice.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class SocketController {
    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/move")
    public void handleMove(@Payload MoveRequest moveRequest) {
        String username = moveRequest.getUsername();

        if (username == null || username.isEmpty()) {
            GameStateDTO errorState = GameStateDTO.builder()
                    .type("ERROR")
                    .status("ERROR")
                    .statusMessage("Username required for making moves")
                    .build();
            messagingTemplate.convertAndSend("/topic/game/" + moveRequest.getGameId(), errorState);
            return;
        }

        try {
            Game game = gameService.makeMove(
                    moveRequest.getGameId(),
                    username,
                    moveRequest.getFrom(),
                    moveRequest.getTo(),
                    moveRequest.getPromotion());

            GameStateDTO gameState = GameStateDTO.builder()
                    .type("MOVE")
                    .fen(game.getFen())
                    .pgn(game.getPgn())
                    .currentTurn(game.getCurrentTurn())
                    .whiteTimeRemaining(game.getWhiteTimeRemaining())
                    .blackTimeRemaining(game.getBlackTimeRemaining())
                    .status(game.getStatus().toString())
                    .statusMessage(game.getStatusMessage())
                    .build();

            messagingTemplate.convertAndSend("/topic/game/" + moveRequest.getGameId(), gameState);

        } catch (Exception e) {
            GameStateDTO errorState = GameStateDTO.builder()
                    .type("ERROR")
                    .status("ERROR")
                    .statusMessage(e.getMessage())
                    .build();
            messagingTemplate.convertAndSend("/topic/game/" + moveRequest.getGameId(), errorState);
        }
    }
}
