import './App.css'
import AudioSequencer from './AudioSequencer';

function App() {
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Line Tunes</h1>
      </header>
      <main>
        <AudioSequencer />
      </main>
    </div>
  );
}

export default App
