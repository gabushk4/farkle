import { useGameState } from "@/game/gameStateContext";
import CasinoMessage from "./ui/casinoMessage";
import { LayoutRectangle, StyleSheet, Text, useColorScheme, View } from "react-native";
import { Colors } from "@/constants/theme";
import { LocalReadyOverlay, OnlineReadyOverlay } from "./readyOverlays";
import { useEffect, useRef, useState } from "react";
import CasinoScoreCounter from "./casinoScoreCounter";
import { useRules } from "@/game/rulesContext";
import { router } from "expo-router";

type AnimationStep = 'scoreUp' | 'farkle' | 'hotDice' | 'win' | null;

/* 
    bug:

 LOG  enqueue farkle
 LOG  processNext farkle
 LOG  enqueue hotDice
 LOG  processNext hotDice
 LOG  casinoMessage visible HOT DICE
 LOG  processNext undefined
 
*/

export default function GameEventsManager() {
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]
    
    const { state, mode, nextPlayer, setIsHotDice } = useGameState()
    const {rules} = useRules()

    const currentPlayer = state.players[state.currentPlayerIndex];

    const prevScoreRef = useRef(currentPlayer.score);
    const prevPlayerRef = useRef(currentPlayer.id)
    const queueRef = useRef<AnimationStep[]>([]);

    const [currentAnimation, setCurrentAnimation] = useState<AnimationStep>(null);    
    const [scoreLayout, setScoreLayout] = useState<LayoutRectangle>({ x: 0, y: 0, height: 0, width: 0 })    

    // NOUVEAU: pousse dans la queue plutôt que de trigger directement
    const enqueue = (step: AnimationStep) => {
        console.log("enqueue", step)
        queueRef.current.push(step);
        if (currentAnimation === null) processNext();
    };

    const processNext = (onQueueEmpty?: () => void) => {        
        const next = queueRef.current.shift();

        console.log("processNext", next)
        
        setCurrentAnimation(next ?? null);

        if (!next && onQueueEmpty) {
            onQueueEmpty(); //seulement si la queue est vide après ce shift
        }
    };

    // Détection des événements
    useEffect(() => {
        console.log("score changed: prevPlayerRef.current", prevPlayerRef.current," === currentPlayer",  currentPlayer, prevPlayerRef.current === currentPlayer.id)
        if (currentPlayer.score !== prevScoreRef.current && prevPlayerRef.current === currentPlayer.id) {
            prevScoreRef.current = currentPlayer.score;            
            enqueue('scoreUp');            
        }
    }, [currentPlayer.score]);

    useEffect(() => {
        if (currentPlayer.id != prevPlayerRef.current) {
            prevPlayerRef.current = currentPlayer.id
        }
    }, [currentPlayer.id])

    useEffect(() => {
        if (state.isFarkle) enqueue('farkle');
    }, [state.isFarkle]);

    useEffect(() => {
        if (state.isHotDice) enqueue('hotDice');
    }, [state.isHotDice]);

    useEffect(() => {
        if (state.winnerId) enqueue('win')
    }, [state.winnerId])

    return (
        <>
            {mode === 'local'
                ? <LocalReadyOverlay />
                : <OnlineReadyOverlay />
            }

            <View style={s.container}>      
                <CasinoMessage
                    text="HOT DICE"
                    visible={currentAnimation === 'hotDice'}
                    color={colors.accent}
                    textShadowColor={colors.accentMuted}                
                    backgroundGifs={[require('@/assets/gifs/fire.gif')]}
                    backgroundGifStyle={{ bottom: -150 }}
                    onAnimationEnd={() => {
                        setIsHotDice(false)
                        processNext();
                    }}
                />
        
                <CasinoMessage
                    text="FARKLE"
                    visible={currentAnimation === 'farkle'}
                    color={colors.danger}
                    onAnimationEnd={() => {
                        processNext(nextPlayer)
                                               
                    }}
                    backgroundGifs={[require('@/assets/gifs/sad.gif')]}        
                />
            
                <CasinoMessage
                    text="GAGNÉE"
                    visible={currentAnimation === 'win'}
                    color={colors.accent}
                    onAnimationEnd={() => {
                        processNext(() => { router.push('/(tabs)/play') })
                        
                    }}
                    backgroundGifs={[require('@/assets/gifs/confettis.gif'), require('@/assets/gifs/fireworks.gif')]}        
                />
                
                <View style={s.scorePlaceholder} onLayout={(e) => setScoreLayout(e.nativeEvent.layout)}>
                    <Text style={{ color: 'transparent', fontSize: 40 * 0.7 }}>{Array.from({length:rules.winScore.toString().length}).map(v => '0')}</Text>                        
                </View>
                
                <CasinoScoreCounter
                    value={currentPlayer.score}
                    digits={rules.winScore.toString().length}
                    animate={currentAnimation === 'scoreUp'}
                    startPosition={scoreLayout}
                    onAnimationEnd={() => {
                        processNext(nextPlayer)
                        
                    }}
                />
            </View>
        </>
    )
}

const s = StyleSheet.create({
    scorePlaceholder: {
        position: 'absolute',
        right: 48,
        top:20
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        flex: 1,
        zIndex: 10,
        height: '100%',
        width: '100%',
        pointerEvents:'none'
    }
})