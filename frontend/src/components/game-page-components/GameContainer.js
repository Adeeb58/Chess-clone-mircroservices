import React, { useState, useCallback, useEffect } from "react";
import BoardLayout from "./BoardLayout";
import GamePlayControlContainer from "./GamePlayControlContainer";
import GameOverModal from "./GameOverModal";

const GameContainer = ({ gameId }) => {
  const [moves, setMoves] = useState([]);  // Holds the list of moves
  const [gameOverState, setGameOverState] = useState({ show: false, message: "" });
  const [gameData, setGameData] = useState(null);

  // Fetch game data on mount with retry for when game is just starting
  useEffect(() => {
    if (gameId) {
      let retryCount = 0;
      const maxRetries = 5;

      const fetchGame = async () => {
        try {
          const token = localStorage.getItem('token');
          console.log("Fetching game with token:", token ? "present" : "missing");

          const response = await fetch(`http://localhost:8080/game/${gameId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });

          console.log("Game fetch response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            setGameData(data);
            console.log("Game data:", data);

            // If game is still WAITING, retry after a delay
            if (data.status === 'WAITING' && retryCount < maxRetries) {
              retryCount++;
              setTimeout(fetchGame, 1000);
            }
          } else {
            console.warn("Game fetch failed with status:", response.status);
            // Set default game data so moves can still work (for development)
            if (!gameData) {
              setGameData({
                id: gameId,
                status: 'IN_PROGRESS',
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
              });
            }
          }
        } catch (error) {
          console.error("Error fetching game:", error);
          // Set default game data for fallback
          if (!gameData) {
            setGameData({
              id: gameId,
              status: 'IN_PROGRESS',
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
            });
          }
        }
      };

      // Initial fetch with small delay to let second player join
      setTimeout(fetchGame, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const handleGameUpdate = useCallback((status, message) => {
    if (status === 'COMPLETED' || status === 'FINISHED') {
      setGameOverState({ show: true, message: message || "Game Over" });
    }
  }, []);

  const handleNewGame = () => {
    window.location.href = '/home';
  };

  // Function to add a move to the history
  const addMove = (move) => {
    // we will check if it is white move or black move
    if (move.piece !== move.piece.toLowerCase()) {
      const newMove = { move, moveToWhite: move.moveTo };
      setMoves((moves) => [...moves, newMove]);
    }
    else {
      setMoves((prevMoves) => {
        const newMoves = [...prevMoves];
        const lastMove = {
          ...newMoves[newMoves.length - 1],
          moveToBlack: move.moveTo,
          tc: `Black's Turn: ${move.tc}`,
          tr: move.tr
        };
        newMoves[newMoves.length - 1] = lastMove;  // Update the last move
        return newMoves;  // Return a new array to trigger re-render
      });
    }
  };

  return (
    <div className="game-container">
      <BoardLayout addMove={addMove} gameId={gameId} gameData={gameData} />
      <GamePlayControlContainer moves={moves} onGameUpdate={handleGameUpdate} gameId={gameId} />
      <GameOverModal
        show={gameOverState.show}
        message={gameOverState.message}
        onNewGame={handleNewGame}
      />
    </div>
  );
};

export default GameContainer;
