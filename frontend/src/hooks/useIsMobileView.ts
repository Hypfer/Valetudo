import { useMediaQuery, useTheme } from "@mui/material";

export const useIsMobileView = (): boolean => {
    const theme = useTheme();
    const largeView = useMediaQuery(theme.breakpoints.up("sm"), {
        noSsr: true,
    });
    return !largeView;
};
