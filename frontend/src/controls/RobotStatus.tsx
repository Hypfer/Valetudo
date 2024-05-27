import {
    Grid,
    LinearProgress,
    linearProgressClasses,
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
import {RobotMonochromeIcon} from "../components/CustomIcons";
import ControlsCard from "./ControlsCard";

const batteryLevelColors = {
    red: red[500],
    yellow: yellow[700],
    green: green[500],
};

const getBatteryColor = (level: number): "red" | "yellow" | "green" => {
    if (level > 60) {
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

const RobotStatus = (): React.ReactElement => {
    const {
        data: status,
        isPending: isStatusPending,
        isError: isStatusError,
    } = useRobotStatusQuery();
    const {
        data: batteries,
        isPending: isBatteryPending,
        isError: isBatteryError,
    } = useRobotAttributeQuery(RobotAttributeClass.BatteryState);
    const isPending = isStatusPending || isBatteryPending;

    const stateDetails = React.useMemo(() => {
        if (isStatusError) {
            return <Typography color="error">Error loading robot state</Typography>;
        }

        if (status === undefined) {
            return null;
        }

        return (
            <Typography variant="overline">
                {status.value}
                {status.flag !== "none" ? <> &ndash; {status.flag}</> : ""}
            </Typography>
        );
    }, [isStatusError, status]);

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
                <Grid item container direction="column" key={index}>
                    <Grid item>
                        <Typography
                            variant="overline"
                            style={{
                                color: batteryLevelColors[getBatteryColor(battery.level)],
                            }}
                        >
                            Battery{batteries.length > 1 ? ` ${index+1}`: ""}: {Math.round(battery.level)}%
                        </Typography>
                    </Grid>
                    <Grid item sx={{ flexGrow: 1, minHeight: "1rem"}}>
                        <BatteryProgress value={battery.level} variant="determinate" />
                    </Grid>
                </Grid>
            );
        });
    }, [batteries, isBatteryError]);

    return (
        <ControlsCard
            icon={RobotMonochromeIcon}
            title="Robot"
            isLoading={isPending}
        >
            <Grid container direction="column">
                <Grid item container direction="row">
                    <Grid item>
                        {stateDetails}
                    </Grid>
                </Grid>
                {batteries !== undefined && batteries.length > 0 && (
                    <Grid item container direction="row" width="100%">
                        {batteriesDetails}
                    </Grid>
                )}
            </Grid>
        </ControlsCard>
    );
};

export default RobotStatus;
