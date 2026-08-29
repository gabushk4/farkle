import { Colors, Typography } from "@/constants/theme"
import { useGameState } from "@/game/gameStateContext"
import { Player } from "@/game/types"
import { StyleSheet, Text, useColorScheme, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"

const Line = ({player, index}: {player: Player, index: number}) => {
     const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]

    return (
        <View style={s.line}>
            <Text style={[s.text, { color: colors.textSecondary, textAlign:'left' }]}>{index + 1}</Text>
            <Text ellipsizeMode="tail" numberOfLines={1} style={[s.text, { color: colors.text, flex:2, textAlign:'center', }]}>{player.name}</Text>
            <Text style={[s.text, { color: colors.accent, textAlign:'right' }]}>{player.score}</Text>
        </View>
    )
}

export default function Leaderboard({ }) {
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]

    const { state } = useGameState()
    const sortedPlayers = state.players.sort((a, b) => b.score - a.score)

    return (
        <View style={s.container}>
            <Text style={[{ color: colors.textSecondary }, Typography.scoreSmall]}>Classement</Text>
            <ScrollView>
                {sortedPlayers.map((p, i) => (
                    <View key={`leaderboardLine-${i}`} style={{alignItems:'center'}}>
                        {i > 0 && <View style={[s.separator, { backgroundColor:colors.border}]} />}
                        <Line player={p} index={i} />
                    </View>                    
                ))}
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        height: '100%',
        width: '100%',
        alignItems: 'center',
        padding: 16,
        gap:16
    },
    line: {
        flexDirection: 'row',
        width: '100%',
        height: 64,
        justifyContent: 'space-between',
        alignItems: 'center',
        flex:3
    },
    separator: {
        width: '80%',
        height: 1
    },
    text: {
        fontSize: 20,
        flex: 1,
    }
})