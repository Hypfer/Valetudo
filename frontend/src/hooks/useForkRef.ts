import React from "react";

const setRef = <T>(ref: React.ForwardedRef<T>, value: T) => {
    if (typeof ref === "function") {
        ref(value);
    } else if (ref) {
        ref.current = value;
    }
};

const useForkRef = <T>(
    refA: React.ForwardedRef<T>,
    refB: React.ForwardedRef<T>
): ((value: T) => void) | null => {
    /**
     * This will create a new function if the ref props change and are defined.
     * This means react will call the old forkRef with `null` and the new forkRef
     * with the ref. Cleanup naturally emerges from this behavior
     */
    return React.useMemo(() => {
        if (refA === null && refB === null) {
            return null;
        }

        return (refValue: T) => {
            setRef(refA, refValue);
            setRef(refB, refValue);
        };
    }, [refA, refB]);
};

export { useForkRef };
