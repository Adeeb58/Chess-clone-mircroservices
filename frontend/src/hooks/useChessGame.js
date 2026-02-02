import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import socketService from '../services/socket';

export function useChessGame(gameId = 1) { // Default gameId 1 for Phase 1
    const [game, setGame] = useState(new Chess());
    const [optionSquares, setOptionSquares] = useState({});
    const [moveFrom, setMoveFrom] = useState('');
    const [rightClickedSquares, setRightClickedSquares] = useState({});
    const [lastLog, setLastLog] = useState("Connecting to server...");
    const [isConnected, setIsConnected] = useState(false);
    const [whiteTime, setWhiteTime] = useState(600); // 10 mins
    const [blackTime, setBlackTime] = useState(600);
    const [gameOver, setGameOver] = useState(false);
    const [gameResult, setGameResult] = useState("");

    // WebSocket Connection using centralized socket service
    useEffect(() => {
        let unsubscribe = null;

        const handleGameUpdate = (body) => {
            console.log("Received:", body);

            if (body.type === 'MOVE') {
                // Update Game State
                if (body.pgn) {
                    try {
                        const newGame = new Chess();
                        const moves = body.pgn.split(" ");
                        for (const moveStr of moves) {
                            if (!moveStr) continue;
                            newGame.move({
                                from: moveStr.substring(0, 2),
                                to: moveStr.substring(2, 4),
                                promotion: moveStr.length > 4 ? moveStr.substring(4) : undefined
                            });
                        }
                        setGame(newGame);
                    } catch (e) {
                        console.error("PGN replay failed", e);
                        setGame(new Chess(body.fen));
                    }
                } else {
                    setGame(new Chess(body.fen));
                }

                setWhiteTime(body.whiteTimeLeft);
                setBlackTime(body.blackTimeLeft);
                setLastLog(`Opponent moved. Turn: ${body.currentTurn}`);

                if (body.status === 'COMPLETED' || body.status === 'FINISHED') {
                    setGameOver(true);
                    setGameResult(body.message || "Game Over");
                }
            } else if (body.type === 'GAME_OVER') {
                setGameOver(true);
                setGameResult(body.message);
            } else if (body.type === 'ERROR') {
                setLastLog(`Error: ${body.status}`);
            }
        };

        socketService.connect()
            .then(() => {
                console.log('Connected to WebSocket');
                setIsConnected(true);
                setLastLog("Connected to Game Server");
                unsubscribe = socketService.subscribe(`/topic/game/${gameId}`, handleGameUpdate);
            })
            .catch((error) => {
                console.error('WebSocket connection error:', error);
                setLastLog("Connection Error");
                setIsConnected(false);
            });

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [gameId]);

    // Helper: Get valid moves for a square
    function getMoveOptions(square) {
        const moves = game.moves({
            square,
            verbose: true,
        });
        if (moves.length === 0) {
            return false;
        }

        const newSquares = {};
        moves.map((move) => {
            newSquares[move.to] = {
                background:
                    game.get(move.to) && game.get(move.to).color !== game.turn()
                        ? 'radial-gradient(circle, rgba(0, 255, 0, 0.5) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0, 255, 0, 0.5) 25%, transparent 25%)',
                borderRadius: '50%',
            };
            return move;
        });
        newSquares[square] = {
            background: 'rgba(0, 255, 0, 0.4)',
        };
        setOptionSquares(newSquares);
        return true;
    }

    // Handler: Drag and Drop
    function onDrop(sourceSquare, targetSquare) {
        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (!move) return false;

            if (isConnected) {
                socketService.publish("/app/move", {
                    gameId: gameId,
                    from: sourceSquare,
                    to: targetSquare,
                    promotion: 'q'
                });
            } else {
                setLastLog("Not connected! Move not sent.");
                return false;
            }

            setOptionSquares({});
            return true;
        } catch (e) {
            return false;
        }
    }

    // Handler: Click to Move
    function onSquareClick(square) {
        setRightClickedSquares({});

        if (moveFrom) {
            try {
                const gameCopy = new Chess(game.fen());
                const move = gameCopy.move({
                    from: moveFrom,
                    to: square,
                    promotion: 'q',
                });

                if (move) {
                    if (isConnected) {
                        socketService.publish("/app/move", {
                            gameId: gameId,
                            from: moveFrom,
                            to: square,
                            promotion: 'q'
                        });
                        setMoveFrom('');
                        setOptionSquares({});
                        return;
                    }
                }
            } catch (e) { }

            const hasOptions = getMoveOptions(square);
            if (hasOptions) {
                setMoveFrom(square);
            } else {
                setMoveFrom('');
                setOptionSquares({});
            }
        } else {
            const hasOptions = getMoveOptions(square);
            if (hasOptions) setMoveFrom(square);
        }
    }

    function onSquareRightClick(square) {
        const colour = 'rgba(0, 0, 255, 0.4)';
        setRightClickedSquares({
            ...rightClickedSquares,
            [square]:
                rightClickedSquares[square] && rightClickedSquares[square].backgroundColor === colour
                    ? undefined
                    : { backgroundColor: colour },
        });
    }

    async function resetGame() {
        setGame(new Chess());
        setMoveFrom('');
        setOptionSquares({});
        setGameOver(false);
        setGameResult("");
        window.location.reload();
    }

    async function resignGame() {
        if (!isConnected) return;
        try {
            await fetch(`http://localhost:8080/game/${gameId}/resign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error("Resign failed", error);
        }
    }

    async function undoMove() {
        if (!isConnected) return;
        try {
            await fetch(`http://localhost:8080/game/${gameId}/undo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (error) {
            console.error("Undo failed", error);
        }
    }

    return {
        game,
        onDrop,
        onSquareClick,
        onSquareRightClick,
        optionSquares,
        rightClickedSquares,
        resetGame,
        resignGame,
        undoMove,
        lastLog,
        whiteTime,
        blackTime,
        gameOver,
        gameResult
    };
}
