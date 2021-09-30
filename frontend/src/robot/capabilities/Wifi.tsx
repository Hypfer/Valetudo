import React, {FunctionComponent} from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    LinearProgress,
    linearProgressClasses,
    styled,
    TextField,
    Typography
} from "@mui/material";
import {Capability, useWifiConfigurationMutation, useWifiConfigurationQuery} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {LoadingButton} from "@mui/lab";
import {CapabilityItem} from "./CapabilityLayout";
import {green, red, yellow} from "@mui/material/colors";
import {ExpandMore as ExpandMoreIcon} from "@mui/icons-material";
import ConfirmationDialog from "../../components/ConfirmationDialog";

const getWifiColor = (level: number): string => {
    if (level > 50) {
        return green[500];
    }

    if (level > 30) {
        return yellow[700];
    }

    return red[500];
};

const WifiProgress = styled(LinearProgress)(({value}) => {
    return {
        [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor: "transparent"
        },
        [`& .${linearProgressClasses.bar}`]: {
            backgroundColor: getWifiColor(value ?? -100),
        },
    };
});

const WifiConfigurationControl: FunctionComponent = () => {
    const {
        data: wifiConfiguration,
        isFetching: wifiConfigurationFetching,
        isError: wifiConfigurationError,
        refetch: wifiConfigurationRefetch,
    } = useWifiConfigurationQuery();

    const {
        mutate: updateWifiConfiguration,
        isLoading: wifiConfigurationUpdating
    } = useWifiConfigurationMutation();

    const [newSSID, setNewSSID] = React.useState("");
    const [newPSK, setNewPSK] = React.useState("");
    const [confirmationDialogOpen, setConfirmationDialogOpen] = React.useState(false);
    const [finalDialogOpen, setFinalDialogOpen] = React.useState(false);

    const wifiConfigurationContent = React.useMemo(() => {
        if (wifiConfigurationError) {
            return (
                <Typography color="error">
                    Error loading Wifi configuration.
                </Typography>
            );
        }

        const ssid = wifiConfiguration?.ssid || "No SSID";
        const state = wifiConfiguration?.details?.state || "Unknown state";
        const stateStr = state === "not_connected" ? "not connected" : state;
        const upspeed = wifiConfiguration?.details?.upspeed;
        const downspeed = wifiConfiguration?.details?.downspeed;
        const signal = wifiConfiguration?.details?.signal;
        const frequency = wifiConfiguration?.details?.frequency;
        const frequencyStr = frequency === "2.4ghz" ? "2.4 GHz" : "5 GHz";
        const ips = wifiConfiguration?.details?.ips?.join(", ");

        return (
            <>
                <Typography
                    component="span"
                    variant="h5"
                    sx={{mr: 1}}
                >
                    {ssid}
                </Typography>
                <Typography
                    variant="h6"
                    component="span"
                    color="textSecondary"
                >
                    {stateStr}
                </Typography>
                <Box/>

                {upspeed && <Typography variant="caption" sx={{mr: 1}}>⇧ {upspeed} MBit/s</Typography>}
                {downspeed && <Typography variant="caption" sx={{mr: 1}}>⇩ {downspeed} MBit/s</Typography>}
                {frequency && <Typography variant="caption" sx={{mr: 1}}>{frequencyStr}</Typography>}
                {signal && <Typography variant="caption">{signal} dBm</Typography>}

                <Box/>
                {signal && <WifiProgress value={100 + signal} variant="determinate"/>}
                {ips && <Typography variant="caption">IPs: {ips}</Typography>}

                <Accordion sx={{mt: 1}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon/>}
                    >
                        <Typography>Change Wifi connection</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TextField label="SSID/Wifi name" variant="standard" fullWidth
                            value={newSSID} sx={{mb: 1}}
                            onChange={(e) => {
                                setNewSSID(e.target.value);
                            }}/>
                        <TextField label="PSK/Password" variant="standard" type="password" fullWidth
                            value={newPSK} sx={{mb: 1}}
                            onChange={(e) => {
                                setNewPSK(e.target.value);
                            }}/>
                        <LoadingButton loading={wifiConfigurationUpdating} variant="outlined" color="success"
                            disabled={!newSSID || !newPSK} onClick={() => {
                                setConfirmationDialogOpen(true);
                            }}>Apply</LoadingButton>
                    </AccordionDetails>
                </Accordion>

                <ConfirmationDialog title="Apply new Wifi configuration?" text="" open={confirmationDialogOpen}
                    onClose={() => {
                        setConfirmationDialogOpen(false);
                    }} onAccept={() => {
                        setFinalDialogOpen(true);
                        updateWifiConfiguration({
                            ssid: newSSID,
                            credentials: {
                                type: "wpa2_psk",
                                typeSpecificSettings: {
                                    password: newPSK
                                }
                            }
                        });
                    }}>
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
            </>
        );
    }, [
        wifiConfiguration,
        newPSK,
        newSSID,
        confirmationDialogOpen,
        finalDialogOpen,
        wifiConfigurationError,
        wifiConfigurationUpdating,
        updateWifiConfiguration
    ]);


    const loading = wifiConfigurationUpdating || wifiConfigurationFetching || !wifiConfiguration;
    return (
        <CapabilityItem title={"Wifi configuration"} loading={loading} onReload={wifiConfigurationRefetch}>
            {wifiConfigurationContent}
        </CapabilityItem>
    );
};

const Wifi: FunctionComponent = () => {
    const [supported] = useCapabilitiesSupported(Capability.WifiConfiguration);
    if (!supported) {
        return null;
    }

    return <WifiConfigurationControl/>;
};

export default Wifi;
