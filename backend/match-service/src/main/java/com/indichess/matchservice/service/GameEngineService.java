package com.indichess.matchservice.service;

import com.github.bhlangonijr.chesslib.Board;
import com.github.bhlangonijr.chesslib.Square;
import com.github.bhlangonijr.chesslib.move.Move;
import com.indichess.common.exception.InvalidMoveException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GameEngineService {
    private static final String INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    public String getInitialFen() {
        return INITIAL_FEN;
    }

    public Board createBoard(String fen) {
        Board board = new Board();
        if (fen != null && !fen.isEmpty()) {
            board.loadFromFen(fen);
        }
        return board;
    }

    public String makeMove(String currentFen, String from, String to, String promotion) {
        Board board = createBoard(currentFen);

        Square fromSquare = Square.valueOf(from.toUpperCase());
        Square toSquare = Square.valueOf(to.toUpperCase());

        Move move;
        if (promotion != null && !promotion.isEmpty()) {
            move = new Move(fromSquare, toSquare,
                    com.github.bhlangonijr.chesslib.Piece.fromValue(promotion.toUpperCase()));
        } else {
            move = new Move(fromSquare, toSquare);
        }

        // Check if move is legal
        List<Move> legalMoves = board.legalMoves();
        boolean isLegal = legalMoves.stream()
                .anyMatch(m -> m.getFrom() == fromSquare && m.getTo() == toSquare);

        if (!isLegal) {
            throw new InvalidMoveException("Illegal move: " + from + " to " + to);
        }

        board.doMove(move);
        return board.getFen();
    }

    public boolean isCheckmate(String fen) {
        Board board = createBoard(fen);
        return board.isMated();
    }

    public boolean isStalemate(String fen) {
        Board board = createBoard(fen);
        return board.isStaleMate();
    }

    public boolean isDraw(String fen) {
        Board board = createBoard(fen);
        return board.isDraw();
    }

    public boolean isCheck(String fen) {
        Board board = createBoard(fen);
        return board.isKingAttacked();
    }

    public String getCurrentTurn(String fen) {
        Board board = createBoard(fen);
        return board.getSideToMove().name();
    }
}
