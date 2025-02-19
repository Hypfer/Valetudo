import {
    Box,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    Grid2,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Skeleton,
    TextField,
    Typography
} from "@mui/material";
import {ReactComponent as Logo} from "./assets/icons/valetudo_logo_with_name.svg";
import React from "react";
import {
    Refresh as RefreshIcon,
    Wifi as SignalWifiUnknown,
    SignalWifi4Bar as SignalWifi4Bar,
    SignalWifi3Bar as SignalWifi3Bar,
    SignalWifi2Bar as SignalWifi2Bar,
    SignalWifi1Bar as SignalWifi1Bar,
    SignalWifi0Bar as SignalWifi0Bar,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";
import {
    Capability,
    useRobotInformationQuery,
    useValetudoVersionQuery,
    useWifiConfigurationMutation,
    useWifiScanQuery,
} from "./api";
import {LoadingButton} from "@mui/lab";
import {useCapabilitiesSupported} from "./CapabilitiesProvider";

const SCAN_RESULT_BATCH_SIZE = 5;

const SignalStrengthIcon :React.FunctionComponent<{
    signal?: number
}> = ({
    signal
}): React.ReactElement => {
    //Adapted from https://android.stackexchange.com/a/176325 Android 7.1.2
    if (signal === undefined) {
        return <SignalWifiUnknown/>;
    } else if (signal >= -55) {
        return <SignalWifi4Bar/>;
    } else if (signal >= -66) {
        return <SignalWifi3Bar/>;
    } else if (signal >= -77) {
        return <SignalWifi2Bar/>;
    } else if (signal >= -88) {
        return <SignalWifi1Bar/>;
    } else {
        return <SignalWifi0Bar/>;
    }
};

const WifiScan: React.FunctionComponent<{
    onSelect: (ssid: string) => void,
}> = ({
    onSelect
}): React.ReactElement => {
    const {
        data: wifiScanResult,
        isFetching: wifiScanFetching,
        refetch: triggerWifiScan
    } = useWifiScanQuery();
    const [resultLimit, setResultLimit] = React.useState(SCAN_RESULT_BATCH_SIZE);

    const foundNetworkListItems = React.useMemo(() => {
        if (!wifiScanResult) {
            return [];
        }
        const deduplicationMap = new Map();

        wifiScanResult.forEach(network => {
            if (network.details.ssid) {
                deduplicationMap.set(network.details.ssid, {
                    ssid: network.details.ssid,
                    signal: network.details.signal
                });
            }
        });
        const deduplicatedArray : Array<{ssid: string, signal?: number}> = Array.from(deduplicationMap.values());

        deduplicatedArray.sort((a, b) => {
            return (b.signal ?? -999) - (a.signal ?? -999);
        });

        const items = deduplicatedArray.map((network) => {
            return (
                <ListItem
                    key={network.ssid}
                    sx={{
                        paddingTop: "0.25rem",
                        paddingBottom: "0.25rem"
                    }}
                >
                    <ListItemButton
                        onClick={() => {
                            onSelect(network.ssid);
                        }}
                    >
                        <ListItemIcon>
                            <SignalStrengthIcon signal={network.signal}/>
                        </ListItemIcon>
                        <ListItemText
                            primaryTypographyProps={{ style: {fontSize: "0.95rem"} }}
                            primary={network.ssid}
                            secondary={`${network.signal ?? "unknown"} dBm`}
                        />
                    </ListItemButton>
                </ListItem>
            );
        });

        if (items.length > 0) {
            if (items.length > resultLimit) {
                return [
                    ...items.slice(0, resultLimit),

                    <ListItem key="more_results">
                        <ListItemButton
                            onClick={() => {
                                setResultLimit(resultLimit + SCAN_RESULT_BATCH_SIZE);
                            }}
                        >
                            <ListItemText
                                sx={{textAlign: "center"}}
                                primary="See more results"
                            />
                        </ListItemButton>
                    </ListItem>
                ];
            } else {
                return items;
            }
        } else {
            return [
                <ListItem key="no_networks_found">
                    <ListItemText
                        sx={{textAlign: "center"}}
                        secondary="No Wi-Fi networks found or background network scan still active"
                    />
                </ListItem>
            ];
        }

    }, [wifiScanResult, resultLimit, onSelect]);

    return (
        <List
            sx={{
                paddingRight: "1rem",
                wordBreak: "break-word"
            }}
        >
            {foundNetworkListItems}
            <ListItem sx={{paddingTop: "1rem"}}>
                <ListItemButton
                    onClick={() => {
                        if (!wifiScanFetching) {
                            triggerWifiScan().catch(() => {
                                /* intentional */
                            });
                        }
                    }}
                >
                    <ListItemIcon>
                        <RefreshIcon />
                    </ListItemIcon>
                    <ListItemText
                        primary={wifiScanFetching ? "Scanning..." : "Press to scan for Wi-Fi networks"}
                    />
                </ListItemButton>
            </ListItem>
        </List>
    );
};



const ProvisioningPage = (): React.ReactElement => {
    const [wifiScanSupported] = useCapabilitiesSupported(Capability.WifiScan);
    const {
        data: robotInformation,
        isPending: robotInformationPending,
    } = useRobotInformationQuery();
    const {
        data: version,
        isPending: versionPending,
    } = useValetudoVersionQuery();
    const {
        mutate: updateWifiConfiguration,
        isPending: wifiConfigurationUpdating
    } = useWifiConfigurationMutation({
        onSuccess: () => {
            setSuccessDialogOpen(true);
        }
    });

    const [newSSID, setNewSSID] = React.useState("");
    const [newPSK, setNewPSK] = React.useState("");
    const [showPasswordAsPlain, setShowPasswordAsPlain] = React.useState(false);
    const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);

    const robotInformationElement = React.useMemo(() => {
        if (robotInformationPending || versionPending) {
            return (
                <Skeleton height={"6rem"}/>
            );
        }

        if (!robotInformation || !version) {
            return <Typography color="error">No robot information</Typography>;
        }

        const items: Array<[header: string, body: string]> = [
            ["Valetudo", version.release],
            ["Manufacturer", robotInformation.manufacturer],
            ["Model", robotInformation.modelName]
        ];

        return (
            <Grid2 container direction="row" sx={{padding: "1rem", justifyContent: "space-around"}}>
                {items.map(([header, body]) => {
                    return (
                        <Grid2 key={header}>
                            <Typography variant="caption" color="textSecondary">
                                {header}
                            </Typography>
                            <Typography variant="body2">{body}</Typography>
                        </Grid2>
                    );
                })}
            </Grid2>
        );
    }, [robotInformation, robotInformationPending, version, versionPending]);


    return (
        <>
            <Paper
                sx={{
                    width: "90%",
                    height: "90%",
                    margin: "auto",
                    marginTop: "5%",
                    marginBottom: "5%",
                    maxWidth: "600px"
                }}
            >
                <Grid2
                    container
                    direction="row"
                >
                    <Grid2>
                        <Box px={2} pt={2} pb={1}>
                            <Logo
                                style={{
                                    width: "90%",
                                    marginLeft: "5%"
                                }}
                            />
                        </Box>
                    </Grid2>
                </Grid2>
                <Typography
                    variant="body1"
                    style={{
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        paddingBottom: "1rem"
                    }}
                    align="center"
                >
                    Please join the robot to your Wi-Fi network to start using Valetudo
                </Typography>
                <Divider/>

                {robotInformationElement}
                <Divider/>

                {
                    wifiScanSupported &&
                    <>
                        <WifiScan
                            onSelect={(ssid) => {
                                setNewSSID(ssid);
                            }}
                        />

                        <Divider/>
                    </>
                }

                <Grid2 container sx={{padding: "1rem"}} direction="column">
                    <Grid2 sx={{paddingLeft: "1rem", paddingRight: "1rem"}}>
                        <TextField
                            label="SSID/Wi-Fi name"
                            variant="standard"
                            fullWidth
                            value={newSSID} sx={{mb: 1}}
                            onChange={(e) => {
                                setNewSSID(e.target.value);
                            }}
                        />
                    </Grid2>

                    <Grid2 sx={{paddingLeft: "1rem", paddingRight: "1rem"}}>
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
                                }}/>
                        </FormControl>
                    </Grid2>

                    <Grid2 sx={{marginLeft: "auto", marginTop: "0.75rem"}}>
                        <LoadingButton
                            loading={wifiConfigurationUpdating}
                            variant="outlined"
                            color="success"
                            disabled={!newSSID || !newPSK}
                            onClick={() => {
                                updateWifiConfiguration({
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
                            Apply
                        </LoadingButton>
                    </Grid2>

                </Grid2>
            </Paper>

            <Dialog open={successDialogOpen}>
                <DialogTitle>
                    Wi-Fi configuration is applying
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        If you&apos;ve entered your Wi-Fi credentials correctly, the robot should now join your network.<br/>
                        You can now close this page.
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ProvisioningPage;
