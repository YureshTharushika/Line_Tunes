import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AudioCD from './AudioCD';

function App() {
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Atomic Tunes</h1>
      </header>
      <main>
        <AudioCD />
      </main>
    </div>
  );
}

export default App
