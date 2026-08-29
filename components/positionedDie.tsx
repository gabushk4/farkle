import { forwardRef, useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { runOnJS, scheduleOnRN } from "react-native-worklets";

import Die from "./die";
import { DieHandle, DiceZone } from '@/game/types';
import { Text } from "react-native";


// Wrapper qui prend la position physique du parent + garde l'animation squash/flip locale + gere le drag & drop
const PositionedDie = forwardRef<DieHandle, {
    posX: SharedValue<number>
    posY: SharedValue<number>
    velX: SharedValue<number>
    velY: SharedValue<number>
    isDragging: SharedValue<boolean>
    onRollEnd: (value: number) => void
    radius: number
    highlighted: boolean
    zone: SharedValue<DiceZone>
    groupId?: string
    pointsTrayBounds: { x: number; y: number; width: number; height: number }
    onDroppedInPoints: (index: number) => void
    onDroppedInField: (index: number) => void
    index: number
}>(({ posX, posY, velX, velY, onRollEnd, radius, highlighted, zone, groupId, pointsTrayBounds, onDroppedInPoints, isDragging, index, onDroppedInField }, ref) => {      
    
    const VEL_DIVIDER = 120

    const hasDropped = useSharedValue(false)

    const dragGesture = Gesture.Pan()
        .enabled(zone.value !== 'locked')
        .onStart(() => {
            isDragging.value = true
            hasDropped.value = false
        })
        .onChange((e) => {
            if (zone.value === 'locked') return 
            
            posX.value += e.changeX;
            posY.value += e.changeY;
            velX.value = e.velocityX / VEL_DIVIDER
            velY.value = e.velocityY / VEL_DIVIDER
        })
        .onEnd(() => {            
            if (posY.value - radius > pointsTrayBounds.y && !hasDropped.value) { //si le de tombe dans le pointsTray (en bas de son y)      
                hasDropped.value = true
                scheduleOnRN(onDroppedInPoints, index)
            } else if(zone.value === 'scored') { // we put it back in field
                scheduleOnRN(onDroppedInField, index)
            }
            isDragging.value = false
        })
    
    const positionStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        zIndex: zone.value === 'scored' ? 0 : 1,
        left: posX.value - radius,
        top: posY.value - radius
    }));

    return (
        <GestureDetector gesture={dragGesture}>
            
            <Animated.View style={positionStyle}>
                <Text style={{color:'white'}}>{hasDropped.value}</Text>
                <Die ref={ref} onRollEnd={onRollEnd} highlighted={highlighted} />
            </Animated.View>
        </GestureDetector>
    );
});

export default PositionedDie