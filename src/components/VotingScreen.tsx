import { useState } from 'react';
import FoodIcon from './FoodIcon';

interface Submission {
  playerId: number;
  playerName: string;
  playerIcon: string;
  drawing: string;
  category: string;
  prompt: string;
}

interface VotingScreenProps {
  currentSubmission: Submission | null;
  submissionIndex: number;
  totalSubmissions: number;
  onVote: (submissionId: number) => void;
  hasVoted: boolean;
  category: string;
  prompt: string;
}

export default function VotingScreen({
  currentSubmission,
  submissionIndex,
  totalSubmissions,
  onVote,
  hasVoted,
  category,
  prompt
}: VotingScreenProps) {
  const [showVoteButton, setShowVoteButton] = useState(true);

  const handleVote = () => {
    if (currentSubmission && !hasVoted) {
      onVote(currentSubmission.playerId);
      setShowVoteButton(false);
    }
  };

  if (!currentSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-blue-900 mb-4">
            Waiting for voting to begin...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-blue-900 mb-2">
            {category} Voting
          </h1>
          <p className="text-xl font-semibold text-blue-700 mb-2">
            "{prompt}"
          </p>
          <p className="text-lg text-blue-600">
            Submission {submissionIndex + 1} of {totalSubmissions}
          </p>
        </div>

        {/* Submission Display */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-blue-200 mb-8">
          {/* Artist Info */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <FoodIcon type={currentSubmission.playerIcon as 'cabbage' | 'carrot' | 'crab' | 'eggplant' | 'elbow' | 'tomato'} />
            <h2 className="text-3xl font-bold text-gray-900">
              {currentSubmission.playerName}'s Creation
            </h2>
          </div>

          {/* Drawing */}
          <div className="flex justify-center mb-6">
            <img
              src={currentSubmission.drawing}
              alt={`${currentSubmission.playerName}'s drawing`}
              className="max-w-full max-h-96 rounded-lg shadow-lg border-2 border-gray-200"
            />
          </div>

          {/* Vote Button */}
          {showVoteButton && !hasVoted && (
            <div className="text-center">
              <button
                onClick={handleVote}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-xl text-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🏆 Vote for this Creation!
              </button>
              <p className="text-gray-600 mt-2">
                Click to vote for this drawing in the {category} category
              </p>
            </div>
          )}

          {(hasVoted || !showVoteButton) && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                ✅ Vote Cast!
              </div>
              <p className="text-gray-700">
                Waiting for other submissions to be shown...
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-100 rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold text-blue-900 mb-2">
            How to Vote
          </h3>
          <p className="text-blue-700">
            Look at each drawing and vote for the one you think best represents "{prompt}". 
            You can only vote once per category!
          </p>
        </div>
      </div>
    </div>
  );
}