export type GamePhase = 'setup' | 'clue' | 'guessing' | 'reveal' | 'scoring' | 'lobby' | 'gameover';

export interface Player {
  id: string;
  name: string;
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
  score: number;
  currentRound: number;
  totalRounds: number;
  sliderController: string | null;
}

export type GameMessage = 
  | { type: 'join'; name: string; mode: 'join' | 'create' }
  | { type: 'setClue'; clue: string }
  | { type: 'setDial'; position: number }
  | { type: 'claimSlider' }
  | { type: 'releaseSlider' }
  | { type: 'submitGuess' }
  | { type: 'nextRound' }
  | { type: 'startGame' }
  | { type: 'returnToLobby' }
  | { type: 'error'; message: string };
