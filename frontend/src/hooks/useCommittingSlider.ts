import React from "react";

export const useCommittingSlider = (initialValue: number, onChange: (value: number) => void): [
    number,
    (event: unknown, value: number | number[]) => void,
    (event: unknown, value: number | number[]) => void
] => {
    const [sliderValue, setSliderValue] = React.useState(initialValue);
    const [adoptedValue, setAdoptedValue] = React.useState(initialValue);
    React.useEffect(() => {
        if (adoptedValue !== initialValue) {
            setSliderValue(initialValue);
            setAdoptedValue(initialValue);
        }
    }, [sliderValue, initialValue, adoptedValue]);

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
