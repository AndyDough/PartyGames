export type GamePhase = 'setup' | 'clue' | 'guessing' | 'reveal' | 'scoring' | 'lobby';

export interface Player {
  id: string;
  name: string;
  team: 'red' | 'blue';
  role: 'psychic' | 'guesser';
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  targetPosition: number; // 0 to 100
  dialPosition: number;   // 0 to 100
  clue?: string;
  leftSpectrum: string;
  rightSpectrum: string;
  scores: {
    red: number;
    blue: number;
  };
  turnTeam: 'red' | 'blue';
}

export type GameMessage = 
  | { type: 'join'; name: string; mode: 'join' | 'create' }
  | { type: 'setClue'; clue: string }
  | { type: 'setDial'; position: number }
  | { type: 'submitGuess' }
  | { type: 'nextRound' }
  | { type: 'startGame' }
  | { type: 'error'; message: string };
