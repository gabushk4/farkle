import { Keyboard, Pressable } from "react-native";

export default function KeyboardDismisser({zIndex}: {zIndex?:number}){
    return (
        <Pressable
            style={{ position: 'absolute', zIndex: zIndex ?? 0, flex: 1, height: '100%', width: '100%' }}
            onPress={() => {
                if (Keyboard.isVisible())
                    Keyboard.dismiss()
            }}
        />
    )
}