package com.indichess.matchservice.repository;

import com.indichess.matchservice.model.Game;
import com.indichess.matchservice.model.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByStatus(GameStatus status);

    List<Game> findByWhitePlayerIdOrBlackPlayerId(Long whitePlayerId, Long blackPlayerId);

    Optional<Game> findFirstByStatusOrderByCreatedAtAsc(GameStatus status);
}
