import { useState, useEffect } from 'react';
import { ChefHat, Utensils, Play } from 'lucide-react';
import FoodIcon from './FoodIcon';

const FOOD_ICONS = ['cabbage', 'carrot', 'crab', 'eggplant', 'elbow', 'tomato'] as const;

interface Player {
  id: number;
  name: string;
  icon: typeof FOOD_ICONS[number];
}

interface LobbyScreenProps {
  players: Player[];
  roomCode: string;
  ws: WebSocket | null;
  onGameStart: () => void;
}

export default function LobbyScreen({ players, roomCode, ws, onGameStart }: LobbyScreenProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (ws) {
      setIsConnected(ws.readyState === WebSocket.OPEN);
      
      const handleOpen = () => setIsConnected(true);
      const handleClose = () => setIsConnected(false);
      
      ws.addEventListener('open', handleOpen);
      ws.addEventListener('close', handleClose);
      
      return () => {
        ws.removeEventListener('open', handleOpen);
        ws.removeEventListener('close', handleClose);
      };
    }
  }, [ws]);

  const startGame = () => {
    if (ws) { // Allow starting with any number of players for testing
      console.log('Starting game with', players.length, 'players');
      ws.send(JSON.stringify({ type: 'START_GAME' }));
      onGameStart();
    }
  };

  const resetGame = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'RESET_GAME' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-20 text-amber-300 text-8xl">🍳</div>
        <div className="absolute top-40 right-32 text-amber-300 text-6xl">🥄</div>
        <div className="absolute bottom-32 left-40 text-amber-300 text-7xl">🍴</div>
        <div className="absolute top-1/2 left-10 text-amber-300 text-5xl">🥕</div>
        <div className="absolute bottom-20 right-20 text-amber-300 text-9xl">🥘</div>
      </div>

      <div className="relative min-h-screen flex items-center justify-between px-16 py-12">
        <div className="flex-1 max-w-md space-y-8">
          <div className="text-center space-y-6">
            <div className="text-amber-900">
              <h1 className="text-5xl font-black tracking-tight leading-tight">
                KITCHEN CHAOS
              </h1>
            </div>
            
            <div className="text-center">
              <div className="text-amber-900 font-mono text-4xl font-bold tracking-widest">
                {roomCode}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-amber-900">
                Join at: <span className="font-bold">localhost:5173/join</span>
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={startGame}
                disabled={!isConnected} // Allow starting with any number of players
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl flex items-center space-x-2 transition-colors disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                <span>Start Game ({players.length}/6)</span>
              </button>
              
              <button
                onClick={resetGame}
                disabled={!isConnected}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-96 h-96 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full shadow-2xl border-8 border-amber-400/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-white/60 via-transparent to-transparent"></div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[360px] h-[360px] bg-white rounded-full shadow-inner border-4 border-gray-100 relative">
                  <div className="absolute inset-4">
                    {players.map((player, index) => {
                      const angle = (index * 60) - 90;
                      const radius = 120;
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;

                      return (
                        <div
                          key={player.id}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          }}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <FoodIcon type={player.icon} />
                            <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                              {player.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -inset-8 bg-gradient-to-br from-orange-200 to-amber-300 rounded-3xl -z-10 shadow-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
