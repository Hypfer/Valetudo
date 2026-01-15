import {
    Grid2,
    LinearProgress,
    linearProgressClasses,
    styled,
    Typography,
} from "@mui/material";
import React from "react";
import {
    RobotAttributeClass,
    useRobotAttributeQuery,
    useRobotStatusQuery,
} from "../api";
import {RobotMonochromeIcon} from "../components/CustomIcons";
import ControlsCard from "./ControlsCard";
import {useValetudoColorsInverse} from "../hooks/useValetudoColors";

const BatteryProgress = styled(LinearProgress)(({ theme }) => {
    return {
        marginTop: -theme.spacing(1),
        borderRadius: theme.shape.borderRadius,
        [`&.${linearProgressClasses.colorPrimary}`]: {
            backgroundColor:
                theme.palette.grey[theme.palette.mode === "light" ? 200 : 700],
        },
    };
});

const RobotStatus = (): React.ReactElement => {
    const palette = useValetudoColorsInverse();
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
        const getBatteryColor = (level: number) => {
            if (level > 60) {
                return palette.green;
            }
            if (level > 20) {
                return palette.yellow;
            }
            return palette.red;
        };

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
            const batteryColor = getBatteryColor(battery.level);

            return (
                <Grid2 size="grow" container direction="column" key={index}>
                    <Grid2>
                        <Typography
                            variant="overline"
                            style={{
                                color: batteryColor,
                                fontWeight: 500
                            }}
                        >
                            Battery{batteries.length > 1 ? ` ${index + 1}` : ""}: {Math.round(battery.level)}%
                        </Typography>
                    </Grid2>
                    <Grid2 sx={{ flexGrow: 1, minHeight: "1rem" }}>
                        <BatteryProgress
                            value={battery.level}
                            variant="determinate"
                            sx={{
                                [`& .${linearProgressClasses.bar}`]: {
                                    backgroundColor: batteryColor,
                                },
                            }}
                        />
                    </Grid2>
                </Grid2>
            );
        });
    }, [batteries, isBatteryError, palette]);

    return (
        <ControlsCard
            icon={RobotMonochromeIcon}
            title="Robot"
            isLoading={isPending}
        >
            <Grid2 size="grow" container direction="column">
                <Grid2 container direction="row">
                    <Grid2>
                        {stateDetails}
                    </Grid2>
                </Grid2>
                {batteries !== undefined && batteries.length > 0 && (
                    <Grid2 size="grow" container direction="row" width="100%">
                        {batteriesDetails}
                    </Grid2>
                )}
            </Grid2>
        </ControlsCard>
    );
};

export default RobotStatus;
