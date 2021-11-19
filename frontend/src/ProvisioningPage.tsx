import {
    Box,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid,
    Paper,
    TextField,
    Typography
} from "@mui/material";
import {ReactComponent as Logo} from "./controls/icons/valetudo_logo_with_name.svg";
import React from "react";
import {useRobotInformationQuery, useValetudoVersionQuery, useWifiConfigurationMutation} from "./api";
import LoadingFade from "./components/LoadingFade";
import {LoadingButton} from "@mui/lab";
import ConfirmationDialog from "./components/ConfirmationDialog";


const ProvisioningPage = (): JSX.Element => {
    const {
        data: robotInformation,
        isLoading: robotInformationLoading,
    } = useRobotInformationQuery();
    const {
        data: version,
        isLoading: versionLoading,
    } = useValetudoVersionQuery();
    const {
        mutate: updateWifiConfiguration,
        isLoading: wifiConfigurationUpdating
    } = useWifiConfigurationMutation();

    const [newSSID, setNewSSID] = React.useState("");
    const [newPSK, setNewPSK] = React.useState("");
    const [confirmationDialogOpen, setConfirmationDialogOpen] = React.useState(false);
    const [finalDialogOpen, setFinalDialogOpen] = React.useState(false);

    const robotInformationElement = React.useMemo(() => {
        if (robotInformationLoading || versionLoading) {
            return (
                <LoadingFade/>
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
            <Grid container direction="column" sx={{padding: "1rem"}}>
                {items.map(([header, body]) => {
                    return (
                        <Grid item key={header}>
                            <Typography variant="caption" color="textSecondary">
                                {header}
                            </Typography>
                            <Typography variant="body2">{body}</Typography>
                        </Grid>
                    );
                })}
            </Grid>
        );
    }, [robotInformation, robotInformationLoading, version, versionLoading]);


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
                <Grid
                    container
                    direction="row"
                >
                    <Grid item>
                        <Box px={2} pt={2} pb={1}>
                            <Logo
                                style={{
                                    width: "90%",
                                    marginLeft: "5%"
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
                <Divider/>

                {robotInformationElement}
                <Divider/>

                <Typography
                    variant="body1"
                    style={{
                        padding: "1rem"
                    }}
                    align="center"
                >
                    To start using Valetudo, please join the robot to your Wi-Fi network
                </Typography>

                <Grid item container sx={{padding: "1rem"}} direction="column">
                    <Grid item>
                        <TextField
                            label="SSID/Wi-Fi name"
                            variant="standard"
                            fullWidth
                            value={newSSID} sx={{mb: 1}}
                            onChange={(e) => {
                                setNewSSID(e.target.value);
                            }}
                        />
                    </Grid>

                    <Grid item>
                        <TextField
                            label="PSK/Password"
                            variant="standard"
                            type="password"
                            fullWidth
                            value={newPSK} sx={{mb: 1}}
                            onChange={(e) => {
                                setNewPSK(e.target.value);
                            }}
                        />
                    </Grid>

                    <Grid item sx={{marginLeft: "auto", marginTop: "0.5rem"}}>
                        <LoadingButton
                            loading={wifiConfigurationUpdating}
                            variant="outlined"
                            color="success"
                            disabled={!newSSID || !newPSK}
                            onClick={() => {
                                setConfirmationDialogOpen(true);
                            }}
                        >
                            Apply
                        </LoadingButton>
                    </Grid>

                </Grid>
            </Paper>

            <ConfirmationDialog
                title="Apply Wi-Fi configuration?"
                text=""
                open={confirmationDialogOpen}

                onClose={() => {
                    setConfirmationDialogOpen(false);
                }}
                onAccept={() => {
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
                    Are you sure you want to apply the Wi-Fi settings?
                    <br/>
                    <strong>Hint:</strong> You can always revert back to the integrated Wifi Hotspot.
                    Check the documentation supplied with your robot for instructions on how to do so.
                </DialogContentText>
            </ConfirmationDialog>

            <Dialog open={finalDialogOpen}>
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
