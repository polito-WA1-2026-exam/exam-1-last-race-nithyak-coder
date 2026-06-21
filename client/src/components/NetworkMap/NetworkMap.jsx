import './NetworkMap.css';

const COORDS = {
  'Lampugnano': { x: 50,  y: 200 },
  'Biscione':   { x: 120, y: 200 },
  'Corvino':    { x: 190, y: 160 },
  'Croce':      { x: 270, y: 160 },
  'Duomo':      { x: 360, y: 160 },
  'Centrale':   { x: 450, y: 160 },
  'Loreto':     { x: 530, y: 120 },
  'Sesto':      { x: 610, y: 120 },
  'Assago':     { x: 160, y: 270 },
  'Romolo':     { x: 220, y: 220 },
  'Garibaldi':  { x: 360, y: 90  },
  'Cologno':    { x: 610, y: 80  },
  'Comasina':   { x: 270, y: 35  },
  'Zara':       { x: 360, y: 35  },
  'San Donato': { x: 540, y: 210 },
  'Bisceglie':  { x: 110, y: 260 },
  'Linate':     { x: 460, y: 230 },
};

export default function NetworkMap({
  stations,
  segments,
  lines,
  showLines = true,
  highlightStart = null,
  highlightDest  = null,
}) {
  if (!stations || !segments || !lines) return null;

  const stById    = Object.fromEntries(stations.map(s => [s.id, s]));
  const lineColor = Object.fromEntries(lines.map(l => [l.id, l.color]));

  // Interchange highlighting and per-station line coloring are only shown
  // when lines themselves are shown (Setup phase). During Planning, the
  // spec requires the map to reveal only bare stations — no hint of which
  // lines serve them, since that's exactly what the player must recall
  // from memory. So none of this structural info is computed/used unless
  // showLines is true.
  const interchangeIds = showLines
    ? new Set(stations.filter(s => s.lines && s.lines.length > 1).map(s => s.id))
    : new Set();

  return (
    <div className="network-map">
      <svg viewBox="0 0 680 310" style={{ width: '100%', display: 'block' }}>

        {/* Lines (segments with color) */}
        {showLines && segments.map((seg, i) => {
          const from = stById[seg.fromId];
          const to   = stById[seg.toId];
          if (!from || !to) return null;
          const fc = COORDS[from.name];
          const tc = COORDS[to.name];
          if (!fc || !tc) return null;
          const color = seg.lineId ? lineColor[seg.lineId] : '#888';
          return (
            <line key={i}
              x1={fc.x} y1={fc.y} x2={tc.x} y2={tc.y}
              stroke={color} strokeWidth="4" strokeLinecap="round"
            />
          );
        })}

        {/* Station dots */}
        {stations.map(s => {
          const c = COORDS[s.name];
          if (!c) return null;
          const isInterchange = interchangeIds.has(s.id);
          const isStart = s.id === highlightStart;
          const isDest  = s.id === highlightDest;
          // Only derive a per-line color when lines are actually shown.
          // During Planning (showLines=false) every station must render
          // identically, regardless of which line(s) it belongs to.
          const color = showLines && s.lines?.[0] ? lineColor[s.lines[0]] : '#888';

          return (
            <g key={s.id}>
              {/* Highlight rings for start/dest */}
              {isStart && (
                <circle cx={c.x} cy={c.y} r={16}
                  fill="none" stroke="#2E8B57" strokeWidth="2.5"
                  strokeDasharray="4 2" />
              )}
              {isDest && (
                <circle cx={c.x} cy={c.y} r={16}
                  fill="none" stroke="#D83B2E" strokeWidth="2.5"
                  strokeDasharray="4 2" />
              )}

              {isInterchange && (
                <circle cx={c.x} cy={c.y} r={11}
                  fill="white" stroke="#888" strokeWidth="2.5" />
              )}
              <circle cx={c.x} cy={c.y} r={isInterchange ? 6 : 5}
                fill="white" stroke={isStart ? '#2E8B57' : isDest ? '#D83B2E' : color}
                strokeWidth={isStart || isDest ? 3 : 2} />

              <text x={c.x} y={c.y + (isStart || isDest ? 22 : 18)}
                textAnchor="middle" fontSize="9" fill="#eef0f5"
                fontWeight={isStart || isDest ? '700' : 'normal'}>
                {s.name}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        {showLines && lines.map((l, i) => (
          <g key={l.id}>
            <rect x={10 + i * 100} y={292} width={14} height={6} rx={3} fill={l.color} />
            <text x={28 + i * 100} y={299} fontSize="9" fill="rgba(255,255,255,0.6)">{l.name}</text>
          </g>
        ))}

        {/* Planning mode legend */}
        {!showLines && (highlightStart || highlightDest) && (
          <g transform="translate(0,8)">
            <circle cx={16} cy={296} r={5} fill="none" stroke="#63C85A" strokeWidth="2"/>
            <text x={26} y={300} fontSize="9" fill="rgba(255,255,255,0.6)">Start</text>
            <circle cx={66} cy={296} r={5} fill="none" stroke="#E24B4A" strokeWidth="2"/>
            <text x={76} y={300} fontSize="9" fill="rgba(255,255,255,0.6)">Destination</text>
          </g>
        )}
      </svg>
    </div>
  );
}