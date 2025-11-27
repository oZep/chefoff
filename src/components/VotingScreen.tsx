import { useState, useEffect } from 'react';

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
  onVote: (submissionId: number, voteType: 'up' | 'down') => void;
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

  // Reset vote button when submission changes
  useEffect(() => {
    setShowVoteButton(true);
  }, [currentSubmission?.playerId, submissionIndex]);

  const handleVote = (voteType: 'up' | 'down') => {
    if (currentSubmission && !hasVoted) {
      onVote(currentSubmission.playerId, voteType);
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
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-blue-900 mb-2">
            {category} Voting
          </h1>
        </div>
          {showVoteButton && !hasVoted && (
            <div className="text-center">
              <div className="flex justify-center gap-6 mb-4">
                <button
                  onClick={() => handleVote('up')}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-8 rounded-xl text-4xl shadow-lg transform hover:scale-110 transition-all duration-200"
                >
                  👍
                </button>
                <button
                  onClick={() => handleVote('down')}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 px-8 rounded-xl text-4xl shadow-lg transform hover:scale-110 transition-all duration-200"
                >
                  👎
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}