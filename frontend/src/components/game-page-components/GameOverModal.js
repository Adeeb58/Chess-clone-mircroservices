import React from 'react';
import "../component-styles/GameOverModal.css";

const GameOverModal = ({ show, message, onNewGame }) => {
    if (!show) return null;

    return (
        <div className="game-over-modal-overlay">
            <div className="game-over-modal">
                <h2>Game Over</h2>
                <p className="game-over-message">{message}</p>
                <button className="new-game-btn" onClick={onNewGame}>
                    New Game
                </button>
            </div>
        </div>
    );
};

export default GameOverModal;
