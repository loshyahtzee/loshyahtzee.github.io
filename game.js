// ============================================================
// YAHTZEE MULTIPLAYER GAME
// Supports both local (3 players on one device) and online multiplayer
// ============================================================

// Configuration
const CONFIG = {
    // WebSocket Server URL
    // ====================================
    // CHANGE THIS to your deployed server URL:
    WEBSOCKET_URL: 'wss://loshyahtzee-github-io.onrender.com',
    
    // For local testing, change to: 'ws://localhost:8080'
    // For production, use: 'wss://your-server.onrender.com'
    
    MAX_PLAYERS: 3,
    ROLLS_PER_TURN: 3,
    CATEGORIES: [
        'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
        'three_of_a_kind', 'four_of_a_kind', 'full_house',
        'small_straight', 'large_straight', 'yahtzee', 'chance'
    ]
};

// Game State
class GameState {
    constructor() {
        this.mode = null; // 'local' or 'online'
        this.players = [];
        this.currentPlayerIndex = 0;
        this.currentDice = [0, 0, 0, 0, 0];
        this.heldDice = [false, false, false, false, false];
        this.rollsLeft = CONFIG.ROLLS_PER_TURN;
        this.gameStarted = false;
        this.gameOver = false;
        
        // Online-specific
        this.socket = null;
        this.roomCode = null;
        this.playerId = null;
        this.isHost = false;
    }

    reset() {
        this.currentPlayerIndex = 0;
        this.currentDice = [0, 0, 0, 0, 0];
        this.heldDice = [false, false, false, false, false];
        this.rollsLeft = CONFIG.ROLLS_PER_TURN;
        this.gameStarted = false;
        this.gameOver = false;
    }
}

// Player Class
class Player {
    constructor(name, id) {
        this.name = name;
        this.id = id;
        this.scores = {};
        CONFIG.CATEGORIES.forEach(cat => this.scores[cat] = null);
        this.upperBonus = 0;
        this.totalScore = 0;
    }

    calculateUpperBonus() {
        const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        const upperSum = upperCategories.reduce((sum, cat) => {
            return sum + (this.scores[cat] || 0);
        }, 0);
        this.upperBonus = upperSum >= 63 ? 35 : 0;
    }

    calculateTotalScore() {
        this.calculateUpperBonus();
        this.totalScore = Object.values(this.scores).reduce((sum, score) => {
            return sum + (score || 0);
        }, 0) + this.upperBonus;
        return this.totalScore;
    }

    hasCompletedAllCategories() {
        return CONFIG.CATEGORIES.every(cat => this.scores[cat] !== null);
    }
}

// Initialize game state
const game = new GameState();

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ============================================================
// MENU HANDLERS
// ============================================================

document.getElementById('local-game-btn').addEventListener('click', () => {
    game.mode = 'local';
    showScreen('local-setup-screen');
});

document.getElementById('online-game-btn').addEventListener('click', () => {
    game.mode = 'online';
    showScreen('lobby-screen');
    initializeWebSocket();
});

document.getElementById('back-from-local').addEventListener('click', () => {
    showScreen('menu-screen');
});

document.getElementById('back-from-lobby').addEventListener('click', () => {
    if (game.socket) {
        game.socket.close();
    }
    showScreen('menu-screen');
});

// ============================================================
// LOCAL GAME SETUP
// ============================================================

// Player count selector
let selectedPlayerCount = 3;

document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
        // Add active to clicked button
        btn.classList.add('active');
        
        selectedPlayerCount = parseInt(btn.dataset.count);
        
        // Show/hide player inputs based on selection
        for (let i = 1; i <= 4; i++) {
            const inputGroup = document.querySelector(`.player-input-group[data-player="${i}"]`);
            if (inputGroup) {
                inputGroup.style.display = i <= selectedPlayerCount ? 'flex' : 'none';
            }
        }
    });
});

document.getElementById('start-local-game').addEventListener('click', () => {
    const playerNames = [];
    
    for (let i = 1; i <= selectedPlayerCount; i++) {
        const input = document.getElementById(`local-player${i}`);
        const name = input.value.trim() || `Player ${i}`;
        playerNames.push(name);
    }

    game.players = playerNames.map((name, index) => new Player(name, `p${index + 1}`));

    game.playerId = 'p1'; // In local mode, all players controlled by one user
    startGame();
});

// ============================================================
// ONLINE MULTIPLAYER - WEBSOCKET
// ============================================================

function initializeWebSocket() {
    updateConnectionStatus('disconnected', 'Connecting...');
    
    console.log('Attempting to connect to:', CONFIG.WEBSOCKET_URL);
    
    try {
        game.socket = new WebSocket(CONFIG.WEBSOCKET_URL);
        
        game.socket.onopen = () => {
            updateConnectionStatus('connected', 'Connected');
            console.log('✅ WebSocket connected successfully');
        };
        
        game.socket.onmessage = (event) => {
            handleWebSocketMessage(JSON.parse(event.data));
        };
        
        game.socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            console.error('Failed to connect to:', CONFIG.WEBSOCKET_URL);
            updateConnectionStatus('disconnected', 'Connection error');
        };
        
        game.socket.onclose = (event) => {
            updateConnectionStatus('disconnected', 'Disconnected');
            console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
            
            // If server might be sleeping (Render free tier), show helpful message
            if (event.code === 1006) {
                console.log('💡 Tip: If using Render free tier, server might be sleeping. First connection can take 30-60 seconds.');
            }
        };
    } catch (error) {
        console.error('Failed to create WebSocket:', error);
        updateConnectionStatus('disconnected', 'Failed to connect');
        showOfflineMessage();
    }
}

function showOfflineMessage() {
    const lobbyActions = document.getElementById('lobby-actions');
    lobbyActions.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p style="color: var(--danger-color); margin-bottom: 1rem; font-weight: 700;">⚠️ Unable to connect to the game server</p>
            
            <div style="background: rgba(255, 51, 102, 0.1); padding: 1.5rem; border-radius: 10px; border: 2px solid var(--danger-color); margin-bottom: 1rem;">
                <p style="color: var(--text-secondary); margin-bottom: 0.5rem;"><strong>Current server URL:</strong></p>
                <code style="background: var(--darker-bg); padding: 0.5rem; display: block; border-radius: 5px; color: var(--neon-cyan); margin-bottom: 1rem;">${CONFIG.WEBSOCKET_URL}</code>
                
                <p style="color: var(--text-secondary); font-size: 0.9rem; text-align: left; margin-top: 1rem;">
                    <strong>Possible reasons:</strong><br>
                    • Server is not running<br>
                    • Wrong server URL configured<br>
                    • Network/firewall blocking connection
                </p>
            </div>
            
            <div style="background: rgba(0, 255, 136, 0.1); padding: 1.5rem; border-radius: 10px; border: 2px solid var(--success-color); text-align: left;">
                <p style="color: var(--success-color); margin-bottom: 0.5rem; font-weight: 700;">💡 How to fix:</p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6;">
                    <strong>For Local Testing:</strong><br>
                    1. Make sure server is running: <code style="background: var(--darker-bg); padding: 0.2rem 0.4rem;">npm start</code> in server/ folder<br>
                    2. If testing on same device, it should auto-connect to localhost<br>
                    3. If testing on different devices (same WiFi), edit game.js line 12 with your computer's IP
                </p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-top: 1rem;">
                    <strong>For Production:</strong><br>
                    1. Deploy server to Render/Railway/Glitch (see DEPLOYMENT.md)<br>
                    2. Edit game.js line 9 with your deployed server URL<br>
                    3. URL must start with <code style="background: var(--darker-bg); padding: 0.2rem 0.4rem;">wss://</code> (not https://)
                </p>
            </div>
            
            <p style="color: var(--text-secondary); margin-top: 1.5rem; font-size: 0.9rem;">
                Or play a <strong>Local Game</strong> instead (no server needed!)
            </p>
        </div>
    `;
}

function updateConnectionStatus(status, text) {
    const statusBadge = document.getElementById('connection-status');
    statusBadge.className = `status-badge ${status}`;
    statusBadge.querySelector('.status-text').textContent = text;
}

function sendWebSocketMessage(type, data) {
    if (game.socket && game.socket.readyState === WebSocket.OPEN) {
        game.socket.send(JSON.stringify({ type, ...data }));
    }
}

function handleWebSocketMessage(message) {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'room_created':
            handleRoomCreated(message);
            break;
        case 'room_joined':
            handleRoomJoined(message);
            break;
        case 'player_joined':
            handlePlayerJoined(message);
            break;
        case 'player_left':
            handlePlayerLeft(message);
            break;
        case 'game_start':
            handleGameStart(message);
            break;
        case 'turn_update':
            handleTurnUpdate(message);
            break;
        case 'dice_rolled':
            handleDiceRolled(message);
            break;
        case 'score_selected':
            handleScoreSelected(message);
            break;
        case 'game_over':
            handleGameOver(message);
            break;
        case 'error':
            alert(message.message);
            break;
    }
}

// ============================================================
// ONLINE LOBBY HANDLERS
// ============================================================

// Online player count selector
let selectedOnlinePlayerCount = 3;
let currentRoomMaxPlayers = 3;

document.querySelectorAll('.online-count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.online-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedOnlinePlayerCount = parseInt(btn.dataset.count);
    });
});

document.getElementById('create-room-btn').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim();
    if (!playerName) {
        alert('Please enter your name');
        return;
    }
    sendWebSocketMessage('create_room', { 
        playerName,
        maxPlayers: selectedOnlinePlayerCount 
    });
});

document.getElementById('join-room-btn').addEventListener('click', () => {
    const playerName = document.getElementById('join-player-name').value.trim();
    const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
    
    if (!playerName || !roomCode) {
        alert('Please enter your name and room code');
        return;
    }
    
    sendWebSocketMessage('join_room', { playerName, roomCode });
});

document.getElementById('copy-code-btn').addEventListener('click', () => {
    const roomCode = document.getElementById('display-room-code').textContent;
    navigator.clipboard.writeText(roomCode).then(() => {
        const btn = document.getElementById('copy-code-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy Code', 2000);
    });
});

document.getElementById('leave-room-btn').addEventListener('click', () => {
    sendWebSocketMessage('leave_room', { roomCode: game.roomCode });
    document.getElementById('lobby-actions').style.display = 'flex';
    document.getElementById('room-view').style.display = 'none';
});

function handleRoomCreated(message) {
    game.roomCode = message.roomCode;
    game.playerId = message.playerId;
    game.isHost = true;
    currentRoomMaxPlayers = message.maxPlayers || 3;
    
    document.getElementById('lobby-actions').style.display = 'none';
    document.getElementById('room-view').style.display = 'block';
    document.getElementById('display-room-code').textContent = message.roomCode;
    
    updatePlayersList(message.players, currentRoomMaxPlayers);
}

function handleRoomJoined(message) {
    game.roomCode = message.roomCode;
    game.playerId = message.playerId;
    game.isHost = false;
    currentRoomMaxPlayers = message.maxPlayers || 3;
    
    document.getElementById('lobby-actions').style.display = 'none';
    document.getElementById('room-view').style.display = 'block';
    document.getElementById('display-room-code').textContent = message.roomCode;
    
    updatePlayersList(message.players, currentRoomMaxPlayers);
}

function handlePlayerJoined(message) {
    currentRoomMaxPlayers = message.maxPlayers || 3;
    updatePlayersList(message.players, currentRoomMaxPlayers);
    
    // Auto-start game when we have enough players
    if (message.players.length === currentRoomMaxPlayers) {
        setTimeout(() => {
            if (game.isHost) {
                sendWebSocketMessage('start_game', { roomCode: game.roomCode });
            }
        }, 1000);
    }
}

function handlePlayerLeft(message) {
    updatePlayersList(message.players, currentRoomMaxPlayers);
}

function updatePlayersList(players, maxPlayers = 3) {
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('room-player-count');
    const waitingMessage = document.getElementById('waiting-message');
    
    playersList.innerHTML = players.map(p => 
        `<div class="player-item">${p.name} ${p.id === game.playerId ? '(You)' : ''}</div>`
    ).join('');
    
    playerCount.textContent = `${players.length}/${maxPlayers}`;
    
    if (players.length < maxPlayers) {
        waitingMessage.textContent = `Waiting for ${maxPlayers - players.length} more player${maxPlayers - players.length === 1 ? '' : 's'}...`;
    } else {
        waitingMessage.textContent = 'Starting game...';
    }
}

function handleGameStart(message) {
    game.players = message.players.map(p => {
        const player = new Player(p.name, p.id);
        return player;
    });
    
    startGame();
}

// ============================================================
// GAME INITIALIZATION
// ============================================================

function startGame() {
    game.reset();
    game.gameStarted = true;
    
    showScreen('game-screen');
    
    // Set up game info
    if (game.mode === 'online') {
        document.getElementById('game-room-info').textContent = `Room: ${game.roomCode}`;
    } else {
        document.getElementById('game-room-info').textContent = 'Local Game';
    }
    
    // Update player names in scorecard headers
    document.getElementById('player1-header').textContent = game.players[0].name;
    document.getElementById('player2-header').textContent = game.players[1].name;
    document.getElementById('player3-header').textContent = game.players[2].name;
    
    // Initialize UI
    renderPlayersScoreboard();
    resetDiceDisplay();
    updateTurnIndicator();
    updateRollsLeft();
    resetScorecard();
    
    // Enable controls for first turn
    updateGameControls();
}

// ============================================================
// GAME UI RENDERING
// ============================================================

function renderPlayersScoreboard() {
    const scoreboard = document.getElementById('players-scoreboard');
    scoreboard.innerHTML = game.players.map((player, index) => `
        <div class="player-score-card ${player.id === game.playerId ? 'active-player' : ''} ${index === game.currentPlayerIndex ? 'current-turn' : ''}" id="player-card-${player.id}">
            <div class="player-card-header">
                <span class="player-card-name">${player.name}</span>
                <span class="player-card-score">${player.totalScore}</span>
            </div>
            <div class="player-card-categories">
                ${Object.keys(player.scores).filter(k => player.scores[k] !== null).length}/13 categories
            </div>
        </div>
    `).join('');
}

function updatePlayersScoreboard() {
    game.players.forEach((player, index) => {
        const card = document.getElementById(`player-card-${player.id}`);
        if (card) {
            card.className = `player-score-card ${player.id === game.playerId ? 'active-player' : ''} ${index === game.currentPlayerIndex ? 'current-turn' : ''}`;
            card.querySelector('.player-card-score').textContent = player.totalScore;
            card.querySelector('.player-card-categories').textContent = 
                `${Object.keys(player.scores).filter(k => player.scores[k] !== null).length}/13 categories`;
        }
    });
}

function updateTurnIndicator() {
    const currentPlayer = game.players[game.currentPlayerIndex];
    const indicator = document.getElementById('turn-indicator');
    
    if (game.mode === 'local' || currentPlayer.id === game.playerId) {
        indicator.textContent = `${currentPlayer.name}'s Turn`;
    } else {
        indicator.textContent = `${currentPlayer.name}'s Turn (Waiting...)`;
    }
}

function updateRollsLeft() {
    document.getElementById('rolls-left').textContent = `Rolls: ${game.rollsLeft}`;
}

function resetScorecard() {
    // Update all player columns
    game.players.forEach((player, playerIndex) => {
        CONFIG.CATEGORIES.forEach(category => {
            const btn = document.querySelector(`.score-btn[data-category="${category}"][data-player="${playerIndex}"]`);
            if (btn) {
                if (player.scores[category] !== null) {
                    btn.textContent = player.scores[category];
                    btn.disabled = true;
                    btn.classList.add('scored');
                    btn.classList.remove('active-player-btn');
                } else {
                    btn.textContent = '-';
                    btn.disabled = true; // Will be enabled for current player after rolling
                    btn.classList.remove('scored');
                    btn.classList.remove('active-player-btn');
                }
            }
        });
        
        // Update bonus and total for each player
        const bonusSpan = document.querySelector(`.upper-bonus[data-player="${playerIndex}"]`);
        if (bonusSpan) {
            bonusSpan.textContent = player.upperBonus;
        }
        
        const totalSpan = document.querySelector(`.total-score[data-player="${playerIndex}"]`);
        if (totalSpan) {
            totalSpan.textContent = player.totalScore;
        }
    });
    
    // Highlight current player's column header
    const headers = ['player1-header', 'player2-header', 'player3-header'];
    headers.forEach((headerId, index) => {
        const header = document.getElementById(headerId);
        if (header) {
            if (index === game.currentPlayerIndex) {
                header.classList.add('current-player');
            } else {
                header.classList.remove('current-player');
            }
        }
    });
}

// ============================================================
// DICE HANDLING
// ============================================================

const diceElements = document.querySelectorAll('.die');
const rollButton = document.getElementById('roll-dice');

// Initialize dice click handlers
diceElements.forEach((die, index) => {
    die.addEventListener('click', () => {
        if (game.rollsLeft < CONFIG.ROLLS_PER_TURN && !die.disabled) {
            game.heldDice[index] = !game.heldDice[index];
            die.classList.toggle('held');
        }
    });
});

rollButton.addEventListener('click', () => {
    if (isMyTurn()) {
        rollDice();
    }
});

function rollDice() {
    if (game.rollsLeft <= 0) return;
    
    // Trigger first roll event
    if (game.currentPlayerIndex === 0 && game.rollsLeft === 3 && 
        game.players[0].scores.ones === null && game.players[0].scores.twos === null) {
        triggerFirstRollEvent();
    }
    
    // Roll non-held dice
    for (let i = 0; i < 5; i++) {
        if (!game.heldDice[i]) {
            game.currentDice[i] = Math.floor(Math.random() * 6) + 1;
        }
    }
    
    game.rollsLeft--;
    
    // Sync online
    if (game.mode === 'online') {
        sendWebSocketMessage('roll_dice', {
            roomCode: game.roomCode,
            dice: game.currentDice,
            rollsLeft: game.rollsLeft
        });
    }
    
    updateDiceDisplay();
    updateRollsLeft();
    updateScoreButtons();
    
    // Enable dice selection after first roll
    diceElements.forEach(die => {
        die.disabled = false;
    });
}

function updateDiceDisplay() {
    diceElements.forEach((die, index) => {
        die.classList.add('rolling');
        setTimeout(() => {
            die.querySelector('.die-value').textContent = game.currentDice[index] || '?';
            die.classList.remove('rolling');
        }, 300);
    });
}

function resetDiceDisplay() {
    game.currentDice = [0, 0, 0, 0, 0];
    game.heldDice = [false, false, false, false, false];
    
    diceElements.forEach((die, index) => {
        die.querySelector('.die-value').textContent = '?';
        die.classList.remove('held');
        die.disabled = true;
    });
}

function handleDiceRolled(message) {
    game.currentDice = message.dice;
    game.rollsLeft = message.rollsLeft;
    
    updateDiceDisplay();
    updateRollsLeft();
    updateScoreButtons();
}

// ============================================================
// SCORING
// ============================================================

// Score button handling - updated for multi-player scorecard
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('score-btn') && !e.target.disabled) {
        const category = e.target.dataset.category;
        const playerIndex = parseInt(e.target.dataset.player);
        
        // Only allow current player to select scores
        if (playerIndex === game.currentPlayerIndex) {
            selectScore(category);
        }
    }
});

function selectScore(category) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    
    // Check if player has already scored this category
    if (currentPlayer.scores[category] !== null) {
        return;
    }
    
    const score = calculateScore(category, game.currentDice);
    const rollNumber = 4 - game.rollsLeft; // Calculate which roll was used (1, 2, or 3)
    
    currentPlayer.scores[category] = score;
    currentPlayer.calculateTotalScore();
    
    // Trigger custom events with new system
    triggerScoringEvent(category, score, rollNumber);
    
    // Update the scorecard display immediately for current player
    const btn = document.querySelector(`.score-btn[data-category="${category}"][data-player="${game.currentPlayerIndex}"]`);
    if (btn) {
        btn.textContent = score;
        btn.disabled = true;
        btn.classList.add('scored');
        btn.classList.remove('active-player-btn');
    }
    
    // Update bonus and total for current player
    const bonusSpan = document.querySelector(`.upper-bonus[data-player="${game.currentPlayerIndex}"]`);
    if (bonusSpan) {
        bonusSpan.textContent = currentPlayer.upperBonus;
    }
    
    const totalSpan = document.querySelector(`.total-score[data-player="${game.currentPlayerIndex}"]`);
    if (totalSpan) {
        totalSpan.textContent = currentPlayer.totalScore;
    }
    
    // Sync online
    if (game.mode === 'online') {
        sendWebSocketMessage('select_score', {
            roomCode: game.roomCode,
            category,
            score
        });
    }
    
    updatePlayersScoreboard();
    
    // Check if game is over
    if (currentPlayer.hasCompletedAllCategories()) {
        const allDone = game.players.every(p => p.hasCompletedAllCategories());
        if (allDone) {
            endGame();
            return;
        }
    }
    
    // Move to next turn
    nextTurn();
}

function handleScoreSelected(message) {
    const player = game.players.find(p => p.id === message.playerId);
    if (player) {
        player.scores[message.category] = message.score;
        player.calculateTotalScore();
        updatePlayersScoreboard();
    }
}

function calculateScore(category, dice) {
    const sorted = [...dice].sort((a, b) => a - b);
    const counts = dice.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    
    switch (category) {
        case 'ones':
        case 'twos':
        case 'threes':
        case 'fours':
        case 'fives':
        case 'sixes':
            const targetValue = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].indexOf(category) + 1;
            return dice.filter(d => d === targetValue).reduce((sum, d) => sum + d, 0);
        
        case 'three_of_a_kind':
            if (Object.values(counts).some(c => c >= 3)) {
                return dice.reduce((sum, d) => sum + d, 0);
            }
            return 0;
        
        case 'four_of_a_kind':
            if (Object.values(counts).some(c => c >= 4)) {
                return dice.reduce((sum, d) => sum + d, 0);
            }
            return 0;
        
        case 'full_house':
            const hasThree = Object.values(counts).includes(3);
            const hasTwo = Object.values(counts).includes(2);
            return (hasThree && hasTwo) ? 25 : 0;
        
        case 'small_straight':
            const smallStraights = [[1,2,3,4], [2,3,4,5], [3,4,5,6]];
            const hasSmallStraight = smallStraights.some(straight => 
                straight.every(num => sorted.includes(num))
            );
            return hasSmallStraight ? 30 : 0;
        
        case 'large_straight':
            const largeStraights = [[1,2,3,4,5], [2,3,4,5,6]];
            const hasLargeStraight = largeStraights.some(straight => 
                JSON.stringify(sorted) === JSON.stringify(straight)
            );
            return hasLargeStraight ? 40 : 0;
        
        case 'yahtzee':
            return dice.every(d => d === dice[0]) ? 50 : 0;
        
        case 'chance':
            return dice.reduce((sum, d) => sum + d, 0);
        
        default:
            return 0;
    }
}

function updateScoreButtons() {
    const currentPlayerIndex = game.currentPlayerIndex;
    const currentPlayer = game.players[currentPlayerIndex];
    
    if (game.rollsLeft === CONFIG.ROLLS_PER_TURN) {
        // No roll yet - disable all buttons for current player
        CONFIG.CATEGORIES.forEach(category => {
            const btn = document.querySelector(`.score-btn[data-category="${category}"][data-player="${currentPlayerIndex}"]`);
            if (btn && currentPlayer.scores[category] === null) {
                btn.disabled = true;
                btn.textContent = '-';
                btn.classList.remove('active-player-btn');
            }
        });
        return;
    }
    
    // Update buttons for current player only
    CONFIG.CATEGORIES.forEach(category => {
        const btn = document.querySelector(`.score-btn[data-category="${category}"][data-player="${currentPlayerIndex}"]`);
        if (btn && currentPlayer.scores[category] === null) {
            const score = calculateScore(category, game.currentDice);
            btn.textContent = score;
            btn.disabled = false;
            btn.classList.add('active-player-btn');
        }
    });
}

// ============================================================
// TURN MANAGEMENT
// ============================================================

function nextTurn() {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.rollsLeft = CONFIG.ROLLS_PER_TURN;
    game.heldDice = [false, false, false, false, false];
    
    if (game.mode === 'online') {
        sendWebSocketMessage('next_turn', {
            roomCode: game.roomCode,
            currentPlayerIndex: game.currentPlayerIndex
        });
    }
    
    resetDiceDisplay();
    updateTurnIndicator();
    updateRollsLeft();
    resetScorecard();
    updateGameControls();
}

function handleTurnUpdate(message) {
    game.currentPlayerIndex = message.currentPlayerIndex;
    game.rollsLeft = CONFIG.ROLLS_PER_TURN;
    
    resetDiceDisplay();
    updateTurnIndicator();
    updateRollsLeft();
    resetScorecard();
    updateGameControls();
}

function updateGameControls() {
    const myTurn = isMyTurn();
    
    rollButton.disabled = !myTurn || game.rollsLeft <= 0;
    
    diceElements.forEach(die => {
        die.disabled = !myTurn || game.rollsLeft === CONFIG.ROLLS_PER_TURN;
    });
}

function isMyTurn() {
    if (game.mode === 'local') return true;
    return game.players[game.currentPlayerIndex].id === game.playerId;
}

// ============================================================
// GAME END
// ============================================================

function endGame() {
    game.gameOver = true;
    
    if (game.mode === 'online') {
        sendWebSocketMessage('end_game', {
            roomCode: game.roomCode,
            finalScores: game.players.map(p => ({
                id: p.id,
                name: p.name,
                score: p.totalScore
            }))
        });
    } else {
        showGameOver();
    }
}

function handleGameOver(message) {
    game.players.forEach(player => {
        const finalPlayer = message.finalScores.find(p => p.id === player.id);
        if (finalPlayer) {
            player.totalScore = finalPlayer.score;
        }
    });
    
    showGameOver();
}

function showGameOver() {
    const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
    
    const finalScoresHtml = sortedPlayers.map((player, index) => `
        <div class="final-score-item ${index === 0 ? 'winner' : ''}">
            <span class="rank">#${index + 1}</span>
            <span class="player-name">${player.name}</span>
            <span class="player-score">${player.totalScore}</span>
        </div>
    `).join('');
    
    document.getElementById('final-scores').innerHTML = finalScoresHtml;
    showScreen('gameover-screen');
    
    // Trigger game end events
    setTimeout(() => {
        triggerGameOverEvent();
    }, 500);
}

function startGame() {
    game.reset();
    game.gameStarted = true;
    
    // Reset popup system for new game
    popupSystem.reset();
    
    showScreen('game-screen');
    
    // Set up game info
    if (game.mode === 'online') {
        document.getElementById('game-room-info').textContent = `Room: ${game.roomCode}`;
    } else {
        document.getElementById('game-room-info').textContent = 'Local Game';
    }
    
    // Show/hide player columns based on player count
    const playerCount = game.players.length;
    for (let i = 1; i <= 4; i++) {
        const header = document.getElementById(`player${i}-header`);
        const cols = document.querySelectorAll(`.player-col-${i}`);
        
        if (i <= playerCount) {
            if (header) header.style.display = '';
            cols.forEach(col => col.style.display = '');
        } else {
            if (header) header.style.display = 'none';
            cols.forEach(col => col.style.display = 'none');
        }
    }
    
    // Update player names in scorecard headers
    game.players.forEach((player, index) => {
        const header = document.getElementById(`player${index + 1}-header`);
        if (header) {
            header.textContent = player.name;
        }
    });
    
    // Initialize UI
    renderPlayersScoreboard();
    resetDiceDisplay();
    updateTurnIndicator();
    updateRollsLeft();
    resetScorecard();
    
    // Enable controls for first turn
    updateGameControls();
}

document.getElementById('play-again-btn').addEventListener('click', () => {
    if (game.mode === 'local') {
        showScreen('local-setup-screen');
    } else {
        showScreen('lobby-screen');
    }
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    if (game.socket) {
        game.socket.close();
    }
    showScreen('menu-screen');
});

document.getElementById('leave-game-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the game?')) {
        if (game.mode === 'online' && game.socket) {
            sendWebSocketMessage('leave_room', { roomCode: game.roomCode });
            game.socket.close();
        }
        showScreen('menu-screen');
    }
});

// ============================================================
// CUSTOM EVENT POPUP SYSTEM
// ============================================================

class EventPopupSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.triggeredOnce = new Set(); // Track triggerOnce rules
        this.init();
    }

    init() {
        // Create popup container
        this.container = document.createElement('div');
        this.container.className = `event-popup-container position-${PopupSettings.position}`;
        document.body.appendChild(this.container);
    }

    // Main method to check all rules against event data
    checkRules(eventData) {
        if (!CustomEvents.enabled || !CustomEvents.rules) return;

        CustomEvents.rules.forEach(rule => {
            if (!rule.enabled) return;

            // Check triggerOnce rules
            if (rule.triggerOnce && this.triggeredOnce.has(rule.name)) {
                return;
            }

            try {
                // Evaluate the condition
                if (rule.condition(eventData)) {
                    const message = this.getMessage(rule, eventData);
                    const replacedMessage = this.replacePlaceholders(message, eventData);
                    this.showPopup(replacedMessage);

                    // Mark as triggered if it's a triggerOnce rule
                    if (rule.triggerOnce) {
                        this.triggeredOnce.add(rule.name);
                    }
                }
            } catch (error) {
                console.error(`Error in rule "${rule.name}":`, error);
            }
        });
    }

    getMessage(rule, eventData) {
        const messages = rule.messages;
        const selection = rule.selection;

        if (selection === 'random') {
            return messages[Math.floor(Math.random() * messages.length)];
        } else if (typeof selection === 'number' && selection < messages.length) {
            return messages[selection];
        }
        return messages[0];
    }

    replacePlaceholders(message, data) {
        return message
            .replace(/\{\{player\}\}/g, data.player || '')
            .replace(/\{\{score\}\}/g, data.score !== undefined ? data.score : '')
            .replace(/\{\{totalScore\}\}/g, data.totalScore || '')
            .replace(/\{\{category\}\}/g, this.prettyCategoryName(data.category) || '')
            .replace(/\{\{upperSectionTotal\}\}/g, data.upperSectionTotal || '')
            .replace(/\{\{yahtzeeCount\}\}/g, data.yahtzeeCount || '')
            .replace(/\{\{margin\}\}/g, data.margin || '')
            .replace(/\{\{categoriesRemaining\}\}/g, data.categoriesRemaining || '');
    }

    prettyCategoryName(category) {
        const names = {
            'ones': 'Ones',
            'twos': 'Twos',
            'threes': 'Threes',
            'fours': 'Fours',
            'fives': 'Fives',
            'sixes': 'Sixes',
            'three_of_a_kind': 'Three of a Kind',
            'four_of_a_kind': 'Four of a Kind',
            'full_house': 'Full House',
            'small_straight': 'Small Straight',
            'large_straight': 'Large Straight',
            'yahtzee': 'Yahtzee',
            'chance': 'Chance'
        };
        return names[category] || category;
    }

    showPopup(message) {
        if (PopupSettings.allowQueue) {
            this.queue.push(message);
            if (this.queue.length > PopupSettings.maxQueue) {
                this.queue.shift(); // Remove oldest
            }
            if (!this.isShowing) {
                this.processQueue();
            }
        } else {
            this.displayPopup(message);
        }
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const message = this.queue.shift();
        this.displayPopup(message);

        setTimeout(() => {
            this.processQueue();
        }, PopupSettings.duration + 200);
    }

    displayPopup(message) {
        const popup = document.createElement('div');
        popup.className = `event-popup anim-${PopupSettings.animation}`;
        popup.textContent = message;

        this.container.appendChild(popup);

        // Remove after duration
        setTimeout(() => {
            popup.remove();
        }, PopupSettings.duration);
    }

    reset() {
        this.triggeredOnce.clear();
    }
}

// Initialize popup system
const popupSystem = new EventPopupSystem();

// ============================================================
// EVENT DATA BUILDER
// ============================================================

function buildEventData(player, additionalData = {}) {
    // Calculate upper section total
    const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
    const upperSectionTotal = upperCategories.reduce((sum, cat) => {
        return sum + (player.scores[cat] || 0);
    }, 0);

    // Count Yahtzees
    const yahtzeeCount = Object.keys(player.scores).filter(cat => 
        cat === 'yahtzee' && player.scores[cat] === 50
    ).length;

    // Count straights
    const straightCount = 
        (player.scores.small_straight > 0 ? 1 : 0) + 
        (player.scores.large_straight > 0 ? 1 : 0);

    // Count remaining categories
    const categoriesRemaining = CONFIG.CATEGORIES.filter(cat => 
        player.scores[cat] === null
    ).length;

    // Check if player took the lead
    let tookLead = false;
    if (game.players.length > 1) {
        const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
        const wasLeader = sortedPlayers[0].id === player.id;
        const prevScores = game.previousScores || {};
        if (!prevScores[player.id] || prevScores[player.id] < sortedPlayers[0].totalScore) {
            tookLead = wasLeader && player.totalScore > 0;
        }
    }

    return {
        player: player.name,
        totalScore: player.totalScore,
        upperSectionTotal: upperSectionTotal,
        categoriesRemaining: categoriesRemaining,
        yahtzeeCount: yahtzeeCount,
        straightCount: straightCount,
        upperBonus: player.upperBonus,
        allScores: { ...player.scores },
        tookLead: tookLead,
        ...additionalData
    };
}

// ============================================================
// EVENT TRIGGERS
// ============================================================

function triggerScoringEvent(category, score, rollNumber) {
    const currentPlayer = game.players[game.currentPlayerIndex];
    
    const eventData = buildEventData(currentPlayer, {
        category: category,
        score: score,
        rollNumber: rollNumber,
        dice: [...game.currentDice]
    });

    // Store previous scores for lead detection
    if (!game.previousScores) {
        game.previousScores = {};
    }
    game.players.forEach(p => {
        game.previousScores[p.id] = p.totalScore;
    });

    popupSystem.checkRules(eventData);
}

function triggerFirstRollEvent() {
    const eventData = {
        isFirstRoll: true,
        player: game.players[0].name
    };
    popupSystem.checkRules(eventData);
}

function triggerGameOverEvent() {
    const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
    const winner = sortedPlayers[0];
    const runnerUp = sortedPlayers[1];
    const margin = winner.totalScore - runnerUp.totalScore;

    const eventData = {
        gameOver: true,
        player: winner.name,
        totalScore: winner.totalScore,
        margin: margin,
        ...buildEventData(winner)
    };

    popupSystem.checkRules(eventData);
}

// ============================================================
// INITIALIZE
// ============================================================

// Show menu on load
showScreen('menu-screen');
