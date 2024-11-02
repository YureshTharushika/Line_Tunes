
interface SoundType {
    id: string;
    name: string;
    color: string;
  }
export const SOUND_TYPES: SoundType[] = [
    { id: 'kick', name: 'Kick', color: 'bg-red-500' },
    { id: 'snare', name: 'Snare', color: 'bg-blue-500' },
    { id: 'hihat', name: 'Hi-hat', color: 'bg-green-500' },
    { id: 'clap', name: 'Clap', color: 'bg-yellow-500' },
    { id: 'noteC', name: 'Note C', color: 'bg-purple-500' },
    { id: 'noteD', name: 'Note D', color: 'bg-pink-500' },
    { id: 'noteE', name: 'Note E', color: 'bg-indigo-500' },
    { id: 'noteF', name: 'Note F', color: 'bg-orange-500' }
  ];