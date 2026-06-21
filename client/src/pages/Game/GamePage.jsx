import { useState, useEffect, useRef } from 'react';
import API from '../../api.js';
import Setup     from './phases/Setup.jsx';
import Planning  from './phases/Planning.jsx';
import Execution from './phases/Execution.jsx';
import Result    from './phases/Result.jsx';

const PHASE = {
  SETUP:     'setup',
  PLANNING:  'planning',
  EXECUTION: 'execution',
  RESULT:    'result',
};

export default function GamePage() {
  const [phase,         setPhase]         = useState(PHASE.SETUP);
  const [network,       setNetwork]       = useState(null);
  const [game,          setGame]          = useState(null);
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [usedSegKeys,   setUsedSegKeys]   = useState(new Set());
  const [timeLeft,      setTimeLeft]      = useState(90);
  const [execResult,    setExecResult]    = useState(null);
  const [currentStep,   setCurrentStep]   = useState(0);
  const [coins,         setCoins]         = useState(20);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const timerRef = useRef(null);
  const selectedRouteRef = useRef([]);

  // Keep the ref in sync with the latest selectedRoute on every change.
  // The 90-second timer's setInterval callback is created once, when
  // planning starts, and would otherwise keep a stale closure over
  // whatever `selectedRoute` was at that exact moment (an empty array).
  // Reading from this ref instead guarantees submitRoute always sees
  // the player's most recently built route, even when triggered by the
  // timer expiring rather than a manual button click.
  useEffect(() => {
    selectedRouteRef.current = selectedRoute;
  }, [selectedRoute]);

  // Load network once on mount
  useEffect(() => {
    API.getNetwork()
      .then(n => setNetwork(n))
      .catch(() => setError('Failed to load network. Please refresh.'));
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Setup phase: create a new game and transition to planning phase

  const handleReady = async () => {
    setLoading(true);
    setError('');
    try {
      const g = await API.createGame();
      setGame(g);
      setSelectedRoute([]);
      setUsedSegKeys(new Set());
      setTimeLeft(90);
      setPhase(PHASE.PLANNING);
      startTimer(g);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (g) => {
    clearInterval(timerRef.current);
    let t = 90;
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        submitRoute(g);
      }
    }, 1000);
  };

  // Build route: add segments to the route, mark them as used, and allow clearing the last segment

  const handleAddSegment = (fromId, toId, currentGame) => {
    const key = [fromId, toId].sort().join('|');
    if (usedSegKeys.has(key)) return;

    setSelectedRoute(prev => {
      if (prev.length === 0) {
        // First segment: make sure the start station comes first in the route
        const startId = currentGame?.startStation?.id;
        if (startId === toId)   return [toId, fromId];
        if (startId === fromId) return [fromId, toId];
        return [fromId, toId];
      }
      const last = prev[prev.length - 1];
      if (last === fromId) return [...prev, toId];
      if (last === toId)   return [...prev, fromId];
      return prev;
    });

    setUsedSegKeys(prev => new Set([...prev, key]));
  };

  const handleClearRoute = () => {
    setSelectedRoute(prev => {
      if (prev.length <= 1) return [];
      // Remove the last station, and un-mark the segment that connected
      // it to the previous station as "used" so it becomes selectable
      // again. Calling this repeatedly walks the route back one step
      // at a time, like an undo button.
      const removedStationId = prev[prev.length - 1];
      const newLastId         = prev[prev.length - 2];
      const key = [removedStationId, newLastId].sort().join('|');

      setUsedSegKeys(prevKeys => {
        const next = new Set(prevKeys);
        next.delete(key);
        return next;
      });

      return prev.slice(0, -1);
    });
  };

  //route submission: stop timer, send route to server, and transition to execution phase

  const handleSubmit = () => submitRoute(game);

  const submitRoute = async (currentGame) => {
    clearInterval(timerRef.current);
    if (!currentGame) return;
    setLoading(true);
    try {
      const result = await API.executeGame(currentGame.id, selectedRouteRef.current);
      setExecResult(result);
      setCurrentStep(0);
      setCoins(20);
      setPhase(result.valid ? PHASE.EXECUTION : PHASE.RESULT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Execution phase: advance through steps one at a time, updating coins and current step index

  const handleNextStep = () => {
    if (!execResult) return;
    if (currentStep >= execResult.steps.length) {
      setPhase(PHASE.RESULT);
      return;
    }
    const step = execResult.steps[currentStep];
    setCoins(step.coinsAfter);
    setCurrentStep(prev => prev + 1);
  };

  // Result phase: reset everything to start a new game

  const handlePlayAgain = () => {
    setPhase(PHASE.SETUP);
    setGame(null);
    setExecResult(null);
    setSelectedRoute([]);
    setUsedSegKeys(new Set());
    setCurrentStep(0);
    setCoins(20);
  };

  

  if (error)    return <p style={{ padding: '32px', color: '#D83B2E' }}>{error}</p>;
  if (!network) return <p style={{ padding: '32px', color: '#888' }}>Loading network...</p>;

  return (
    <>
      {phase === PHASE.SETUP && (
        <Setup
          network={network}
          onReady={handleReady}
          loading={loading}
        />
      )}

      {phase === PHASE.PLANNING && game && (
        <Planning
          network={network}
          game={game}
          timeLeft={timeLeft}
          selectedRoute={selectedRoute}
          usedSegKeys={usedSegKeys}
          onAddSegment={(fromId, toId) => handleAddSegment(fromId, toId, game)}
          onClearRoute={handleClearRoute}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {phase === PHASE.EXECUTION && execResult && (
        <Execution
          steps={execResult.steps}
          currentStep={currentStep}
          coins={coins}
          onNextStep={handleNextStep}
        />
      )}

      {phase === PHASE.RESULT && (
        <Result
          score={execResult?.score ?? 0}
          valid={execResult?.valid ?? false}
          game={game}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
