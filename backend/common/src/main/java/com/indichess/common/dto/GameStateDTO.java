package com.indichess.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameStateDTO {
    private String type; // "MOVE", "ERROR", "GAME_OVER"
    private String fen;
    private String pgn;
    private String currentTurn;
    private String lastMove;
    private Long whiteTimeRemaining;
    private Long blackTimeRemaining;
    private String status;
    private String statusMessage;
}
