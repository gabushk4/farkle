import { DiceZone, TrayBounds } from '@/game/types';
import SetupDicePosition from '@/functions/setupDice';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { runOnJS, SharedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';



export function useDicePhysics(
    numDice: number,
    bounds: TrayBounds,
    dieSize: number = 60,
    zones: SharedValue<DiceZone>[]
) {
    const DIE_SIZE = dieSize;
    const DIE_RADIUS = DIE_SIZE / 2;
    const FRICTION = 0.90;
    const RESTITUTION = 1;
    const STRENGTH_MULT = 4.5

    const locked = useSharedValue(false)
    const boundsWidth = useSharedValue(bounds?.width || 0);
    const boundsHeight = useSharedValue(bounds?.height || 0);
    const boundsX = useSharedValue(bounds?.x || 0);
    const boundsY = useSharedValue(bounds?.y || 0);

    const isDragging = Array.from({ length: numDice }, () => useSharedValue(false)); // NOUVEAU
    const isShaking = useSharedValue(false)

    const posX = Array.from({ length: numDice }, (_, i) => useSharedValue((boundsWidth.value / 2 - DIE_SIZE) + DIE_SIZE * (i % 3)));
    const posY = Array.from({ length: numDice }, (_, i) => useSharedValue( i < 3 ? (boundsHeight.value / 2 - DIE_SIZE/2) : (boundsHeight.value / 2 - DIE_SIZE/2) + DIE_SIZE));
    const velX = Array.from({ length: numDice }, () => useSharedValue(0));
    const velY = Array.from({ length: numDice }, () => useSharedValue(0));

    //état continu du shake, mis à jour par l'accéléromètre à chaque lecture
    const applyForce = (angle: number, strength: number) => {                
        'worklet';
        if(locked.value) return
        for (let i = 0; i < numDice; i++) {
            //console.log("apply force zones", zones[i].value)
            if (zones[i].value !== 'field') continue;
            const newAngle = angle + (Math.random() - 0.5) * (Math.PI / 2);
            velX[i].value += Math.cos(newAngle) * (strength * STRENGTH_MULT);
            velY[i].value += Math.sin(-newAngle) * strength;
        }        
    };

    const lastDiceCollisionHaptic = useRef(Array.from({ length: numDice }).map((v) => 0))
    const lastWallCollisionHaptic = useRef(lastDiceCollisionHaptic.current)
    const hapticInterval = 800 //ms

    useFrameCallback((info) => {
        'worklet';  
        if(locked.value) return
        // déplacement + friction + murs
        const now = info.timestamp
                    
        for (let i = 0; i < numDice; i++) {
            if (zones[i].value !== 'field' || isDragging[i].value === true) continue
            
            posX[i].value += velX[i].value;
            posY[i].value += velY[i].value;
            velX[i].value *= FRICTION;
            velY[i].value *= FRICTION;

            // detection des collisions avec le mur
            let collision = false
            // de gauche
            if (posX[i].value < boundsX.value + DIE_RADIUS) {
                posX[i].value = boundsX.value +DIE_RADIUS;
                velX[i].value = Math.abs(velX[i].value) * RESTITUTION;
                collision = true
            }
            // de droite
            if (posX[i].value > boundsX.value + boundsWidth.value - DIE_RADIUS) {
                posX[i].value = boundsX.value + boundsWidth.value - DIE_RADIUS;
                velX[i].value = -Math.abs(velX[i].value) * RESTITUTION;
                collision = true
            }
            //de haut
            if (posY[i].value < boundsY.value + DIE_RADIUS) {
                posY[i].value = boundsY.value +DIE_RADIUS;
                velY[i].value = Math.abs(velY[i].value) * RESTITUTION;
                collision = true
            }
            // de bas
            if (posY[i].value > boundsY.value + boundsHeight.value - DIE_RADIUS) {
                posY[i].value = boundsHeight.value - DIE_RADIUS;
                velY[i].value = -Math.abs(velY[i].value) * RESTITUTION;                
                collision = true
            }

            let lastWallCollisionMS = lastWallCollisionHaptic.current[i]
            if (collision && now - lastWallCollisionMS >= hapticInterval && (isShaking.value || isDragging[i].value)) {
                lastWallCollisionHaptic.current[i] = now
                scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
            }
        }

        // collisions entre les des (simple, pas de rotation ni d'angle de rebond réaliste)
        for (let i = 0; i < numDice; i++) {
            if(zones[i].value !== 'field') continue
            for (let j = i + 1; j < numDice; j++) {
                if (zones[j].value !== 'field') continue
                
                const dx = posX[j].value - posX[i].value;
                const dy = posY[j].value - posY[i].value;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = DIE_SIZE * 1.2;

                //collision detectee !
                if (dist > 0 && dist < minDist) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = minDist - dist;
                    posX[i].value -= nx * overlap * 0.5;
                    posY[i].value -= ny * overlap * 0.5;
                    if (!isDragging[j].value) { //si on le drag, on veut que le dé en poigne reste maitre
                        posX[j].value += nx * overlap * 0.5;
                        posY[j].value += ny * overlap * 0.5;
                    }

                    const vRelX = velX[j].value - velX[i].value;
                    const vRelY = velY[j].value - velY[i].value;
                    const vRelDotN = vRelX * nx + vRelY * ny;

                    if (vRelDotN < 0) {
                        const impulse = vRelDotN * RESTITUTION;
                        velX[i].value += impulse * nx;
                        velY[i].value += impulse * ny;
                        velX[j].value -= impulse * nx;
                        velY[j].value -= impulse * ny;
                    }
                    
                    let lastDieCollisionMS = lastDiceCollisionHaptic.current[i]

                    if (now - lastDieCollisionMS >= hapticInterval && (isShaking.value || (isDragging[i].value || isDragging[j].value))) {
                        lastDiceCollisionHaptic.current[i] = now
                        scheduleOnRN(Haptics.impactAsync,Haptics.ImpactFeedbackStyle.Rigid);    
                    }                    
                }
            }
        }
    }, !locked.value);

    useEffect(() => {
        boundsWidth.value = bounds?.width;
        boundsHeight.value = bounds?.height;
        boundsX.value = bounds?.x;
        boundsY.value = bounds?.y;

        if(locked.value) return
        
        for (let i = 0; i < numDice; i++) {
            if (zones[i].value !== 'field') continue
            
            const pos = SetupDicePosition(i, DIE_SIZE, numDice, bounds, 8)
            posX[i].value = pos.x 
            posY[i].value = pos.y
        } 
        
    }, [bounds?.x, bounds?.y, bounds?.width, bounds?.height]);

    return { posX, posY, velX, velY, applyForce, DIE_RADIUS, isDragging, isShaking, locked };
}