import { Colors } from "@/constants/theme";
import { useEffect, useRef, useState } from "react";
import { Dimensions, LayoutRectangle, Text, useColorScheme, View } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from 'expo-haptics'
import { scheduleOnRN } from "react-native-worklets";

function DigitColumn({ digit, animate, height = 40 }: { digit: number; animate: boolean; height?: number }) {
    const translateY = useSharedValue(-digit * height);
    const theme = useColorScheme() ?? 'light'
    const colors = Colors[theme]

    useEffect(() => {
        //toujours suivre digit, juste varier l'easing/duration selon animate
        translateY.value = animate
            ? withTiming(-digit * height, { duration: 800, easing: Easing.elastic(2) })
            : withTiming(-digit * height, { duration: 150 }); // transition discrète même sans le show complet
    }, [digit, animate]);


    let lastSnap = useRef(0)
    useAnimatedReaction(() => translateY.value, (v) => {
        if (Math.abs(v - lastSnap.current) >= height) {
            lastSnap.current = v
            scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Rigid)
        }
    })

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={{ height, overflow: 'hidden' }}>
            <Animated.View style={style}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <Text key={i} style={{color:colors.accent, height, fontSize: height * 0.7, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                        {i}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
}

const SCALE_INIT = 1

export default function CasinoScoreCounter({ value, digits = 5, animate, startPosition, onAnimationEnd }: { value: number; digits?: number; animate: boolean; startPosition: LayoutRectangle; onAnimationEnd: () => void }) {
    const paddedValue = String(value).padStart(digits, '0');
    const latestPaddedValue = useRef(paddedValue);
    latestPaddedValue.current = paddedValue; // NOUVEAU: toujours à jour à chaque render
    
    const { height: WIN_H, width: WIN_W } = Dimensions.get('window')

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(SCALE_INIT); // petit au départ 
    const opacity = useSharedValue(1);
    const [score, setScore] = useState(paddedValue)
    const [animateDigits, setAnimateDigits] = useState(false)
    
    const centerX = WIN_W / 2 
    const centerY = WIN_H / 2
    
    const targetTranslateX = centerX - (startPosition.x + startPosition.width / 2);
    const targetTranslateY = centerY - (startPosition.y + startPosition.height / 2);

    
    const translateConfig = { duration: 500, easing: Easing.out(Easing.cubic) }
    const scaleConfig = { duration: 500, easing: Easing.out(Easing.back(1.5)) }

    useEffect(() => {
        if (animate) {
            console.log("casionScoreCounter:", value)
            translateX.value = 0;
            translateY.value = 0;
            scale.value = SCALE_INIT;
            opacity.value = withTiming(1, { duration: 100 });

            translateY.value = withTiming(targetTranslateY, translateConfig);
            translateX.value = withTiming(targetTranslateX, translateConfig)
            scale.value = withTiming(2, scaleConfig);

            const scoreTimeout = setTimeout(() => {
                setAnimateDigits(true) 
                setScore(latestPaddedValue.current)
            }, scaleConfig.duration)
                    
            const fadeTimeout = setTimeout(() => {
                setAnimateDigits(false)
                scale.value = withTiming(SCALE_INIT, { ...scaleConfig, duration: 300 });
                translateY.value = withTiming(0, { ...translateConfig, duration: 300 })
                translateX.value = withTiming(0, { ...translateConfig, duration: 300 })
                onAnimationEnd()
            }, 1400);

            return () => {
                clearTimeout(fadeTimeout)
                clearTimeout(scoreTimeout)
            };
        }        
    }, [animate]);

    useEffect(() => {
        console.log("setScore", {animate, value})
        if (!animate) setScore(latestPaddedValue.current)
    }, [animate, latestPaddedValue.current])

    const containerStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: startPosition.y,
        left: startPosition.x,
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }, {translateX:translateX.value}, { scale: scale.value }],
    }));

    return (
        <Animated.View style={[containerStyle, { flexDirection: 'row' }]}>
            {score.split('').map((char, i) => (
                <DigitColumn animate={animateDigits} key={i} digit={Number(char)} />
            ))}
        </Animated.View>
    );
}