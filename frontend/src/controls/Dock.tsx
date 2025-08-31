import {
    Capability,
    RobotAttributeClass,
    useAutoEmptyDockManualTriggerMutation,
    useMopDockCleanManualTriggerMutation,
    useMopDockDryManualTriggerMutation,
    useRobotAttributeQuery,
    useRobotStatusQuery
} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Button, Grid2, Icon, styled, Typography} from "@mui/material";
import {
    RestoreFromTrash as EmptyIcon,
    Villa as DockIcon,
    Water as CleanMopIcon,
    WindPower as DryMopIcon,
} from "@mui/icons-material";
import React from "react";
import ControlsCard from "./ControlsCard";
import {useFeedbackPending} from "../hooks/useFeedbackPending";

const Dock = (): React.ReactElement => {
    const { data: robotStatus, isPending: isRobotStatusPending } = useRobotStatusQuery();
    const {
        data: dockStatus,
        isPending: isDockStatusPending,
    } = useRobotAttributeQuery(RobotAttributeClass.DockStatusState);
    const {
        data: attachments,
        isPending: isAttachmentPending,
    } = useRobotAttributeQuery(RobotAttributeClass.AttachmentState);
    const isPending = isRobotStatusPending || isDockStatusPending || isAttachmentPending;

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

        return (
            <>
                <Typography variant="overline">
                    {dockState}
                </Typography>
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
        triggerMopDockDryCommand
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
