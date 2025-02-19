import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Grid2,
    Skeleton,
    TextField,
    Typography
} from "@mui/material";
import React from "react";
import {
    useNetworkAdvertisementConfigurationMutation,
    useNetworkAdvertisementConfigurationQuery,
    useNetworkAdvertisementPropertiesQuery
} from "../../api";
import {LoadingButton} from "@mui/lab";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";
import {
    AutoFixHigh as NetworkAdvertisementIcon
} from "@mui/icons-material";
import DetailPageHeaderRow from "../../components/DetailPageHeaderRow";

const NetworkAdvertisementSettings = (): React.ReactElement => {
    const {
        data: storedConfiguration,
        isPending: configurationPending,
        isError: configurationError,
    } = useNetworkAdvertisementConfigurationQuery();

    const {
        data: properties,
        isPending: propertiesPending,
        isError: propertiesLoadError
    } = useNetworkAdvertisementPropertiesQuery();

    const {
        mutate: updateConfiguration,
        isPending: configurationUpdating
    } = useNetworkAdvertisementConfigurationMutation();

    const [enabled, setEnabled] = React.useState(false);

    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);


    React.useEffect(() => {
        if (storedConfiguration) {
            setEnabled(storedConfiguration.enabled);
        }
    }, [storedConfiguration]);

    if (configurationPending || propertiesPending) {
        return (
            <Skeleton height={"8rem"}/>
        );
    }

    if (configurationError || propertiesLoadError || !storedConfiguration) {
        return <Typography color="error">Error loading Network Advertisement configuration</Typography>;
    }

    return (
        <>

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
                label="Network Advertisement enabled"
                sx={{mb: 1, marginTop: "1rem", userSelect: "none"}}
            />
            <Grid2 container spacing={1} sx={{mb: 1, mt: "1rem"}} direction="row">
                <Grid2 style={{flexGrow: 1}}>
                    <TextField
                        style={{width: "100%"}}
                        label="Zeroconf Hostname"
                        value={properties?.zeroconfHostname ?? ""}
                        variant="standard"
                        disabled={true}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Grid2>
            </Grid2>

            <InfoBox
                boxShadow={5}
                style={{
                    marginTop: "3rem",
                    marginBottom: "2rem"
                }}
            >
                <Typography color="info">
                    When running Valetudo in embedded mode, it will advertise its presence on your local network
                    via both Bonjour/mDNS and SSDP/UPnP to enable other software such as the android companion app
                    or the windows explorer to discover it.
                    <br/><br/>
                    Please note that disabling this feature <em>will break</em> the companion app as well as other
                    things that may be able to auto-discover Valetudo instances on your network.
                </Typography>
            </InfoBox>

            <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
            <Grid2 container>
                <Grid2 style={{marginLeft: "auto"}}>
                    <LoadingButton
                        loading={configurationUpdating}
                        color="primary"
                        variant="outlined"
                        disabled={!configurationModified}
                        onClick={() => {
                            updateConfiguration({
                                enabled: enabled
                            });
                            setConfigurationModified(false);
                        }}
                    >
                        Save configuration
                    </LoadingButton>
                </Grid2>
            </Grid2>
        </>
    );
};

const NetworkAdvertisementSettingsPage = (): React.ReactElement => {
    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="Network Advertisement"
                        icon={<NetworkAdvertisementIcon/>}
                    />

                    <NetworkAdvertisementSettings/>
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

export default NetworkAdvertisementSettingsPage;
