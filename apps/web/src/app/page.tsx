"use client";

import { useState, useEffect } from "react";
import usePartySocket from "partysocket/react";
import { GameState, GameMessage } from "@partygames/types";

export default function Home() {
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  const [state, setState] = useState<GameState | null>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: room,
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "sync") {
        setState(data.state);
      }
    },
  });

  const joinGame = () => {
    if (name && room) {
      socket.send(JSON.stringify({ type: "join", name }));
      setJoined(true);
    }
  };

  const sendClue = (clue: string) => {
    socket.send(JSON.stringify({ type: "setClue", clue }));
  };

  const updateDial = (pos: number) => {
    socket.send(JSON.stringify({ type: "setDial", position: pos }));
  };

  const submitGuess = () => {
    socket.send(JSON.stringify({ type: "submitGuess" }));
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">Wavelength</h1>
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room Code"
            className="w-full p-3 rounded bg-slate-700 border border-slate-600 focus:outline-none focus:border-blue-500"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button
            onClick={joinGame}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-colors"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  if (!state) return <div className="p-8 text-white">Connecting...</div>;

  const me = state.players.find((p) => p.id === socket.id);
  const isTurn = state.turnTeam === me?.team;
  const isPsychic = me?.role === "psychic";

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-blue-400">Wavelength</h1>
        <div className="flex space-x-8">
          <div className="text-center">
            <p className="text-sm text-red-400 uppercase tracking-wider">Red Team</p>
            <p className="text-2xl font-bold">{state.scores.red}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-blue-400 uppercase tracking-wider">Blue Team</p>
            <p className="text-2xl font-bold">{state.scores.blue}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-12">
        <section className="text-center space-y-4">
          <div className="flex justify-center space-x-12 items-center">
            <span className="text-xl font-medium text-slate-400">{state.leftSpectrum}</span>
            <div className="h-2 w-48 bg-slate-700 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 w-full"></div>
            </div>
            <span className="text-xl font-medium text-slate-400">{state.rightSpectrum}</span>
          </div>
          {state.clue && (
            <div className="text-3xl font-bold text-white italic">"{state.clue}"</div>
          )}
        </section>

        <section className="relative h-64 flex flex-col items-center justify-center">
          <div className="w-full h-8 bg-slate-800 rounded-full relative overflow-hidden mb-4">
            {/* Target Area (only visible for Psychic or in Reveal phase) */}
            {(isPsychic || state.phase === 'reveal') && (
              <div 
                className="absolute h-full bg-yellow-400 opacity-50 blur-sm"
                style={{ 
                  left: `${state.targetPosition - 5}%`, 
                  width: '10%' 
                }}
              />
            )}
            
            {/* Dial Handle */}
            <div 
              className="absolute h-full w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 transition-all duration-300"
              style={{ left: `${state.dialPosition}%`, transform: 'translateX(-50%)' }}
            />
          </div>
          
          <input 
            type="range" 
            min="0" 
            max="100" 
            className="w-full accent-blue-500"
            value={state.dialPosition}
            disabled={!isTurn || isPsychic || state.phase !== 'guessing'}
            onChange={(e) => updateDial(Number(e.target.value))}
          />
        </section>

        <section className="text-center space-y-6">
          {state.phase === 'clue' && isTurn && isPsychic && (
             <div className="flex flex-col items-center space-y-4">
                <p className="text-lg">You are the Psychic! Enter a clue for the spectrum.</p>
                <div className="flex space-x-2">
                    <input 
                        type="text" 
                        id="clueInput"
                        placeholder="Your Clue" 
                        className="p-2 rounded bg-slate-700 border border-slate-600"
                    />
                    <button 
                        onClick={() => sendClue((document.getElementById('clueInput') as HTMLInputElement).value)}
                        className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-500"
                    >
                        Send
                    </button>
                </div>
             </div>
          )}

          {state.phase === 'guessing' && isTurn && !isPsychic && (
            <button 
                onClick={submitGuess}
                className="bg-green-600 px-8 py-3 rounded-full text-xl font-bold hover:bg-green-500 transition-transform active:scale-95"
            >
                Submit Guess
            </button>
          )}

          {state.phase === 'reveal' && (
             <button 
                onClick={() => socket.send(JSON.stringify({ type: 'nextRound' }))}
                className="bg-slate-700 px-8 py-3 rounded-full text-xl font-bold hover:bg-slate-600"
            >
                Next Round
            </button>
          )}

          <div className="pt-8 text-slate-500">
            <p>Team: <span className={me?.team === 'red' ? 'text-red-400' : 'text-blue-400'}>{me?.team}</span></p>
            <p>Role: <span className="text-slate-300 capitalize">{me?.role}</span></p>
          </div>
        </section>
      </main>
    </div>
  );
}
