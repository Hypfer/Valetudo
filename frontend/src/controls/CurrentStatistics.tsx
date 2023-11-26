import {useCurrentStatisticsQuery} from "../api";
import {Box, CircularProgress, Grid, Paper, Typography} from "@mui/material";
import {Equalizer as StatisticsIcon} from "@mui/icons-material";
import React from "react";
import LoadingFade from "../components/LoadingFade";
import {getFriendlyStatName, getHumanReadableStatValue} from "../utils";

const CurrentStatistics = (): React.ReactElement => {
    const {
        data: currentStatistics,
        isPending: statisticsPending,
        isError: statisticsLoadError,
    } = useCurrentStatisticsQuery();

    const body = React.useMemo(() => {
        if (statisticsPending) {
            return (
                <Grid item>
                    <CircularProgress size={20}/>
                </Grid>
            );
        }

        if (statisticsLoadError || !Array.isArray(currentStatistics)) {
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
        statisticsPending,
        statisticsLoadError,
        currentStatistics
    ]);

    return (
        <Grid item>
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
                                    in={statisticsPending}
                                    transitionDelay={statisticsPending ? "500ms" : "0ms"}
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
        </Grid>
    );
};

export default CurrentStatistics;
