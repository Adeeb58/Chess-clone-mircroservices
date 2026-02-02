package com.indichess.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameDTO {
    private Long id;
    private Long whitePlayerId;
    private Long blackPlayerId;
    private String whitePlayerName;
    private String blackPlayerName;
    private String fen;
    private String pgn;
    private String status;
    private String currentTurn;
    private String timeControl;
    private Long whiteTimeRemaining;
    private Long blackTimeRemaining;
    private String statusMessage;
}
