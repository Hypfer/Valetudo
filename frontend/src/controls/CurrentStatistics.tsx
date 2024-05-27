import {useCurrentStatisticsQuery} from "../api";
import {Box, CircularProgress, Grid, Paper, Typography} from "@mui/material";
import {Equalizer as StatisticsIcon} from "@mui/icons-material";
import React from "react";
import {getFriendlyStatName, getHumanReadableStatValue} from "../utils";
import ControlsCard from "./ControlsCard";

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
        <ControlsCard icon={StatisticsIcon} title="Current Statistics" isLoading={statisticsPending}>
            <Grid container direction="row">
                {body}
            </Grid>
        </ControlsCard>
    );
};

export default CurrentStatistics;
