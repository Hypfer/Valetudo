import React from "react";
import {useGetter} from "../utils";

export const useCommittingSlider = (initialValue: number, onChange: (value: number) => void): [
    number,
    (event: unknown, value: number | number[]) => void,
    (event: unknown, value: number | number[]) => void
] => {
    const [sliderValue, setSliderValue] = React.useState(initialValue);
    const [adoptedValue, setAdoptedValue] = React.useState(initialValue);
    const [resetTimeout, setResetTimeout] = React.useState<any>();
    const getResetTimeout = useGetter(resetTimeout);

    React.useEffect(() => {
        if (adoptedValue !== initialValue) {
            clearTimeout(getResetTimeout());

            setSliderValue(initialValue);
            setAdoptedValue(initialValue);
        } else if (initialValue !== sliderValue) {
            clearTimeout(getResetTimeout());

            setResetTimeout(setTimeout(() => {
                setSliderValue(initialValue);
            }, 2000));
        }
    }, [sliderValue, initialValue, adoptedValue, getResetTimeout]);

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

    return [sliderValue, handleSliderChange, handleSliderCommitted];
};
