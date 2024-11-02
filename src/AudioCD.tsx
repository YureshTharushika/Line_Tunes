import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Minus } from 'lucide-react';

interface SoundType {
  id: string;
  name: string;
  color: string;
}

interface Path {
  size: number;
}

interface Dot {
  pathIndex: number;
  angle: number;
  type: string;
}

const SOUND_TYPES: SoundType[] = [
  { id: 'kick', name: 'Kick', color: 'bg-red-500' },
  { id: 'snare', name: 'Snare', color: 'bg-blue-500' },
  { id: 'hihat', name: 'Hi-hat', color: 'bg-green-500' },
  { id: 'clap', name: 'Clap', color: 'bg-yellow-500' },
  { id: 'noteC', name: 'Note C', color: 'bg-purple-500' },
  { id: 'noteD', name: 'Note D', color: 'bg-pink-500' },
  { id: 'noteE', name: 'Note E', color: 'bg-indigo-500' },
  { id: 'noteF', name: 'Note F', color: 'bg-orange-500' }
];

const AudioCD: React.FC = () => {
  const [paths, setPaths] = useState<Path[]>([{ size: 100 }]);
  const [dots, setDots] = useState<Dot[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  const [selectedDotType, setSelectedDotType] = useState<string>('kick');
  const [currentAngle, setCurrentAngle] = useState<number>(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const addPath = (): void => {
    if (paths.length < 10) {
      setPaths([...paths, {
        size: (paths.length + 1) * 100
      }]);
    }
  };

  const removePath = (): void => {
    if (paths.length > 1) {
      setPaths(paths.slice(0, -1));
      setDots(dots.filter(dot => dot.pathIndex < paths.length - 1));
      if (selectedPathIndex && selectedPathIndex >= paths.length - 1) {
        setSelectedPathIndex(null);
      }
    }
  };

  const addDot = (): void => {
    if (selectedPathIndex !== null) {
      const dotsInPath = dots.filter(d => d.pathIndex === selectedPathIndex);
      if (dotsInPath.length < 16) {
        // Calculate the angle for the new dot starting from top (270 degrees)
        // and evenly space them around the circle
        const angleStep = 360 / 16; // 16 possible positions
        const newAngle = 270 + (dotsInPath.length * angleStep);
        
        setDots([...dots, {
          pathIndex: selectedPathIndex,
          angle: newAngle % 360, // Keep angle between 0-360
          type: selectedDotType
        }]);
      }
    }
  };

  const removeDot = (): void => {
    if (selectedPathIndex !== null) {
      const pathDots = dots.filter(d => d.pathIndex === selectedPathIndex);
      if (pathDots.length > 0) {
        const newDots = [...dots];
        // Find the last dot in the selected path
        for (let i = newDots.length - 1; i >= 0; i--) {
          if (newDots[i].pathIndex === selectedPathIndex) {
            newDots.splice(i, 1);
            break;
          }
        }
        setDots(newDots);
      }
    }
  };

  const stopPlayback = (): void => {
    setIsPlaying(false);
    setCurrentAngle(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;
  };

  const playSound = (type: string): void => {
    console.log(`Playing sound: ${type}`);
  };

  const animate = (timestamp: number): void => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    
    const newAngle = (elapsed / 2000) * 360 % 360;
    setCurrentAngle(newAngle);

    dots.forEach(dot => {
      const dotPosition = (dot.angle + newAngle) % 360;
      if (Math.abs(dotPosition - 270) < 5) { // Changed to 270 to match top position
        playSound(dot.type);
      }
    });

    if (elapsed < 60000) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      stopPlayback();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else if (!isPlaying && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Handle circle click with z-index consideration
  const handleCircleClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event bubbling
    setSelectedPathIndex(selectedPathIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Sound Types */}
      <div className="mb-4 flex gap-2">
        {SOUND_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedDotType(type.id)}
            className={`px-3 py-1 rounded ${type.color} text-white 
              ${selectedDotType === type.id ? 'ring-2 ring-black' : ''}`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Playback Controls */}
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => setIsPlaying(true)}
          disabled={isPlaying}
          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          <Play className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsPlaying(false)}
          disabled={!isPlaying}
          className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          <Pause className="w-6 h-6" />
        </button>
        <button
          onClick={stopPlayback}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <Square className="w-6 h-6" />
        </button>
      </div>

      {/* Circle Controls */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-gray-700">Circles:</span>
        <button
          onClick={addPath}
          disabled={paths.length >= 10}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={removePath}
          disabled={paths.length <= 1}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Minus className="w-6 h-6" />
        </button>
      </div>

      {/* Dot Controls */}
      <div className="mb-4 flex items-center gap-4">
        <span className="text-gray-700">Dots:</span>
        <button
          onClick={addDot}
          disabled={selectedPathIndex === null}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={removeDot}
          disabled={selectedPathIndex === null}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <Minus className="w-6 h-6" />
        </button>
      </div>

      {/* Circles and Dots */}
      <div className="relative w-[600px] h-[600px]">
        {/* Circular paths - Render in reverse to handle z-index properly */}
        {[...paths].reverse().map((path, reversedIndex) => {
          const i = paths.length - 1 - reversedIndex; // Convert back to original index
          return (
            <div
              key={i}
              onClick={(e) => handleCircleClick(i, e)}
              className={`absolute border-2 rounded-full cursor-pointer transition-all
                ${selectedPathIndex === i ? 'border-blue-500' : 'border-gray-300'}`}
              style={{
                width: `${path.size}px`,
                height: `${path.size}px`,
                left: `${(600 - path.size) / 2}px`,
                top: `${(600 - path.size) / 2}px`,
                zIndex: paths.length - i, // Higher z-index for inner circles
              }}
            />
          );
        })}

        {/* Dots */}
        {dots.map((dot, i) => {
          const radius = paths[dot.pathIndex].size / 2;
          const angle = (dot.angle + currentAngle) * (Math.PI / 180);
          return (
            <div
              key={i}
              className={`absolute w-4 h-4 rounded-full ${
                SOUND_TYPES.find(t => t.id === dot.type)?.color || ''
              }`}
              style={{
                left: `${300 + radius * Math.cos(angle) - 8}px`,
                top: `${300 + radius * Math.sin(angle) - 8}px`,
                zIndex: paths.length + 1, // Ensure dots are always on top
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AudioCD;