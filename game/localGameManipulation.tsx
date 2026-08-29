import { SQLiteDatabase } from "expo-sqlite";
import { Game, GameStatus } from "./types";

export function toGameRow(game: Game) {
    return {
        id: game.id,
        mode: game.mode,
        status: game.status,
        game_state: JSON.stringify(game.gameState),
        rules: JSON.stringify(game.rules),
        started_at: game.startedAt,
        updated_at: game.updatedAt,
    };
}

export function fromGameRow(row: any): Game {
    return {
        id: row.id,
        mode: row.mode,
        status: row.status,
        gameState: JSON.parse(row.game_state),
        rules: JSON.parse(row.rules),
        startedAt: row.started_at,
        updatedAt: row.updated_at,
        hostPlayerId: null,
        playerStatuses: null,
    };
}

export async function upsertGame(db: SQLiteDatabase, game: Game) {
    const row = toGameRow(game);
    await db.runAsync(
        `INSERT OR REPLACE INTO games (id, mode, status, game_state, rules, started_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.mode, row.status, row.game_state, row.rules, row.started_at, row.updated_at]
    );
}

export async function getGamesByStatus(db: SQLiteDatabase, status: GameStatus): Promise<Game[]> {
    //TODO: mix in Online games

    const rows = await db.getAllAsync<any>(`SELECT * FROM games WHERE status = ? ORDER BY updated_at DESC`, [status]);
    return rows.map(fromGameRow);
}

export async function getGameById(db: SQLiteDatabase, id: string): Promise<Game | null> {
    const row = await db.getFirstAsync<any>(`SELECT * FROM games WHERE id = ?`, [id]);
    return row ? fromGameRow(row) : null;
}