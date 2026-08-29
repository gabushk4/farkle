import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

type Props = {
    onShake: (angle: number, strength: number) => void;
    idleThreshold?: number;
    updateIntervalMs?: number;
    quietDurationMs?: number;
    isShaking: SharedValue<boolean>
}

export function useShakeDrivenForce(
    {
        onShake,
        idleThreshold = 1,
        updateIntervalMs = 50,
        quietDurationMs = 500,
        isShaking 
    } : Props
) {
    const shakeIntensity = useSharedValue(0); // magnitude courante (delta par rapport à 1G)
    const hasShakenOnce = useSharedValue(false); // évite de déclencher un roll au tout premier rendu
    const quietSince = useRef<number | null>(null); // JS thread, sert juste à mesurer la durée de calme
    
    
    useEffect(() => {
        Accelerometer.setUpdateInterval(updateIntervalMs);
        const subscription = Accelerometer.addListener(({ x, y, z }) => {
            const magnitude = Math.sqrt(x * x + y * y + z * z);
            const delta = Math.abs(magnitude - 1);
            if (delta > idleThreshold) {
                isShaking.value = true
                const angle = Math.atan2(y, x);
                const strength = Math.min(delta * 3, 6);
                onShake(angle, strength);
            }
        });
        return () => subscription.remove();
    }, [onShake, idleThreshold, updateIntervalMs]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (
                hasShakenOnce.value &&
                !isShaking.value &&
                quietSince.current !== null &&
                Date.now() - quietSince.current > quietDurationMs
            ) {
                // on a shaké, puis arrêté depuis assez longtemps -> on déclenche le roll une seule fois
                hasShakenOnce.value = false; // reset, pour ne pas re-déclencher tant qu'on n'a pas re-shaké
                
            }

            // NOUVEAU: on remet isShaking à false une fois qu'on a eu une lecture calme
            if (shakeIntensity.value <= idleThreshold) {
                isShaking.value = false;
            }
        }, 50);

        return () => clearInterval(interval);
    }, [quietDurationMs, idleThreshold]);
}