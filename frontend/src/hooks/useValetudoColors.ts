import {useTheme} from "@mui/material";
import {darkPalette, lightPalette} from "../colors";

export const useValetudoColors = () => {
    const theme = useTheme();
    return theme.palette.mode === "dark" ? darkPalette : lightPalette;
};

// Better contrast for text
export const useValetudoColorsInverse = () => {
    const theme = useTheme();
    return theme.palette.mode === "dark" ? lightPalette : darkPalette;
};
