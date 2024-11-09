import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Trash2, Plus } from 'lucide-react';
import { AudioSynthesizer, DrumSound, NoteSound, SoundType } from './AudioSynthesizer';

interface SoundLine {
  id: string;
  lane: number;
  time: number;
  type: SoundType;
  isLit: boolean;
}

interface Lane {
  id: string;
}

const GRID_INTERVAL = 0.2;
const MIN_LINE_SPACING = 0.2;

// Sound types with their colors
const DRUM_SOUNDS: { type: DrumSound; color: string; label: string }[] = [
  { type: 'kick', color: '#EF4444', label: 'Kick' },   // red
  { type: 'snare', color: '#F59E0B', label: 'Snare' }, // amber
  { type: 'hihat', color: '#10B981', label: 'Hi-hat' }, // emerald
  { type: 'clap', color: '#6366F1', label: 'Clap' }    // indigo
];

const NOTE_SOUNDS: { type: NoteSound; color: string; label: string }[] = [
  { type: 'noteC', color: '#EC4899', label: 'C4' }, // pink
  { type: 'noteD', color: '#8B5CF6', label: 'D4' }, // violet
  { type: 'noteE', color: '#3B82F6', label: 'E4' }, // blue
  { type: 'noteF', color: '#14B8A6', label: 'F4' }  // teal
];

const AudioSequencer: React.FC = () => {
  const [lines, setLines] = useState<SoundLine[]>([]);
  const [lanes, setLanes] = useState<Lane[]>([{ id: 'lane-1' }]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [draggingLine, setDraggingLine] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, time: number } | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedSound, setSelectedSound] = useState<{ type: SoundType; color: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<AudioSynthesizer | null>(null);

  useEffect(() => {
    synthRef.current = new AudioSynthesizer();
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + (0.016 * speed);
          if (next >= 60) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 16);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    if (isPlaying) {
      lines.forEach(line => {
        const distance = Math.abs(currentTime - line.time);
        const shouldBeLit = distance < 0.02;
        
        if (shouldBeLit && !line.isLit) {
          synthRef.current?.playSound(line.type);
          setLines(prev => prev.map(l => 
            l.id === line.id ? { ...l, isLit: true } : l
          ));
        } else if (!shouldBeLit && line.isLit) {
          setLines(prev => prev.map(l => 
            l.id === line.id ? { ...l, isLit: false } : l
          ));
        }
      });
    }
  }, [currentTime, isPlaying, lines]);

  const snapToGrid = (time: number) => {
    const gridPos = Math.round(time / GRID_INTERVAL) * GRID_INTERVAL;
    return Math.max(0, Math.min(60, gridPos));
  };

  // Check if a new line would overlap with existing lines
  const wouldOverlap = (newTime: number, lane: number, excludeLineId?: string) => {
    return lines.some(line => 
      line.lane === lane && 
      line.id !== excludeLineId && 
      Math.abs(line.time - newTime) < MIN_LINE_SPACING
    );
  };

  const addLane = () => {
    setLanes(prev => [...prev, { id: `lane-${Date.now()}` }]);
  };

  const removeLane = (laneId: string) => {
    setLanes(prev => prev.filter(lane => lane.id !== laneId));
    setLines(prev => prev.filter(line => line.lane !== lanes.findIndex(l => l.id === laneId)));
  };

  const handleLaneClick = (laneIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSound || draggingLine) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const rawTime = (clickX / rect.width) * 60;
    const snappedTime = snapToGrid(rawTime);

    if (wouldOverlap(snappedTime, laneIndex)) return;

    setLines(prev => [...prev, {
      id: `line-${Date.now()}`,
      lane: laneIndex,
      time: snappedTime,
      type: selectedSound.type,
      isLit: false
    }]);
  };

  const handleDragStart = (lineId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const line = lines.find(l => l.id === lineId);
    if (!line) return;

    setDraggingLine(lineId);
    setSelectedLine(lineId);
    setDragStartPos({
      x: event.clientX,
      time: line.time
    });
  };

  const handleDrag = (event: React.MouseEvent) => {
    if (!draggingLine || !dragStartPos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragStartPos.x;
    const deltaTime = (deltaX / rect.width) * 60;
    const newTime = snapToGrid(dragStartPos.time + deltaTime);

    // Get the current line's lane
    const currentLine = lines.find(l => l.id === draggingLine);
    if (!currentLine) return;

    // Check for overlap before updating position
    if (!wouldOverlap(newTime, currentLine.lane, draggingLine)) {
      setLines(prev => prev.map(line =>
        line.id === draggingLine
          ? { ...line, time: newTime }
          : line
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggingLine(null);
    setDragStartPos(null);
  };

  const handleLineClick = (event: React.MouseEvent, lineId: string) => {
    event.stopPropagation();
    setSelectedLine(lineId);
  };

  const handleDeleteSelected = () => {
    if (selectedLine) {
      setLines(prev => prev.filter(line => line.id !== selectedLine));
      setSelectedLine(null);
    }
  };

  const startPlayback = () => setIsPlaying(true);
  const pausePlayback = () => setIsPlaying(false);
  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setLines(prev => prev.map(l => ({ ...l, isLit: false })));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      {/* Sound Selection */}
      <div className="w-full max-w-4xl mb-4">
        <div className="mb-4">
          <h3 className="text-white mb-2">Drums</h3>
          <div className="flex gap-2">
            {DRUM_SOUNDS.map(sound => (
              <button
                key={sound.type}
                onClick={() => setSelectedSound({ type: sound.type, color: sound.color })}
                className="px-3 py-1 rounded text-white"
                style={{
                  backgroundColor: sound.color,
                  opacity: selectedSound?.type === sound.type ? 1 : 0.6
                }}
              >
                {sound.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-white mb-2">Notes</h3>
          <div className="flex gap-2">
            {NOTE_SOUNDS.map(sound => (
              <button
                key={sound.type}
                onClick={() => setSelectedSound({ type: sound.type, color: sound.color })}
                className="px-3 py-1 rounded text-white"
                style={{
                  backgroundColor: sound.color,
                  opacity: selectedSound?.type === sound.type ? 1 : 0.6
                }}
              >
                {sound.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sequencer */}
      <div 
        ref={containerRef}
        className="w-full max-w-4xl mb-8"
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Time markers */}
        <div className="w-full h-6 relative border-b border-purple-500/30">
          {Array.from({ length: 300 }).map((_, i) => {
            const isMajor = i % 25 === 0;
            const showLabel = isMajor && (i * GRID_INTERVAL) % 10 === 0;
            return (
              <div
                key={i}
                className={`absolute h-${isMajor ? '4' : '2'} w-px bg-purple-500/30`}
                style={{
                  left: `${(i * GRID_INTERVAL / 60) * 100}%`,
                  top: isMajor ? '0' : '50%'
                }}
              >
                {showLabel && (
                  <span className="absolute -top-6 left-1 text-xs text-purple-300">
                    {i * GRID_INTERVAL}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Lanes */}
        <div className="relative w-full">
          {lanes.map((lane, laneIndex) => (
            <div key={lane.id} className="flex items-center">
              <div
                onClick={(e) => handleLaneClick(laneIndex, e)}
                className="relative h-16 border-t border-purple-500/50 cursor-pointer mb-4 flex-grow"
                style={{ boxShadow: '0 0 10px rgba(147, 51, 234, 0.3)' }}
              >
                {lines
                  .filter(line => line.lane === laneIndex)
                  .map(line => {
                    const soundConfig = [...DRUM_SOUNDS, ...NOTE_SOUNDS].find(s => s.type === line.type);
                    return (
                      <div
                        key={line.id}
                        className={`absolute top-0 bottom-0 w-1 cursor-move
                          transition-all duration-100`}
                        style={{
                          left: `${(line.time / 60) * 100}%`,
                          transform: 'translateX(-50%)',
                          backgroundColor: soundConfig?.color,
                          boxShadow: line.isLit 
                            ? `0 0 15px ${soundConfig?.color}`
                            : line.id === selectedLine
                            ? '0 0 10px rgba(255,255,255,0.5)'
                            : `0 0 10px ${soundConfig?.color}80`
                        }}
                        onClick={(e) => handleLineClick(e, line.id)}
                        onMouseDown={(e) => handleDragStart(line.id, e)}
                      />
                    );
                  })}
              </div>
              {laneIndex > 0 && (
                <button
                  onClick={() => removeLane(lane.id)}
                  className="ml-2 p-2 text-white bg-red-600 rounded hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Add Lane Button */}
          <button
            onClick={addLane}
            className="w-full py-2 flex items-center justify-center gap-2 text-white bg-purple-600 rounded hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Lane
          </button>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ 
              left: `${(currentTime / 60) * 100}%`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button
          onClick={startPlayback}
          disabled={isPlaying}
          className="p-2 text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          <Play className="w-6 h-6" />
        </button>
        <button
          onClick={pausePlayback}
          disabled={!isPlaying}
          className="p-2 text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          <Pause className="w-6 h-6" />
        </button>
        <button
          onClick={stopPlayback}
          className="p-2 text-white bg-purple-600 rounded hover:bg-purple-700"
        >
          <Square className="w-6 h-6" />
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={!selectedLine}
          className="p-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="text-white">Speed:</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-48"
        />
        <span className="text-white">{speed.toFixed(1)}x</span>
      </div>
    </div>
  );
};

export default AudioSequencer;