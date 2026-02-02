import React from "react";
import Player from "./Player";
import Board from "./Board";
import "../component-styles/BoardLayout.css";
import { useAuth } from "../../context/AuthContext";

const BoardLayout = ({ addMove, gameId, gameData }) => {
  const { user } = useAuth();

  // Determine player names and colors
  const currentUsername = user?.username;
  const isWhite = gameData?.whitePlayer?.username === currentUsername;

  const opponentName = gameData
    ? (isWhite ? gameData.blackPlayer?.username : gameData.whitePlayer?.username) || "Waiting..."
    : "Opponent";

  const playerName = gameData
    ? (isWhite ? gameData.whitePlayer?.username : gameData.blackPlayer?.username) || currentUsername
    : "You";

  return (
    <div className="board-layout-main">
      <div className="board-layout-player">
        <Player name={opponentName} rating="1500" />
      </div>

      <div className="board-layout-chessboard">
        <div className="board">
          <Board addMove={addMove} gameId={gameId} gameData={gameData} isWhite={isWhite} />
        </div>
      </div>

      <div className="board-layout-player">
        <Player name={playerName} rating="1200" />
      </div>
    </div>
  );
};

export default BoardLayout;
