import { useSQLiteContext } from 'expo-sqlite';
import { DateTime } from 'luxon';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toGameRow, upsertGame } from './localGameManipulation';
import { useRules } from './rulesContext';
import { Game, GameMode, GameState, Player } from './types';
import * as crypto from 'expo-crypto'

type GameStateContextValue = {    
    state: GameState;
    mode: GameMode;
    bankPoints: () => void;
    endTurnWithFarkle: () => void;
    confirmReadyForNextTurn: () => void
    setPlayers: (players: Player[]) => void;
    addToRunningScore: (points: number) => void;
    setIsFarkle: (state: boolean) => void;
    setIsHotDice: (state: boolean) => void;
    nextPlayer: () => void;
    saveGameInProgress: () => void
    accumulateDuration: () => void
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({initialGameState, initialPlayers, mode, children }: { initialGameState?:GameState, initialPlayers: Player[]; mode: GameMode; children: ReactNode }) {    
    const {rules} = useRules()
    const db = useSQLiteContext()

    const [state, setState] = useState<GameState>(
        initialGameState
        ?? {
            gameId:crypto.randomUUID(),
            players: initialPlayers,
            currentPlayerIndex: 0,
            runningScore: 0,
            isWaitingForNextTurn: false,
            isHotDice: false,
            isFarkle: false,
            winnerId: undefined,
            started_at: DateTime.now().toMillis(),
            ended_at: undefined,
            duration:0,
        }
    );

    const nextPlayer = () => {
        setState(prev => changeTurn(prev))
    }

    const changeTurn = (prev: GameState): GameState => ({
        ...prev,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        runningScore: 0,
        isWaitingForNextTurn: true,
        isFarkle: false,
        isHotDice: false,
    });

    const bankPoints = () => {        
        setState((prev) => {
            const players = [...prev.players];
            const score = players[prev.currentPlayerIndex].score + prev.runningScore; // NOUVEAU: prev.runningScore, pas state.runningScore (évite un state périmé)

            console.log("bankPoints", score)

            if (score > rules.winScore) {
                // NOUVEAU: overshoot = farkle, le score du tour ne s'applique PAS                
                return {...prev, isFarkle:true, runningScore:0}
            }

            players[prev.currentPlayerIndex] = { ...players[prev.currentPlayerIndex], score };

            if (score === rules.winScore) { 
                const state = { ...prev, players, runningScore: 0, winnerId: players[prev.currentPlayerIndex].id }
                recordGameResult(state)
                return state;
            }

            return { ...prev, players, runningScore: 0 }
        });
    };

    const accumulateDuration = () => {
        setState(prev => {
            const now = DateTime.now().toMillis()
            const newState = {...prev}
            newState.duration += now - newState.started_at
            newState.started_at = now // reset pour la prochaine période comptée

            return newState
        })        
    }

    const recordGameResult = async (finalState: GameState) => {
        if (mode === 'local') {
            const now = DateTime.now().toMillis()

            accumulateDuration()

            const game: Game = {
                mode: mode,
                startedAt: finalState.started_at,
                rules: rules,
                id: finalState.gameId,
                status: 'completed',
                gameState: finalState,
                updatedAt: now,
                hostPlayerId: null,
                playerStatuses: finalState.players.map(p => ({
                    id: p.id,
                    status:'afk' 
                }))
            } 
            try {
                await upsertGame(db, game)
            } catch (e) {
                console.error(e)
            }
        } else {
            //TODO: api call pour sauver en BD la partie qui vient de finir
        }
    }

    const saveGameInProgress = async () => {
        const quitTime = DateTime.now().toMillis()

        accumulateDuration()

        const savedGame: Game = {
            id: state.gameId, 
            mode: 'local',
            startedAt: state.started_at,
            updatedAt: quitTime,            
            rules: rules,
            hostPlayerId: null,
            playerStatuses: null,
            status: 'ongoing',
            gameState: state,
        }
        
        try {
            await upsertGame(db, savedGame)
        } catch (e) {
            console.error(e)
        }
    }

    const addToRunningScore = (points: number) => {
        setState((prev) => ({ ...prev, runningScore: prev.runningScore + points }));
    };

    const endTurnWithFarkle = () => {
        setState((prev) => ({...prev, isFarkle:true}));
    };

    const setPlayers = (players: Player[]) => {
        setState((prev) => ({ ...prev, players }));
    };

    const confirmReadyForNextTurn = () => {
        setState((prev) => ({...prev, isWaitingForNextTurn:false}))
    }

    const setIsHotDice = (state: boolean) => {
        setState(prev => ({...prev, isHotDice:state}))
    }

    const setIsFarkle = (state: boolean) => {
        setState(prev => ({...prev, isFarkle:state}))
    }

    return (
        <GameStateContext.Provider value={{ state, mode, bankPoints, endTurnWithFarkle, setPlayers, addToRunningScore, confirmReadyForNextTurn, setIsFarkle, setIsHotDice, nextPlayer, saveGameInProgress, accumulateDuration }}>
            {children}
        </GameStateContext.Provider>
    );
}

export function useGameState() {
    const ctx = useContext(GameStateContext);
    if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
    return ctx;
}