import {Capability, PresetSelectionState, PresetValue} from "./api";
import React, {ReactElement} from "react";
import {
    FanSpeedHighIcon,
    FanSpeedLowIcon,
    FanSpeedMaxIcon,
    FanSpeedMediumIcon,
    FanSpeedMinIcon,
    FanSpeedOffIcon,
    FanSpeedTurboIcon,
    OperationModeMop,
    OperationModeVacuum,
    OperationModeVacuumAndMop,
    WaterGradeHighIcon,
    WaterGradeLowIcon,
    WaterGradeMaxIcon,
    WaterGradeMediumIcon,
    WaterGradeMinIcon,
    WaterGradeOffIcon
} from "./components/CustomIcons";

const order: Array<PresetValue> = ["off", "min", "low", "medium", "high", "max", "turbo", "vacuum", "vacuum_and_mop", "mop"];
export const sortPresets = (presets: PresetSelectionState["value"][]) => {
    return [...presets].sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b);
    });
};
export const presetFriendlyNames: {[key in PresetValue]: string} = Object.freeze({
    "off": "Off",
    "min": "Min",
    "low": "Low",
    "medium": "Medium",
    "high": "High",
    "max": "Max",
    "turbo": "Turbo",

    "custom": "Custom",

    "vacuum_and_mop": "Vacuum & Mop",
    "vacuum": "Vacuum",
    "mop": "Mop"
});

export function getPresetIconOrLabel(capability: Capability, preset: PresetValue, style?: React.CSSProperties): ReactElement | string {
    switch (capability) {
        case Capability.FanSpeedControl:
            switch (preset) {
                case "off":
                    return <FanSpeedOffIcon style={style}/>;
                case "min":
                    return <FanSpeedMinIcon style={style}/>;
                case "low":
                    return <FanSpeedLowIcon style={style}/>;
                case "medium":
                    return <FanSpeedMediumIcon style={style}/>;
                case "high":
                    return <FanSpeedHighIcon style={style}/>;
                case "max":
                    return <FanSpeedMaxIcon style={style}/>;
                case "turbo":
                    return <FanSpeedTurboIcon style={style}/>;
                default:
                    return presetFriendlyNames[preset];

            }
        case Capability.WaterUsageControl:
            switch (preset) {
                case "off":
                    return <WaterGradeOffIcon style={style}/>;
                case "min":
                    return <WaterGradeMinIcon style={style}/>;
                case "low":
                    return <WaterGradeLowIcon style={style}/>;
                case "medium":
                    return <WaterGradeMediumIcon style={style}/>;
                case "high":
                    return <WaterGradeHighIcon style={style}/>;
                case "max":
                    return <WaterGradeMaxIcon style={style}/>;
                default:
                    return presetFriendlyNames[preset];
            }
        case Capability.OperationModeControl:
            switch (preset) {
                case "vacuum":
                    return <OperationModeVacuum style={style}/>;
                case "mop":
                    return <OperationModeMop style={style}/>;
                case "vacuum_and_mop":
                    return <OperationModeVacuumAndMop style={style}/>;
                default:
                    return presetFriendlyNames[preset];
            }
        default:
            return presetFriendlyNames[preset];
    }
}
