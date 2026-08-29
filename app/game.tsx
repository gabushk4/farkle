import GameBoard from "@/components/gameBoard";
import GameEventsManager from "@/components/gameEventsAnimation";
import { Colors, Radius, Typography } from "@/constants/theme";
import { GameStateProvider, useGameState } from "@/game/gameStateContext";
import { DEFAULT_RULES, GameRules, RulesProvider } from "@/game/rulesContext";
import { GameMode, GameState, Player } from "@/game/types";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, LayoutRectangle, Modal, Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import CloseMenu from '@/components/svgs/closeMenu';
import Ranking from '@/components/svgs/ranking';
import Leaderboard from "@/components/leaderboard";
import { DateTime } from "luxon";
import { usePreventRemove } from "@react-navigation/native";

function Content({ }) {
    const navigation = useNavigation()
    const { state, saveGameInProgress } = useGameState()
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'dark']

    const currentPlayer = state.players[state.currentPlayerIndex]    

    const [leaderBoardOpen, setLeaderBoardOpen] = useState(false)
    const [buttonLayout, setButtonLayout] = useState<LayoutRectangle>()

    const leaderBoardOpenShared = useSharedValue(0)


    const rankingIconStyle = useAnimatedStyle(() => ({
        opacity: 1 - leaderBoardOpenShared.value,
        transform: [
            { rotate: `${leaderBoardOpenShared.value * 90}deg` },
            { scale: 1 - leaderBoardOpenShared.value * 0.25 },
        ],
    }))

    const closeIconStyle = useAnimatedStyle(() => ({
        opacity: leaderBoardOpenShared.value,
        transform: [
            { rotate: `${leaderBoardOpenShared.value * 90}deg` },
            { scale: 0.75 + leaderBoardOpenShared.value * 0.25 },
        ],
    }))
    // TODO: Current player changes when leaderboard opens and closes
    const toggleLeaderboard = () => {
        console.log("leaderboard open")
        const isOpen = !leaderBoardOpen
        setLeaderBoardOpen(isOpen)
        leaderBoardOpenShared.value = withTiming(isOpen ? 1 : 0, {
            duration: 180,
        })
    }

    useFocusEffect(useCallback(() => {
        state.started_at = DateTime.now().toMillis()
    }, []))

    const shouldPreventRemove = true; // ou state.status === 'ongoing'

    usePreventRemove(shouldPreventRemove, ({ data }) => {
        Alert.alert(
        'Quitter la partie ?',
        '...',
        [
            { text: 'Annuler', style: 'cancel' },
            {
            text: 'Quitter et sauvegarder',
            onPress: () => {
                saveGameInProgress();
                navigation.dispatch(data.action);
            },
            },
        ]
        );
    });

    return (
        <GestureHandlerRootView style={{ flex: 1}}>
            <View style={{ flex: 1, height: '100%', width: '100%', marginTop: 32, paddingVertical: 8 }}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                    <Text style={{ color: colors.textSecondary, fontSize: 20 }}>{currentPlayer.name}</Text>   
                    <TouchableOpacity
                        onLayout={(e) => {
                            setButtonLayout(e.nativeEvent.layout)                            
                        }}
                        style={{ height: 56, width: 56, justifyContent: 'center', alignItems: 'center' }} onPress={() => {
                        toggleLeaderboard()
                    }}>
                        <View style={styles.iconContainer}>
                            <Animated.View style={[styles.icon, rankingIconStyle]}>
                                <Ranking width={32} height={32} stroke={colors.text} />
                            </Animated.View>
                            <Animated.View                                
                                style={[StyleSheet.absoluteFillObject, styles.icon, closeIconStyle]}>
                                <CloseMenu width={32} height={32} stroke={colors.text} />
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                </View>
                <GameBoard numDiceInit={6} dieSize={60} />
                <GameEventsManager />
                <Modal
                    visible={leaderBoardOpen}
                    transparent={true}
                    backdropColor={colors.accentMuted}
                    style={{flex:1}}
                >
                    
                    <View style={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity
                        style={{ position: 'absolute', zIndex:20, left: buttonLayout?.x ? buttonLayout.x - 12 : 0, top: buttonLayout?.y ? buttonLayout.y : 52, width: buttonLayout?.width, height: buttonLayout?.height, }}
                        onPress={() => {
                            toggleLeaderboard()
                        }}
                    >
                        <Animated.View
                            style={[StyleSheet.absoluteFillObject, closeIconStyle, {width:'100%', height:'100%'}]}
                        >
                            <CloseMenu width={32} height={32} stroke={colors.text} />
                        </Animated.View>
                    </TouchableOpacity>
                        <Pressable
                            style={{ position: 'absolute', height: '100%', width: '100%', opacity: 0.3, backgroundColor: colors.background }}
                            onPress={() => {
                                toggleLeaderboard()
                            }}
                        />
                        <View style={{  position: 'relative', height:'64%', width:'72%', backgroundColor:colors.surface, borderRadius:Radius.lg}}>
                            <Leaderboard/>                            
                        </View>
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default function Game({ }) {
    let { players, mode, initialGameState, initialRules } = useLocalSearchParams<{ players: string, mode: string, initialGameState?: string, initialRules?: string }>()
    
    console.log("game: ", { players: JSON.parse(players as string), mode })

    //TODO: for online games, if we recreate a game, we need to inform all the other players

    return (
        <RulesProvider initialRules={initialRules ? JSON.parse(initialRules as string) as GameRules : undefined}>
            <GameStateProvider
                initialGameState={initialGameState ? JSON.parse(initialGameState as string) as GameState : undefined}
                mode={mode as GameMode ?? 'local'}
                initialPlayers={JSON.parse(players as string) as Player[]}
            >
                <Content/>
            </GameStateProvider>
        </RulesProvider>
    )
}