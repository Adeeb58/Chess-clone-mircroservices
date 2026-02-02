package com.indichess.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MoveRequest {
    private Long gameId;
    private String username;
    private String from;
    private String to;
    private String promotion;
}
