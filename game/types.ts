import { GameRules } from "./rulesContext";

export type Player = {
    id: number;
    name: string;
    score: number; //banked score for leaderboard
    isTurn: boolean; //is his turn to play or not
    isComputer: boolean;
}

export type GameState = {
    gameId: string;
    winnerId?: number;
    players: Player[];
    currentPlayerIndex: number;
    runningScore: number;
    isWaitingForNextTurn: boolean;
    isFarkle: boolean;
    isHotDice: boolean; 
    started_at: number;
    ended_at: number | undefined;
    duration: number;
}

export type DiceState = {
    faces: number[]
    isRolling: boolean;
    zones: DiceZone[]
} //For real time spectatoring dice events (faces shown)

export type DieHandle = {
    roll: (index?:number) => void;
};

export type DiceZone = 'field' | 'scored' | 'locked';

export type TrayBounds = { x: number, y: number, width: number; height: number };

export type Combination = { [key: number]: number[] }

export type GameMode = 'local' | 'online'

export type PlayerStatus = {
    id: number; 
    status: 'active' | 'afk'
}

export type GameStatus = 'ongoing' | 'completed';

export type Game = {
    id: string; // généré par toi, stable à travers tout le cycle de vie de la partie
    mode: 'local' | 'online';
    status: GameStatus;

    gameState: GameState; // toujours présent — même complétée, tu gardes l'état final
    rules: GameRules;

    startedAt: number;
    updatedAt: number; // NOUVEAU: remplace savedAt/playedAt — dernier moment où la partie a été touchée

    hostPlayerId: number | null;
    playerStatuses: PlayerStatus[] | null;
};
