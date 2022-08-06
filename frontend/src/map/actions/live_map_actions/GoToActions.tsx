import {
    useGoToMutation,
    useRobotStatusQuery
} from "../../../api";
import React from "react";
import {CircularProgress, Grid, Typography} from "@mui/material";
import {ActionButton} from "../../Styled";
import GoToTargetClientStructure from "../../structures/client_structures/GoToTargetClientStructure";
import IntegrationHelpDialog from "../../../components/IntegrationHelpDialog";
import {useLongPress} from "use-long-press";
import {floorObject} from "../../../api/utils";
import {PointCoordinates} from "../../utils/types";

interface GoToActionsProperties {
    goToTarget: GoToTargetClientStructure;

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates

    onClear(): void;
}

const GoToActions = (
    props: GoToActionsProperties
): JSX.Element => {
    const {goToTarget, convertPixelCoordinatesToCMSpace, onClear} = props;
    const [integrationHelpDialogOpen, setIntegrationHelpDialogOpen] = React.useState(false);
    const [integrationHelpDialogPayload, setIntegrationHelpDialogPayload] = React.useState("");

    const {data: status} = useRobotStatusQuery((state) => {
        return state.value;
    });
    const {
        mutate: goTo,
        isLoading: goToIsExecuting
    } = useGoToMutation({
        onSuccess: onClear,
    });

    const canGo = status === "idle" || status === "docked" || status === "paused" || status === "returning" || status === "error";

    const handleClick = React.useCallback(() => {
        if (!canGo) {
            return;
        }

        goTo(convertPixelCoordinatesToCMSpace({x: goToTarget.x0, y: goToTarget.y0}));
    }, [canGo, goToTarget, goTo, convertPixelCoordinatesToCMSpace]);

    const handleLongClick = React.useCallback(() => {
        setIntegrationHelpDialogPayload(JSON.stringify({
            action: "goto",
            coordinates: floorObject(convertPixelCoordinatesToCMSpace({x: goToTarget.x0, y: goToTarget.y0})),
        }, null, 2));

        setIntegrationHelpDialogOpen(true);
    }, [goToTarget, convertPixelCoordinatesToCMSpace]);

    const setupClickHandlers = useLongPress(
        handleLongClick,
        {
            onCancel: (event) => {
                handleClick();
            },
            threshold: 500,
            captureEvent: true,
            cancelOnMovement: true,
        }
    );


    return (
        <>
            <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
                <Grid item>
                    <ActionButton
                        disabled={goToIsExecuting || !canGo}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        {...setupClickHandlers()}
                    >
                        Go To Location
                        {goToIsExecuting && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{marginLeft: 10}}
                            />
                        )}
                    </ActionButton>
                </Grid>
                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onClear}
                    >
                        Clear
                    </ActionButton>
                </Grid>
                {
                    !canGo &&
                    <Grid item>
                        <Typography variant="caption" color="textSecondary">
                            Cannot go to point while the robot is busy
                        </Typography>
                    </Grid>
                }
            </Grid>
            <IntegrationHelpDialog
                dialogOpen={integrationHelpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    setIntegrationHelpDialogOpen(open);
                }}
                helperText={"To trigger a \"Go To\" to the currently selected location via MQTT or REST, simply use this payload."}
                coordinatesWarning={true}
                payload={integrationHelpDialogPayload}
            />
        </>
    );
};

export default GoToActions;
