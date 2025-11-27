import { useState, useEffect } from 'react';
import LobbyScreen from './components/LobbyScreen';
import JoinScreen from './components/JoinScreen';
import WaitingScreen from './components/WaitingScreen';
import DrawingCanvas from './components/DrawingCanvas';
import VotingScreen from './components/VotingScreen';
import GameHostScreen from './components/GameHostScreen';

type GameState = 'lobby' | 'join' | 'waiting' | 'playing' | 'drawing' | 'voting';

interface Player {
  id: number;
  name: string;
  icon: 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato';
}

interface Submission {
  playerId: number;
  playerName: string;
  playerIcon: string;
  drawing: string;
  category: string;
  prompt: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('join');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);
  // Drawing phase state
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentCategory, setCurrentCategory] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [hasSubmittedDrawing, setHasSubmittedDrawing] = useState(false);
  // Voting phase state
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [submissionIndex, setSubmissionIndex] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  // Check URL to determine if this is host or player
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/host' || path === '/') {
      setGameState('lobby');
      setIsHost(true);
      
      // Set up host WebSocket connection
      const websocket = new WebSocket('ws://localhost:3001');
      
      websocket.onopen = () => {
        console.log('Connected to server as host');
        websocket.send(JSON.stringify({ type: 'HOST_CONNECT' }));
      };
      
      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'HOST_CONNECTED':
            setRoomCode(message.roomCode || 'ABCD');
            setAllPlayers(message.players || []);
            break;
          case 'PLAYERS_UPDATED':
            setAllPlayers(message.players);
            break;
        }
      };
      
      setWs(websocket);
      
      return () => {
        websocket.close();
      };
    } else if (path === '/join') {
      setGameState('join');
      setIsHost(false);
    }
  }, []);

  const handleJoinGame = (roomCode: string, username: string) => {
    setIsJoining(true);
    setJoinError('');

    // Connect to WebSocket server
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('Connected to server as player');
      websocket.send(JSON.stringify({
        type: 'JOIN_GAME',
        roomCode,
        username
      }));
    };
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'JOIN_SUCCESS':
          setCurrentPlayer(message.player);
          setRoomCode(roomCode);
          setGameState('waiting');
          setIsJoining(false);
          break;
        case 'JOIN_ERROR':
          setJoinError(message.message);
          setIsJoining(false);
          websocket.close();
          break;
        case 'PLAYERS_UPDATED':
          setAllPlayers(message.players);
          break;
        case 'DRAWING_PHASE_STARTED':
          console.log('Player received DRAWING_PHASE_STARTED message:', message);
          // Players switch to drawing
          setGameState('drawing');
          setCurrentCategory(message.category);
          setCurrentPrompt(message.prompt);
          setTimeRemaining(message.timeRemaining);
          setHasSubmittedDrawing(false);
          break;
        case 'TIME_UPDATE':
          setTimeRemaining(message.timeRemaining);
          break;
        case 'DRAWING_SUBMITTED_CONFIRM':
          setHasSubmittedDrawing(true);
          break;
        case 'SHOW_SUBMISSION_FOR_VOTING':
          console.log('Received SHOW_SUBMISSION_FOR_VOTING:', message.index + 1, 'of', message.total, 'isHost:', isHost);
          if (isHost) {
            // Host stays on game host screen during voting
            setGameState('playing');
          } else {
            // Only players see voting screen
            console.log('Player switching to voting screen for submission:', message.submission.playerName);
            setGameState('voting');
          }
          setCurrentSubmission(message.submission);
          setSubmissionIndex(message.index);
          setTotalSubmissions(message.total);
          setCurrentCategory(message.category);
          setCurrentPrompt(message.prompt);
          console.log('Resetting hasVoted to false for new submission');
          setHasVoted(false);
          break;
        case 'VOTE_CAST_CONFIRM':
          console.log('Vote confirmed, setting hasVoted to true');
          setHasVoted(true);
          break;
        case 'GAME_RESET':
          setGameState('join');
          setCurrentPlayer(null);
          setAllPlayers([]);
          setRoomCode('');
          setHasSubmittedDrawing(false);
          setHasVoted(false);
          break;
      }
    };
    
    websocket.onclose = () => {
      console.log('Disconnected from server');
      setIsJoining(false);
      if (gameState === 'waiting') {
        // Return to join screen if disconnected while waiting
        setGameState('join');
        setJoinError('Disconnected from server');
      }
    };
    
    setWs(websocket);
  };

  const handleDrawingSubmit = (drawing: string) => {
    if (ws) {
      ws.send(JSON.stringify({
        type: 'SUBMIT_DRAWING',
        drawing: drawing
      }));
    }
  };

  const handleVote = (submissionId: number, voteType: 'up' | 'down') => {
    if (ws && !hasVoted) {
      ws.send(JSON.stringify({
        type: 'CAST_VOTE',
        submissionId: submissionId,
        voteType: voteType
      }));
    }
  };

  const handleGameStart = () => {
    if (isHost) {
      setGameState('playing');
    }
  };

  // Render appropriate screen based on game state
  switch (gameState) {
    case 'lobby':
      return <LobbyScreen players={allPlayers} roomCode={roomCode} ws={ws} onGameStart={handleGameStart} />;
    case 'join':
      return (
        <JoinScreen 
          onJoin={handleJoinGame}
          isLoading={isJoining}
          error={joinError}
        />
      );
    case 'waiting':
      return currentPlayer ? (
        <WaitingScreen 
          player={currentPlayer}
          roomCode={roomCode}
        />
      ) : null;
    case 'playing':
      // Host view - show game host screen
      return <GameHostScreen players={allPlayers} ws={ws} />;
    case 'drawing':
      return (
        <DrawingCanvas
          onDrawingComplete={handleDrawingSubmit}
          prompt={currentPrompt}
          timeRemaining={timeRemaining}
          isSubmitted={hasSubmittedDrawing}
        />
      );
    case 'voting':
      return (
        <VotingScreen
          currentSubmission={currentSubmission}
          submissionIndex={submissionIndex}
          totalSubmissions={totalSubmissions}
          onVote={handleVote}
          hasVoted={hasVoted}
          category={currentCategory}
          prompt={currentPrompt}
        />
      );
    default:
      return null;
  }
}

export default App;
