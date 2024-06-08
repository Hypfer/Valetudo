import React from "react";
import {useGetter} from "../utils";

export const useCommittingSlider = (initialValue: number, onChange: (value: number) => void, maxWait: number): [
    number,
    (event: unknown, value: number | number[]) => void,
    (event: unknown, value: number | number[]) => void,
    boolean
] => {
    const [sliderValue, setSliderValue] = React.useState(initialValue);
    const [adoptedValue, setAdoptedValue] = React.useState(initialValue);
    const [pending, setPending] = React.useState(false);
    const [resetTimeout, setResetTimeout] = React.useState<any>();
    const getResetTimeout = useGetter(resetTimeout);

    React.useEffect(() => {
        if (adoptedValue !== initialValue) {
            clearTimeout(getResetTimeout());
            setPending(false);

            setSliderValue(initialValue);
            setAdoptedValue(initialValue);
        } else if (initialValue !== sliderValue) {
            clearTimeout(getResetTimeout());

            setPending(true);

            setResetTimeout(setTimeout(() => {
                setSliderValue(initialValue);

                setPending(false);
            }, maxWait));
        }
    }, [sliderValue, initialValue, adoptedValue, getResetTimeout, maxWait]);

    const handleSliderChange = React.useCallback(
        (_event: unknown, value: number | number[]) => {
            if (typeof value !== "number") {
                return;
            }

            setSliderValue(value);
        },
        []
    );
    const handleSliderCommitted = React.useCallback(
        (event: unknown, value: number | number[]) => {
            if (typeof value !== "number") {
                return;
            }
            setSliderValue(value);
            onChange(value);
        },
        [onChange]
    );

    return [sliderValue, handleSliderChange, handleSliderCommitted, pending];
};
