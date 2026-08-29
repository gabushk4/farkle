import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

type ShakeOptions = {
    threshold?: number;      // sensibilité — plus bas = plus sensible
    cooldownMs?: number;     // délai minimum entre deux détections
    updateIntervalMs?: number; // fréquence de lecture du capteur
};

export function useShakeDetector(onShake: (x: number, y: number, intensity: number) => void, options: ShakeOptions = {}) {
    const {
        threshold = 1.5,
        cooldownMs = 1000,
        updateIntervalMs = 100, // ~10Hz, largement suffisant pour un shake
    } = options;

    const lastShakeTime = useRef(0);

    useEffect(() => {
        Accelerometer.setUpdateInterval(updateIntervalMs);

        const subscription = Accelerometer.addListener(({ x, y, z }) => {
            // magnitude du vecteur d'accélération (en Gs, gravité incluse)
            const magnitude = Math.sqrt(x * x + y * y + z * z);

            // on soustrait ~1G (gravité au repos) pour isoler le mouvement réel
            const delta = Math.abs(magnitude - 1);

            const now = Date.now();
            if (delta > threshold && now - lastShakeTime.current > cooldownMs) {
                lastShakeTime.current = now;
                onShake(x, y, delta);
            }
        });

        return () => subscription.remove();
    }, [onShake, threshold, cooldownMs, updateIntervalMs]);
}