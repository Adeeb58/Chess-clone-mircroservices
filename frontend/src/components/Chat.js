import React, { useState, useEffect, useRef } from 'react';
import { stompClient } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import './component-styles/Chat.css';

const Chat = ({ gameId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!stompClient || !gameId) return;

        // Subscribe to chat messages for this game
        const subscription = stompClient.subscribe(
            `/topic/game/${gameId}/chat`,
            (message) => {
                const chatMessage = JSON.parse(message.body);
                setMessages(prev => [...prev, chatMessage]);
            }
        );

        setIsConnected(true);

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [gameId]);

    const sendMessage = (e) => {
        e.preventDefault();

        if (!inputMessage.trim() || !stompClient || !isConnected) return;

        const chatMessage = {
            gameId: gameId,
            sender: user?.username || 'Anonymous',
            message: inputMessage.trim(),
            type: 'CHAT'
        };

        stompClient.publish({
            destination: '/app/chat',
            body: JSON.stringify(chatMessage)
        });

        setInputMessage('');
    };

    const getMessageClass = (message) => {
        if (message.type === 'SYSTEM') return 'message-system';
        if (message.type === 'GAME_EVENT') return 'message-event';
        if (message.sender === user?.username) return 'message-own';
        return 'message-other';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h3>Chat</h3>
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢' : '🔴'}
                </span>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`message ${getMessageClass(msg)}`}>
                            {msg.type === 'CHAT' && (
                                <>
                                    <div className="message-header">
                                        <span className="message-sender">{msg.sender}</span>
                                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div className="message-content">{msg.message}</div>
                                </>
                            )}
                            {(msg.type === 'SYSTEM' || msg.type === 'GAME_EVENT') && (
                                <div className="message-content">{msg.message}</div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={!isConnected}
                    maxLength={200}
                />
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={!inputMessage.trim() || !isConnected}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
