import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type InputMode = "joystick" | "dpad" | "keyboard";

export interface VirtualControllerState {
    velocity: number;
    angle: number;
}

interface VirtualControllerContextValue {
    state: VirtualControllerState;
    updateState: (partial: Partial<VirtualControllerState>) => void;
    resetState: () => void;
}

const VirtualControllerContext = createContext<VirtualControllerContextValue | null>(null);

export function useVirtualController(): VirtualControllerContextValue {
    const context = useContext(VirtualControllerContext);
    if (!context) {
        throw new Error("useVirtualController must be used within VirtualControllerProvider");
    }
    return context;
}

export function VirtualControllerProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<VirtualControllerState>({ velocity: 0, angle: 0 });
    const stateRef = useRef<VirtualControllerState>({ velocity: 0, angle: 0 });

    const updateState = useCallback((partial: Partial<VirtualControllerState>) => {
        const next = { ...stateRef.current, ...partial };
        stateRef.current = next;
        setState(next);
    }, []);

    const resetState = useCallback(() => {
        const zeroState = { velocity: 0, angle: 0 };
        stateRef.current = zeroState;
        setState(zeroState);
    }, []);

    const contextValue = useMemo(() => ({
        state: state,
        updateState: updateState,
        resetState: resetState,
    }), [state, updateState, resetState]);

    return (
        <VirtualControllerContext.Provider value={contextValue}>
            {children}
        </VirtualControllerContext.Provider>
    );
}

export type MovementCommandSender = (vector: VirtualControllerState) => Promise<void>;
