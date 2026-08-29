import { useGameState } from "@/game/gameStateContext";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import ButtonAbs from "./ui/button";
import { Colors } from "@/constants/theme";

export function LocalReadyOverlay() {
    const colorScheme = useColorScheme()
    const colors = Colors[colorScheme ?? 'light']

    const { state, confirmReadyForNextTurn } = useGameState();

    if (!state.isWaitingForNextTurn) return null;

    return (
        <View style={styles.overlay}>
            <View style={[styles.backdrop, { backgroundColor: colors.background }]} />            
            <Text style={{ color: colors.text, fontSize: 20, textAlign:'center' }}>Au tour de {'\n'} {state.players[state.currentPlayerIndex].name}</Text>            
            <ButtonAbs borderColor={colors.accent} backgroundColor={colors.accentMuted} onPress={confirmReadyForNextTurn}>
                <Text style={{color:colors.text, fontSize:16}}>Prêt</Text>
            </ButtonAbs>
        </View>
    );
}

export function OnlineReadyOverlay() {
    return(<></>)
}

const styles = StyleSheet.create({
    overlay: {
        flex:1,
        position: 'absolute',
        height: '100%',
        width: '100%',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        flexDirection:'column'
    },
    backdrop: {
        position: 'absolute',
        height: '150%',
        width: '100%',
        zIndex: 0,
        opacity:0.8
    }
})