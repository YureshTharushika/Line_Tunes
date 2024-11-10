# Line Tunes

Line Tunes is a web-based drum sequencer application that allows users to create, play, and export drum patterns. The application features multiple drum sounds, adjustable sequence length, and customizable playback speed.

🎵 [Live Demo](https://linetunes.netlify.app/)

## Features

- **Multi-Sound Sequencer**: Create patterns using multiple drum sounds including kick, snare, hi-hat, clap, cowbell, crash, open hat, percussion, and tom.
- **Dynamic Grid**: Adjustable sequence length from 4 to 64 steps, with visual distinction every 4 steps.
- **Playback Controls**: Play, pause, and stop functionality with adjustable BPM (60-400).
- **Visual Feedback**: Real-time visual feedback with color-coded sounds and neon glow playback indicator.
- **Responsive Design**: Fully responsive interface with custom-styles.
- **Pattern Export**: Export your beats as WAV files for use in other applications.

## Technologies Used

- **React**: Frontend framework for building the user interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **TailwindCSS**: Utility-first CSS framework for styling
- **Web Audio API**: For sound synthesis and playback
- **Lucide Icons**: For UI icons
- **Netlify**: For hosting and deployment

## Getting Started

To get a local copy of this project running, follow these steps:

1. **Clone the Repository**:

```bash
git clone https://github.com/YureshTharushika/Line_Tunes.git
```

2. **Navigate to the Project Directory**:

```bash
cd line-tunes
```

3. **Install Dependencies**:

```bash
npm install
```

4. **Run the Application**:

```bash
npm run dev
```

5. **Open your Browser** and navigate to `http://localhost:5173` to view the application.

## Project Structure

- `src/components/` - React components
- `src/AudioSynthesizer.ts` - Audio synthesis and playback logic
- `src/AudioExporter.ts` - WAV file export functionality
- `public/icons/` - Drum sound icons
- `public/samples/` - Audio samples for drum sounds
- `src/styles/` - CSS styles and custom scrollbar

## Usage

1. **Creating Patterns**:

   - Click on any grid cell to toggle a sound at that position
   - Each row represents a different drum sound
   - Active cells will play their corresponding sound during playback
   - Clear all patterns using the clear button

2. **Playback Controls**:

   - Use the play/pause/stop buttons to control playback
   - Adjust tempo using the BPM control (60-400 BPM)
   - Change sequence length using the step controls (4-64 steps)

3. **Visual Elements**:

   - Each sound type has its unique color
   - Playing position is indicated by a neon blue glow
   - Grid sections are visually separated every 4 steps

4. **Exporting**:
   - Click the download button to export your pattern
   - Saves as a WAV file with pattern length based on BPM and steps
   - File name includes BPM and step count for reference

## Contributing

If you would like to contribute to this project, please follow these guidelines:

1. **Fork the Repository** and create a new branch for your feature or bug fix
2. **Make Your Changes** and test them thoroughly
3. **Submit a Pull Request** detailing the changes you have made

## Acknowledgements

- **React**: For providing an efficient library for building user interfaces
- **Web Audio API**: For enabling high-quality audio synthesis in the browser
- **TailwindCSS**: For making styling and responsive design easier
- **Lucide**: For providing beautiful and customizable icons
- **Flaticons**: For providing beautiful drum icons
- **Netlify**: For hosting and continuous deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
