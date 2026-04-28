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
      phase: "setup",
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
    console.log(`Connected: ${conn.id}`);
    conn.send(JSON.stringify({ type: "sync", state: this.state }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as GameMessage;

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name);
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

  handleJoin(conn: Party.Connection, name: string) {
    const existingPlayer = this.state.players.find((p) => p.id === conn.id);
    if (!existingPlayer) {
      const team = this.state.players.filter(p => p.team === 'red').length <= this.state.players.filter(p => p.team === 'blue').length ? 'red' : 'blue';
      const role = this.state.players.filter(p => p.role === 'psychic' && p.team === team).length === 0 ? 'psychic' : 'guesser';
      
      const newPlayer: Player = {
        id: conn.id,
        name,
        team,
        role,
      };
      this.state.players.push(newPlayer);
    }
    
    if (this.state.players.length >= 2 && this.state.phase === 'setup') {
        this.state.phase = 'clue';
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
    
    // Re-assign psychics for the next round
    this.state.players.forEach(p => {
        if (p.team === this.state.turnTeam) {
            // logic to rotate psychic... simplified for now
        }
    });
  }
}
