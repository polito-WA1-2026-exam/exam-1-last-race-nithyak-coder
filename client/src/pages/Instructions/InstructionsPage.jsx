import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './InstructionsPage.css';

export default function InstructionsPage() {
  const { user } = useAuth();

  return (
    <div className="instructions-page">
      <div className="instructions-wrap">

        {/* Hero */}
        <div className="instructions-hero">
          <div className="instructions-dots">
            <span className="instr-dot dot-red" />
            <span className="instr-dot dot-blue" />
            <span className="instr-dot dot-green" />
            <span className="instr-dot dot-yellow" />
          </div>
          <h1 className="instructions-title">Welcome to Last Race</h1>
          <p className="instructions-sub">
            A single-player metro network puzzle game — plan your route before time runs out!
          </p>
        </div>

        {/* Guest notice */}
        {!user && (
          <div className="guest-notice">
            <span className="guest-notice-icon">🔒</span>
            <div>
              <p className="guest-notice-title">You're browsing as a guest</p>
              <p className="guest-notice-desc">
                Sign in to access the network map, play games, and appear on the ranking.
              </p>
            </div>
            
          </div>
        )}

        {/* How to play */}
        <div className="card instructions-card">
          <h2 className="instructions-section-title">How to play</h2>
          <div className="instructions-steps">

            <div className="instructions-step">
              <div className="step-number step-blue">1</div>
              <div className="step-content">
                <p className="step-title">Setup — study the network</p>
                <p className="step-desc">
                  View the full metro map with all stations, line colors, and connections.
                  Memorize it well — during planning, the line colors will be hidden!
                </p>
              </div>
            </div>

            <div className="instructions-step">
              <div className="step-number step-orange">2</div>
              <div className="step-content">
                <p className="step-title">
                  Planning — 90 seconds
                </p>
                <p className="step-desc">
                  You're assigned a random start and destination station (at least 3 segments apart).
                  Build a valid route by selecting segments from a list — no line colors shown.
                  You can only use each segment once. Submit before the timer hits zero!
                </p>
              </div>
            </div>

            <div className="instructions-step">
              <div className="step-number step-green">3</div>
              <div className="step-content">
                <p className="step-title">Execution — random events</p>
                <p className="step-desc">
                  Your route is validated. If valid, each segment triggers a random event
                  that adds or removes coins from your starting balance of 20.
                  Line changes are only allowed at interchange stations.
                  An invalid or incomplete route means losing all 20 coins.
                </p>
              </div>
            </div>

            <div className="instructions-step">
              <div className="step-number step-red">4</div>
              <div className="step-content">
                <p className="step-title">Result — your score</p>
                <p className="step-desc">
                  Your final score is your remaining coins (minimum 0).
                  Beat your personal best to climb the global ranking!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Tips card */}
        <div className="card instructions-tips">
          <h2 className="instructions-section-title">Tips</h2>
          <ul className="tips-list">
            <li>Interchange stations (served by more than one line) are the only places you can switch lines.</li>
            <li>During planning, the list of all segments is shown — use it to mentally rebuild the map.</li>
            <li>Events range from −4 to +4 coins. The longer your route, the more events you'll face.</li>
            <li>You can visit the same station twice, but not the same segment twice.</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="instructions-cta">
          {user ? (
            <Link to="/game" className="btn btn-primary instructions-play-btn">
              Start playing
            </Link>
          ) : (
            <div className="instructions-guest-cta">
              <Link to="/login" className="btn btn-primary instructions-play-btn">
                Sign in to play
              </Link>
             
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
