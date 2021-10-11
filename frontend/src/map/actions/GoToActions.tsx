import {
    useGoToMutation,
    useRobotStatusQuery
} from "../../api";
import React from "react";
import {CircularProgress, Grid, Typography} from "@mui/material";
import {ActionButton} from "../Styled";
import GoToTargetClientStructure from "../structures/client_structures/GoToTargetClientStructure";

interface GoToActionsProperties {
    goToTarget: GoToTargetClientStructure;

    convertPixelCoordinatesToCMSpace(coordinates: {x: number, y: number}) : {x: number, y: number}

    onClear(): void;
}

const GoToActions = (
    props: GoToActionsProperties
): JSX.Element => {
    const {goToTarget, convertPixelCoordinatesToCMSpace, onClear} = props;

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



    return (
        <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            <Grid item>
                <ActionButton
                    disabled={goToIsExecuting || !canGo}
                    color="inherit"
                    size="medium"
                    variant="extended"
                    onClick={handleClick}
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
    );
};

export default GoToActions;
