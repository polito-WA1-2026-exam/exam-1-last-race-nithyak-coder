import './Execution.css';

export default function Execution({ steps, currentStep, coins, onNextStep }) {
  const isLastStep = currentStep >= steps.length;

  // Build the list of stop names for the track: start station + every
  // "to" station along the route, in order. This is purely derived from
  // the same `steps` prop already passed in — no new data, no new logic.
  const stopNames = steps.length > 0
    ? [steps[0].from.name, ...steps.map(s => s.to.name)]
    : [];
  const totalStops = stopNames.length;

  // Evenly space stops left-to-right as percentages, with a small margin
  // on each side so labels never get clipped at the track edges.
  const stopPercent = (index) => {
    if (totalStops <= 1) return 50;
    const margin = 6;
    return margin + (index / (totalStops - 1)) * (100 - margin * 2);
  };

  return (
    <div className="execution-page">
      <div className="execution-wrap">

        <div className="phase-tag">Phase 3 — Execution</div>

        <div className="execution-header">
          <h1 className="execution-title">Your journey</h1>
          <div className="coins-badge">🪙 {coins} coins</div>
        </div>

        {/* Track with stops — visual only, derived from the existing
            steps prop. The train marker sits at whichever stop matches
            currentStep; the track behind it fills in as "traveled". */}
        {totalStops > 0 && (
          <div className="card track-card">
            <div className="track-stage">
              <div className="track-base" />
              <div
                className="track-progress"
                style={{
                  width: currentStep >= totalStops - 1
                    ? '100%'
                    : `${stopPercent(currentStep)}%`,
                }}
              />

              {stopNames.map((name, i) => {
                const reached = i <= currentStep;
                const isTrainHere = i === currentStep;
                const labelBelow = i % 2 === 1; // alternate above/below
                return (
                  <div
                    key={i}
                    className={`track-stop ${reached ? 'track-stop-reached' : ''}`}
                    style={{ left: `${stopPercent(i)}%` }}
                  >
                    <span
                      className={`stop-label ${reached ? 'stop-label-reached' : ''} ${labelBelow ? 'stop-label-below' : ''}`}
                      title={name}
                    >
                      {name}
                    </span>
                    <span className="stop-dot" />
                    {isTrainHere && (
                      <span className="track-train" aria-hidden="true">
                        <svg viewBox="0 0 48 32" width="34" height="23">
                          <rect x="1" y="1" width="46" height="24" rx="7" fill="#EF9F27" stroke="#FAC775" strokeWidth="1.5" />
                          <rect x="6" y="6" width="11" height="10" rx="1.5" fill="#161b2e" opacity="0.55" />
                          <rect x="19" y="6" width="11" height="10" rx="1.5" fill="#161b2e" opacity="0.55" />
                          <rect x="32" y="6" width="9" height="10" rx="1.5" fill="#161b2e" opacity="0.55" />
                          <circle cx="11" cy="27" r="3.5" fill="#1a1a1a" />
                          <circle cx="37" cy="27" r="3.5" fill="#1a1a1a" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="execution-steps">
          {steps.slice(0, currentStep).map((step, i) => {
            const isActive = i === currentStep - 1;
            const cls      = step.event.effect > 0 ? 'event-pos'
                           : step.event.effect < 0 ? 'event-neg'
                           : 'event-neu';
            const sign     = step.event.effect > 0 ? '+' : '';

            return (
              <div key={i} className={`exec-step ${isActive ? 'exec-step-active' : 'exec-step-done'}`}>
                <div className="exec-step-header">
                  <span className="exec-step-route">
                    {step.from.name} → {step.to.name}
                  </span>
                  <span className={`event-pill ${cls}`}>
                    {sign}{step.event.effect} coins
                  </span>
                </div>
                <p className="exec-step-desc">{step.event.description}</p>
                <p className="exec-step-coins">
                  Coins after: <strong>{step.coinsAfter}</strong>
                </p>
              </div>
            );
          })}
        </div>

        <button
          className="btn btn-primary btn-full execution-next"
          onClick={onNextStep}
        >
          {isLastStep ? 'See final result →' : 'Next step →'}
        </button>

      </div>
    </div>
  );
}
