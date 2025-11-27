import { useEffect, useState } from 'react';
import FoodIcon from './FoodIcon';

interface Player {
  id: number;
  name: string;
  icon: 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato';
}

interface WaitingScreenProps {
  player: Player;
  roomCode: string;
}

export default function WaitingScreen({ player, roomCode }: WaitingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-20 text-green-300 text-8xl">🍳</div>
        <div className="absolute top-40 right-32 text-green-300 text-6xl">🥄</div>
        <div className="absolute bottom-32 left-40 text-green-300 text-7xl">🍴</div>
        <div className="absolute top-1/2 left-10 text-green-300 text-5xl">🥕</div>
        <div className="absolute bottom-20 right-20 text-green-300 text-9xl">🥘</div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-4 border-green-200 max-w-2xl w-full">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-black text-green-900 mb-2">
              Welcome to the Kitchen!
            </h1>
            <p className="text-green-700 text-lg">
              Room: <span className="font-mono font-bold">{roomCode}</span>
            </p>
          </div>

          {/* Player Info */}
          <div className="bg-green-100 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-4">
              <FoodIcon type={player.icon} />
              <div>
                <h2 className="text-2xl font-bold text-green-900">
                  {player.name}
                </h2>
                <p className="text-green-700">You're ready to cook!</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}