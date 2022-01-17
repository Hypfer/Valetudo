import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Grid,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import React from "react";
import {
    NTPClientState,
    useNTPClientConfigurationMutation,
    useNTPClientConfigurationQuery,
    useNTPClientStateQuery
} from "../../api";
import LoadingFade from "../../components/LoadingFade";
import {LoadingButton} from "@mui/lab";
import {formatRelative} from "date-fns";
import {AccessTime as NTPIcon, Refresh as RefreshIcon} from "@mui/icons-material";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";

const NTPClientStateComponent: React.FunctionComponent<{
    state: NTPClientState,
    loading: boolean,
    refetch: () => void
}> = ({
    state,
    loading,
    refetch
}) => {
    return (
        <>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Typography variant="h6" title={state.timestamp}>
                    Current state active since {formatRelative(new Date(state.timestamp), new Date())}
                </Typography>
                <LoadingButton
                    loading={loading}
                    onClick={refetch}
                    title="Refresh"
                >
                    <RefreshIcon/>
                </LoadingButton>
            </Stack>
            {state.type && <Typography variant="h5" color="red">Error: {state.type}</Typography>}
            {state.message && (
                <Typography color="red">{state.message}</Typography>
            )}
            {state.offset && (
                <Typography>Offset to previous time on last sync: {state.offset} ms</Typography>
            )}
        </>
    );
};

const NTPConnectivity = (): JSX.Element => {
    const {
        data: ntpClientState,
        isLoading: ntpClientStateLoading,
        isFetching: ntpClientStateFetching,
        isError: ntpClientStateError,
        refetch: refetchNTPClientState,
    } = useNTPClientStateQuery();

    const {
        data: ntpClientConfig,
        isLoading: ntpClientConfigLoading,
        isError: ntpClientConfigError,
    } = useNTPClientConfigurationQuery();

    const {mutate: updateConfiguration, isLoading: configurationUpdating} = useNTPClientConfigurationMutation();

    const [enabled, setEnabled] = React.useState(false);
    const [server, setServer] = React.useState("");
    const [port, setPort] = React.useState(0);
    const [ntpInterval, setNtpInterval] = React.useState(0);
    const [ntpTimeout, setNtpTimeout] = React.useState(0);

    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (ntpClientConfig) {
            setEnabled(ntpClientConfig.enabled);
            setServer(ntpClientConfig.server);
            setPort(ntpClientConfig.port);
            setNtpInterval(ntpClientConfig.interval);
            setNtpTimeout(ntpClientConfig.timeout);
        }
    }, [ntpClientConfig]);

    if (ntpClientStateLoading || ntpClientConfigLoading) {
        return (
            <LoadingFade/>
        );
    }

    if (ntpClientStateError || ntpClientConfigError || !ntpClientState || !ntpClientConfig) {
        return <Typography color="error">Error loading NTP Client configuration</Typography>;
    }

    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <NTPIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>NTP Connectivity</Typography>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{mt: 1}}/>
                    <NTPClientStateComponent
                        state={ntpClientState}
                        loading={ntpClientStateFetching}
                        refetch={refetchNTPClientState}
                    />
                    <Divider sx={{mt: 1}}/>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={enabled}
                                onChange={e => {
                                    setEnabled(e.target.checked);
                                    setConfigurationModified(true);
                                }}
                            />
                        }
                        label="NTP enabled"
                        sx={{mb: 1}}
                    />
                    <Grid container spacing={1} sx={{mb: 2}}>
                        <Grid item xs="auto">
                            <TextField
                                label="Server"
                                value={server}
                                disabled={!enabled}
                                variant="standard"
                                onChange={e => {
                                    setServer(e.target.value);
                                    setConfigurationModified(true);
                                }}
                            />
                        </Grid>
                        <Grid item xs="auto">
                            <TextField
                                label="Port"
                                value={port}
                                disabled={!enabled}
                                type="number"
                                inputProps={{min: 1, max: 65535}}
                                variant="standard"
                                onChange={e => {
                                    setPort(parseInt(e.target.value));
                                    setConfigurationModified(true);
                                }}
                            />
                        </Grid>
                        <Grid item xs="auto">
                            <TextField
                                label="Interval (hours)"
                                value={ntpInterval / 3_600_000}
                                sx={{minWidth: 100}}
                                disabled={!enabled}
                                type="number"
                                inputProps={{min: 1, max: 24}}
                                variant="standard"
                                onChange={e => {
                                    setNtpInterval(3_600_000 * parseInt(e.target.value));
                                    setConfigurationModified(true);
                                }}
                            />
                        </Grid>
                        <Grid item xs="auto">
                            <TextField
                                label="Timeout (seconds)"
                                value={ntpTimeout / 1000}
                                sx={{minWidth: 150}}
                                disabled={!enabled}
                                type="number"
                                inputProps={{min: 5, max: 60}}
                                variant="standard"
                                onChange={e => {
                                    setNtpTimeout(1000 * parseInt(e.target.value));
                                    setConfigurationModified(true);
                                }}
                            />
                        </Grid>
                    </Grid>

                    <InfoBox
                        boxShadow={5}
                        style={{
                            marginTop: "3rem",
                            marginBottom: "2rem"
                        }}
                    >
                        <Typography color="info">
                            Valetudo needs a synchronized clock for timers to work and the log timestamps to make sense.
                            Furthermore, the integrated updater may not work if the clock is set wrongly due to SSL
                            certificates usually only being valid within a particular period of time.
                        </Typography>
                    </InfoBox>

                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
                    <Grid container>
                        <Grid item style={{marginLeft: "auto"}}>
                            <LoadingButton
                                loading={configurationUpdating}
                                color="primary"
                                variant="outlined"
                                disabled={!configurationModified}
                                onClick={() => {
                                    updateConfiguration({
                                        enabled,
                                        server,
                                        port,
                                        interval: ntpInterval,
                                        timeout: ntpTimeout
                                    });
                                    setConfigurationModified(false);
                                }}
                            >
                                Save configuration
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </PaperContainer>
    );
};

export default NTPConnectivity;
