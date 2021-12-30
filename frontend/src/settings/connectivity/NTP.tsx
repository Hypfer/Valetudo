import {
    Box,
    Checkbox,
    Container,
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
import {Refresh as RefreshIcon} from "@mui/icons-material";
import InfoBox from "../../components/InfoBox";

const NTPClientStateComponent: React.FunctionComponent<{ state: NTPClientState, loading: boolean, refetch: () => void }> = ({
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

const NTP = (): JSX.Element => {
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
    const [interval, setInterval] = React.useState(0);
    const [timeout, setTimeout] = React.useState(0);

    React.useEffect(() => {
        if (ntpClientConfig) {
            setEnabled(ntpClientConfig.enabled);
            setServer(ntpClientConfig.server);
            setPort(ntpClientConfig.port);
            setInterval(ntpClientConfig.interval);
            setTimeout(ntpClientConfig.timeout);
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
        <Container>
            <NTPClientStateComponent
                state={ntpClientState}
                loading={ntpClientStateFetching}
                refetch={refetchNTPClientState}
            />
            <Divider sx={{mt: 1}}/>
            <FormControlLabel control={<Checkbox checked={enabled} onChange={e => {
                setEnabled(e.target.checked);
            }}/>} label="NTP enabled" sx={{mb: 1}}/>
            <Grid container spacing={1} sx={{mb: 2}}>
                <Grid item xs="auto">
                    <TextField label="Server" value={server}
                        disabled={!enabled} variant="standard" onChange={e => {
                            setServer(e.target.value);
                        }}/>
                </Grid>
                <Grid item xs="auto">
                    <TextField label="Port" value={port}
                        disabled={!enabled} type="number" inputProps={{min: 1, max: 65535}} variant="standard"
                        onChange={e => {
                            setPort(parseInt(e.target.value));
                        }}/>
                </Grid>
                <Grid item xs="auto">
                    <TextField label="Interval (hours)" value={interval / 3_600_000} sx={{minWidth: 100}}
                        disabled={!enabled} type="number" inputProps={{min: 1, max: 24}} variant="standard"
                        onChange={e => {
                            setInterval(3_600_000 * parseInt(e.target.value));
                        }}/>
                </Grid>
                <Grid item xs="auto">
                    <TextField label="Timeout (seconds)" value={timeout / 1000} sx={{minWidth: 150}}
                        disabled={!enabled} type="number" inputProps={{min: 5, max: 60}} variant="standard"
                        onChange={e => {
                            setTimeout(1000 * parseInt(e.target.value));
                        }}/>
                </Grid>
            </Grid>

            <InfoBox
                boxShadow={5}
                style={{
                    marginTop: "2rem",
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

            <LoadingButton loading={configurationUpdating} color="primary" variant="contained" onClick={() => {
                updateConfiguration({
                    enabled,
                    server,
                    port,
                    interval,
                    timeout
                });
            }}>Save configuration</LoadingButton>

            <Box pt={3}/>
        </Container>
    );
};

export default NTP;
