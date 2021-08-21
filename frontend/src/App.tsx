import React from 'react';
import {createTheme, CssBaseline, ThemeProvider, useMediaQuery,} from '@material-ui/core';
import AppRouter from './AppRouter';
import CapabilitiesProvider from './CapabilitiesProvider';
import {SnackbarProvider} from 'notistack';
import {QueryClient, QueryClientProvider} from 'react-query';
import {ReactQueryDevtools} from 'react-query/devtools';

const queryClient = new QueryClient();

const App = (): JSX.Element => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const theme = React.useMemo(
        () =>
            {return createTheme({
                palette: {
                    mode: prefersDarkMode ? 'dark' : 'light',
                },
                map: {
                    floor: '#0076FF',
                    wall: '#242424',
                    segment: ['#19A1A1', '#7AC037', '#DF5618', '#F7C841', '#9966CC'],
                    path: '#FAFAFA',
                    noGo: {stroke: '#FF0000', fill: '#75000066'},
                    noMop: {stroke: '#CC00FF', fill: '#58006E66'},
                    active: {stroke: '#35911A', fill: '#6AF5424C'},
                },
            })},
        [prefersDarkMode]
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>

                <SnackbarProvider maxSnack={3} autoHideDuration={5000}>
                    <CapabilitiesProvider>
                        <AppRouter/>
                    </CapabilitiesProvider>
                </SnackbarProvider>
            </ThemeProvider>

            <ReactQueryDevtools initialIsOpen={false}/>
        </QueryClientProvider>
    );
};

export default App;
