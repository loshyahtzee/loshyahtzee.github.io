// ============================================================
// YAHTZEE MULTIPLAYER - WEBSOCKET SERVER
// Node.js WebSocket server for handling online multiplayer
// ============================================================

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game state storage
const rooms = new Map();
const players = new Map(); // WebSocket -> Player info

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function generatePlayerId() {
    return 'p' + Math.random().toString(36).substr(2, 9);
}

function broadcast(room, message, excludeWs = null) {
    room.players.forEach(player => {
        if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(message));
        }
    });
}

function sendToPlayer(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// ============================================================
// ROOM MANAGEMENT
// ============================================================

function createRoom(ws, playerName) {
    const roomCode = generateRoomCode();
    const playerId = generatePlayerId();
    
    const room = {
        code: roomCode,
        host: playerId,
        players: [{
            id: playerId,
            name: playerName,
            ws: ws,
            scores: {}
        }],
        gameStarted: false,
        currentPlayerIndex: 0
    };
    
    rooms.set(roomCode, room);
    players.set(ws, { roomCode, playerId });
    
    sendToPlayer(ws, {
        type: 'room_created',
        roomCode: roomCode,
        playerId: playerId,
        players: room.players.map(p => ({ id: p.id, name: p.name }))
    });
    
    console.log(`Room ${roomCode} created by ${playerName}`);
}

function joinRoom(ws, playerName, roomCode) {
    const room = rooms.get(roomCode);
    
    if (!room) {
        sendToPlayer(ws, {
            type: 'error',
            message: 'Room not found'
        });
        return;
    }
    
    if (room.players.length >= 3) {
        sendToPlayer(ws, {
            type: 'error',
            message: 'Room is full'
        });
        return;
    }
    
    if (room.gameStarted) {
        sendToPlayer(ws, {
            type: 'error',
            message: 'Game already in progress'
        });
        return;
    }
    
    const playerId = generatePlayerId();
    const player = {
        id: playerId,
        name: playerName,
        ws: ws,
        scores: {}
    };
    
    room.players.push(player);
    players.set(ws, { roomCode, playerId });
    
    // Notify the joining player
    sendToPlayer(ws, {
        type: 'room_joined',
        roomCode: roomCode,
        playerId: playerId,
        players: room.players.map(p => ({ id: p.id, name: p.name }))
    });
    
    // Notify other players
    broadcast(room, {
        type: 'player_joined',
        playerId: playerId,
        playerName: playerName,
        players: room.players.map(p => ({ id: p.id, name: p.name }))
    }, ws);
    
    console.log(`${playerName} joined room ${roomCode}`);
}

function leaveRoom(ws) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;
    
    const { roomCode, playerId } = playerInfo;
    const room = rooms.get(roomCode);
    
    if (!room) return;
    
    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    players.delete(ws);
    
    // If room is empty, delete it
    if (room.players.length === 0) {
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (empty)`);
        return;
    }
    
    // If host left, assign new host
    if (room.host === playerId && room.players.length > 0) {
        room.host = room.players[0].id;
    }
    
    // Notify remaining players
    broadcast(room, {
        type: 'player_left',
        playerId: playerId,
        players: room.players.map(p => ({ id: p.id, name: p.name }))
    });
    
    console.log(`Player ${playerId} left room ${roomCode}`);
}

// ============================================================
// GAME LOGIC
// ============================================================

function startGame(ws, roomCode) {
    const room = rooms.get(roomCode);
    const playerInfo = players.get(ws);
    
    if (!room || !playerInfo) return;
    
    // Only host can start
    if (playerInfo.playerId !== room.host) {
        sendToPlayer(ws, {
            type: 'error',
            message: 'Only host can start the game'
        });
        return;
    }
    
    if (room.players.length !== 3) {
        sendToPlayer(ws, {
            type: 'error',
            message: 'Need exactly 3 players to start'
        });
        return;
    }
    
    room.gameStarted = true;
    room.currentPlayerIndex = 0;
    
    // Initialize player scores
    room.players.forEach(player => {
        player.scores = {
            ones: null,
            twos: null,
            threes: null,
            fours: null,
            fives: null,
            sixes: null,
            three_of_a_kind: null,
            four_of_a_kind: null,
            full_house: null,
            small_straight: null,
            large_straight: null,
            yahtzee: null,
            chance: null
        };
    });
    
    // Notify all players
    broadcast(room, {
        type: 'game_start',
        players: room.players.map(p => ({ id: p.id, name: p.name })),
        currentPlayerIndex: room.currentPlayerIndex
    });
    
    console.log(`Game started in room ${roomCode}`);
}

function handleRollDice(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    // Broadcast dice roll to all players
    broadcast(room, {
        type: 'dice_rolled',
        playerId: playerInfo.playerId,
        dice: data.dice,
        rollsLeft: data.rollsLeft
    });
}

function handleSelectScore(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    const player = room.players.find(p => p.id === playerInfo.playerId);
    if (player) {
        player.scores[data.category] = data.score;
    }
    
    // Broadcast score selection
    broadcast(room, {
        type: 'score_selected',
        playerId: playerInfo.playerId,
        category: data.category,
        score: data.score
    });
}

function handleNextTurn(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    room.currentPlayerIndex = data.currentPlayerIndex;
    
    // Broadcast turn update
    broadcast(room, {
        type: 'turn_update',
        currentPlayerIndex: room.currentPlayerIndex
    }, ws);
}

function handleEndGame(ws, data) {
    const playerInfo = players.get(ws);
    if (!playerInfo) return;
    
    const room = rooms.get(playerInfo.roomCode);
    if (!room) return;
    
    // Broadcast game over
    broadcast(room, {
        type: 'game_over',
        finalScores: data.finalScores
    }, ws);
    
    // Reset room for potential new game
    room.gameStarted = false;
    room.currentPlayerIndex = 0;
}

// ============================================================
// WEBSOCKET CONNECTION HANDLING
// ============================================================

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received:', data.type);
            
            switch (data.type) {
                case 'create_room':
                    createRoom(ws, data.playerName);
                    break;
                    
                case 'join_room':
                    joinRoom(ws, data.playerName, data.roomCode);
                    break;
                    
                case 'leave_room':
                    leaveRoom(ws);
                    break;
                    
                case 'start_game':
                    startGame(ws, data.roomCode);
                    break;
                    
                case 'roll_dice':
                    handleRollDice(ws, data);
                    break;
                    
                case 'select_score':
                    handleSelectScore(ws, data);
                    break;
                    
                case 'next_turn':
                    handleNextTurn(ws, data);
                    break;
                    
                case 'end_game':
                    handleEndGame(ws, data);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        leaveRoom(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// ============================================================
// SERVER STARTUP
// ============================================================

server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
    console.log(`ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
