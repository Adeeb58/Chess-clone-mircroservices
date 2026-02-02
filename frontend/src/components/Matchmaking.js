import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { stompClient } from '../services/socket';
import './component-styles/Matchmaking.css';

const Matchmaking = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [inQueue, setInQueue] = useState(false);
    const [timeControl, setTimeControl] = useState('STANDARD');
    const [queueStatus, setQueueStatus] = useState(null);
    const [remainingTime, setRemainingTime] = useState(90);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Subscribe to WebSocket notifications
        if (stompClient && user) {
            stompClient.onConnect = (frame) => {
                console.log('Connected to matchmaking WebSocket');

                // Subscribe to match found notifications
                stompClient.subscribe(`/user/queue/match-found`, (message) => {
                    const matchData = JSON.parse(message.body);
                    console.log('Match found!', matchData);

                    setInQueue(false);

                    // Navigate to game page
                    navigate(`/game?id=${matchData.gameId}`);
                });

                // Subscribe to timeout notifications
                stompClient.subscribe(`/user/queue/timeout`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('Queue timeout', data);

                    setInQueue(false);
                    setError(data.message || 'No opponent found. Please try again.');
                });
            };

            if (!stompClient.connected) {
                stompClient.activate();
            }
        }

        return () => {
            // Cleanup: leave queue if component unmounts
            if (inQueue) {
                leaveQueue();
            }
        };
    }, [user, navigate]);

    // Countdown timer
    useEffect(() => {
        let interval;
        if (inQueue && remainingTime > 0) {
            interval = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        setInQueue(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [inQueue, remainingTime]);

    const joinQueue = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/matchmaking/queue', {
                timeControl: timeControl
            });

            const data = response.data;
            console.log('Queue response:', data);

            if (data.status === 'MATCHED') {
                // Immediate match found
                setInQueue(false);
                navigate(`/game?id=${data.gameId}`);
            } else if (data.status === 'WAITING') {
                setQueueStatus(data);
                setInQueue(true);
                setRemainingTime(90);
            } else {
                setError(data.message || 'Unexpected response');
            }
        } catch (err) {
            console.error('Error joining queue:', err);
            setError(err.message || 'Failed to join queue');
        } finally {
            setLoading(false);
        }
    };

    const leaveQueue = async () => {
        setLoading(true);

        try {
            const response = await api.delete('/matchmaking/queue');
            console.log('Left queue:', response.data);

            setInQueue(false);
            setQueueStatus(null);
            setRemainingTime(90);
        } catch (err) {
            console.error('Error leaving queue:', err);
            setError(err.message || 'Failed to leave queue');
        } finally {
            setLoading(false);
        }
    };

    const getTimeControlLabel = (tc) => {
        switch (tc) {
            case 'STANDARD':
                return 'Standard (No time limit)';
            case 'RAPID':
                return 'Rapid (10 minutes)';
            case 'BLITZ':
                return 'Blitz (3 minutes)';
            default:
                return tc;
        }
    };

    return (
        <div className="matchmaking-container">
            <div className="matchmaking-card">
                <h2>Find a Match</h2>

                {!inQueue ? (
                    <>
                        <div className="time-control-selection">
                            <label htmlFor="timeControl">Select Time Control:</label>
                            <select
                                id="timeControl"
                                value={timeControl}
                                onChange={(e) => setTimeControl(e.target.value)}
                                disabled={loading}
                            >
                                <option value="STANDARD">Standard (No time limit)</option>
                                <option value="RAPID">Rapid (10 minutes)</option>
                                <option value="BLITZ">Blitz (3 minutes)</option>
                            </select>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button
                            className="matchmaking-btn join-btn"
                            onClick={joinQueue}
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Find Opponent'}
                        </button>
                    </>
                ) : (
                    <div className="queue-status">
                        <div className="searching-animation">
                            <div className="spinner"></div>
                            <p>Searching for opponent...</p>
                        </div>

                        <div className="queue-info">
                            <p className="time-control-info">
                                {getTimeControlLabel(timeControl)}
                            </p>
                            <p className="timer">
                                Time remaining: <span className="time-value">{remainingTime}s</span>
                            </p>
                        </div>

                        <button
                            className="matchmaking-btn cancel-btn"
                            onClick={leaveQueue}
                            disabled={loading}
                        >
                            Cancel Search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Matchmaking;
