import {
    Box,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    Grid2,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    Skeleton,
    TextField,
    Typography
} from "@mui/material";
import React from "react";
import {useHTTPBasicAuthConfigurationMutation, useHTTPBasicAuthConfigurationQuery} from "../../api";
import {LoadingButton} from "@mui/lab";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    VpnKey as BasicAuthIcon
} from "@mui/icons-material";
import DetailPageHeaderRow from "../../components/DetailPageHeaderRow";

const AuthSettings = (): React.ReactElement => {
    const {
        data: storedConfiguration,
        isPending: configurationPending,
        isError: configurationError,
    } = useHTTPBasicAuthConfigurationQuery();

    const {mutate: updateConfiguration, isPending: configurationUpdating} = useHTTPBasicAuthConfigurationMutation();

    const [enabled, setEnabled] = React.useState(false);
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    const [showPasswordAsPlain, setShowPasswordAsPlain] = React.useState(false);
    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (storedConfiguration) {
            setEnabled(storedConfiguration.enabled);
            setUsername(storedConfiguration.username);
            setPassword(storedConfiguration.password);
        }
    }, [storedConfiguration]);

    if (configurationPending) {
        return (
            <Skeleton height={"8rem"}/>
        );
    }

    if (configurationError || !storedConfiguration) {
        return <Typography color="error">Error loading HTTP Basic Auth configuration</Typography>;
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
                label="HTTP Basic Auth enabled"
                sx={{mb: 1}}
            />
            <Grid2 container spacing={1} sx={{mb: 1}} direction="row">
                <Grid2 size="grow" style={{flexGrow: 1}}>
                    <TextField
                        style={{width: "100%"}}
                        label="Username"
                        value={username}
                        variant="standard"
                        disabled={!enabled}
                        onChange={e => {
                            setUsername(e.target.value);
                            setConfigurationModified(true);
                        }}
                    />
                </Grid2>
                <Grid2 size="grow" style={{flexGrow: 1}}>
                    <FormControl style={{width: "100%"}} variant="standard">
                        <InputLabel htmlFor="standard-adornment-password">Password</InputLabel>
                        <Input
                            type={showPasswordAsPlain ? "text" : "password"}
                            fullWidth
                            value={password}
                            disabled={!enabled}
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
                                        {showPasswordAsPlain ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                                    </IconButton>
                                </InputAdornment>
                            }
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setConfigurationModified(true);
                            }}/>
                    </FormControl>
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
                    Valetudo will by default try to block access from public-routable IP addresses
                    for your safety and convenience.
                    <br/><br/>
                    If you want to allow external access to your Valetudo instance, consider using a VPN such as
                    WireGuard or OpenVPN to ensure the safety of your network.
                    <br/><br/>
                    If you don&apos;t want to use a VPN, usage of a reverse proxy in front of Valetudo and all of your
                    other
                    IoT things and network services is strongly recommended, as a recent version of a proper WebServer
                    such as nginx, the Apache HTTP Server or similar will likely be more secure than Valetudo itself.
                    <br/>
                    Moreover, this approach will group all access logs to all services in a single place.
                    It&apos;s also much easier to implement some kind of Single sign-on that way.
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
                                enabled: enabled,
                                username: username,
                                password: password
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

const AuthSettingsPage = (): React.ReactElement => {
    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="HTTP Basic Auth"
                        icon={<BasicAuthIcon/>}
                    />
                    <AuthSettings/>
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

export default AuthSettingsPage;
