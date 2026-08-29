import KeyboardDismisser from "@/components/keyboardDismisser";
import Rules from "@/components/rulesDisplay";
import ButtonAbs from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import { Colors, Radius, Typography } from "@/constants/theme";
import { GameRules, RULES_LABELS, useRules } from "@/game/rulesContext";
import { GameState, Player } from "@/game/types";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { push } from "expo-router/build/global-state/routing";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AnimatedScrollView } from "react-native-reanimated/lib/typescript/component/ScrollView";

const LINE_HEIGHT = 56
const PSEUDO_PARTS = 5
const LINE_PART =  100/6
const BTN_WIDTH = LINE_PART * PSEUDO_PARTS
export const PLAYERS_INIT : Player[] = [
        {
            id:1,
            name: 'Joueur 1',
            score: 0,
            isTurn: false,
            isComputer: false
        },
        {
            id: 2,
            name: 'Joueur 2',
            score: 0,
            isTurn: false,
            isComputer: false
        }
]

const PlayerLine = ({ player, onNameChange, onDelete, setIsComputer }: { player: Player, setIsComputer?: (id: number, newVal:boolean) => void; onNameChange: (id:number, newName:string) => void, onDelete?: (id:number) => void }) => {
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'light']
    const rad = Radius
    const ty = Typography

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(player.name)
    const inputRef = useRef<TextInput>(null);
    
    const isComputer = player.isComputer

    useEffect(() => {
        const inRef = inputRef.current
        let inRefTimeout = 0;
        if (inRef) {
            inRefTimeout = setTimeout(() => {
                inRef.focus()    
                setIsEditing(true)
            }, 300)
        }

        return () => {
            clearTimeout(inRefTimeout)
        }
    }, [])
    return (
        <View style={s.playerLine}>
            {/* <View style={{flex:1}}>
                {setIsComputer &&
                    <TouchableOpacity
                        style={[s.sideBtn, { backgroundColor: colors.surfaceElevated }]}
                        onPress={()=>setIsComputer(player.id, !isComputer)}
                    >
                        <FontAwesome6 name="robot" size={24} color={isComputer?colors.accent : colors.textSecondary} />
                    </TouchableOpacity>
                }
            </View> */}
            <TouchableOpacity
                onPress={() => {
                    if(isComputer) return
                    setIsEditing(true);
                    inputRef.current?.focus();
                }}
                style={[s.playerPseudo, {borderRadius: rad.lg, backgroundColor: colors.surfaceElevated, borderColor: isEditing ? colors.accent : 'transparent'}]}>
                <TextInput
                    ref={inputRef}
                    value={name}
                    selectTextOnFocus={true}
                    onChangeText={(text) => setName(text)} 
                    onBlur={() => {
                        setIsEditing(false)
                        setName(name.trim())
                        onNameChange(player.id, name.trim())
                    }}
                    style={[{ color: colors.text }, ty.scoreSmall]}
                    editable={true}
                    pointerEvents="none"  
                />
                <View style={{ position: 'absolute', right: 16 }}>
                    {!isComputer &&                        
                        <FontAwesome6 name="pen" size={24} color={isEditing ? colors.tint : colors.textSecondary} />                    
                    }
                </View>
            </TouchableOpacity>
            <View style={{flex:1}}>
                {onDelete &&
                    <TouchableOpacity style={[s.sideBtn, { backgroundColor: colors.surfaceElevated }]}
                        onPress={() => {
                            onDelete(player.id)
                        }}
                    >
                        <FontAwesome6 name="trash" color={colors.danger} size={20} />
                    </TouchableOpacity>
                }
            </View>
        </View>
    )
}

const AddPlayers = ({ players, setPlayers }: {players:Player[], setPlayers:React.Dispatch<SetStateAction<Player[]>>}) => {   
    const height = useSharedValue<number>(LINE_HEIGHT * PLAYERS_INIT.length + 17 * (PLAYERS_INIT.length - 1))
    
    const listRef = useRef<AnimatedScrollView>(null)

    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'light']
    const radius = Radius

    const listAnimated = useAnimatedStyle(() => ({
        height: height.value
    }))

    useEffect(() => {
        const gap = 17 * (players.length - 1)
        height.value = withTiming(LINE_HEIGHT * players.length + gap)
    }, [players])

    return (
        <View style={[s.addPlayersContainer, { borderRadius: radius.sm, backgroundColor: colors.surface }]}>
            <KeyboardDismisser />
            <Animated.ScrollView
                ref={listRef}
                style={[{ width: '100%' }, listAnimated]}>
                {players.map((player, index) => (
                    <View key={`p-${index}`} style={{alignItems:'flex-start',gap:8}}>
                        <PlayerLine player={player}
                            onNameChange={(id, newName) => {
                                //console.log("onNameChange:", {id, newName})
                                setPlayers((prev) =>
                                    prev.map(j => j.id === id ? { ...j, name: newName.trim() } : j)
                                )
                            }}
                            onDelete={index < 2 ? undefined : (id: number) => {
                                //console.log("deleting", id)
                                setPlayers((prev) => prev.filter((j) => j.id != id))
                            }}
                            setIsComputer={index < 1 ? undefined : (id: number, newVal:boolean) => {                                
                                setPlayers((prev) => prev.map(p => p.id === id ? {...p, isComputer: newVal, name:newVal ? "Ordi" : `Joueur ${id}`} : p))
                            }}
                        />                    
                        {players.length - 1 != index && <View style={{ height:1, marginLeft:16, marginBottom:8, width:`${BTN_WIDTH - 12}%`, backgroundColor:colors.border}} />}
                    </View>
                ))}
            </Animated.ScrollView>
            <TouchableOpacity
                style={{ width: 56, aspectRatio: 1 / 1, alignItems: 'center', justifyContent: 'center', borderRadius: 100, backgroundColor: colors.accent }}
                onPress={() => {
                    const id = players.length + 1
                    const newPlayer: Player = {id, name:`Joueur ${id}`, score:0, isTurn:false, isComputer:false} 
                    setPlayers((prev) => [...prev, newPlayer])
                    setTimeout(()=>listRef.current?.scrollToEnd({animated:true}), 50)
                }}
            >
                <FontAwesome6 name="plus" size={44} color={colors.surfaceElevated} />
            </TouchableOpacity>
        </View>
    )   

}

export default function SetupLocal() {
    const rules = useRules()
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'light']
    const ty = Typography

    const [players, setPlayers] = useState(PLAYERS_INIT)
    
    return (
        <View style={s.container}>
            <KeyboardDismisser />
            <Text style={[{color:colors.textSecondary}, ty.scoreSmall]}>Ajouter des joueurs</Text>
            <AddPlayers players={players} setPlayers={setPlayers} />
            <Rules/>
            <ButtonAbs
                onPress={() => {                    
                    push({ pathname: '/game', params: { players: JSON.stringify(players), mode: 'local' } })
                }}
                borderColor={colors.accent}
                backgroundColor={colors.accentMuted}
                style={{height:96, position:'absolute', bottom:16}}
            >
                <Text style={[{color:colors.text}, ty.scoreLarge]}>Jouer</Text>
            </ButtonAbs>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        flex: 1, 
        width: '100%',
        height: '100%',
        alignItems: 'center',
        paddingHorizontal: 16, 
        paddingVertical:8,
        gap:16
    },
    addPlayersContainer: {
        maxHeight: '50%',
        width:'100%',
        borderWidth: 1, 
        padding: 8,
        alignItems: 'center',
        gap:8
    },
    playerLine: {
        flex:6,
        width: '100%',
        height: LINE_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap:8
    },
    sideBtn: {
        flex: 1,
        aspectRatio:1/1,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerPseudo: {
        flex: PSEUDO_PARTS,
        maxWidth: `${BTN_WIDTH}%`,
        height: '100%',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    
    
})