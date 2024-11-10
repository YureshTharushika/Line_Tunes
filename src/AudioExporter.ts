import { DrumSound } from './AudioSynthesizer';
import { AudioSynthesizer } from './AudioSynthesizer';

interface GridCell {
  isActive: boolean;
  type: DrumSound;
  isLit: boolean;
}

export class AudioExporter {
    static async exportToWav(
        grid: GridCell[][],
        bpm: number,
        steps: number,
        drumsConfig: { type: DrumSound; color: string }[]
      ): Promise<void> {
        // Validate pattern
        const hasActiveCell = grid.some(row => row.some(cell => cell.isActive));
        
        if (!hasActiveCell) {
          throw new Error('No pattern to export! Please create a beat pattern first.');
        }
    
        // Calculate duration in seconds
        const stepDuration = 60 / bpm / 2; // Duration of one step in seconds (divided by 2 for 8th notes)
        const totalDuration = stepDuration * steps; // Total duration of the pattern
        const sampleRate = 44100;
        
        // Create offline context with exact duration
        const offlineCtx = new (window.OfflineAudioContext || window.OfflineAudioContext)(
          2, // stereo output
          Math.ceil(sampleRate * totalDuration), // exact number of samples needed
          sampleRate
        );
    
        try {
          // Initialize synthesizer with offline context and wait for samples to load
          const offlineSynth = new AudioSynthesizer(offlineCtx);
          await offlineSynth.loadSamples();
    
          // Schedule all sounds
          grid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (cell.isActive) {
                const startTime = colIndex * stepDuration;
                offlineSynth.playSound(drumsConfig[rowIndex].type, startTime);
              }
            });
          });
    
          // Render audio
          const renderedBuffer = await offlineCtx.startRendering();
          const wavBlob = await AudioExporter.createWavBlob(renderedBuffer);
          AudioExporter.downloadBlob(wavBlob, `line-tunes-beat-${bpm}bpm-${steps}steps-${Date.now()}.wav`);
    
        } catch (error) {
          console.error('Error exporting audio:', error);
          throw new Error('Failed to export audio. Please try again.');
        }
      }

  private static async createWavBlob(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels;
    const wav = new Float32Array(length);
    
    // Interleave channels
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        wav[i * numberOfChannels + channel] = channelData[i];
      }
    }

    // Create WAV file
    const wavBuffer = new ArrayBuffer(44 + wav.length * 2);
    const view = new DataView(wavBuffer);

    // Write WAV header
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + wav.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, wav.length * 2, true);

    // Write audio data
    const floatTo16Bit = (sample: number) => {
      return Math.max(-32768, Math.min(32767, Math.round(sample * 32768)));
    };

    let offset = 44;
    for (let i = 0; i < wav.length; i++) {
      view.setInt16(offset, floatTo16Bit(wav[i]), true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  private static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}