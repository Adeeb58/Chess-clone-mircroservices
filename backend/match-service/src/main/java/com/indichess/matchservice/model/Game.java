package com.indichess.matchservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "white_player_id")
    private Long whitePlayerId;

    @Column(name = "black_player_id")
    private Long blackPlayerId;

    @Column(name = "white_player_name")
    private String whitePlayerName;

    @Column(name = "black_player_name")
    private String blackPlayerName;

    @Column(length = 100)
    private String fen;

    @Column(columnDefinition = "TEXT")
    private String pgn;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private GameStatus status;

    @Column(name = "current_turn", length = 10)
    private String currentTurn; // "WHITE" or "BLACK"

    @Enumerated(EnumType.STRING)
    @Column(name = "time_control", length = 20)
    private TimeControl timeControl;

    @Column(name = "white_time_remaining")
    private Long whiteTimeRemaining; // milliseconds

    @Column(name = "black_time_remaining")
    private Long blackTimeRemaining; // milliseconds

    @Column(name = "last_move_time")
    private Long lastMoveTime; // timestamp in millis

    @Column(name = "status_message")
    private String statusMessage;

    @Column(name = "previous_fen", length = 100)
    private String previousFen;

    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Move> moves = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
