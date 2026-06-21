import { Link } from 'react-router-dom';
import './Result.css';

export default function Result({ score, valid, game, onPlayAgain }) {
  const emoji = !valid        ? '❌'
              : score >= 25   ? '🏆'
              : score >= 10   ? '🎯'
              : score >= 1    ? '😅'
              : '😬';

  return (
    <div className="result-page">
      <div className="result-wrap">

        <div className="result-emoji">{emoji}</div>

        <h1 className="result-title">
          {valid ? 'Journey complete!' : 'Invalid route'}
        </h1>

        <p className="result-desc">
          {valid
            ? `You reached ${game?.destStation?.name} from ${game?.startStation?.name}.`
            : 'Your route was invalid or incomplete — you scored 0 coins.'}
        </p>

        <div className="card result-score-card">
          <p className="result-score-label">Final score</p>
          <p className="result-score">{score}</p>
          <p className="result-score-sub">coins remaining</p>
        </div>

        <div className="result-actions">
          <button className="btn btn-primary btn-full" onClick={onPlayAgain}>
            Play again
          </button>
          <Link to="/ranking" className="btn btn-full">
            View ranking
          </Link>
        </div>

      </div>
    </div>
  );
}
