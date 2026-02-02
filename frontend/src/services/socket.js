import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080/ws';

// Connection state
let isConnected = false;
let isConnecting = false;
let connectionPromise = null;
const subscriptions = new Map(); // topic -> Set of callbacks
const activeSubscriptions = new Map(); // topic -> STOMP subscription object

// Create the STOMP client
const stompClient = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),
    debug: function (str) {
        console.log('[STOMP]', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
});

// Handle successful connection
stompClient.onConnect = (frame) => {
    console.log('[Socket] Connected:', frame);
    isConnected = true;
    isConnecting = false;

    // Re-establish all pending subscriptions
    subscriptions.forEach((callbacks, topic) => {
        if (!activeSubscriptions.has(topic)) {
            const stompSub = stompClient.subscribe(topic, (message) => {
                const body = JSON.parse(message.body);
                callbacks.forEach(callback => callback(body));
            });
            activeSubscriptions.set(topic, stompSub);
            console.log('[Socket] Subscribed to:', topic);
        }
    });
};

// Handle disconnection
stompClient.onDisconnect = () => {
    console.log('[Socket] Disconnected');
    isConnected = false;
    activeSubscriptions.clear();
};

// Handle WebSocket errors
stompClient.onWebSocketError = (error) => {
    console.error('[Socket] WebSocket error:', error);
    isConnected = false;
    isConnecting = false;
};

// Handle STOMP errors
stompClient.onStompError = (frame) => {
    console.error('[Socket] STOMP error:', frame.headers['message']);
    console.error('[Socket] Details:', frame.body);
};

/**
 * Socket service with centralized connection management
 */
export const socketService = {
    /**
     * Connect to WebSocket server. Returns a promise that resolves when connected.
     * Multiple calls to connect() are safe - returns same promise if already connecting.
     */
    connect: () => {
        if (isConnected) {
            return Promise.resolve();
        }

        if (isConnecting && connectionPromise) {
            return connectionPromise;
        }

        isConnecting = true;
        connectionPromise = new Promise((resolve, reject) => {
            const originalOnConnect = stompClient.onConnect;
            stompClient.onConnect = (frame) => {
                originalOnConnect(frame);
                resolve();
            };

            const originalOnError = stompClient.onWebSocketError;
            stompClient.onWebSocketError = (error) => {
                originalOnError(error);
                reject(error);
            };

            stompClient.activate();
        });

        return connectionPromise;
    },

    /**
     * Subscribe to a topic. Returns an unsubscribe function.
     * @param {string} topic - The topic to subscribe to (e.g., '/topic/game/123')
     * @param {function} callback - Function to call with parsed message body
     * @returns {function} Unsubscribe function
     */
    subscribe: (topic, callback) => {
        // Add callback to subscriptions map
        if (!subscriptions.has(topic)) {
            subscriptions.set(topic, new Set());
        }
        subscriptions.get(topic).add(callback);

        // If already connected, establish STOMP subscription
        if (isConnected && !activeSubscriptions.has(topic)) {
            const stompSub = stompClient.subscribe(topic, (message) => {
                const body = JSON.parse(message.body);
                subscriptions.get(topic).forEach(cb => cb(body));
            });
            activeSubscriptions.set(topic, stompSub);
            console.log('[Socket] Subscribed to:', topic);
        }

        // Return unsubscribe function
        return () => {
            const callbacks = subscriptions.get(topic);
            if (callbacks) {
                callbacks.delete(callback);
                // If no more callbacks for this topic, unsubscribe from STOMP
                if (callbacks.size === 0) {
                    subscriptions.delete(topic);
                    const stompSub = activeSubscriptions.get(topic);
                    if (stompSub) {
                        stompSub.unsubscribe();
                        activeSubscriptions.delete(topic);
                        console.log('[Socket] Unsubscribed from:', topic);
                    }
                }
            }
        };
    },

    /**
     * Publish a message to a destination
     * @param {string} destination - The destination (e.g., '/app/move')
     * @param {object} body - The message body (will be JSON stringified)
     */
    publish: (destination, body) => {
        if (!isConnected) {
            console.warn('[Socket] Cannot publish: not connected');
            return false;
        }
        stompClient.publish({
            destination,
            body: JSON.stringify(body)
        });
        return true;
    },

    /**
     * Check if currently connected
     */
    isConnected: () => isConnected,

    /**
     * Disconnect from the server
     */
    disconnect: () => {
        if (stompClient.connected) {
            stompClient.deactivate();
        }
        isConnected = false;
        isConnecting = false;
        connectionPromise = null;
        subscriptions.clear();
        activeSubscriptions.clear();
    }
};

// Also export the raw client for backward compatibility (deprecated)
export { stompClient };

export default socketService;
