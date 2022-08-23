import {
    Box, Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    styled,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import React from "react";
import {
    useWifiConfigurationMutation,
    useWifiStatusQuery,
    WifiStatus
} from "../../api";
import LoadingFade from "../../components/LoadingFade";
import {LoadingButton} from "@mui/lab";

import {
    Wifi as WifiIcon,

    Wifi as WifiStateUnknownIcon,
    SignalWifiOff as WifiStateNotConnectedIcon,
    SignalWifi4Bar as WifiStateConnected4BarIcon,
    SignalWifi3Bar as WifiStateConnected3BarIcon,
    SignalWifi2Bar as WifiStateConnected2BarIcon,
    SignalWifi1Bar as WifiStateConnected1BarIcon,
    SignalWifi0Bar as WifiStateConnected0BarIcon,
    Refresh as RefreshIcon,
    VisibilityOff as VisibilityOffIcon, Visibility as VisibilityIcon,

} from "@mui/icons-material";
import PaperContainer from "../../components/PaperContainer";
import ConfirmationDialog from "../../components/ConfirmationDialog";


const StyledLoadingButton = styled(LoadingButton)(({theme}) => {
    return {
        minWidth: 0
    };
});

const WifiStatusComponent : React.FunctionComponent<{
    status?: WifiStatus,
    statusLoading: boolean,
    statusError: boolean
}> = ({
    status,
    statusLoading,
    statusError
}) => {
    const theme = useTheme();

    if (statusLoading || !status) {
        return (
            <LoadingFade/>
        );
    }

    if (statusError) {
        return <Typography color="error">Error loading Wi-Fi status</Typography>;
    }

    const getIconForState = () : JSX.Element => {
        switch (status.state) {
            case "not_connected":
                return <WifiStateNotConnectedIcon sx={{fontSize: "4rem"}}/>;
            case "unknown":
                return <WifiStateUnknownIcon sx={{fontSize: "4rem"}}/>;
            case "connected":

                //Adapted from https://android.stackexchange.com/a/176325 Android 7.1.2
                if (status.details.signal === undefined || status.details.signal >= -55) {
                    return <WifiStateConnected4BarIcon sx={{fontSize: "4rem"}}/>;
                } else if (status.details.signal >= -66) {
                    return <WifiStateConnected3BarIcon sx={{fontSize: "4rem"}}/>;
                } else if (status.details.signal >= -77) {
                    return <WifiStateConnected2BarIcon sx={{fontSize: "4rem"}}/>;
                } else if (status.details.signal >= -88) {
                    return <WifiStateConnected1BarIcon sx={{fontSize: "4rem"}}/>;
                } else {
                    return <WifiStateConnected0BarIcon sx={{fontSize: "4rem"}}/>;
                }
        }
    };

    const getContentForState = () : JSX.Element | undefined => {
        switch (status.state) {
            case "not_connected":
                return (
                    <Typography variant="h5">Not connected</Typography>
                );
            case "unknown":
                return (
                    <Typography variant="h5">Unknown</Typography>
                );
            case "connected":
                return (
                    <>
                        <Typography variant="h5">
                            {status.details.ssid ?? "Unknown SSID"}
                        </Typography>

                        {
                            status.details.signal !== undefined &&

                            <Typography
                                variant="subtitle2"
                                style={{marginTop: "0.5rem", color: theme.palette.grey[theme.palette.mode === "light" ? 400 : 700]}}
                            >
                                {status.details.signal} dBm
                            </Typography>
                        }
                        {
                            status.details.ips !== undefined &&

                            <Typography
                                variant="subtitle2"
                                style={{
                                    marginTop: "0.5rem",
                                    color: theme.palette.grey[theme.palette.mode === "light" ? 400 : 700],
                                    userSelect: "text"
                                }}
                            >
                                {status.details.ips.map(ip => {
                                    return (
                                        <span key={ip}>
                                            {ip}<br/>
                                        </span>
                                    );
                                })}
                            </Typography>
                        }
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
                </Grid>
            </Grid>
        </>
    );
};

const WifiConnectivity = (): JSX.Element => {
    const {
        data: wifiStatus,
        isLoading: wifiStatusLoading,
        isFetching: wifiStatusFetching,
        isError: wifiStatusLoadError,
        refetch: refetchWifiStatus,
    } = useWifiStatusQuery();


    const {mutate: updateConfiguration, isLoading: configurationUpdating} = useWifiConfigurationMutation({
        onSuccess: () => {
            setFinalDialogOpen(true);
        }
    });

    const [newSSID, setNewSSID] = React.useState("");
    const [newPSK, setNewPSK] = React.useState("");

    const [showPasswordAsPlain, setShowPasswordAsPlain] = React.useState(false);
    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);
    const [confirmationDialogOpen, setConfirmationDialogOpen] = React.useState(false);
    const [finalDialogOpen, setFinalDialogOpen] = React.useState(false);


    if (wifiStatusLoading) {
        return (
            <LoadingFade/>
        );
    }

    if (wifiStatusLoadError || !wifiStatus) {
        return <Typography color="error">Error loading Wi-Fi Status</Typography>;
    }

    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <WifiIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>Wi-Fi Connectivity</Typography>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container>
                                <Grid item>
                                    <StyledLoadingButton
                                        loading={wifiStatusFetching}
                                        onClick={() => {
                                            refetchWifiStatus();
                                        }}
                                        title="Refresh"
                                    >
                                        <RefreshIcon/>
                                    </StyledLoadingButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Divider sx={{mt: 1}}/>
                    <WifiStatusComponent
                        status={wifiStatus}
                        statusLoading={wifiStatusLoading}
                        statusError={wifiStatusLoadError}
                    />
                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

                    <Typography variant="h6" style={{marginBottom: "0.5rem"}}>
                        Change Wi-Fi configuration
                    </Typography>

                    <Grid container spacing={1} sx={{mb: 1}} direction="row">
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <TextField
                                style={{width: "100%"}}
                                label="SSID/Wi-Fi name"
                                value={newSSID}
                                variant="standard"
                                onChange={e => {
                                    setNewSSID(e.target.value);
                                    setConfigurationModified(true);
                                }}
                            />
                        </Grid>
                        <Grid item xs="auto" style={{flexGrow: 1}}>
                            <FormControl style={{width: "100%"}} variant="standard">
                                <InputLabel htmlFor="standard-adornment-password">PSK/Password</InputLabel>
                                <Input
                                    type={showPasswordAsPlain ? "text" : "password"}
                                    fullWidth
                                    value={newPSK}
                                    sx={{mb: 1}}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => {
                                                    setShowPasswordAsPlain(!showPasswordAsPlain);
                                                }}
                                                onMouseDown={e => {
                                                    e.preventDefault();
                                                }}
                                                edge="end"
                                            >
                                                {showPasswordAsPlain ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    onChange={(e) => {
                                        setNewPSK(e.target.value);
                                        setConfigurationModified(true);
                                    }}/>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Divider sx={{mt: 1}} style={{marginTop: "1rem", marginBottom: "1rem"}}/>
                    <Grid container>
                        <Grid item style={{marginLeft: "auto"}}>
                            <LoadingButton
                                loading={configurationUpdating}
                                color="primary"
                                variant="outlined"
                                disabled={!(configurationModified && newSSID && newPSK)}
                                onClick={() => {
                                    setConfirmationDialogOpen(true);
                                }}
                            >
                                Save configuration
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
            <ConfirmationDialog
                title="Apply new Wi-Fi configuration?"
                text=""
                open={confirmationDialogOpen}
                onClose={() => {
                    setConfirmationDialogOpen(false);
                }}
                onAccept={() => {
                    updateConfiguration({
                        ssid: newSSID,
                        credentials: {
                            type: "wpa2_psk",
                            typeSpecificSettings: {
                                password: newPSK
                            }
                        }
                    });
                }}
            >
                <DialogContentText>
                    Are you sure you want to apply the new Wifi settings?
                    <br/>
                    <strong>Hint:</strong> You can always revert back to the integrated Wifi Hotspot.
                    Check the documentation supplied with your robot for instructions on how to do so.
                </DialogContentText>
            </ConfirmationDialog>

            <Dialog open={finalDialogOpen}>
                <DialogTitle>
                    New Wifi configuration is applying
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        After pressing OK the page will refresh. However, you will most likely need to change the
                        URL since the robot will connect to a new Wifi.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        window.location.reload();
                    }} autoFocus>
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </PaperContainer>
    );
};

export default WifiConnectivity;
