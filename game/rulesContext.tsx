import { createContext, ReactNode, useContext, useState } from "react";

export type GameRules = {
    winScore: number;
    minPairsForScore: number;
    straightScore: number;
    minFacesInRow: number;
    minStraightNumber: number;
    scoreToGoalDifference: number;
    onesInRowScore: number;
    minFacesInRowExceededScore: number;
    addedFaceToRowScore: number;
    pairScore: number;
    minRunningScoreToScore: number 
};

export const DEFAULT_RULES: GameRules = {
    winScore: 5000,
    minRunningScoreToScore: 500,
    scoreToGoalDifference: 0,
    minFacesInRow: 3,
    minFacesInRowExceededScore: 1000,
    addedFaceToRowScore: 500,
    onesInRowScore: 1000,
    minPairsForScore: 3,
    pairScore: 500,
    minStraightNumber: 6,
    straightScore: 2500,             
};

export const RULES_LABELS: Record<keyof GameRules, string> = {
    winScore: "Score pour gagner",
    minPairsForScore: "Paires minimum pour scorer",
    straightScore: "Score d'une suite",
    minFacesInRow: "Faces minimum pour une suite",
    minFacesInRowExceededScore: "Score bonus suite augmentée",
    addedFaceToRowScore: "Score face ajoutée à la suite",
    minStraightNumber: "Nombre minimum pour une Straight",
    scoreToGoalDifference: "Différence de score vers l'objectif",
    onesInRowScore: "Score d'une suite de 1",
    pairScore: "Score d'une paire",
    minRunningScoreToScore: "Score minimum en main pour scorer"
};

type ContextType = {
    rules: GameRules;
    modifyRule: (key:  keyof GameRules, value: number) => void
}

const RulesContext = createContext<ContextType>({ rules: DEFAULT_RULES, modifyRule: () => { } });

export function RulesProvider({initialRules, children }: {initialRules?:GameRules, children: ReactNode }) {
    const [rules, setRules] = useState(initialRules ?? DEFAULT_RULES)

    const modifyRule = (key: keyof GameRules, value: number) => {
        setRules((prev) => {
            const newRules = { ...prev }
            newRules[key] = value
            return newRules
        })
    }

    return <RulesContext.Provider value={{rules, modifyRule}}>{children}</RulesContext.Provider>;
}

export function useRules() {
    return useContext(RulesContext);
}