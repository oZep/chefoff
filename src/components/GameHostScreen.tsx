import { useEffect, useState } from 'react';
import FoodIcon from './FoodIcon';

interface Player {
  id: number;
  name: string;
  icon: 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato';
  hasSubmitted?: boolean;
}

interface Prompt {
  category: string;
  title: string;
}

interface Submission {
  playerId: number;
  playerName: string;
  playerIcon: string;
  drawing: string;
  category: string;
  prompt: string;
}

interface GameHostScreenProps {
  players: Player[];
  ws: WebSocket | null;
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner'];

export default function GameHostScreen({ players, ws }: GameHostScreenProps) {
  const [currentPhase, setCurrentPhase] = useState<'drawing' | 'voting' | 'complete'>('drawing');
  const [currentCategoryIndex, setCategoryIndex] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    // Load prompts and start first drawing phase
    fetch('/prompt.json')
      .then(res => res.json())
      .then(data => {
        setAllPrompts(data);
        // Start first breakfast prompt automatically
        const breakfastPrompts = data.filter((p: Prompt) => p.category === 'Breakfast');
        if (breakfastPrompts.length > 0) {
          const randomPrompt = breakfastPrompts[Math.floor(Math.random() * breakfastPrompts.length)];
          setCurrentPrompt(randomPrompt);
          // Auto-start first drawing phase with longer delay
          setTimeout(() => startDrawingPhase(randomPrompt), 1500);
        }
      });
  }, [ws]);

  const startDrawingPhase = (prompt: Prompt) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Host starting drawing phase:', prompt);
      setCurrentPhase('drawing');
      setTimeRemaining(60);
      ws.send(JSON.stringify({
        type: 'START_DRAWING_PHASE',
        category: prompt.category,
        prompt: prompt.title,
        timeRemaining: 60
      }));
    } else {
      console.log('WebSocket not ready, retrying in 100ms');
      setTimeout(() => startDrawingPhase(prompt), 100);
    }
  };

  const startFirstRound = () => {
    if (currentPrompt) {
      startDrawingPhase(currentPrompt);
    }
  };

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'DRAWING_SUBMITTED':
            setSubmissions(prev => [...prev, message.submission]);
            // Update player submission status
            break;
          case 'VOTE_CAST':
            setVotes(prev => ({
              ...prev,
              [message.submissionId]: (prev[message.submissionId] || 0) + 1
            }));
            
            // Auto-advance if all players voted
            if (message.allPlayersVoted) {
              console.log('All players voted, auto-advancing in 2 seconds...');
              setTimeout(() => {
                nextSubmission();
              }, 2000);
            }
            break;
        }
      };
    }
  }, [ws]);

  const handlePhaseComplete = () => {
    if (currentPhase === 'drawing') {
      // Move to voting phase
      setCurrentPhase('voting');
      setCurrentSubmissionIndex(0);
      
      const categorySubmissions = submissions.filter(s => 
        s.category === CATEGORIES[currentCategoryIndex]
      );
      
      if (ws && categorySubmissions.length > 0) {
        // Automatically show first submission to start voting
        ws.send(JSON.stringify({
          type: 'SHOW_SUBMISSION',
          submission: categorySubmissions[0],
          index: 0,
          total: categorySubmissions.length
        }));
      }
    } else if (currentPhase === 'voting') {
      // Move to next category or end game
      if (currentCategoryIndex < CATEGORIES.length - 1) {
        // Move to next category
        setCategoryIndex(prev => prev + 1);
        setCurrentPhase('drawing');
        setTimeRemaining(60);
        setSubmissions([]);
        setVotes({});
        
        // Get next prompt
        const nextCategory = CATEGORIES[currentCategoryIndex + 1];
        const categoryPrompts = allPrompts.filter((p: Prompt) => p.category === nextCategory);
        if (categoryPrompts.length > 0) {
          const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
          setCurrentPrompt(randomPrompt);
          
          if (ws) {
            ws.send(JSON.stringify({
              type: 'START_DRAWING_PHASE',
              category: randomPrompt.category,
              prompt: randomPrompt.title,
              timeRemaining: 60
            }));
          }
        }
      } else {
        // Game complete - show thanks for playing screen
        setCurrentPhase('complete');
        if (ws) {
          ws.send(JSON.stringify({
            type: 'GAME_COMPLETE'
          }));
        }
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (currentPhase === 'drawing' && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
        
        // Send time update to players
        if (ws) {
          ws.send(JSON.stringify({
            type: 'TIME_UPDATE',
            timeRemaining: timeRemaining - 1
          }));
        }
      }, 1000);
    } else if (currentPhase === 'drawing' && timeRemaining === 0) {
      // Time's up, move to voting phase
      handlePhaseComplete();
    }
    
    return () => clearTimeout(timer);
  }, [timeRemaining, currentPhase, ws, handlePhaseComplete]);

  const nextSubmission = () => {
    const categorySubmissions = submissions.filter(s => 
      s.category === CATEGORIES[currentCategoryIndex]
    );
    
    if (currentSubmissionIndex < categorySubmissions.length - 1) {
      const nextIndex = currentSubmissionIndex + 1;
      setCurrentSubmissionIndex(nextIndex);
      
      console.log(`Showing submission ${nextIndex + 1} of ${categorySubmissions.length}`);
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'SHOW_SUBMISSION',
          submission: categorySubmissions[nextIndex],
          index: nextIndex,
          total: categorySubmissions.length
        }));
      }
    } else {
      // Voting complete for this category
      console.log('All submissions shown, completing voting phase');
      handlePhaseComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const categorySubmissions = submissions.filter(s => 
    s.category === CATEGORIES[currentCategoryIndex]
  );

  if (currentPhase === 'drawing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-black text-amber-900 mb-4">
            {CATEGORIES[currentCategoryIndex]} Round
          </h1>
          
          <div>
            <p className="text-3xl font-semibold text-purple-700 mb-6">
              "{currentPrompt?.title}"
            </p>
            
            <div className={`text-5xl font-black mb-6 ${timeRemaining <= 10 ? 'text-red-600' : 'text-amber-600'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {players.map((player) => {
                const hasSubmitted = categorySubmissions.some(s => s.playerId === player.id);
                return (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-2 p-3 rounded-xl ${
                      hasSubmitted ? 'bg-green-200 border-2 border-green-400' : 'bg-gray-200'
                    }`}
                  >
                    <FoodIcon type={player.icon} />
                    <span className="font-semibold text-gray-900 text-sm">
                      {player.name}
                      {hasSubmitted && ' ✅'}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {categorySubmissions.length === players.length && (
              <button
                onClick={handlePhaseComplete}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl"
              >
                Start Voting Phase
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentPhase === 'voting') {
    const currentSubmission = categorySubmissions[currentSubmissionIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-black text-blue-900 mb-4">
            {CATEGORIES[currentCategoryIndex]} Voting
          </h1>
          
          {currentSubmission && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-blue-200 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                "{currentPrompt?.title}"
              </h2>
              
              <div className="flex items-center justify-center space-x-4 mb-6">
                <FoodIcon type={currentSubmission.playerIcon as 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato'} />
                <span className="text-2xl font-bold text-gray-900">
                  {currentSubmission.playerName}'s Creation
                </span>
              </div>
              
              <img
                src={currentSubmission.drawing}
                alt="Player submission"
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg mb-6"
              />
              
              <button
                onClick={nextSubmission}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-xl"
              >
                {currentSubmissionIndex < categorySubmissions.length - 1 ? 'Next Submission' : 'Finish Voting'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentPhase === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-black text-green-900 mb-8">
            Thanks for Playing!
          </h1>
          
          <div>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}