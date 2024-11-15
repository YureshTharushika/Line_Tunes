export type DrumSound = 'clap' | 'cowbell' | 'crash' | 'hihat' | 'kick' | 'openhat' | 'perc' | 'snare' | 'tom';
export type NoteSound = 'noteC' | 'noteD' | 'noteE' | 'noteF';
export type SoundType = DrumSound | NoteSound;

type NoteFrequencies = {
  [Key in NoteSound]: number;
};

export class AudioSynthesizer {
  private audioContext: AudioContext | OfflineAudioContext;
  private samples: { [Key in DrumSound]?: AudioBuffer } = {};
  
  private readonly noteFrequencies: NoteFrequencies = {
    noteC: 261.63, // C4
    noteD: 293.66, // D4
    noteE: 329.63, // E4
    noteF: 349.23  // F4
  };

  constructor(context?: AudioContext | OfflineAudioContext) {
    this.audioContext = context || new AudioContext();
    this.loadSamples();
  }

  public async loadSamples(): Promise<void> {
    const sampleUrls: { [Key in DrumSound]: string } = {
      clap: '/samples/clap.wav',
      cowbell: '/samples/cowbell.wav',
      crash: '/samples/crash.wav',
      hihat: '/samples/hihat.wav',
      kick: '/samples/kick.wav',
      openhat: '/samples/openhat.wav',
      perc: '/samples/perc.wav',
      snare: '/samples/snare.wav',
      tom: '/samples/tom.wav'
    };

    for (const [name, url] of Object.entries(sampleUrls) as [DrumSound, string][]) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.samples[name] = audioBuffer;
      } catch (error) {
        console.error(`Failed to load sample ${name}:`, error);
      }
    }
  }

  private createOscillator(frequency: number, duration: number = 0.2): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playDrumSample(sampleName: DrumSound, startTime?: number): void {
    const sample = this.samples[sampleName];
    if (!sample) {
      console.warn(`Sample ${sampleName} not loaded`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = sample;
    gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    source.start(startTime !== undefined ? startTime : this.audioContext.currentTime);
  }

  playSound(type: string, startTime?: number): void {
    // Type assertion to SoundType after validation
    if (!this.isValidSoundType(type)) {
      console.warn(`Invalid sound type: ${type}`);
      return;
    }

    // Resume audio context if it's suspended (needed for browsers)
    if (this.audioContext instanceof AudioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Handle drum sounds
    if (this.isDrumSound(type)) {
      this.playDrumSample(type, startTime);
      return;
    }

    // Handle musical notes
    if (this.isNoteSound(type)) {
      this.createOscillator(this.noteFrequencies[type]);
    }
  }

  // Type guards and validators
  private isValidSoundType(type: string): type is SoundType {
    return this.isDrumSound(type as DrumSound) || this.isNoteSound(type as NoteSound);
  }

  private isDrumSound(type: string): type is DrumSound {
    return ['clap', 'cowbell', 'crash', 'hihat', 'kick', 'openhat', 'perc', 'snare', 'tom'].includes(type);
  }

  private isNoteSound(type: string): type is NoteSound {
    return ['noteC', 'noteD', 'noteE', 'noteF'].includes(type);
  }

  // Clean up method
  dispose(): void {
    if (this.audioContext instanceof AudioContext) {
      this.audioContext.close();
    }
  }
}