import React from "react";
import {createTheme, CssBaseline, PaletteMode, ThemeProvider, useMediaQuery} from "@material-ui/core";
import AdapterDateFns from "@material-ui/lab/AdapterDateFns";
import LocalizationProvider from "@material-ui/lab/LocalizationProvider";
import AppRouter from "./AppRouter";
import CapabilitiesProvider from "./CapabilitiesProvider";
import {SnackbarProvider} from "notistack";
import {QueryClient, QueryClientProvider} from "react-query";
import {ReactQueryDevtools} from "react-query/devtools";
import {useLocalStorage} from "./hooks";

const queryClient = new QueryClient();

const App = (): JSX.Element => {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const [paletteMode, setPaletteMode] = useLocalStorage<PaletteMode>("palette-mode", prefersDarkMode ? "dark" : "light");

    const theme = React.useMemo(
        () => {
            return createTheme({
                palette: {
                    mode: paletteMode,
                },
                map: {
                    floor: "#0076FF",
                    wall: "#242424",
                    segment: ["#19A1A1", "#7AC037", "#DF5618", "#F7C841", "#9966CC"],
                    path: "#050505",
                    noGo: {stroke: "#FF0000", fill: "#75000066"},
                    noMop: {stroke: "#CC00FF", fill: "#58006E66"},
                    active: {stroke: "#35911A", fill: "#6AF5424C"},
                },
            });
        },
        [paletteMode]
    );

    return (
        <QueryClientProvider client={queryClient}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <ThemeProvider theme={theme}>
                    <CssBaseline/>

                    <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
                        <CapabilitiesProvider>
                            <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
                        </CapabilitiesProvider>
                    </SnackbarProvider>
                </ThemeProvider>

                <ReactQueryDevtools initialIsOpen={false}/>
            </LocalizationProvider>
        </QueryClientProvider>
    );
};

export default App;
