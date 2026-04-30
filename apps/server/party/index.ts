import type * as Party from "partykit/server";
import { GameState, GameMessage, Player } from "@partygames/types";
import { SPECTRUM_CARDS } from "./cards";

export default class WavelengthServer implements Party.Server {
  state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = this.getInitialState();
  }

  getRandomCard() {
    return SPECTRUM_CARDS[Math.floor(Math.random() * SPECTRUM_CARDS.length)];
  }

  getInitialState(): GameState {
    const card = this.getRandomCard();
    return {
      phase: "lobby",
      players: [],
      targetPosition: Math.floor(Math.random() * 100),
      dialPosition: 50,
      leftSpectrum: card.left,
      rightSpectrum: card.right,
      score: 0,
      currentRound: 0,
      totalRounds: 0,
      sliderController: null,
    };
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(JSON.stringify({ type: "sync", state: this.state }));
  }

  onClose(conn: Party.Connection) {
    this.state.players = this.state.players.filter((p) => p.id !== conn.id);
    
    if (this.state.sliderController === conn.id) {
        this.state.sliderController = null;
    }

    this.room.broadcast(JSON.stringify({ type: "sync", state: this.state }));
  }

  async onRequest(req: Party.Request) {
    if (req.method === "GET") {
      const exists = this.state.players.length > 0;
      return new Response(JSON.stringify({ exists }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    return new Response("Method not allowed", { status: 405 });
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as any;

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name, msg.mode);
        break;
      case "setAvatar":
        const p = this.state.players.find(p => p.id === sender.id);
        if (p) {
          (p as any).avatarIndex = msg.avatarIndex;
        }
        break;
      case "startGame":
        this.handleStartGame(sender);
        break;
      case "setClue":
        if (this.state.phase === "clue") {
          this.state.clue = msg.clue;
          this.state.phase = "guessing";
        }
        break;
      case "claimSlider":
        const player = this.state.players.find(p => p.id === sender.id);
        if (this.state.phase === "guessing" && this.state.sliderController === null && player?.role !== 'psychic') {
          this.state.sliderController = sender.id;
        }
        break;
      case "releaseSlider":
        if (this.state.sliderController === sender.id) {
          this.state.sliderController = null;
        }
        break;
      case "setDial":
        if (this.state.phase === "guessing" && this.state.sliderController === sender.id) {
          this.state.dialPosition = msg.position;
        }
        break;
      case "submitGuess":
        if (this.state.phase === "guessing") {
          this.calculateScore();
          this.state.phase = "reveal";
          this.state.sliderController = null;
        }
        break;
      case "nextRound":
        this.resetRound();
        break;
      case "returnToLobby":
        this.handleReturnToLobby(sender);
        break;
    }

    this.room.broadcast(JSON.stringify({ type: "sync", state: this.state }));
  }

  handleJoin(conn: Party.Connection, name: string, mode: 'join' | 'create') {
    if (mode === 'join' && this.state.players.length === 0) {
      conn.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
      return;
    }

    const existingPlayer = this.state.players.find((p) => p.id === conn.id);
    if (!existingPlayer) {
      const newPlayer: any = {
        id: conn.id,
        name: name || `Player ${this.state.players.length + 1}`,
        role: 'guesser',
        avatarIndex: 0,
      };
      this.state.players.push(newPlayer);
    }
  }

  handleStartGame(sender: Party.Connection) {
    if (this.state.players.length > 0 && this.state.players[0].id === sender.id) {
        if (this.state.players.length >= 2) {
            this.state.score = 0;
            this.state.currentRound = 1;
            this.state.totalRounds = this.state.players.length * 2;
            this.state.phase = 'clue';
            
            // Assign first psychic
            this.state.players.forEach(p => p.role = 'guesser');
            this.state.players[0].role = 'psychic';
        } else {
            sender.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players to start' }));
        }
    }
  }

  calculateScore() {
    const diff = Math.abs(this.state.dialPosition - this.state.targetPosition);
    let points = 0;
    if (diff <= 2) points = 4;
    else if (diff <= 7) points = 3;
    else if (diff <= 12) points = 2;

    this.state.score += points;
  }

  resetRound() {
    if (this.state.currentRound >= this.state.totalRounds) {
      this.state.phase = "gameover";
      return;
    }

    this.state.currentRound++;
    const card = this.getRandomCard();
    this.state.phase = "clue";
    this.state.targetPosition = Math.floor(Math.random() * 100);
    this.state.dialPosition = 50;
    this.state.leftSpectrum = card.left;
    this.state.rightSpectrum = card.right;
    this.state.clue = undefined;
    this.state.sliderController = null;
    
    // Rotate psychic: (currentRound - 1) % players.length
    this.state.players.forEach(p => p.role = 'guesser');
    const nextPsychicIndex = (this.state.currentRound - 1) % this.state.players.length;
    if (this.state.players[nextPsychicIndex]) {
        this.state.players[nextPsychicIndex].role = 'psychic';
    }
  }

  handleReturnToLobby(sender: Party.Connection) {
    // Only creator can return to lobby
    if (this.state.players.length > 0 && this.state.players[0].id === sender.id) {
        this.state.phase = "lobby";
        this.state.score = 0;
        this.state.currentRound = 0;
        this.state.totalRounds = 0;
        this.state.players.forEach(p => p.role = 'guesser');
    }
  }
}
