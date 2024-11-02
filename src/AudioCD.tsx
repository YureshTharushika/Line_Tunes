import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Plus, Minus } from 'lucide-react';
import { AudioSynthesizer, DrumSound, NoteSound } from './AudioSynthesizer';

interface SoundTypeInfo {
  id: DrumSound | NoteSound;  // Using the exported types from AudioSynthesizer
  name: string;
  color: string;
}

interface Path {
  size: number;
}

interface Dot {
  id: string;
  pathIndex: number;
  angle: number;
  type: DrumSound | NoteSound; 
}

const SOUND_TYPES: SoundTypeInfo[] = [
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
  const [selectedDotType, setSelectedDotType] = useState<DrumSound | NoteSound>('kick');
  const [currentAngle, setCurrentAngle] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [draggedDotId, setDraggedDotId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);
  const lastTriggeredRef = useRef<{[key: string]: number}>({});
  const synthRef = useRef<AudioSynthesizer | null>(null);


  // Helper function to get closest point on circle
  const getClosestPointOnCircle = (
    mouseX: number, 
    mouseY: number, 
    centerX: number, 
    centerY: number, 
    radius: number,
    offsetX = 0,
    offsetY = 0
  ) => {
    // Adjust mouse position by the offset
    const adjustedMouseX = mouseX - offsetX;
    const adjustedMouseY = mouseY - offsetY;
    
    // Vector from center to adjusted mouse position
    const dx = adjustedMouseX - centerX;
    const dy = adjustedMouseY - centerY;
    
    // Calculate the distance from center to mouse
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If mouse is at center, default to top of circle
    if (distance === 0) {
      return { x: centerX, y: centerY - radius, angle: 270 };
    }
    
    // Scale the vector to the radius length
    const scale = radius / distance;
    const closestX = centerX + dx * scale;
    const closestY = centerY + dy * scale;
    
    // Calculate angle in degrees, adjusted to start from top
    let angle = Math.atan2(closestY - centerY, closestX - centerX) * (180 / Math.PI);
    angle = (angle + 450) % 360;
    
    return { x: closestX, y: closestY, angle };
  };

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
        const angleStep = 360 / 16;
        const newAngle = 270 + (dotsInPath.length * angleStep);
        
        setDots([...dots, {
          id: `dot-${Date.now()}-${Math.random()}`,
          pathIndex: selectedPathIndex,
          angle: newAngle % 360,
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

  const handleDotDragStart = (dotId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!containerRef.current) return;
    
    const dot = dots.find(d => d.id === dotId);
    if (!dot) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = paths[dot.pathIndex].size / 2;
    
    // Calculate dot's current position
    const angle = dot.angle * (Math.PI / 180);
    const dotCenterX = centerX + radius * Math.cos(angle);
    const dotCenterY = centerY + radius * Math.sin(angle);
    
    // Calculate offset between click position and dot center
    setDragOffset({
      x: event.clientX - dotCenterX,
      y: event.clientY - dotCenterY
    });
    
    setDraggedDotId(dotId);
  };

  const handleDotDragEnd = () => {
    setDraggedDotId(null);
    setDragOffset(null);
  };


  const handleContainerMouseMove = (event: React.MouseEvent) => {
    if (!draggedDotId || !containerRef.current || !dragOffset) return;

    const dot = dots.find(d => d.id === draggedDotId);
    if (!dot) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = paths[dot.pathIndex].size / 2;
    
    // Get closest point using the drag offset
    const closestPoint = getClosestPointOnCircle(
      event.clientX,
      event.clientY,
      centerX,
      centerY,
      radius,
      dragOffset.x,
      dragOffset.y
    );
    
    // Update dot position
    setDots(dots.map(d => {
      if (d.id === draggedDotId) {
        return { ...d, angle: closestPoint.angle };
      }
      return d;
    }));
  };

  const playSound = (type: string): void => {
    synthRef.current?.playSound(type);
  };

  const animate = (timestamp: number): void => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    
    const newAngle = (elapsed / 2000) * 360 * speed % 360;
    setCurrentAngle(newAngle);

    // Check each dot for sound triggering
    dots.forEach(dot => {
      const dotPosition = (dot.angle + newAngle) % 360;
      const dotId = dot.id;
      
      // Check if dot has crossed the trigger point (270 degrees)
      // Only trigger if we haven't triggered in the last 270-90 degrees
      if (Math.abs(dotPosition - 270) < 5) {
        const lastTriggered = lastTriggeredRef.current[dotId] || 0;
        const fullRotation = 360 / speed; // Adjust for playback speed
        
        // Only trigger if we haven't triggered recently
        if ((elapsed - lastTriggered) > (fullRotation * 0.75)) {
          playSound(dot.type);
          lastTriggeredRef.current[dotId] = elapsed;
        }
      }
    });

    if (elapsed < 60000) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      stopPlayback();
    }
  };

  // Reset the trigger tracking when playback stops
  const stopPlayback = (): void => {
    setIsPlaying(false);
    setCurrentAngle(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;
    lastTriggeredRef.current = {};
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
  }, [isPlaying, speed]);

  useEffect(() => {
    synthRef.current = new AudioSynthesizer();
    
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const handleCircleClick = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
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

      {/* Playback Controls and Speed Slider */}
      <div className="mb-4 space-y-4">
        <div className="flex gap-4">
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
        
        {/* Speed Control */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Speed:</span>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-48"
          />
          <span className="text-sm text-gray-700">{speed.toFixed(1)}x</span>
        </div>
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
      <div 
        ref={containerRef}
        className="relative w-[600px] h-[600px]"
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleDotDragEnd}
        onMouseLeave={handleDotDragEnd}
      >
        {/* Circular paths */}
        {[...paths].reverse().map((path, reversedIndex) => {
          const i = paths.length - 1 - reversedIndex;
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
                zIndex: paths.length - i,
              }}
            />
          );
        })}

        {/* Dots */}
        {dots.map((dot) => {
          const radius = paths[dot.pathIndex].size / 2;
          const angle = (dot.angle + currentAngle) * (Math.PI / 180);
          return (
            <div
              key={dot.id}
              onMouseDown={(e) => handleDotDragStart(dot.id, e)}
              className={`absolute w-4 h-4 rounded-full ${
                SOUND_TYPES.find(t => t.id === dot.type)?.color || ''
              } cursor-move ${draggedDotId === dot.id ? 'ring-2 ring-white' : ''}`}
              style={{
                left: `${300 + radius * Math.cos(angle) - 8}px`,
                top: `${300 + radius * Math.sin(angle) - 8}px`,
                zIndex: paths.length + 1,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AudioCD;