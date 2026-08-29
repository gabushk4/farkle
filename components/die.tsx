import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, View } from "react-native";
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { DieHandle } from '@/game/types';

const POINTS_LAYOUT = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
} as { [key: number]: number[]}

function Face({ face, size = 60, highlighted = false }: { face: number, size?: number, highlighted?: boolean }) {
    const points = POINTS_LAYOUT[face] || [] 

    return (
        <View style={[s.face, {width: size, height:size, backgroundColor: highlighted ? 'gold' : 'white'}]}> 
            {Array.from({ length: 9 }).map((_, i) => (
                <View style={s.cell} key={`p-${i}`}>
                    {points.includes(i) && <View style={s.point}/>}
                </View>
            ))}
        </View>
    )
}

// NOUVEAU: un fantôme, copie floue/transparente qui traîne derrière le dé principal
function GhostFace({ face, opacity, offsetX, offsetY, rotate }: {
    face: number,
    opacity: SharedValue<number>,
    offsetX: SharedValue<number>,
    offsetY: SharedValue<number>,
    rotate: SharedValue<number>
}) {
    const ghostStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        opacity: opacity.value,
        transform: [
            { translateX: offsetX.value },
            { translateY: offsetY.value },
            { rotateZ: `${rotate.value}deg` },
        ],
    }));

    return (
        <Animated.View style={ghostStyle}>
            <Face face={face}/>
        </Animated.View>
    );
}



const Die = forwardRef<DieHandle, { onRollEnd?: (face: number) => void, highlighted: boolean }>(
    ({ onRollEnd, highlighted }, ref) => {
        const [face, setFace] = useState(1);
        const [ghostFace1, setGhostFace1] = useState(1);
        const [ghostFace2, setGhostFace2] = useState(1);

        const scaleX = useSharedValue(1);
        const scaleY = useSharedValue(1);
        const rotateZ = useSharedValue(0);

        const ghost1Opacity = useSharedValue(0);
        const ghost1X = useSharedValue(0);
        const ghost1Y = useSharedValue(0);
        const ghost1Rot = useSharedValue(0);

        const ghost2Opacity = useSharedValue(0);
        const ghost2X = useSharedValue(0);
        const ghost2Y = useSharedValue(0);
        const ghost2Rot = useSharedValue(0);

        const roll = (index?:number) => {
            const finalValue = index ?? Math.floor(Math.random() * 6) + 1;
            const stepDurations = [70, 80, 90, 110];
            let step = 0;
            let previousFace = face;

            const doStep = () => {
                const isLast = step === stepDurations.length - 1;
                const duration = stepDurations[step];
                const progress = step / (stepDurations.length - 1);
                const amplitude = 1 - progress;
                const isFastPhase = amplitude > 0.5;
                const squashOnX = Math.random() > 0.5;

                if (isLast) {
                    scaleX.value = withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.quad) });
                    scaleY.value = withSequence(
                        withTiming(0.05, { duration: duration / 2, easing: Easing.in(Easing.quad) }),
                        withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.quad) })
                    );
                } else if (squashOnX) {
                    scaleX.value = withSequence(
                        withTiming(0.05, { duration: duration / 2, easing: Easing.in(Easing.quad) }),
                        withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.quad) })
                    );
                    scaleY.value = withTiming(1, { duration: duration / 2 });
                } else {
                    scaleY.value = withSequence(
                        withTiming(0.05, { duration: duration / 2, easing: Easing.in(Easing.quad) }),
                        withTiming(1, { duration: duration / 2, easing: Easing.out(Easing.quad) })
                    );
                    scaleX.value = withTiming(1, { duration: duration / 2 });
                }

                rotateZ.value = withTiming(isLast ? 0 : (Math.random() - 0.5) * 20, { duration });

                if (isFastPhase) {
                    setGhostFace2(ghostFace1);
                    setGhostFace1(previousFace);

                    ghost1Opacity.value = withSequence(withTiming(0.35, { duration: 20 }), withTiming(0, { duration: Math.max(duration - 20, 10) }));
                    ghost1X.value = withTiming((Math.random() - 0.5) * 10, { duration });
                    ghost1Y.value = withTiming((Math.random() - 0.5) * 6, { duration });
                    ghost1Rot.value = withTiming((Math.random() - 0.5) * 25, { duration });

                    ghost2Opacity.value = withSequence(withTiming(0.18, { duration: 20 }), withTiming(0, { duration: Math.max(duration - 20, 10) }));
                    ghost2X.value = withTiming((Math.random() - 0.5) * 16, { duration });
                    ghost2Y.value = withTiming((Math.random() - 0.5) * 10, { duration });
                    ghost2Rot.value = withTiming((Math.random() - 0.5) * 35, { duration });
                }

                setTimeout(() => {
                    previousFace = face;
                    const nextFace = isLast ? finalValue : Math.floor(Math.random() * 6) + 1;
                    setFace(nextFace);
                }, duration / 2);

                step++;
                if (step < stepDurations.length) {
                    setTimeout(doStep, duration);
                } else if (onRollEnd) {
                    onRollEnd(finalValue);
                }
            };

            doStep();
        };

        useImperativeHandle(ref, () => ({
            roll,
        }));

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [
                { scaleX: scaleX.value },
                { scaleY: scaleY.value },
                { rotateZ: `${rotateZ.value}deg` },
            ],
        }));

        return (
            <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
                <GhostFace face={ghostFace2} opacity={ghost2Opacity} offsetX={ghost2X} offsetY={ghost2Y} rotate={ghost2Rot}/>
                <GhostFace face={ghostFace1} opacity={ghost1Opacity} offsetX={ghost1X} offsetY={ghost1Y} rotate={ghost1Rot}/>
                <Animated.View style={animatedStyle}>
                    <Face face={face} highlighted={highlighted} />
                </Animated.View>
            </View>
        );
    }
);

export default Die;

const s = StyleSheet.create({
    face: {
        backgroundColor: 'white',
        borderRadius: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 4,
    },
    cell: {
        width: '33.33%',
        height: '33.33%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    point: {
        width: '55%',
        height: '55%',
        borderRadius: 999,
        backgroundColor: '#222',
    },
})