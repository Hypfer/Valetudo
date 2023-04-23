import {PresetSelectionState} from "./api";

const order = ["off", "min", "low", "medium", "high", "max", "turbo", "vacuum", "vacuum_and_mop", "mop"];
export const sortPresets = (presets: PresetSelectionState["value"][]) => {
    return [...presets].sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b);
    });
};
export const presetFriendlyNames = Object.freeze({
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
