"use client";

import { useState } from "react";
import usePartySocket from "partysocket/react";
import { GameState } from "@partygames/types";
import { Avatar, AVATARS } from "@/components/Avatar";
import { WavelengthDial } from "@/components/WavelengthDial";

function Game({
  room,
  name,
  mode,
  onExit,
}: {
  room: string;
  name: string;
  mode: "join" | "create";
  onExit: (msg?: string) => void;
}) {
  const [state, setState] = useState<GameState | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (!state)
    return (
      <div className="p-8 text-white flex justify-center items-center min-h-screen bg-slate-900">
        Connecting...
      </div>
    );

  const me = state.players.find((p) => p.id === socket.id);
  const isPsychic = me?.role === "psychic";
  const isCreator = state.players[0]?.id === socket.id;
  const isSliderLocked =
    state.sliderController !== null && state.sliderController !== socket.id;
  const sliderControllerName = state.players.find(
    (p) => p.id === state.sliderController,
  )?.name;

  if (state.phase === "lobby") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
        {/* Header with Grid */}
        <div className="h-[25vh] bg-grid relative flex flex-col items-center justify-center border-b border-white/10 pt-8">
          <button
            onClick={() => onExit()}
            className="absolute top-6 left-6 text-[10px] font-black tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity uppercase italic flex items-center"
          >
            <span className="mr-2 text-base">←</span> Leave Room
          </button>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-1 italic">
            Starter
          </h2>
          <button 
            onClick={handleCopy}
            className="flex items-center space-x-2 text-white/50 group hover:text-white transition-all active:scale-95"
          >
            <p className="text-[11px] font-black uppercase tracking-widest">
              {copied ? "Copied!" : "Your room code is"}{" "}
              <span className="text-white border-b-2 border-white/20 ml-1 group-hover:border-white transition-colors">
                {room}
              </span>
            </p>
            {!copied && (
                <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                </svg>
            )}
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-10 p-6">
          <div className="relative flex items-center justify-center w-full max-w-sm">
            <button 
              onClick={() => {
                const current = (me as any)?.avatarIndex || 0;
                const next = (current - 1 + AVATARS.length) % AVATARS.length;
                socket.send(JSON.stringify({ type: 'setAvatar', avatarIndex: next }));
              }}
              className="absolute left-0 p-4 opacity-20 hover:opacity-100 transition-opacity z-10"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="relative group">
              {isCreator && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-xl z-20">
                  Host
                </div>
              )}
              <div className="w-44 h-44 rounded-full border-[6px] border-white flex items-center justify-center bg-zinc-950 overflow-hidden shadow-2xl relative">
                {/* Minimalist B&W Avatar */}
                <div className="absolute inset-0 bg-white/5 animate-pulse"></div>
                <Avatar index={(me as any)?.avatarIndex || 0} className="w-44 h-44" />
              </div>
            </div>

            <button 
              onClick={() => {
                const current = (me as any)?.avatarIndex || 0;
                const next = (current + 1) % AVATARS.length;
                socket.send(JSON.stringify({ type: 'setAvatar', avatarIndex: next }));
              }}
              className="absolute right-0 p-4 opacity-20 hover:opacity-100 transition-opacity z-10"
            >
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-2xl font-black tracking-[0.1em] uppercase italic">
              {name}
            </p>
          </div>

          {/* Player Dots */}
          <div className="grid grid-cols-5 gap-4 max-w-xs">
            {state.players.map((p) => (
              <div
                key={p.id}
                className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden ${p.id === socket.id ? "bg-white border-white" : "bg-transparent border-white/20 opacity-50"}`}
              >
                {p.id === socket.id ? (
                  <Avatar index={(p as any).avatarIndex || 0} className="w-8 h-8 brightness-0" />
                ) : (
                  <Avatar index={(p as any).avatarIndex || 0} className="w-8 h-8 opacity-80" />
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - state.players.length) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 border-white/5 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 bg-white/5 rounded-full" />
                </div>
              ),
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 pb-12 space-y-8 bg-gradient-to-t from-black via-black to-transparent">
          {isCreator ? (
            <button
              onClick={() => socket.send(JSON.stringify({ type: "startGame" }))}
              className="w-full max-w-md mx-auto block bg-white text-black font-black py-6 rounded-full transition-all text-xl uppercase tracking-[0.3em] active:scale-[0.97] hover:bg-zinc-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Start Game
            </button>
          ) : (
            <div className="text-center animate-pulse py-6">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">
                Waiting for host...
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (state.phase === "gameover") {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-lg space-y-12 text-center">
          <h2 className="text-6xl font-black italic uppercase tracking-tighter">
            GAME OVER
          </h2>
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black opacity-40">
              Final Score
            </p>
            <p className="text-9xl font-black">{state.score}</p>
          </div>
          <div className="py-8 border-y border-white/10">
            <p className="text-sm font-black uppercase tracking-widest opacity-60 italic">
              Played {state.totalRounds} rounds with {state.players.length}{" "}
              players.
            </p>
          </div>
          {isCreator && (
            <button
              onClick={() =>
                socket.send(JSON.stringify({ type: "returnToLobby" }))
              }
              className="w-full bg-white text-black font-black py-6 rounded-full transition-all text-xl uppercase tracking-[0.2em] active:scale-95"
            >
              Back to Lobby
            </button>
          )}
        </div>
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

  const claimSlider = () => {
    socket.send(JSON.stringify({ type: "claimSlider" }));
  };

  const releaseSlider = () => {
    socket.send(JSON.stringify({ type: "releaseSlider" }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      <header className="flex justify-between items-center px-8 py-6 border-b border-white/10 bg-black z-10">
        <h1 className="text-xl font-black uppercase italic tracking-tighter">
          WAVELENGTH
        </h1>

        <div className="flex space-x-12">
          <div className="text-right">
            <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em]">
              Round
            </p>
            <p className="text-xl font-black">
              {state.currentRound}{" "}
              <span className="text-xs opacity-20">/ {state.totalRounds}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.3em]">
              Score
            </p>
            <p className="text-xl font-black">{state.score}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-12 space-y-16">
        {/* Dial Section */}
        <section className="space-y-12">
          <div className="text-center min-h-[4rem] flex flex-col items-center justify-center space-y-4">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
                {state.phase === 'clue' ? 'SETTING THE CLUE' : state.phase === 'guessing' ? `${state.players.find(p => p.role === 'psychic')?.name}'s Clue` : 'THE REVEAL'}
             </div>
             {state.clue ? (
              <div className="text-5xl font-black uppercase italic tracking-tight leading-tight">
                {state.clue}
              </div>
            ) : (
              <div className="text-lg font-black uppercase tracking-[0.2em] opacity-20 italic">
                {isPsychic ? 'GIVE A CLUE...' : 'Waiting for clue...'}
              </div>
            )}
          </div>

          <WavelengthDial 
            position={state.dialPosition}
            targetPosition={state.targetPosition}
            showTarget={isPsychic || state.phase === 'reveal'}
            showNeedle={state.phase !== 'clue'}
            isInteractive={!isPsychic && state.phase === 'guessing' && !isSliderLocked}
            onChange={updateDial}
            onPointerDown={claimSlider}
            onPointerUp={releaseSlider}
          />

          <div className="flex justify-between items-center px-4">
            <div className="flex flex-col items-center space-y-1 w-32">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">← Spectrum</span>
                <span className="text-xs font-black uppercase tracking-widest italic text-center">{state.leftSpectrum}</span>
            </div>
            {isSliderLocked && (
                <div className="flex flex-col items-center animate-pulse">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic"> Dialing...</span>
                    <span className="text-xs font-black uppercase">{sliderControllerName}</span>
                </div>
            )}
            <div className="flex flex-col items-center space-y-1 w-32">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Spectrum →</span>
                <span className="text-xs font-black uppercase tracking-widest italic text-center">{state.rightSpectrum}</span>
            </div>
          </div>
        </section>

        {/* Actions Section */}
        <section className="pt-8">
          {state.phase === "clue" && isPsychic && (
            <div className="flex flex-col items-center space-y-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">
                You are the Psychic. Give a clue.
              </p>
              <div className="w-full space-y-4">
                <input
                  type="text"
                  id="clueInput"
                  placeholder="TYPE CLUE HERE..."
                  className="w-full p-4 bg-transparent border-b-2 border-white focus:outline-none text-2xl font-black uppercase italic"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      "clueInput",
                    ) as HTMLInputElement;
                    if (input.value) sendClue(input.value);
                  }}
                  className="w-full bg-white text-black font-black py-5 rounded-full uppercase tracking-[0.3em] hover:bg-zinc-200 transition-colors"
                >
                  Send Clue
                </button>
              </div>
            </div>
          )}

          {state.phase === "guessing" && !isPsychic && (
            <button
              onClick={submitGuess}
              disabled={isSliderLocked}
              className="w-full bg-white text-black font-black py-5 rounded-full text-xl uppercase tracking-[0.3em] hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-20"
            >
              Submit Guess
            </button>
          )}

          {state.phase === 'reveal' && (
             <div className="flex flex-col items-center space-y-8 animate-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    {(() => {
                        let diff = Math.abs(state.dialPosition - state.targetPosition);
                        if (diff > 50) diff = 100 - diff;
                        
                        let points = 0;
                        let emoji = '😭';
                        let label = 'No points';
                        if (diff <= 2) { points = 4; emoji = '🎯'; label = 'BULLSEYE!'; }
                        else if (diff <= 6) { points = 3; emoji = '🔥'; label = 'Great Guess!'; }
                        else if (diff <= 10) { points = 2; emoji = '👍'; label = 'Nice!'; }

                        return (

                            <>
                                <div className="text-7xl mb-4">{emoji}</div>
                                <div className="text-4xl font-black uppercase italic tracking-tighter">{label}</div>
                                {points > 0 && <div className="text-xl font-black opacity-40">+{points} POINTS</div>}
                            </>
                        );
                    })()}
                </div>
                <button 
                    onClick={() => socket.send(JSON.stringify({ type: 'nextRound' }))}
                    className="w-full border-2 border-white text-white font-black py-5 rounded-full text-xl uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
                >
                    {state.currentRound >= state.totalRounds ? 'Finish Game' : 'Next Round'}
                </button>
             </div>
          )}

          <div className="pt-12 flex justify-center">
            <div className="flex items-center space-x-2 px-4 py-2 border border-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                Role: {me?.role}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<
    "home" | "create-name" | "join-code" | "join-name"
  >("home");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <h1 className="text-6xl font-black mb-16 tracking-tighter uppercase italic">
        WAVELENGTH
      </h1>

      <div className="w-full max-w-md space-y-12">
        {error && (
          <div className="border border-white/50 text-white p-4 rounded-none text-sm text-center animate-in fade-in slide-in-from-top-2 duration-300">
            {error}
          </div>
        )}

        {step === "home" && (
          <div className="space-y-4">
            <button
              onClick={handleStartCreate}
              className="w-full bg-white text-black font-black py-5 rounded-full transition-all active:scale-95 text-xl uppercase tracking-widest"
            >
              Create Room
            </button>
            <button
              onClick={handleStartJoin}
              className="w-full border-2 border-white text-white font-black py-5 rounded-full transition-all active:scale-95 text-xl uppercase tracking-widest"
            >
              Join Room
            </button>
          </div>
        )}

        {step === "create-name" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-1 opacity-50">
                Your Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="TYPE HERE..."
                className="w-full p-4 bg-transparent border-b-2 border-white focus:outline-none transition-all text-2xl uppercase font-black"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name && joinGame()}
              />
            </div>
            <div className="flex flex-col space-y-4 pt-2">
              <button
                onClick={joinGame}
                disabled={!name}
                className="w-full bg-white text-black font-black py-5 rounded-full transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                Create & Join
              </button>
              <button
                onClick={() => setStep("home")}
                className="w-full text-white/50 font-bold py-2 uppercase tracking-widest text-sm hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === "join-code" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-1 opacity-50">
                Room Code
              </label>
              <input
                type="text"
                autoFocus
                maxLength={4}
                placeholder="----"
                className="w-full p-4 bg-transparent border-b-2 border-white focus:outline-none transition-all text-5xl text-center font-black uppercase tracking-[0.5em]"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                onKeyDown={(e) =>
                  e.key === "Enter" && room.length === 4 && validateRoom()
                }
              />
            </div>
            <div className="flex flex-col space-y-4 pt-2">
              <button
                onClick={validateRoom}
                disabled={room.length < 4 || isValidating}
                className="w-full bg-white text-black font-black py-5 rounded-full transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                {isValidating ? "Checking..." : "Next"}
              </button>
              <button
                onClick={() => setStep("home")}
                className="w-full text-white/50 font-bold py-2 uppercase tracking-widest text-sm hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {step === "join-name" && (
          <div className="space-y-8">
            <div className="text-center opacity-50">
              <span className="text-xs uppercase font-black tracking-widest">
                Joining Room
              </span>
              <div className="text-2xl font-black">{room}</div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-[0.2em] ml-1 opacity-50">
                Your Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="TYPE HERE..."
                className="w-full p-4 bg-transparent border-b-2 border-white focus:outline-none transition-all text-2xl uppercase font-black"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name && joinGame()}
              />
            </div>
            <div className="flex flex-col space-y-4 pt-2">
              <button
                onClick={joinGame}
                disabled={!name}
                className="w-full bg-white text-black font-black py-5 rounded-full transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                Join Game
              </button>
              <button
                onClick={() => setStep("join-code")}
                className="w-full text-white/50 font-bold py-2 uppercase tracking-widest text-sm hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
