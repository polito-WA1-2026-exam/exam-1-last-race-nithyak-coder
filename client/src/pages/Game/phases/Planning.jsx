import NetworkMap from '../../../components/NetworkMap/NetworkMap.jsx';
import './Planning.css';

export default function Planning({
  network,
  game,
  timeLeft,
  selectedRoute,
  usedSegKeys,
  onAddSegment,
  onClearRoute,
  onSubmit,
  loading,
}) {
  //station name lookup helper
  const getStationName = (id) =>
    network.stations.find(s => s.id === id)?.name || id;

  // Deduplicate segments for display (a pair can be served by more than
  // one line in the underlying data — the player only ever sees it once).
  const uniqueSegments = () => {
    const seen = new Set();
    return network.segments.filter(s => {
      const key = [s.fromId, s.toId].sort().join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  // Timer bar percentage and urgency
  const timerPercent = (timeLeft / 90) * 100;
  const timerUrgent  = timeLeft <= 15;

  const segs = uniqueSegments();
  
  return (
    <div className="planning-page">
      <div className="planning-wrap">

        {/* Header row */}
        <div className="planning-header">
          <div className="phase-tag">Plan your route</div>
          <div className={`planning-timer ${timerUrgent ? 'timer-urgent' : ''}`}>
            ⏱ {timeLeft}s
          </div>
        </div>

        {/* Timer bar */}
        <div className="timer-bar-wrap">
          <div className="timer-bar" style={{ width: `${timerPercent}%` }} />
        </div>

        {/* Start / Destination */}
        <div className="planning-stations">
          <div className="card planning-station-card">
            <p className="planning-station-label">Start</p>
            <p className="planning-station-name">🟢 {game.startStation.name}</p>
          </div>
          <div className="card planning-station-card">
            <p className="planning-station-label">Destination</p>
            <p className="planning-station-name">🔴 {game.destStation.name}</p>
          </div>
        </div>

        {/* Map without lines */}
        <div className="card planning-map-card">
          <p className="planning-card-label">Network map with no connections</p>
          <NetworkMap
            stations={network.stations}
            segments={network.segments}
            lines={network.lines}
            showLines={false}
            highlightStart={game.startStation.id}
            highlightDest={game.destStation.id}
          />
        </div>

        {/* Route builder */}
        <div className="card">
          <p className="planning-card-label">Your route</p>
          <div className="planning-route">
            {selectedRoute.length === 0
              ? <span className="muted" style={{ fontSize: '12px' }}>
                  Select segments below to build your route...
                </span>
              : selectedRoute.map((id, i) => (
                  <span key={i} className="planning-route-item">
                    <span className="planning-route-station">{getStationName(id)}</span>
                    {i < selectedRoute.length - 1 && (
                      <span className="planning-route-arrow">→</span>
                    )}
                  </span>
                ))
            }
          </div>

          {selectedRoute.length > 0 &&
            selectedRoute[selectedRoute.length - 1] === game?.destStation?.id && (
              <p className="route-reached-msg">
                You've reached {game.destStation.name} — ready to submit, or undo to change your route.
              </p>
          )}

          <p className="planning-card-label" style={{ marginTop: '14px', marginBottom: '8px' }}>
            All segments — click to add to your route
          </p>

          <div className="planning-segments">
            {segs.map((seg, i) => {
              const key    = [seg.fromId, seg.toId].sort().join('|');
              const used   = usedSegKeys.has(key);
              const last   = selectedRoute[selectedRoute.length - 1];

              // Once the player has arrived at the assigned destination,
              // no further segments should be selectable — continuing
              // would only ever produce a route the server rejects anyway
              // (route must END exactly at destStation).
              const reachedDestination = last === game?.destStation?.id;

              const canAdd = !reachedDestination && (
                selectedRoute.length === 0
                || last === seg.fromId
                || last === seg.toId
              );

              // Display order should follow the player's travel direction,
              // not raw DB storage order. Before any selection, orient the
              // very first segment so it starts from the assigned start
              // station. Once a route is being built, orient by "last station
              // walked so far -> the other end of this segment".
              let displayFromId = seg.fromId;
              let displayToId   = seg.toId;

              if (selectedRoute.length === 0) {
                // No selection yet — if this segment touches the start
                // station, show the start station first.
                if (seg.toId === game?.startStation?.id) {
                  displayFromId = seg.toId;
                  displayToId   = seg.fromId;
                }
              } else if (last === seg.toId) {
                // We just arrived at seg.toId — walking this segment next
                // means going toId -> fromId, so flip the label.
                displayFromId = seg.toId;
                displayToId   = seg.fromId;
              }

              // NOTE: deliberately not showing which line a segment
              // belongs to here. The spec only gives the player a bare
              // list of station pairs during planning ("Porta Velaria—
              // Fontana Oscura") — the player must mentally reconstruct
              // the network themselves; showing the line would hand them
              // the answer to that exercise.
              return (
                <div
                  key={i}
                  className={`seg-item ${used ? 'seg-used' : !canAdd ? 'seg-dim' : ''}`}
                  onClick={() => !used && canAdd && onAddSegment(displayFromId, displayToId)}
                >
                  <span className="seg-text">
                    {getStationName(displayFromId)} — {getStationName(displayToId)}
                  </span>
                  {used && <span className="seg-used-label">✓ used</span>}
                </div>
              );
            })}
          </div>

          <div className="planning-actions">
            <button
              className="btn"
              onClick={onClearRoute}
              disabled={selectedRoute.length === 0}
            >
              Undo last step
            </button>
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={loading || selectedRoute.length < 2}
            >
              {loading ? 'Submitting...' : 'Submit route'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}