import {
    Box, CircularProgress,
    Grid,
    LinearProgress,
    linearProgressClasses, Paper,
    styled,
    Typography,
} from "@mui/material";
import { green, red, yellow } from "@mui/material/colors";
import React from "react";
import {
    RobotAttributeClass,
    useRobotAttributeQuery,
    useRobotStatusQuery,
} from "../api";

const batteryLevelColors = {
    red: red[500],
    yellow: yellow[700],
    green: green[500],
};

const getBatteryColor = (level: number): "red" | "yellow" | "green" => {
    if (level > 75) {
        return "green";
    }

    if (level > 20) {
        return "yellow";
    }

    return "red";
};

const BatteryProgress = styled(LinearProgress)(({ theme, value }) => {
    return {
        marginTop: -theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor:
                theme.palette.grey[theme.palette.mode === "light" ? 200 : 700],
        },
        [`& .${linearProgressClasses.bar}`]: {
            backgroundColor: getBatteryColor(value ?? 0),
        },
    };
});

const RobotStatus = (): JSX.Element => {
    const {
        data: status,
        isLoading: isStatusLoading,
        isError: isStatusError,
    } = useRobotStatusQuery();
    const {
        data: batteries,
        isLoading: isBatteryLoading,
        isError: isBatteryError,
    } = useRobotAttributeQuery(RobotAttributeClass.BatteryState);
    const isLoading = isStatusLoading || isBatteryLoading;

    const stateDetails = React.useMemo(() => {
        if (isStatusError) {
            return <Typography color="error">Error loading robot state</Typography>;
        }

        if (isLoading) {
            return (
                <Grid item>
                    <CircularProgress color="inherit" size="1rem" />
                </Grid>
            );
        }

        if (status === undefined) {
            return null;
        }

        return (
            <Typography variant="overline" color="textSecondary">
                {status.value}
                {status.flag !== "none" ? <> &ndash; {status.flag}</> : ""}
            </Typography>
        );
    }, [isStatusError, status, isLoading]);

    const batteriesDetails = React.useMemo(() => {
        if (isBatteryError) {
            return <Typography color="error">Error loading battery state</Typography>;
        }

        if (batteries === undefined) {
            return null;
        }

        if (batteries.length === 0) {
            return <Typography color="textSecondary">No batteries found</Typography>;
        }

        return batteries.map((battery, index) => {
            return (
                <Grid container key={index.toString()} direction="column" spacing={1}>
                    <Grid item container spacing={1}>

                    </Grid>
                    <Grid item>
                        <Box display="flex" alignItems="center">
                            <Box width="100%" mr={1}>
                                <BatteryProgress value={battery.level} variant="determinate" />
                            </Box>
                            <Typography
                                variant="overline"
                                style={{
                                    color: batteryLevelColors[getBatteryColor(battery.level)],
                                }}
                            >
                                {Math.round(battery.level)}%
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            );
        });
    }, [batteries, isBatteryError]);

    return (
        <Grid item>
            <Paper>
                <Box p={1}>
                    <Grid container spacing={2} direction="column">
                        <Grid item container>
                            <Grid item xs container direction="column" sx={{paddingLeft:"8px"}}>
                                <Grid item>
                                    <Typography variant="subtitle2">State</Typography>
                                </Grid>
                                <Grid item style={{maxHeight: "2rem"}}>{stateDetails}</Grid>
                            </Grid>
                            {batteries !== undefined && batteries.length > 0 && (
                                <Grid item xs container direction="column" sx={{paddingRight:"8px"}}>
                                    <Grid item>
                                        <Typography variant="subtitle2">Battery</Typography>
                                    </Grid>
                                    <Grid item>{batteriesDetails}</Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Grid>
    );
};

export default RobotStatus;
