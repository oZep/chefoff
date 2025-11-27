const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game state - single instance for demo
const gameState = {
  roomCode: 'ABCD',
  host: null,
  players: [],
  gameStarted: false,
  maxPlayers: 6,
  currentPhase: 'lobby', // 'lobby', 'drawing', 'voting', 'results'
  currentCategory: null,
  currentPrompt: null,
  submissions: [],
  votes: {},
  timeRemaining: 60
};

// Available icons for players
const AVAILABLE_ICONS = ['cabbage', 'carrot', 'crab', 'eggplant', 'elbow', 'tomato'];

function getAvailableIcon() {
  const usedIcons = gameState.players.map(p => p.icon);
  const available = AVAILABLE_ICONS.filter(icon => !usedIcons.includes(icon));
  return available.length > 0 ? available[0] : AVAILABLE_ICONS[0];
}

function broadcastToAll(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function broadcastToHost(message) {
  if (gameState.host && gameState.host.readyState === WebSocket.OPEN) {
    gameState.host.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  console.log('New connection established');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type, message);
      
      switch (message.type) {
        case 'HOST_CONNECT':
          gameState.host = ws;
          ws.isHost = true;
          ws.send(JSON.stringify({
            type: 'HOST_CONNECTED',
            roomCode: gameState.roomCode,
            players: gameState.players
          }));
          break;

        case 'JOIN_GAME':
          const { roomCode, username } = message;
          
          // Validate room code
          if (roomCode !== gameState.roomCode) {
            ws.send(JSON.stringify({
              type: 'JOIN_ERROR',
              message: 'Invalid room code'
            }));
            return;
          }

          // Check if game already started
          if (gameState.gameStarted) {
            ws.send(JSON.stringify({
              type: 'JOIN_ERROR',
              message: 'Game already in progress'
            }));
            return;
          }

          // Check if room is full
          if (gameState.players.length >= gameState.maxPlayers) {
            ws.send(JSON.stringify({
              type: 'JOIN_ERROR',
              message: 'Room is full'
            }));
            return;
          }

          // Check if username already taken
          if (gameState.players.some(p => p.name === username)) {
            ws.send(JSON.stringify({
              type: 'JOIN_ERROR',
              message: 'Username already taken'
            }));
            return;
          }

          // Add player
          const player = {
            id: Date.now(),
            name: username,
            icon: getAvailableIcon(),
            ws: ws
          };

          gameState.players.push(player);
          ws.isPlayer = true;
          ws.playerId = player.id;

          // Confirm join to player
          ws.send(JSON.stringify({
            type: 'JOIN_SUCCESS',
            player: {
              id: player.id,
              name: player.name,
              icon: player.icon
            }
          }));

          // Update host with new player list
          broadcastToHost({
            type: 'PLAYERS_UPDATED',
            players: gameState.players.map(p => ({
              id: p.id,
              name: p.name,
              icon: p.icon
            }))
          });

          console.log(`Player ${username} joined the game`);
          break;

        case 'START_GAME':
          console.log('START_GAME received, isHost:', ws.isHost, 'players:', gameState.players.length);
          if (ws.isHost) { // Allow starting with any number of players for testing
            gameState.gameStarted = true;
            console.log('Game started - skipping GAME_STARTED, will wait for drawing phase');
            // Don't send GAME_STARTED, wait for the host to send START_DRAWING_PHASE
          }
          break;

        case 'START_DRAWING_PHASE':
          console.log('Received START_DRAWING_PHASE, ws.isHost:', ws.isHost, 'players:', gameState.players.length);
          if (ws.isHost) {
            console.log('Host starting drawing phase:', message.category, message.prompt);
            gameState.currentPhase = 'drawing';
            gameState.currentCategory = message.category;
            gameState.currentPrompt = message.prompt;
            gameState.timeRemaining = message.timeRemaining;
            gameState.submissions = [];
            
            // Broadcast to players
            console.log('Broadcasting to', gameState.players.length, 'players');
            gameState.players.forEach((player, index) => {
              if (player.ws && player.ws.readyState === 1) {
                console.log(`Sending DRAWING_PHASE_STARTED to player ${index + 1}:`, player.name);
                player.ws.send(JSON.stringify({
                  type: 'DRAWING_PHASE_STARTED',
                  category: message.category,
                  prompt: message.prompt,
                  timeRemaining: message.timeRemaining
                }));
              } else {
                console.log(`Player ${index + 1} WebSocket not ready:`, player.ws?.readyState);
              }
            });
          } else {
            console.log('Non-host tried to start drawing phase');
          }
          break;

        case 'SUBMIT_DRAWING':
          if (ws.isPlayer && gameState.currentPhase === 'drawing') {
            const player = gameState.players.find(p => p.ws === ws);
            if (player) {
              const submission = {
                playerId: player.id,
                playerName: player.name,
                playerIcon: player.icon,
                drawing: message.drawing,
                category: gameState.currentCategory,
                prompt: gameState.currentPrompt
              };
              
              gameState.submissions.push(submission);
              
              // Notify host
              broadcastToHost({
                type: 'DRAWING_SUBMITTED',
                submission: submission,
                totalSubmissions: gameState.submissions.length
              });
              
              // Confirm to player
              ws.send(JSON.stringify({
                type: 'DRAWING_SUBMITTED_CONFIRM'
              }));
              
              console.log(`Drawing submitted by ${player.name}`);
            }
          }
          break;

        case 'START_VOTING_PHASE':
          if (ws.isHost) {
            gameState.currentPhase = 'voting';
            gameState.votes = {};
            
            // Don't broadcast submissions here, wait for SHOW_SUBMISSION
          }
          break;

        case 'START_VOTING_PHASE':
          if (ws.isHost) {
            console.log('Starting voting phase for players');
            gameState.currentPhase = 'voting';
            gameState.votes = {}; // Reset votes for new voting phase
            gameState.currentSubmissionVotes = {}; // Track per-submission votes
            // The host will send SHOW_SUBMISSION next
          }
          break;

        case 'SHOW_SUBMISSION':
          if (ws.isHost) {
            console.log('Showing submission to players for voting:', message.index + 1, 'of', message.total);
            
            // Initialize votes for this submission if not exists
            if (!gameState.votes[message.submission.playerId]) {
              gameState.votes[message.submission.playerId] = { up: 0, down: 0, votedPlayers: [] };
            }
            
            // Broadcast current submission to players for voting
            gameState.players.forEach(player => {
              if (player.ws && player.ws.readyState === 1) {
                console.log('Sending SHOW_SUBMISSION_FOR_VOTING to player:', player.name);
                player.ws.send(JSON.stringify({
                  type: 'SHOW_SUBMISSION_FOR_VOTING',
                  submission: message.submission,
                  index: message.index,
                  total: message.total,
                  category: gameState.currentCategory,
                  prompt: gameState.currentPrompt
                }));
              }
            });
          }
          break;

        case 'CAST_VOTE':
          if (ws.isPlayer && gameState.currentPhase === 'voting') {
            const playerId = gameState.players.find(p => p.ws === ws)?.id;
            if (playerId) {
              // Record vote
              if (!gameState.votes[message.submissionId]) {
                gameState.votes[message.submissionId] = 0;
              }
              gameState.votes[message.submissionId]++;
              
              // Notify host
              broadcastToHost({
                type: 'VOTE_CAST',
                submissionId: message.submissionId,
                votes: gameState.votes
              });
              
              // Confirm to player
              ws.send(JSON.stringify({
                type: 'VOTE_CAST_CONFIRM'
              }));
            }
          }
          break;

        case 'TIME_UPDATE':
          if (ws.isHost) {
            gameState.timeRemaining = message.timeRemaining;
            
            // Broadcast to players
            gameState.players.forEach(player => {
              if (player.ws && player.ws.readyState === 1) {
                player.ws.send(JSON.stringify({
                  type: 'TIME_UPDATE',
                  timeRemaining: message.timeRemaining
                }));
              }
            });
          }
          break;

        case 'RESET_GAME':
          if (ws.isHost) {
            gameState.players = [];
            gameState.gameStarted = false;
            gameState.currentPhase = 'lobby';
            gameState.currentCategory = null;
            gameState.currentPrompt = null;
            gameState.submissions = [];
            gameState.votes = {};
            gameState.timeRemaining = 60;
            broadcastToAll({
              type: 'GAME_RESET'
            });
            console.log('Game reset');
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed');
    
    // Remove player if they disconnect
    if (ws.isPlayer) {
      gameState.players = gameState.players.filter(p => p.ws !== ws);
      
      // Update host with new player list
      broadcastToHost({
        type: 'PLAYERS_UPDATED',
        players: gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          icon: p.icon
        }))
      });
    }
    
    // Reset game if host disconnects
    if (ws.isHost) {
      gameState.host = null;
      gameState.players = [];
      gameState.gameStarted = false;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});