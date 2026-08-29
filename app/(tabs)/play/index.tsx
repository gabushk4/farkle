import Rules from "@/components/rulesDisplay";
import ButtonAbs from "@/components/ui/button";
import { Colors, Radius } from "@/constants/theme";
import { formatDuration, formatRelativeTime } from "@/functions/formatTime";
import { fromGameRow, getGameById, getGamesByStatus } from "@/game/localGameManipulation";
import { Game } from "@/game/types";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";
import { PLAYERS_INIT } from "./setupLocal";
import { useIsFocused } from "@react-navigation/native";

function HistoryLine({ game, onPress }: { game: Game, onPress: () => void }) {
    const winner = game.gameState.players.find(p => p.id === game.gameState.winnerId);
    const sortedPlayers = [...game.gameState.players].sort((a, b) => b.score - a.score);
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [s.listItem, {backgroundColor:colors.surfaceElevated, borderRadius:Radius.md, opacity: pressed ? 0.7 : 1}]}>
            <View style={[s.headerRow, {justifyContent:'space-between'}]}>
                <View style={s.statusContainer}>
                    <FontAwesome6 
                        name="crown" 
                        size={18} 
                        color={colors.accent}
                        style={{marginRight: 8}}
                    />
                    <Text style={[s.statusText, {color: colors.accent}]}>
                        {winner?.name} a gagné
                    </Text>
                </View>
                <Text style={[s.timeText, {color:colors.text}]}>
                    {formatRelativeTime(game.startedAt)}
                </Text>
            </View>
            <Text style={[s.playersText, {color: colors.textSecondary}]} numberOfLines={1} ellipsizeMode="tail">
                {sortedPlayers.map(p => `${p.name} · ${p.score.toLocaleString()}`).join(' | ')}
            </Text>
            <Text style={[s.metaText, {color: colors.textSecondary}]}>
                {game.mode === 'local' ? 'Partie locale' : 'Partie en ligne'} {/* TODO: calculate duration */}
            </Text>
        </Pressable>
    );
}

function OngoingsLine({ game, onPress }: { game: Game, onPress: () => void }) {
    const sortedPlayers = [...game.gameState.players].sort((a, b) => b.score - a.score);
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]
    const isInProgress = game.status === 'ongoing'

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [s.listItem, {backgroundColor:colors.surfaceElevated, borderRadius:Radius.md, opacity: pressed ? 0.7 : 1}]}>
            <View style={[s.headerRow, {justifyContent:'space-between'}]}>
                <View style={s.statusContainer}>
                    <FontAwesome6 
                        name={isInProgress ? 'play' : 'pause'} 
                        size={18} 
                        color={isInProgress ? colors.accent : colors.textSecondary}
                        style={{marginRight: 8}}
                    />
                    <Text style={[s.statusText, {color: isInProgress ? colors.accent : colors.textSecondary}]}>
                        {isInProgress ? 'En cours...' : 'En pause'}
                    </Text>
                </View>
                <Text style={[s.timeText, {color:colors.text}]}>
                    {formatRelativeTime(game.updatedAt)}
                </Text>
            </View>
            <Text style={[s.playersText, {color: colors.textSecondary}]} numberOfLines={1} ellipsizeMode="tail">
                {sortedPlayers.map(p => `${p.name} · ${p.score.toLocaleString()}`).join(' | ')}
            </Text>
            <Text style={[s.metaText, {color: colors.textSecondary}]}>
                {game.mode === 'local' ? 'Partie locale' : 'Partie en ligne'} · {formatRelativeTime(game.startedAt)}
            </Text>
        </Pressable>
    )
}

function HistoryDetailModal({ game, visible, onClose }: { game?: Game, visible: boolean, onClose: () => void }) {
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]
    
    if (!game) return null;

    const sortedPlayers = [...game.gameState.players].sort((a, b) => b.score - a.score);
    const winner = game.gameState.players.find(p => p.id === game.gameState.winnerId);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[s.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
                <View style={[s.modalContent, {backgroundColor: colors.surface}]}>
                    <View style={s.modalHeader}>
                        <Text style={[s.modalTitle, {color: colors.text}]}>Détails de la partie</Text>
                        <Pressable onPress={onClose}>
                            <FontAwesome6 name="xmark" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={s.modalBody}>
                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, {color: colors.textSecondary}]}>Gagnant</Text>
                            <Text style={{color: colors.text, fontSize: 16, fontWeight: '600'}}>{winner?.name}</Text>
                        </View>

                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, { color: colors.textSecondary }]}>Joueurs</Text>
                            <View style={{width:'50%'}}>
                                {sortedPlayers.map((p, idx) => (
                                    <View key={idx} style={[s.playerRow, {backgroundColor: colors.surfaceElevated, borderRadius: Radius.md}]}>
                                        <Text style={{color: colors.text, fontSize: 16, width: '50%', height:'100%'}}>{p.name}</Text>
                                        <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600', width: '50%', height:'100%', textAlign:'center'}}>{p.score.toLocaleString()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, { color: colors.textSecondary }]}>Informations</Text>
                            <View style={{gap:4}}>
                                <Text style={{color: colors.text, fontSize: 14}}>Mode: {game.mode === 'local' ? 'Partie locale' : 'Partie en ligne'}</Text>
                                <Text style={{ color: colors.text, fontSize: 14 }}>Durée: {formatDuration(game.gameState.duration/1000)}</Text>
                                <Text style={{ color: colors.text, fontSize: 14 }}>Date: {formatRelativeTime(game.startedAt)}</Text>
                            </View>
                        </View>

                        <Rules rulesInit={game.rules}/>
                    </View>

                    <View style={s.modalButtonContainer}>
                        <Pressable 
                            style={[s.modalButton, {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent}]} 
                            onPress={onClose}
                        >
                            <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>Fermer</Text>
                        </Pressable>
                        <Pressable 
                            style={[s.modalButton, {backgroundColor: colors.accent}]} 
                            onPress={() => {
                                onClose();
                                const newPlayers = game.gameState.players.map((p, idx) => ({
                                    id: p.id,
                                    name: p.name,
                                    score: 0,
                                    isTurn: p.isTurn,
                                    isComputer: false
                                }));
                                router.push({
                                    pathname: '/game',
                                    params: {
                                        players: JSON.stringify(newPlayers),
                                        mode: game.mode,

                                    }
                                });
                            }}
                        >
                            <FontAwesome6 name="play" size={16} color={colors.surface} style={{marginRight: 8}} />
                            <Text style={{color: colors.surface, fontSize: 16, fontWeight: '600'}}>Rejouer</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function SavedGameDetailModal({ game, visible, onClose }: { game?: Game, visible: boolean, onClose: () => void }) {
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]
    
    if (!game) return null;

    const sortedPlayers = [...game.gameState.players].sort((a, b) => b.score - a.score);
    const currentPlayer = game.gameState.players[game.gameState.currentPlayerIndex];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={[s.modalOverlay, {backgroundColor: 'rgba(0,0,0,0.5)'}]}>
                <View style={[s.modalContent, {backgroundColor: colors.surface}]}>
                    <View style={s.modalHeader}>
                        <Text style={[s.modalTitle, {color: colors.text}]}>Détails de la partie</Text>
                        <Pressable onPress={onClose}>
                            <FontAwesome6 name="xmark" size={24} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={s.modalBody}>
                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, { color: colors.textSecondary }]}>À qui le tour?</Text>
                            <View>
                                <View style={[s.playerRow, {backgroundColor: colors.accent, borderRadius: Radius.md}]}>
                                    <FontAwesome6 name="hand" size={16} color={colors.surface} />
                                    <Text style={{color: colors.surface, fontSize: 16, fontWeight: '600', marginLeft: 8}}>{currentPlayer.name}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, { color: colors.textSecondary }]}>Joueurs</Text>
                            <View style={{width:'50%'}}>
                                {sortedPlayers.map((p, idx) => (
                                    <View key={idx} style={[s.playerRow, {backgroundColor: colors.surfaceElevated, borderRadius: Radius.md, borderLeftWidth: 4, borderLeftColor: p.id === currentPlayer.id ? colors.accent : 'transparent'}]}>
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={{ color: colors.text, fontSize: 16, width: '44%' }}>{p.name} {p.id === currentPlayer.id ? '→' : ''}
                                        </Text>
                                        <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600', width:'50%', textAlign:'center'}}>{p.score.toLocaleString()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={s.modalRow}>
                            <Text style={[s.modalSectionTitle, { color: colors.textSecondary }]}>Informations</Text>
                            <View style={{gap:4, width:'50%'}}>
                                <Text style={{color: colors.text, fontSize: 14}}>Statut: {game.status === 'ongoing' ? 'En cours' : 'En pause'}</Text>
                                <Text style={{color: colors.text, fontSize: 14}}>Mode: {game.mode === 'local' ? 'Partie locale' : 'Partie en ligne'}</Text>
                                <Text style={{ color: colors.text, fontSize: 14 }}>Commencée: {formatRelativeTime(game.startedAt)}</Text>
                                <Text style={{ color: colors.text, fontSize: 14 }}>Durée: {formatDuration(game.gameState.duration/1000)}</Text>
                            </View>
                        </View>

                        <Rules rulesInit={game.rules}/>
                    </View>

                    <View style={s.modalButtonContainer}>
                        <Pressable 
                            style={[s.modalButton, {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent}]} 
                            onPress={onClose}
                        >
                            <Text style={{color: colors.accent, fontSize: 16, fontWeight: '600'}}>Fermer</Text>
                        </Pressable>
                        <Pressable 
                            style={[s.modalButton, {backgroundColor: colors.accent}]} 
                            onPress={() => {
                                onClose();
                                router.push({ pathname: '/game', params: { mode: game.mode, players: JSON.stringify(game.gameState.players), initialGameState: JSON.stringify(game.gameState), initialRules: JSON.stringify(game.rules)} });
                                
                            }}
                        >
                            <FontAwesome6 name="play" size={16} color={colors.surface} style={{marginRight: 8}} />
                            <Text style={{color: colors.surface, fontSize: 16, fontWeight: '600'}}>Continuer</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function Play() {
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'light']
    const db = useSQLiteContext()
    const isFocused = useIsFocused()

    const [gameHistoric, setGameHistoric] = useState<Game[]>([])
    const [onGoingGames, setOnGoingGames] = useState<Game[]>([])
    const [historyModalVisible, setHistoryModalVisible] = useState(false)
    const [savedGameModalVisible, setSavedGameModalVisible] = useState(false)
    const [selectedHistory, setSelectedHistory] = useState<Game | undefined>()
    const [selectedGame, setSelectedGame] = useState<Game | undefined>()

    const getGameHistoric = async () => {
        const games = await getGamesByStatus(db, 'completed')
        //console.log('historic games', games)
        setGameHistoric(games)
    }

    const getOngoingGames = async () => {
        const games = await getGamesByStatus(db, 'ongoing')
        //console.log("ongoing games", games)
        setOnGoingGames(games)
    } 

    useFocusEffect(useCallback(() => {
        getGameHistoric()
        getOngoingGames()
    }, [isFocused]))

    return (
        <View style={s.container}>
            <View style={[s.listContainer, {borderRadius:Radius.lg}]}>                
                <FlatList
                    ListHeaderComponent={() => <Text style={s.listTitle}>Historique</Text>}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal:8 }}
                    style={{ borderRadius:Radius.md }}
                    data={gameHistoric}
                    renderItem={({ item, index }) => (
                        <View key={`historyLine-${index}`}>
                            <HistoryLine game={item} onPress={() => {
                                setSelectedHistory(item);
                                setHistoryModalVisible(true);
                            }}/>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={{height:140, width:'100%', justifyContent:'center',}}>
                            <Text style={[s.listTitle, { textAlign: 'center' }]}>Aucune partie trouvée...</Text>
                        </View>
                    }
                />
            </View>
            <View style={[s.listContainer,  {borderRadius:Radius.lg} ]}>
                <FlatList
                    ListHeaderComponent={() => <Text style={s.listTitle}>Parties en cours</Text>}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal:8 }}
                    style={{ borderRadius:Radius.md }}
                    data={onGoingGames}
                    renderItem={({ item, index }) => (
                        <View key={`OngoingGamesLine-${index}`}>
                            <OngoingsLine game={item} onPress={() => {
                                setSelectedGame(item);
                                setSavedGameModalVisible(true);
                            }}/>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={{height:140, width:'100%', justifyContent:'center'}}>
                            <Text style={[s.listTitle, { textAlign: 'center' }]}>Aucune partie trouvée...</Text>
                        </View>
                    }
                />
            </View>
            <View style={s.btnContainer}>
                <Text style={{color:colors.text, fontSize:16}}>Créer une partie</Text>
                <ButtonAbs borderColor={colors.accent} backgroundColor={colors.accentMuted} style={s.playBtn}
                    onPress={() => {
                        router.push({pathname:'/game', params:{players:JSON.stringify([PLAYERS_INIT[0]])}})
                    }}
                >
                    <FontAwesome6 name="globe" size={24} color={colors.accent} />
                    <Text style={[s.btnTitle, {color:colors.text}]}>
                        Test
                    </Text>
                </ButtonAbs>
                <ButtonAbs borderColor={colors.border} backgroundColor={colors.surface} style={s.playBtn}
                    onPress={() => {
                        router.push('/(tabs)/play/setupLocal')
                    }}
                >
                    <FontAwesome6 name="users" size={24} color={colors.border} />
                    <Text style={[s.btnTitle, {color:colors.text}]}>
                        Locale
                    </Text>
                </ButtonAbs>
            </View>

            <HistoryDetailModal game={selectedHistory} visible={historyModalVisible} onClose={() => setHistoryModalVisible(false)} />
            <SavedGameDetailModal game={selectedGame} visible={savedGameModalVisible} onClose={() => setSavedGameModalVisible(false)} />
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1, 
        height: '100%',
        width: '100%',
        alignItems: 'center',
        flexDirection: 'column',
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap:8
    },
    listContainer: {
        maxHeight: '33%',
        height: '33%',
        borderWidth: 1,
        borderColor: 'lightgray',
        width: '100%',
        paddingHorizontal: 8,
        paddingVertical:4
    },
    listTitle: {
        color: 'grey',
        fontSize: 16,
        marginLeft: 8,
        marginTop:4
    },
    listItem: { flex: 1, width: '100%', flexDirection: 'column', gap: 4, paddingHorizontal: 8, paddingVertical: 4, },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
    },
    timeText: {
        fontSize: 14,
    },
    playersText: {
        fontSize: 16,
    },
    metaText: {
        fontSize: 13,
    },
    btnContainer: {
        height: '33%',
        width: '100%',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems:'center',
        gap:8
    },
    playBtn: {
        width: '100%',
        borderRadius: 8,
    },
    btnTitle: {
        fontSize:20
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: Radius.lg,
        borderTopRightRadius: Radius.lg,
        padding: 20,
        maxHeight: '95%',
        flexBasis: 'auto',
        minHeight: 'auto',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    modalBody: {
        marginBottom: 16,
        gap:16
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems:'center'
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    playerRow: {
        width:'100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 6,
        gap:16
    },
    modalButtonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
})