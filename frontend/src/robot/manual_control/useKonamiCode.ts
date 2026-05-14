import { useEffect, useRef } from "react";

const konamiSequence = [
    "arrowup", "arrowup", "arrowdown", "arrowdown",
    "arrowleft", "arrowright", "arrowleft", "arrowright",
    "b", "a", "enter"
];

export function useKonamiCode(onUnlock: () => void) {
    const sequenceIndex = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement) {
                return;
            }

            const key = e.key.toLowerCase();

            if (key === konamiSequence[sequenceIndex.current]) {
                sequenceIndex.current++;
                if (sequenceIndex.current === konamiSequence.length) {
                    onUnlock();
                    sequenceIndex.current = 0;
                }
            } else {
                sequenceIndex.current = key === konamiSequence[0] ? 1 : 0;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onUnlock]);
}
