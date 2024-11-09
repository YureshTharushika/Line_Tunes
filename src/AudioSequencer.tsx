import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { AudioSynthesizer, DrumSound } from './AudioSynthesizer';
import './AudioSequencer.css'

interface GridCell {
  isActive: boolean;
  type: DrumSound;
  isLit: boolean;
}

// const INTERVAL = 0.125;
const MIN_STEPS = 4;
const MAX_STEPS = 64;

const DEFAULT_BPM = 120;
const MIN_BPM = 60;
const MAX_BPM = 400;

const DRUMS_CONFIG = [
  { type: 'kick' as DrumSound, color: '#EF4444' },
  { type: 'snare' as DrumSound, color: '#F59E0B' },
  { type: 'hihat' as DrumSound, color: '#10B981' },
  { type: 'clap' as DrumSound, color: '#6366F1' },
  { type: 'cowbell' as DrumSound, color: '#EC4899' },
  { type: 'crash' as DrumSound, color: '#8B5CF6' },
  { type: 'openhat' as DrumSound, color: '#3B82F6' },
  { type: 'perc' as DrumSound, color: '#14B8A6' },
  { type: 'tom' as DrumSound, color: '#84CC16' }
];

const AudioSequencer: React.FC = () => {
  const [steps, setSteps] = useState(20);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [grid, setGrid] = useState<GridCell[][]>(() => 
    DRUMS_CONFIG.map(drum => Array(steps).fill(null).map(() => ({
      isActive: false,
      type: drum.type,
      isLit: false
    })))
  );
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const [synth] = useState(() => new AudioSynthesizer());

  const getBPMInterval = (bpm: number) => {
    // At 120 BPM, a quarter note is 0.5 seconds
    // using 8th notes (INTERVAL = 0.125), divide by 2
    return (60 / bpm) * 1000 / 2;
  };

  const playStepSounds = (stepIndex: number) => {
    grid.forEach((row, rowIndex) => {
      if (row[stepIndex].isActive) {
        synth.playSound(DRUMS_CONFIG[rowIndex].type);
      }
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      if (currentStep === 0) {
        playStepSounds(currentStep);
      }
      
      interval = setInterval(() => {
        setCurrentStep(prev => {
          const next = (prev + 1) % steps;
          playStepSounds(next);
          return next;
        });
      }, getBPMInterval(bpm));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, bpm, grid, steps]);

  useEffect(() => {
    setGrid(prev => prev.map(row => 
      row.map((cell, index) => ({
        ...cell,
        isLit: index === currentStep && cell.isActive
      }))
    ));
  }, [currentStep]);

  const handleStepsChange = (newSteps: number) => {
    setIsPlaying(false);
    setCurrentStep(0);
    setSteps(newSteps);
    setGrid(prev => prev.map(row => {
      const newRow = Array(newSteps).fill(null).map(() => ({
        isActive: false,
        type: row[0].type,
        isLit: false
      }));
      // Copy existing pattern up to the new length
      row.slice(0, newSteps).forEach((cell, index) => {
        newRow[index] = { ...cell, isLit: false };
      });
      return newRow;
    }));
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    setGrid(prev => prev.map((row, rIndex) => 
      rIndex === rowIndex
        ? row.map((cell, cIndex) => 
            cIndex === colIndex
              ? { ...cell, isActive: !cell.isActive }
              : cell
          )
        : row
    ));
  };

  const startPlayback = () => {
    // Only reset to start if at the end or stopped
    if (currentStep === 0 || currentStep === steps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  };

  const pausePlayback = () => setIsPlaying(false);

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setGrid(prev => prev.map(row => 
      row.map(cell => ({ ...cell, isLit: false }))
    ));
  };

  const handleBPMChange = (value: number) => {
    setBpm(Math.min(Math.max(value, MIN_BPM), MAX_BPM));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <h1 className="font-['Exo_2'] text-4xl font-bold mb-8 text-purple-300 animate-pulse"
          style={{
            textShadow: `
              0 0 7px rgba(168, 85, 247, 0.5),
              0 0 10px rgba(168, 85, 247, 0.5),
              0 0 21px rgba(168, 85, 247, 0.5),
              0 0 42px rgba(168, 85, 247, 0.4)
            `
          }}>
        Line Tunes
      </h1>
      
      <div className="w-full max-w-4xl mb-8 overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center mb-2">
              <div className="w-8 h-8 mr-4 rounded bg-purple-600 flex items-center justify-center">
                <img
                  src={`/icons/${DRUMS_CONFIG[rowIndex].type}.png`}
                  alt={DRUMS_CONFIG[rowIndex].type}
                  className="w-8 h-8 object-contain p-1"
                />
              </div>
              
              <div className="flex gap-1">
                {row.map((cell, colIndex) => (
                  <button
                    key={colIndex}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`w-8 h-8 rounded transition-all duration-100
                      ${colIndex % 4 === 0 ? 'border-l-2 border-purple-500/30' : ''}
                      ${!cell.isActive ? 'bg-gray-800 hover:bg-gray-700' : ''}`}
                    style={{
                      backgroundColor: cell.isActive ? DRUMS_CONFIG[rowIndex].color : undefined,
                      boxShadow: cell.isLit 
                        ? '0 0 15px rgba(56, 189, 248, 0.8), inset 0 0 5px rgba(56, 189, 248, 0.5)' 
                        : cell.isActive 
                          ? `0 0 5px ${DRUMS_CONFIG[rowIndex].color}` 
                          : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
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
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => handleBPMChange(parseInt(e.target.value))}
              className="w-32 accent-purple-600"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={(e) => handleBPMChange(parseInt(e.target.value) || DEFAULT_BPM)}
                className="w-16 px-2 py-1 text-sm text-white bg-gray-800 rounded border border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <span className="text-white text-sm">BPM</span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleStepsChange(Math.max(MIN_STEPS, steps - 4))}
              disabled={steps <= MIN_STEPS}
              className="p-1 text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white text-sm w-16 text-center">{steps} steps</span>
            <button
              onClick={() => handleStepsChange(Math.min(MAX_STEPS, steps + 4))}
              disabled={steps >= MAX_STEPS}
              className="p-1 text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSequencer;