import {
    useCurrentStatisticsQuery,
    ValetudoDataPoint
} from "../api";
import {Box, CircularProgress, Grid, Paper, Typography} from "@mui/material";
import {
    Equalizer as StatisticsIcon
} from "@mui/icons-material";
import React from "react";
import LoadingFade from "../components/LoadingFade";
import {convertSecondsToHumans} from "../utils";

function getFriendlyStatName(stat: ValetudoDataPoint) : string {
    switch (stat.type) {
        case "area":
            return "Area";
        case "time":
            return "Time";
        case "count":
            return "Count";
    }
}

function getHumanReadableStatValue(stat: ValetudoDataPoint): string {
    switch (stat.type) {
        case "area":
            return (stat.value / 10000).toFixed(2).padStart(6, "0") + " m²";
        case "time":
            return convertSecondsToHumans(stat.value, true, false);
        case "count":
            return stat.value.toString();
    }
}

const CurrentStatistics = (): JSX.Element => {
    const {
        data: currentStatistics,
        isLoading: statisticsLoading,
        isError: statisticsLoadError,
    } = useCurrentStatisticsQuery();

    const body = React.useMemo(() => {
        if (statisticsLoading) {
            return (
                <Grid item>
                    <CircularProgress size={20} />
                </Grid>
            );
        }

        if (statisticsLoadError || currentStatistics === undefined) {
            return (
                <Paper>
                    <Box p={1}>
                        <Typography color="error">Error loading current statistics</Typography>
                    </Box>
                </Paper>
            );
        }

        return currentStatistics.map((stat, i) => {
            return (
                <Grid item xs container direction="column" key={i}>
                    <Grid item>
                        <Typography variant="subtitle2">
                            {getFriendlyStatName(stat)}
                        </Typography>
                    </Grid>
                    <Grid item style={{maxHeight: "2rem"}}>{getHumanReadableStatValue(stat)}</Grid>
                </Grid>
            );
        });
    }, [
        statisticsLoading,
        statisticsLoadError,
        currentStatistics
    ]);

    return (
        <Paper>
            <Grid container direction="column">
                <Box px={2} pt={1}>
                    <Grid item container alignItems="center" spacing={1}>
                        <Grid item><StatisticsIcon/></Grid>
                        <Grid item>
                            <Typography variant="subtitle1">
                                Current Statistics
                            </Typography>
                        </Grid>
                        <Grid item>
                            <LoadingFade
                                in={statisticsLoading}
                                transitionDelay={statisticsLoading ? "500ms" : "0ms"}
                                size={20}
                            />
                        </Grid>
                    </Grid>
                    <Grid container direction="row" sx={{paddingBottom: "8px", paddingTop: "8px", maxHeight: "4em"}}>
                        {body}
                    </Grid>
                </Box>
            </Grid>
        </Paper>
    );
};

export default CurrentStatistics;
