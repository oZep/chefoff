import { useState } from 'react';
import FoodIcon from './FoodIcon';

interface JoinScreenProps {
  onJoin: (roomCode: string, username: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function JoinScreen({ onJoin, isLoading = false, error }: JoinScreenProps) {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 4 && username.trim().length > 0) {
      onJoin(roomCode.toUpperCase(), username.trim());
    }
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 4);
    setRoomCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-20 text-amber-300 text-8xl">🍳</div>
        <div className="absolute top-40 right-32 text-amber-300 text-6xl">🥄</div>
        <div className="absolute bottom-32 left-40 text-amber-300 text-7xl">🍴</div>
        <div className="absolute top-1/2 left-10 text-amber-300 text-5xl">🥕</div>
        <div className="absolute bottom-20 right-20 text-amber-300 text-9xl">🥘</div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border-4 border-amber-200 max-w-md w-full">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-amber-900 mb-2">
              JOIN THE CHAOS
            </h1>
            <p className="text-amber-700 text-lg">
              Enter the room code and your chef name
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Code Input */}
            <div>
              <label htmlFor="roomCode" className="block text-amber-900 font-semibold mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="ABCD"
                className="w-full px-4 py-3 text-center text-3xl font-mono font-bold tracking-widest bg-gray-100 border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                maxLength={4}
                required
              />
            </div>

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-amber-900 font-semibold mb-2">
                Chef Name
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-lg bg-gray-100 border-2 border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                maxLength={20}
                required
              />
              <p className="text-sm text-amber-600 mt-1">
                {username.length}/20 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-2 border-red-300 rounded-xl p-3">
                <p className="text-red-700 font-semibold text-center">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <button
              type="submit"
              disabled={isLoading || roomCode.length !== 4 || username.trim().length === 0}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl text-xl transition-colors duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Kitchen'}
            </button>
          </form>

          {/* Sample Icons */}
          <div className="mt-8 pt-6 border-t-2 border-amber-200">
            <p className="text-center text-amber-700 font-semibold mb-4">
              You'll get one of these chef icons:
            </p>
            <div className="flex justify-center space-x-3">
              {(['cabbage', 'carrot', 'crab', 'eggplant', 'elbow', 'tomato'] as const).map((icon) => (
                <div key={icon} className="opacity-60">
                  <FoodIcon type={icon} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}