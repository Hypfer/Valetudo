import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Collapse,
    Container,
    Fade,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Input,
    InputLabel,
    Popper,
    Switch,
    Typography,
    useTheme,
} from "@material-ui/core";
import {ArrowUpward} from "@material-ui/icons";
import React from "react";
import {
    MQTTConfiguration,
    useMQTTConfigurationMutation,
    useMQTTConfigurationQuery,
    useMQTTPropertiesQuery
} from "../api";
import {getIn, setIn} from "../api/utils";
import {deepCopy} from "../utils";
import {InputProps} from "@material-ui/core/Input/Input";

const GroupBox = (props: { title: string, children: React.ReactNode, checked?: boolean, disabled?: boolean, onChange?: ((event: React.ChangeEvent<HTMLInputElement>) => void) }): JSX.Element => {
    let title = (
        <Typography
            variant="subtitle1"
            sx={{
                marginBottom: 0,
            }}
        >
            {props.title}
        </Typography>
    );
    if (props.onChange) {
        title = (
            <FormControlLabel
                control={
                    <Checkbox
                        checked={props.checked}
                        disabled={props.disabled}
                        onChange={props.onChange}
                    />
                }
                disableTypography
                label={title}
            />
        );
    }

    return (
        <Container sx={{m: 0.2}}>
            {title}
            <Collapse in={props.checked || !props.onChange} appear={false}>
                <div>
                    {props.children}
                </div>
            </Collapse>
            <Box pt={1}/>
        </Container>
    );
};

const MQTT = (): JSX.Element => {
    const theme = useTheme();

    const [anchorElement, setAnchorElement] = React.useState(null);

    const identifierElement = React.useRef(null);
    const topicElement = React.useRef(null);

    const {
        data: storedMQTTConfiguration,
        isLoading: mqttConfigurationLoading,
        isError: mqttConfigurationError,
    } = useMQTTConfigurationQuery();

    const {
        data: mqttProperties,
        isLoading: mqttPropertiesLoading,
        isError: mqttPropertiesError
    } = useMQTTPropertiesQuery();

    const {mutate: updateMQTTConfiguration, isLoading: mqttConfigurationUpdating} = useMQTTConfigurationMutation();

    const [mqttConfiguration, setMQTTConfiguration] = React.useState<MQTTConfiguration | null>(null);
    const [modifiedConfiguration, setModifiedConfiguration] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (storedMQTTConfiguration && !modifiedConfiguration && !mqttConfigurationUpdating) {
            setMQTTConfiguration(deepCopy(storedMQTTConfiguration));
            setModifiedConfiguration(false);
        }
    }, [storedMQTTConfiguration, modifiedConfiguration, mqttConfigurationUpdating]);

    const modifyMQTTConfig = React.useCallback((value: any, configPath: Array<string>): void => {
        if (!mqttConfiguration) {
            return;
        }
        const newConfig = deepCopy(mqttConfiguration);
        setIn(newConfig, value, configPath);
        setMQTTConfiguration(newConfig);
        setModifiedConfiguration(true);
    }, [mqttConfiguration]);

    if (mqttConfigurationLoading || mqttPropertiesLoading || !mqttConfiguration) {
        return (
            <Fade in
                style={{
                    transitionDelay: "500ms",
                }}
                unmountOnExit
            >
                <CircularProgress/>
            </Fade>
        );
    }

    if (mqttConfigurationError || mqttPropertiesError || !storedMQTTConfiguration || !mqttProperties) {
        return <Typography color="error">Error loading MQTT configuration</Typography>;
    }

    const renderSwitch = (title: string, configPath: Array<string>) => {
        const value = getIn(mqttConfiguration, configPath);
        return (
            <FormControlLabel
                control={
                    <Switch checked={value} onChange={(e) => {
                        modifyMQTTConfig(e.target.checked, configPath);
                    }}/>
                }
                label={title}
            />
        );
    };

    const renderInput = (title: string, helperText: string, required: boolean, configPath: Array<string>, additionalProps?: InputProps) => {
        const idBase = "mqtt-config-" + configPath.join("-");
        const inputId = idBase + "-input";
        const helperId = idBase + "-helper";
        const value = getIn(mqttConfiguration, configPath);
        const error = required && !value;
        return (
            <FormControl
                required={required}
                error={error}
                component="fieldset"
                sx={{ml: 1, mt: 2}}
            >
                <InputLabel htmlFor={inputId}>{title}</InputLabel>
                <Input
                    id={inputId}
                    value={value}
                    onChange={(e) => {
                        modifyMQTTConfig(e.target.value, configPath);
                    }}
                    aria-describedby={helperId}
                    {...additionalProps}
                />
                <FormHelperText id={helperId}>
                    {helperText}
                </FormHelperText>
            </FormControl>
        );
    };

    return (
        <Container>
            <Box pt={2}/>

            <GroupBox title={"MQTT enabled"} checked={mqttConfiguration.enabled} onChange={(e) => {
                modifyMQTTConfig(e.target.checked, ["enabled"]);
            }}>
                <GroupBox title={"Connection"}>
                    {renderInput("Host", "The MQTT Broker hostname", true, ["connection", "host"])}
                    {renderInput("Port", "The MQTT Broker port", true, ["connection", "port"], {type: "number"})}

                    <GroupBox title={"TLS"} checked={mqttConfiguration.connection.tls.enabled}
                        onChange={(e) => {
                            modifyMQTTConfig(e.target.checked, ["connection", "tls", "enabled"]);
                        }}>
                        {renderInput("CA", "The optional Certificate Authority to verify the connection with", false, ["connection", "tls", "ca"], {
                            multiline: true,
                            minRows: 3,
                            maxRows: 10,
                        })}
                    </GroupBox>

                    <GroupBox title={"Authentication"}>
                        <GroupBox title={"Credentials"}
                            checked={mqttConfiguration.connection.authentication.credentials.enabled}
                            onChange={(e) => {
                                modifyMQTTConfig(e.target.checked, ["connection", "authentication", "credentials", "enabled"]);
                            }}>
                            {renderInput("Username", "Username for authentication", true, ["connection", "authentication", "credentials", "username"])}
                            {renderInput("Password", "Password for authentication", true, ["connection", "authentication", "credentials", "password"], {type: "password"})}
                        </GroupBox>
                        <GroupBox title={"Client certificate"}
                            checked={mqttConfiguration.connection.authentication.clientCertificate.enabled}
                            onChange={(e) => {
                                modifyMQTTConfig(e.target.checked, ["connection", "authentication", "clientCertificate", "enabled"]);
                            }}>

                            {renderInput("Certificate", "The full certificate as a multi-line string", true, ["connection", "authentication", "clientCertificate", "certificate"], {
                                multiline: true,
                                minRows: 3,
                                maxRows: 10
                            })}
                            {renderInput("Key", "The full key as a multi-line string", true, ["connection", "authentication", "clientCertificate", "key"], {
                                multiline: true,
                                minRows: 3,
                                maxRows: 10
                            })}
                        </GroupBox>
                    </GroupBox>
                </GroupBox>

                <GroupBox title={"Identity"}>
                    {renderInput("Friendly name", "The human-readable name of the robot", false, ["identity", "friendlyName"], {
                        placeholder: mqttProperties.defaults.identity.friendlyName,
                    })}
                    {renderInput("Identifier", "The machine-readable name of the robot", false, ["identity", "identifier"], {
                        placeholder: mqttProperties.defaults.identity.identifier,
                        color: "secondary",
                        onFocus: () => {
                            setAnchorElement(identifierElement.current);
                        },
                        onBlur: () => {
                            setAnchorElement(null);
                        },
                    })}
                </GroupBox>

                <GroupBox title={"Customizations"}>
                    {renderInput("Topic prefix", "MQTT topic prefix", false, ["customizations", "topicPrefix"], {
                        placeholder: mqttProperties.defaults.customizations.topicPrefix,
                        color: "warning",
                        onFocus: () => {
                            setAnchorElement(topicElement.current);
                        },
                        onBlur: () => {
                            setAnchorElement(null);
                        },
                    })}
                    <br/>
                    <Typography variant={"subtitle2"} sx={{mt: 1}} noWrap={false}>
                        The MQTT Topic structure will look like this:<br/>
                        <span style={{fontFamily: "monospace", overflowWrap: "anywhere"}}>
                            <span style={{
                                color: theme.palette.warning.main
                            }} ref={topicElement}>
                                {mqttConfiguration.customizations.topicPrefix || mqttProperties.defaults.customizations.topicPrefix}
                            </span>
                        /<wbr/>
                            <span style={{
                                color: theme.palette.secondary.main
                            }} ref={identifierElement}>
                                {mqttConfiguration.identity.identifier || mqttProperties.defaults.identity.identifier}
                            </span>
                            /<wbr/>BatteryStateAttribute/<wbr/>level
                        </span>
                    </Typography>
                    <br/>
                    {renderSwitch("Provide map data", ["customizations", "provideMapData"])}
                </GroupBox>

                <GroupBox title={"Interfaces"}>
                    <GroupBox title={"Homie"} checked={mqttConfiguration.interfaces.homie.enabled}
                        onChange={(e) => {
                            modifyMQTTConfig(e.target.checked, ["interfaces", "homie", "enabled"]);
                        }}>
                        <FormControl component="fieldset" variant="standard">
                            <FormLabel component="legend">Select the options for Homie integration</FormLabel>
                            <FormGroup>
                                {renderSwitch("Provide autodiscovery for \"I Can't Believe It's Not Valetudo\" map", ["interfaces", "homie", "addICBINVMapProperty"])}
                                {renderSwitch("Delete autodiscovery on shutdown", ["interfaces", "homie", "cleanAttributesOnShutdown"])}
                            </FormGroup>
                        </FormControl>
                    </GroupBox>

                    <GroupBox title={"Home Assistant"} checked={mqttConfiguration.interfaces.homeassistant.enabled}
                        onChange={(e) => {
                            modifyMQTTConfig(e.target.checked, ["interfaces", "homeassistant", "enabled"]);
                        }}>
                        <FormControl component="fieldset" variant="standard">
                            <FormLabel component="legend">Select the options for Home Assistant integration</FormLabel>
                            <FormGroup>
                                {renderSwitch("Delete autodiscovery on shutdown", ["interfaces", "homeassistant", "cleanAutoconfOnShutdown"])}
                            </FormGroup>
                        </FormControl>
                    </GroupBox>
                </GroupBox>
            </GroupBox>

            <Popper open={Boolean(anchorElement)} anchorEl={anchorElement} transition>
                {({TransitionProps}) => {
                    return (
                        <Fade {...TransitionProps} timeout={350}>
                            <Box>
                                <ArrowUpward fontSize={"large"} color={"info"}/>
                            </Box>
                        </Fade>
                    );
                }}
            </Popper>

            <Box pt={5}/>

            <Button color={"primary"} variant={"contained"} onClick={() => {
                updateMQTTConfiguration(mqttConfiguration);
                setModifiedConfiguration(false);
            }} disabled={!modifiedConfiguration}>Save configuration</Button>

            <Box pt={5}/>
        </Container>
    );
};

export default MQTT;
