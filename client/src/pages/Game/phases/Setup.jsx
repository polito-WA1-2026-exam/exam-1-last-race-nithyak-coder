import NetworkMap from '../../../components/NetworkMap/NetworkMap.jsx';
import './Setup.css';

export default function Setup({ network, onReady, loading }) {
  return (
    <div className="setup-page">
      <div className="setup-wrap">

        <div className="phase-tag">Metro route map</div>
        <h1 className="setup-title">Study the network</h1>
        <p className="setup-desc">
          Memorize the lines, stations, and connections carefully.
          During planning you will NOT see the connecting lines!
        </p>

        <div className="card">
          <NetworkMap
            stations={network.stations}
            segments={network.segments}
            lines={network.lines}
            showLines={true}
          />
          <div className="setup-actions">
            <button
              className="btn btn-primary"
              onClick={onReady}
              disabled={loading}
            >
              {loading ? 'Starting...' : "Build the route"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
