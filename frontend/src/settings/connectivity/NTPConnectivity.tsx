import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Grid,
    TextField,
    Typography,
    useTheme
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

import {
    AccessTime as NTPIcon,
    Sync as SyncEnabledIcon,
    SyncDisabled as SyncDisabledIcon,
    SyncLock as SyncSuccessfulIcon,
    SyncProblem as SyncErrorIcon
} from "@mui/icons-material";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";

const NTPClientStateComponent : React.FunctionComponent<{ state: NTPClientState | undefined, stateLoading: boolean, stateError: boolean }> = ({
    state,
    stateLoading,
    stateError
}) => {
    const theme = useTheme();

    if (stateLoading || !state) {
        return (
            <LoadingFade/>
        );
    }

    if (stateError) {
        return <Typography color="error">Error loading NTPClient state</Typography>;
    }

    const getIconForState = () : JSX.Element => {
        switch (state.__class) {
            case "ValetudoNTPClientEnabledState":
                return <SyncEnabledIcon sx={{ fontSize: "4rem" }}/>;
            case "ValetudoNTPClientDisabledState":
                return <SyncDisabledIcon sx={{ fontSize: "4rem" }}/>;
            case "ValetudoNTPClientSyncedState":
                return <SyncSuccessfulIcon sx={{ fontSize: "4rem" }}/>;
            case "ValetudoNTPClientErrorState":
                return <SyncErrorIcon sx={{ fontSize: "4rem" }}/>;
        }
    };

    const getContentForState = () : JSX.Element | undefined => {
        switch (state.__class) {
            case "ValetudoNTPClientErrorState":
                return (
                    <>
                        <Typography variant="h5" color="red">Error: {state.type}</Typography>
                        <Typography color="red">{state.message}</Typography>
                    </>
                );
            case "ValetudoNTPClientEnabledState":
                return (
                    <Typography variant="h5">Time sync enabled</Typography>
                );
            case "ValetudoNTPClientDisabledState":
                return (
                    <Typography variant="h5">Time sync disabled</Typography>
                );
            case "ValetudoNTPClientSyncedState":
                return (
                    <>
                        <Typography variant="h5">Time sync successful</Typography>
                        <Typography>Offset: {state.offset} ms</Typography>
                    </>
                );
        }
    };


    return (
        <>
            <Grid container alignItems="center" direction="column" style={{paddingBottom:"1rem"}}>
                <Grid item style={{marginTop:"1rem"}}>
                    {getIconForState()}
                </Grid>
                <Grid
                    item
                    sx={{
                        maxWidth: "100% !important", //Why, MUI? Why?
                        wordWrap: "break-word",
                        textAlign: "center",
                        userSelect: "none"
                    }}
                >
                    {getContentForState()}

                    <Typography
                        variant="subtitle2"
                        style={{marginTop: "1rem", color: theme.palette.grey[theme.palette.mode === "light" ? 400 : 700]}}
                    >
                        {state.timestamp}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
};

const NTPConnectivity = (): JSX.Element => {
    const {
        data: ntpClientState,
        isLoading: ntpClientStateLoading,
        isError: ntpClientStateError,
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
                        stateLoading={ntpClientStateLoading}
                        stateError={ntpClientStateError}
                    />
                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
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
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <TextField
                                style={{width:"100%"}}
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
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <TextField
                                style={{width:"100%"}}
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
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <TextField
                                style={{width:"100%"}}
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
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <TextField
                                style={{width:"100%"}}
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
