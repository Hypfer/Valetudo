import React from "react";
import {createTheme, CssBaseline, PaletteMode, ThemeProvider, useMediaQuery} from "@mui/material";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import RouterChoice from "./RouterChoice";
import CapabilitiesProvider from "./CapabilitiesProvider";
import {SnackbarProvider} from "notistack";
import {QueryClient, QueryClientProvider} from "react-query";
import {ReactQueryDevtools} from "react-query/devtools";
import {useLocalStorage} from "./hooks";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/jetbrains-mono/200.css";

const queryClient = new QueryClient();

const App = (): JSX.Element => {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const [paletteMode, setPaletteMode] = useLocalStorage<PaletteMode>("palette-mode", prefersDarkMode ? "dark" : "light");

    const theme = React.useMemo(
        () => {
            return createTheme({
                palette: {
                    mode: paletteMode,
                }
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
                            <RouterChoice paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
                        </CapabilitiesProvider>
                    </SnackbarProvider>
                </ThemeProvider>

                <ReactQueryDevtools initialIsOpen={false}/>
            </LocalizationProvider>
        </QueryClientProvider>
    );
};

export default App;
