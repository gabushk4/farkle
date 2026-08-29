import { useEffect } from "react";
import { ImageProps, StyleSheet, TextProps, View, ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";

type Props = {
    text: string;
    color: string;
    textShadowColor?:string
    visible: boolean;
    onAnimationEnd?: () => void
    backgroundGifs?: any[],
    backgroundGifStyle?: ImageProps['style'],
    textStyle?: TextProps['style'],
    containerStyle?: ViewProps['style'],
}

export default function CasinoMessage({ text, color, textShadowColor, visible, backgroundGifs, backgroundGifStyle, textStyle, containerStyle, onAnimationEnd}: Props ) {
    const textScale = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const bgScale = useSharedValue(0); 
    const bgOpacity = useSharedValue(0); 

    useEffect(() => {
        if (visible) {
            console.log("casinoMessage visible", text)
            // le texte réagit tout de suite
            textOpacity.value = withTiming(1, { duration: 100 });
            textScale.value = withSequence(
                withSpring(1.3, { damping: 6, stiffness: 200 }),
                withSpring(1, { damping: 8 })
            );

            // le GIF suit avec un délai (~120ms) et un spring plus "lourd"
            bgOpacity.value = withDelay(120, withTiming(0.8, { duration: 200 }));
            bgScale.value = withDelay(
                120,
                withSequence(
                    withTiming(1.4, { duration: 1300 }),
                    withTiming(0.9, { duration: 500 }),
                    withTiming(1, { duration: 500 }),
                )
            );

            const timeout = setTimeout(() => {
                textOpacity.value = withTiming(0, { duration: 400 });
                bgOpacity.value = withTiming(0, { duration: 500 });                
                bgScale.value = withTiming(0, { duration: 500 })
                textScale.value = withTiming(0, { duration: 500 })
                setTimeout(()=>{onAnimationEnd?.()}, 500)
            }, 2000);

            return () => clearTimeout(timeout);
        }
    }, [visible]);

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ scale: textScale.value }],
    }));

    const bgGifAnimatedStyle = useAnimatedStyle(() => ({
        opacity: bgOpacity.value,
        transform: [{ scale: bgScale.value }],
    }));

    return (
        <View style={[styles.container, containerStyle]}>
            {backgroundGifs && (
                backgroundGifs.map((g, i) => 
                    <Animated.Image key={ 'gif' + i } source={g} style={[styles.bgGif, {zIndex:i}, bgGifAnimatedStyle, backgroundGifStyle]} resizeMode="contain" />
                )                
            )}
            <Animated.Text style={[styles.text, textAnimatedStyle, textStyle, {color, textShadowColor}]}>{text}</Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'absolute', flex:1, height:'100%', width:'100%', alignItems:'center', justifyContent:'center' },
    text: {
        zIndex:10,
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20, // glow
    },
    bgGif: {
        position:'absolute',
        aspectRatio:1/1,
        height:'100%'
    }
});