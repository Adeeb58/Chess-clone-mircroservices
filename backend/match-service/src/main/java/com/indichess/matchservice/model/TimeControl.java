package com.indichess.matchservice.model;

import lombok.Getter;

@Getter
public enum TimeControl {
    BULLET(60, 0), // 1 minute
    BLITZ(180, 0), // 3 minutes
    RAPID(600, 0), // 10 minutes
    CLASSICAL(1800, 0); // 30 minutes

    private final int initialTimeSeconds;
    private final int incrementSeconds;

    TimeControl(int initialTimeSeconds, int incrementSeconds) {
        this.initialTimeSeconds = initialTimeSeconds;
        this.incrementSeconds = incrementSeconds;
    }
}
