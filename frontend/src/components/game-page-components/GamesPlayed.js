import React, { useEffect, useState } from "react";
import "../component-styles/GamesPlayed.css";

const GamesPlayed = () => {
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, losses: 0, draws: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Using http and credentials: include for cookie-based auth
        const response = await fetch("http://localhost:8080/api/user/stats", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch stats");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="games-played-container">Loading Stats...</div>;
  }

  return (
    <div className="games-played-container">
      <h2>Game Statistics</h2>
      <div className="stats-grid">
        <div className="stat-box">
          <span className="stat-value">{stats.gamesPlayed}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-box">
          <span className="stat-value win">{stats.wins}</span>
          <span className="stat-label">Won</span>
        </div>
        <div className="stat-box">
          <span className="stat-value loss">{stats.losses}</span>
          <span className="stat-label">Lost</span>
        </div>
        <div className="stat-box">
          <span className="stat-value draw">{stats.draws}</span>
          <span className="stat-label">Draw</span>
        </div>
      </div>
    </div>
  );
};

export default GamesPlayed;
