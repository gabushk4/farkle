import { Colors } from "@/constants/theme"
import { GameRules, RULES_LABELS, useRules } from "@/game/rulesContext"
import { Keyboard, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native"
import { Collapsible } from "./ui/collapsible"

export default function Rules({ rulesInit }: { rulesInit?: GameRules }) {
    let { rules } = useRules()
    
    if (rulesInit)
        rules = rulesInit

    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]

    return (
        <Collapsible title="Règles" childrenMaxHeight={250}
            onPress={() => {
                if (Keyboard.isVisible())
                    Keyboard.dismiss()
            }}
        >
            <ScrollView 
                style={{flex: 1}}
                contentContainerStyle={{ gap: 16, paddingVertical: 16, marginRight:8 }}                
            >
                {(Object.keys(rules) as Array<keyof GameRules>).map((key) => (
                    <View key={key} style={s.ruleRow}>
                        <Text style={[s.ruleTitle, { color: colors.text }]}>{RULES_LABELS[key]}</Text>
                        <Text style={[s.ruleValue, {color: colors.accent}]}>{rules[key]}</Text>
                    </View>
                ))}                
            </ScrollView>
        </Collapsible>
    )
}

const s = StyleSheet.create({
    ruleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    ruleTitle: {
        width:'50%',
        flexWrap: 'wrap'
    },
    ruleValue: {
        width:'50%',
        textAlign:'right'
    },
})