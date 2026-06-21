import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import API from '../../api.js';
import './RankingPage.css';

export default function RankingPage() {
  const { user }   = useAuth();
  const location   = useLocation();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Refetch every time this route is navigated to (location.key changes on
  // every navigation, even if the path is the same), so the ranking is
  // always fresh after finishing a game — not just on first mount.
  useEffect(() => {
    setLoading(true);
    setError('');
    API.getRanking()
      .then(r  => setRanking(r))
      .catch(() => setError('Failed to load ranking.'))
      .finally(() => setLoading(false));
  }, [location.key]);

  if (loading) return <p style={{ padding: '32px', color: 'rgba(255,255,255,0.5)' }}>Loading ranking...</p>;
  if (error)   return <p style={{ padding: '32px', color: '#F09595' }}>{error}</p>;

  const medalFor = (i) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
  const rankClass = (i) => i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : '';

  return (
    <div className="ranking-page">
      <div className="ranking-wrap">

        <h1 className="ranking-title">Ranking</h1>
        <p className="ranking-sub">Best score per player — all time</p>

        <div className="card ranking-card">
          <div className="ranking-header-row">
            <span className="ranking-col-pos">#</span>
            <span className="ranking-col-name">Player</span>
            <span className="ranking-col-score">Best score</span>
          </div>

          {ranking.length === 0 && (
            <div className="ranking-row">
              <span className="muted">No completed games yet.</span>
            </div>
          )}

          {ranking.map((entry, i) => {
            const isMe = user && entry.username === user.username;
            return (
              <div key={i} className={`ranking-row ${rankClass(i)} ${isMe ? 'ranking-row-me' : ''}`}>
                <span className="ranking-col-pos">{medalFor(i)}</span>
                <span className="ranking-col-name">
                  {entry.username}
                  {isMe && <span className="ranking-you-badge">you</span>}
                </span>
                <span className="ranking-col-score">
                  {entry.bestScore}
                  <span className="ranking-coins-label"> coins</span>
                </span>
              </div>
            );
          })}
        </div>

        <div className="ranking-play-cta">
          <Link to="/game" className="btn btn-primary">Play a game →</Link>
        </div>

      </div>
    </div>
  );
}
