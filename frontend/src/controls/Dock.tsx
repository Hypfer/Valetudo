import {
    Capability,
    RobotAttributeClass,
    useAutoEmptyDockManualTriggerMutation,
    useMopDockCleanManualTriggerMutation,
    useMopDockDryManualTriggerMutation,
    useRobotAttributeQuery,
    useRobotStatusQuery,
    useRobotInformationQuery,
    DockComponentStateAttributeType,
    DockComponentStateAttributeValue
} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Box,
    Button,
    Grid2,
    Icon,
    Paper,
    styled,
    Typography
} from "@mui/material";
import {
    RestoreFromTrash as EmptyIcon,
    Villa as DockIcon,
    Water as CleanMopIcon,
    WindPower as DryMopIcon,
    Help as DockComponentUnknownIcon,
    ExpandMore as OpenIcon,
    ExpandLess as CloseIcon
} from "@mui/icons-material";
import React from "react";
import ControlsCard from "./ControlsCard";
import {useFeedbackPending} from "../hooks/useFeedbackPending";
import {
    DockComponentWaterTankClean,
    DockComponentWaterTankDirty,
    DockComponentDetergent,
    DockComponentDustbag,
} from "../components/CustomIcons";
import {useValetudoColorsInverse} from "../hooks/useValetudoColors";

const DockComponentTile = ({ label, icon: IconComponent, statusText, statusColor }: { label: string, icon: React.ElementType, statusText: string, statusColor: string }) => {
    return (
        <Grid2 size={6} container alignItems="center" spacing={1} wrap="nowrap" sx={{padding: "0.25rem"}}>
            <Grid2 sx={{ display: "flex", alignItems: "center" }}>
                <IconComponent />
            </Grid2>
            <Grid2 sx={{ display: "flex", flexDirection: "column", justifyContent: "center"}}>
                <Typography variant="body2" sx={{ lineHeight: "1.1rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {label}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: statusColor,
                        fontWeight: "bold",
                        lineHeight: "1.1rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}>
                    {statusText}
                </Typography>
            </Grid2>
        </Grid2>
    );
};

const DOCK_COMPONENT_ORDER: DockComponentStateAttributeType[] = [
    "water_tank_clean",
    "water_tank_dirty",
    "detergent",
    "dustbag"
];

const DockComponents = ({ supportedTypes, dockComponents }: { supportedTypes: DockComponentStateAttributeType[], dockComponents: any[] }) => {
    const palette = useValetudoColorsInverse();

    const components = React.useMemo(() => {
        return supportedTypes
            .slice()
            .sort((a, b) => DOCK_COMPONENT_ORDER.indexOf(a) - DOCK_COMPONENT_ORDER.indexOf(b))
            .map(type => {
                const attribute = dockComponents?.find(a => a.type === type);
                const value = (attribute?.value as DockComponentStateAttributeValue) || "unknown";

                let label: string;
                let IconComponent: React.ElementType;

                switch (type) {
                    case "water_tank_clean":
                        label = "Freshwater";
                        IconComponent = DockComponentWaterTankClean;
                        break;
                    case "water_tank_dirty":
                        label = "Wastewater";
                        IconComponent = DockComponentWaterTankDirty;
                        break;
                    case "detergent":
                        label = "Detergent";
                        IconComponent = DockComponentDetergent;
                        break;
                    case "dustbag":
                        label = "Dustbag";
                        IconComponent = DockComponentDustbag;
                        break;
                    default:
                        label = "Unknown";
                        IconComponent = DockComponentUnknownIcon;
                        break;
                }

                let statusText: string;
                let statusColor: string;

                switch (value) {
                    case "ok":
                        statusText = "OK";
                        statusColor = palette.green;
                        break;
                    case "empty":
                        statusText = "Empty";
                        statusColor = palette.red;
                        break;
                    case "full":
                        statusText = "Full";
                        statusColor = palette.red;
                        break;
                    case "missing":
                        statusText = "Missing";
                        statusColor = palette.yellow;
                        break;
                    default:
                        statusText = "Unknown";
                        statusColor = palette.purple;
                        break;
                }

                return {
                    type: type,
                    value: value,
                    label: label,
                    icon: IconComponent,
                    statusText: statusText,
                    statusColor: statusColor
                };
            });
    }, [supportedTypes, dockComponents, palette]);

    const statusColor = React.useMemo(() => {
        let color = palette.green;

        for (const component of components) {
            if (component.statusColor === palette.red) {
                return palette.red;
            }
            if (component.statusColor === palette.yellow) {
                color = palette.yellow;
            }
            if (component.statusColor === palette.purple && color === palette.green) {
                color = palette.purple;
            }
        }

        return color;
    }, [components, palette]);

    const isOk = statusColor === palette.green;
    const [expanded, setExpanded] = React.useState<boolean>(!isOk);

    return (
        <Paper variant="outlined" sx={{ mt: 1, mb: 1, p: 1, backgroundColor: "transparent" }}>
            <Grid2
                container
                alignItems="center"
                onClick={() => setExpanded(!expanded)}
                sx={{ cursor: "pointer" }}
            >
                <Grid2 sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ml: 0.5}}>Components</Typography>
                </Grid2>
                <Grid2 sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: statusColor, fontWeight: "bold", mr: 1 }}>
                        {isOk ? "OK" : "Not OK"}
                    </Typography>
                    <Icon component={expanded ? CloseIcon : OpenIcon} />
                </Grid2>
            </Grid2>

            <Box sx={{ display: expanded ? "block" : "none", pt: 2 }}>
                <Grid2 container spacing={1}>
                    {components.map((component) => {
                        return (
                            <DockComponentTile
                                key={component.type}
                                label={component.label}
                                icon={component.icon}
                                statusText={component.statusText}
                                statusColor={component.statusColor}
                            />
                        );
                    })}
                </Grid2>
            </Box>
        </Paper>
    );
};

const Dock = (): React.ReactElement => {
    const { data: robotStatus, isPending: isRobotStatusPending } = useRobotStatusQuery();
    const { data: robotInfo, isPending: isRobotInfoPending } = useRobotInformationQuery();
    const {
        data: dockStatus,
        isPending: isDockStatusPending,
    } = useRobotAttributeQuery(RobotAttributeClass.DockStatusState);
    const {
        data: attachments,
        isPending: isAttachmentPending,
    } = useRobotAttributeQuery(RobotAttributeClass.AttachmentState);
    const {
        data: dockComponents,
        isPending: isDockComponentsPending
    } = useRobotAttributeQuery(RobotAttributeClass.DockComponentState);

    const isPending = isRobotStatusPending || isDockStatusPending || isAttachmentPending || isRobotInfoPending || isDockComponentsPending;

    const StyledIcon = styled(Icon)(({ theme }) => {
        return {
            marginRight: theme.spacing(1),
            marginLeft: -theme.spacing(1),
        };
    });

    const [
        triggerEmptySupported,
        mopDockCleanTriggerSupported,
        mopDockDryTriggerSupported,
    ] = useCapabilitiesSupported(
        Capability.AutoEmptyDockManualTrigger,
        Capability.MopDockCleanManualTrigger,
        Capability.MopDockDryManualTrigger,
    );

    const {
        mutate: triggerDockEmpty,
        isPending: emptyIsExecuting,
    } = useAutoEmptyDockManualTriggerMutation();
    const {
        mutate: triggerMopDockCleanCommand,
        isPending: mopDockCleanCommandExecuting,
    } = useMopDockCleanManualTriggerMutation();
    const {
        mutate: triggerMopDockDryCommand,
        isPending: mopDockDryCommandExecuting,
    } = useMopDockDryManualTriggerMutation();

    const { value: dockState } = dockStatus?.[0] ?? {value: "idle"};

    const [feedbackPending, setFeedbackPending] = useFeedbackPending(dockState, 25_000);

    const body = React.useMemo(() => {
        const dockStatusIsRelevant = mopDockCleanTriggerSupported || mopDockDryTriggerSupported;
        const commandIsExecuting = emptyIsExecuting || mopDockCleanCommandExecuting || mopDockDryCommandExecuting;
        const mopAttachmentAttached = attachments?.find(a => {
            return a.type === "mop";
        })?.attached === true;

        if (isPending) {
            return <></>;
        }

        if (robotStatus === undefined || (dockStatusIsRelevant && dockStatus?.length !== 1)) {
            return (
                <Typography color="error">Error loading dock controls</Typography>
            );
        }

        const { value: robotState } = robotStatus;
        const supportedComponents = robotInfo?.modelDetails?.supportedDockComponents ?? [];

        return (
            <>
                <Typography variant="overline">
                    {dockState}
                </Typography>

                {supportedComponents.length > 0 && (
                    <DockComponents
                        supportedTypes={supportedComponents}
                        dockComponents={dockComponents ?? []}
                    />
                )}

                <Grid2 container direction="row" alignItems="center" sx={{flex: 1}} spacing={1} pt={1} wrap={"wrap"}>
                    {
                        mopDockCleanTriggerSupported &&
                        <Grid2 sx={{flex: 1, minWidth: "min-content"}}>
                            <Button
                                disabled={feedbackPending || commandIsExecuting || !["idle", "cleaning", "pause"].includes(dockState) || robotState !== "docked" || !mopAttachmentAttached}
                                variant="outlined"
                                size="medium"
                                color="inherit"
                                onClick={() => {
                                    const command = dockState === "cleaning" ? "stop" : "start";

                                    triggerMopDockCleanCommand(command);
                                    setFeedbackPending(true);
                                }}
                                sx={{width: "100%"}}
                            >
                                <StyledIcon as={CleanMopIcon} /> { dockState === "cleaning" ? "Stop" : "Clean" }
                            </Button>
                        </Grid2>
                    }
                    {
                        mopDockDryTriggerSupported &&
                        <Grid2 sx={{flex: 1, minWidth: "min-content"}}>
                            <Button
                                disabled={feedbackPending || commandIsExecuting || !["idle", "drying", "pause"].includes(dockState) || robotState !== "docked" || !mopAttachmentAttached}
                                variant="outlined"
                                size="medium"
                                color="inherit"
                                onClick={() => {
                                    const command = dockState === "drying" ? "stop" : "start";

                                    triggerMopDockDryCommand(command);
                                    setFeedbackPending(true);
                                }}
                                sx={{width: "100%"}}
                            >
                                <StyledIcon as={DryMopIcon} /> { dockState === "drying" ? "Stop" : "Dry" }
                            </Button>
                        </Grid2>
                    }
                    {
                        triggerEmptySupported &&
                        <Grid2 sx={{flex: 1, minWidth: "min-content"}}>
                            <Button
                                disabled={commandIsExecuting || !["idle", "pause"].includes(dockState) || robotState !== "docked"}
                                variant="outlined"
                                size="medium"
                                color="inherit"
                                onClick={() => {
                                    triggerDockEmpty();
                                }}
                                sx={{width: "100%"}}
                            >
                                <StyledIcon as={EmptyIcon} /> Empty
                            </Button>
                        </Grid2>
                    }
                </Grid2>
            </>
        );
    }, [
        StyledIcon,
        attachments,
        dockState,
        dockStatus,
        emptyIsExecuting,
        isPending,
        mopDockCleanCommandExecuting,
        mopDockCleanTriggerSupported,
        mopDockDryCommandExecuting,
        mopDockDryTriggerSupported,
        feedbackPending,
        setFeedbackPending,
        robotStatus,
        triggerDockEmpty,
        triggerEmptySupported,
        triggerMopDockCleanCommand,
        triggerMopDockDryCommand,
        robotInfo,
        dockComponents
    ]);


    return (
        <ControlsCard
            title="Dock"
            pending={feedbackPending}
            icon={DockIcon}
            isLoading={isPending}
        >
            {body}
        </ControlsCard>
    );
};

export default Dock;
