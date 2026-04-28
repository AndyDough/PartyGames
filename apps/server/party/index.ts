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
      scores: { red: 0, blue: 0 },
      turnTeam: "red",
    };
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    conn.send(JSON.stringify({ type: "sync", state: this.state }));
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
    const msg = JSON.parse(message) as GameMessage;

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name, msg.mode);
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
      case "setDial":
        if (this.state.phase === "guessing") {
          this.state.dialPosition = msg.position;
        }
        break;
      case "submitGuess":
        if (this.state.phase === "guessing") {
          this.calculateScore();
          this.state.phase = "reveal";
        }
        break;
      case "nextRound":
        this.resetRound();
        break;
    }

    this.room.broadcast(JSON.stringify({ type: "sync", state: this.state }));
  }

  handleJoin(conn: Party.Connection, name: string, mode: 'join' | 'create') {
    // If trying to join a room with no players, it doesn't "exist" yet
    if (mode === 'join' && this.state.players.length === 0) {
      conn.send(JSON.stringify({ type: 'error', message: 'Room does not exist' }));
      return;
    }

    const existingPlayer = this.state.players.find((p) => p.id === conn.id);
    if (!existingPlayer) {
      const team = this.state.players.filter(p => p.team === 'red').length <= this.state.players.filter(p => p.team === 'blue').length ? 'red' : 'blue';
      const role = this.state.players.filter(p => p.role === 'psychic' && p.team === team).length === 0 ? 'psychic' : 'guesser';
      
      const newPlayer: Player = {
        id: conn.id,
        name: name || `Player ${this.state.players.length + 1}`,
        team,
        role,
      };
      this.state.players.push(newPlayer);
    }
  }

  handleStartGame(sender: Party.Connection) {
    // Only the first player (creator) can start the game
    if (this.state.players.length > 0 && this.state.players[0].id === sender.id) {
        if (this.state.players.length >= 2) {
            this.state.phase = 'clue';
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

    if (this.state.turnTeam === "red") {
      this.state.scores.red += points;
    } else {
      this.state.scores.blue += points;
    }
  }

  resetRound() {
    const card = this.getRandomCard();
    this.state.phase = "clue";
    this.state.targetPosition = Math.floor(Math.random() * 100);
    this.state.dialPosition = 50;
    this.state.leftSpectrum = card.left;
    this.state.rightSpectrum = card.right;
    this.state.clue = undefined;
    this.state.turnTeam = this.state.turnTeam === "red" ? "blue" : "red";
    
    // Simple psychic rotation: pick the next player in the same team
    const teamPlayers = this.state.players.filter(p => p.team === this.state.turnTeam);
    if (teamPlayers.length > 0) {
        const currentPsychicIndex = teamPlayers.findIndex(p => p.role === 'psychic');
        teamPlayers.forEach(p => p.role = 'guesser');
        const nextPsychicIndex = (currentPsychicIndex + 1) % teamPlayers.length;
        const nextPsychic = teamPlayers[nextPsychicIndex];
        const pInState = this.state.players.find(p => p.id === nextPsychic.id);
        if (pInState) pInState.role = 'psychic';
    }
  }
}
