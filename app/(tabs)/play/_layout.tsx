import { Stack } from "expo-router";
export default function PlayLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Jouer',
                    headerBackButtonDisplayMode:'minimal'
                }}
            />
            <Stack.Screen
                name="setupLocal"
                options={{
                    title: "Partie locale",
                    headerBackButtonDisplayMode:'minimal'
                }}
            />
            
        </Stack>
    )
}