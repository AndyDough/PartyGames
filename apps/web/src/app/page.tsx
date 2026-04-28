"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";
import { GameState } from "@partygames/types";

function Game({ room, name, mode, onExit }: { room: string; name: string; mode: 'join' | 'create', onExit: (msg?: string) => void }) {
  const [state, setState] = useState<GameState | null>(null);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999",
    room: room,
    onOpen() {
      socket.send(JSON.stringify({ type: "join", name, mode }));
    },
    onMessage(event) {
      const data = JSON.parse(event.data);
      if (data.type === "sync") {
        setState(data.state);
      } else if (data.type === "error") {
        onExit(data.message);
      }
    },
  });

  if (!state) return <div className="p-8 text-white flex justify-center items-center min-h-screen bg-slate-900">Connecting...</div>;

  const me = state.players.find((p) => p.id === socket.id);
  const isTurn = state.turnTeam === me?.team;
  const isPsychic = me?.role === "psychic";
  const isCreator = state.players[0]?.id === socket.id;

  if (state.phase === 'lobby') {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center justify-center">
            <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-blue-400">Lobby</h2>
                    <p className="text-slate-400">Share this code with friends:</p>
                    <div className="text-5xl font-mono font-black tracking-widest bg-slate-700 py-4 rounded-lg border-2 border-slate-600">
                        {room}
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-slate-700 pb-2">Players ({state.players.length})</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {state.players.map((p) => (
                            <div key={p.id} className="flex items-center space-x-2 bg-slate-700 p-3 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${p.team === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <span className="font-medium">{p.name} {p.id === socket.id ? '(You)' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {isCreator ? (
                    <button
                        onClick={() => socket.send(JSON.stringify({ type: 'startGame' }))}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-all text-xl shadow-lg"
                    >
                        Start Game
                    </button>
                ) : (
                    <div className="text-center animate-pulse text-slate-400 italic">
                        Waiting for the creator to start...
                    </div>
                )}
            </div>
            <button 
                onClick={() => onExit()}
                className="mt-8 text-slate-500 hover:text-slate-300 underline"
            >
                Leave Room
            </button>
        </div>
    );
  }

  const sendClue = (clue: string) => {
    socket.send(JSON.stringify({ type: "setClue", clue }));
  };

  const updateDial = (pos: number) => {
    socket.send(JSON.stringify({ type: "setDial", position: pos }));
  };

  const submitGuess = () => {
    socket.send(JSON.stringify({ type: "submitGuess" }));
  };

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
                        onClick={() => {
                          const input = document.getElementById('clueInput') as HTMLInputElement;
                          if (input.value) sendClue(input.value);
                        }}
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

export default function Home() {
  const [step, setStep] = useState<"home" | "create-name" | "join-code" | "join-name">("home");
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState<"join" | "create">("join");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const generateRoomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartCreate = () => {
    setMode("create");
    setRoom(generateRoomCode());
    setStep("create-name");
    setError(null);
  };

  const handleStartJoin = () => {
    setMode("join");
    setRoom("");
    setStep("join-code");
    setError(null);
  };

  const validateRoom = async () => {
    if (!room || room.length < 4) {
      setError("Please enter a 4-character room code");
      return;
    }

    setIsValidating(true);
    setError(null);
    try {
      const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      const res = await fetch(`${protocol}://${host}/parties/main/${room}`);
      const data = await res.json();
      
      if (data.exists) {
        setStep("join-name");
      } else {
        setError("Room not found. Make sure the code is correct.");
      }
    } catch (err) {
      setError("Could not connect to server. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const joinGame = () => {
    if (name && room) {
      setJoined(true);
      setError(null);
    }
  };

  const handleExit = (errMsg?: string) => {
    setJoined(false);
    setStep("home");
    setName("");
    setRoom("");
    if (errMsg) {
      setError(errMsg);
    }
  };

  if (joined) {
    return <Game room={room} name={name} mode={mode} onExit={handleExit} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <h1 className="text-5xl font-black mb-12 text-blue-400 tracking-tighter">WAVELENGTH</h1>
      
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-8 border border-slate-700">
        {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm text-center animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
            </div>
        )}

        {step === "home" && (
          <div className="space-y-4">
            <button
              onClick={handleStartCreate}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 text-xl shadow-lg shadow-blue-900/20"
            >
              Create Room
            </button>
            <button
              onClick={handleStartJoin}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 text-xl border border-slate-600"
            >
              Join Room
            </button>
          </div>
        )}

        {step === "create-name" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Enter your name"
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name && joinGame()}
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep("home")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={joinGame}
                disabled={!name}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Create & Join
              </button>
            </div>
          </div>
        )}

        {step === "join-code" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Room Code</label>
              <input
                type="text"
                autoFocus
                maxLength={4}
                placeholder="ABCD"
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-3xl text-center font-mono font-black uppercase tracking-widest"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && room.length === 4 && validateRoom()}
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep("home")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={validateRoom}
                disabled={room.length < 4 || isValidating}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                {isValidating ? "Checking..." : "Next"}
              </button>
            </div>
          </div>
        )}

        {step === "join-name" && (
          <div className="space-y-6">
            <div className="text-center bg-slate-900/50 py-3 rounded-xl border border-slate-700/50 mb-2">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">Joining Room</span>
              <div className="text-2xl font-mono font-black text-blue-400">{room}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Enter your name"
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name && joinGame()}
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setStep("join-code")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={joinGame}
                disabled={!name}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Join Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
