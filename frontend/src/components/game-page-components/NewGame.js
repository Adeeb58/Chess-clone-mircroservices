import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Matchmaking from "../Matchmaking";
import api from "../../services/api";
import "../component-styles/NewGame.css";

const NewGame = () => {
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState("10");
  const [joinId, setJoinId] = useState("");
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartGame = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/game/create");
      const game = response.data;
      // Redirect to game with ID
      navigate(`/game?id=${game.id}`);
    } catch (e) {
      console.error("Failed to create game", e);
      setError(e.message || "Error creating game. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinId) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/game/join/${joinId}`);
      if (response.status === 200) {
        navigate(`/game?id=${joinId}`);
      }
    } catch (e) {
      console.error("Failed to join game", e);
      setError(e.message || "Failed to join. Check ID or if game is full.");
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatch = () => {
    setShowMatchmaking(true);
  };

  const handleSecondaryAction = (action) => {
    alert(`${action} feature coming soon!`);
  };

  if (showMatchmaking) {
    return (
      <div className="new-game-container">
        <button
          className="btn-back"
          onClick={() => setShowMatchmaking(false)}
          style={{ marginBottom: '1rem' }}
        >
          ← Back
        </button>
        <Matchmaking />
      </div>
    );
  }

  return (
    <div className="new-game-container">

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.2)',
          border: '1px solid rgba(255, 0, 0, 0.5)',
          color: '#ffcccc',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Find Match Button (Matchmaking) */}
      <button className="btn-find-match" onClick={handleFindMatch} disabled={loading}>
        🎯 Find Match
      </button>

      {/* Time Control Dropdown */}
      <select
        className="time-control-select"
        value={timeControl}
        onChange={(e) => setTimeControl(e.target.value)}
        disabled={loading}
      >
        <option value="1">1 min (Bullet)</option>
        <option value="3">3 min (Blitz)</option>
        <option value="5">5 min (Blitz)</option>
        <option value="10">10 min (Rapid)</option>
        <option value="30">30 min (Classical)</option>
      </select>

      {/* Main Start Button */}
      <button className="btn-start-game" onClick={handleStartGame} disabled={loading}>
        {loading ? 'Creating...' : 'Create New Game'}
      </button>

      {/* Join Game Section */}
      <div style={{ marginBottom: '15px', padding: '10px', background: '#302e2b', borderRadius: '5px' }}>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          disabled={loading}
          style={{ padding: '8px', width: '60%', marginRight: '5px', borderRadius: '3px', border: '1px solid #555' }}
        />
        <button
          onClick={handleJoinGame}
          disabled={loading || !joinId}
          style={{ padding: '8px', background: '#457524', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', opacity: (loading || !joinId) ? 0.5 : 1 }}
        >
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>

      {/* Secondary Options */}
      <div className="secondary-options">
        <button className="btn-secondary" onClick={() => handleSecondaryAction("Custom Challenge")} disabled={loading}>
          <span className="icon-placeholder">⚙️</span> Custom Challenge
        </button>
        <button className="btn-secondary" onClick={() => handleSecondaryAction("Play a Friend")} disabled={loading}>
          <span className="icon-placeholder">🤝</span> Play a Friend
        </button>
        <button className="btn-secondary" onClick={() => handleSecondaryAction("Tournaments")} disabled={loading}>
          <span className="icon-placeholder">🏆</span> Tournaments
        </button>
      </div>

    </div>
  );
};

export default NewGame;
