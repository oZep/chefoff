import FoodIcon from './FoodIcon';

interface PlayerResult {
  playerId: number;
  playerName: string;
  playerIcon: string;
  upVotes: number;
  downVotes: number;
  score: number; // upvotes - downvotes
}

interface ResultsScreenProps {
  results: PlayerResult[];
  category: string;
  onContinue: () => void;
}

export default function ResultsScreen({ results, category, onContinue }: ResultsScreenProps) {
  // Sort results by score (highest first)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-black text-amber-900 mb-4">
          🏆 {category} Results! 🏆
        </h1>

        {/* Full Results */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-amber-200 mb-8">
          <h3 className="text-3xl font-bold text-amber-900 mb-6">Final Standings</h3>
          <div className="space-y-4">
            {sortedResults.map((result, index) => (
              <div 
                key={result.playerId}
                className={`flex items-center justify-between p-4 rounded-2xl ${
                  index === 0 
                    ? 'bg-gradient-to-r from-yellow-200 to-amber-200 border-2 border-yellow-400' 
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-200 to-gray-300 border-2 border-gray-400'
                    : index === 2
                    ? 'bg-gradient-to-r from-amber-100 to-orange-200 border-2 border-orange-300'
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold text-gray-700">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <FoodIcon type={result.playerIcon as 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato'} />
                  <span className="text-xl font-bold text-gray-900">{result.playerName}</span>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-lg text-gray-700">
                    {result.upVotes} 👍 - {result.downVotes} 👎
                  </div>
                  <div className={`text-2xl font-bold ${
                    result.score > 0 ? 'text-green-600' : result.score < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {result.score > 0 ? '+' : ''}{result.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Continue to Next Round
        </button>
      </div>
    </div>
  );
}