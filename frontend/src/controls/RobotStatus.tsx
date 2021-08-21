import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    linearProgressClasses,
    styled,
    Typography,
} from '@material-ui/core';
import {green, red, yellow} from '@material-ui/core/colors';
import {ExpandMore as ExpandMoreIcon} from '@material-ui/icons';
import {ToggleButton, ToggleButtonGroup} from '@material-ui/lab';
import React from 'react';
import {RobotAttributeClass, useRobotAttributeQuery, useRobotStatusQuery,} from '../api';

const batteryLevelColors = {
    red: red[500],
    yellow: yellow[700],
    green: green[500],
};

const getBatteryColor = (level: number): 'red' | 'yellow' | 'green' => {
    if (level > 75) {
        return 'green';
    }

    if (level > 20) {
        return 'yellow';
    }

    return 'red';
};

const BatteryProgress = styled(LinearProgress)(({theme, value}) => ({
    marginTop: -theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor:
            theme.palette.grey[theme.palette.type === 'light' ? 200 : 700],
    },
    [`& .${linearProgressClasses.bar}`]: {
        backgroundColor: getBatteryColor(value ?? 0),
    },
}));

const RobotStatus = (): JSX.Element => {
    const {
        data: status,
        isLoading: isStatusLoading,
        isError: isStatusError,
    } = useRobotStatusQuery();
    const {
        data: attachments,
        isLoading: isAttachmentLoading,
        isError: isAttachmentError,
    } = useRobotAttributeQuery(RobotAttributeClass.AttachmentState);
    const {
        data: batteries,
        isLoading: isBatteryLoading,
        isError: isBatteryError,
    } = useRobotAttributeQuery(RobotAttributeClass.BatteryState);
    const isLoading = isStatusLoading || isAttachmentLoading || isBatteryLoading;

    const stateDetails = React.useMemo(() => {
        if (isStatusError) {
            return <Typography color="error">Error loading robot state</Typography>;
        }

        if (status === undefined) {
            return null;
        }

        return (
            <Typography variant="overline" color="textSecondary">
                {status.value}
                {status.flag !== 'none' ? <> &ndash; {status.flag}</> : ''}
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
                <Grid container key={index.toString()} direction="column" spacing={1}>
                    <Grid item container spacing={1}>
                        {battery.flag !== 'none' && (
                            <Grid item xs>
                                <Typography variant="overline" color="textSecondary">
                                    {battery.flag}
                                </Typography>
                            </Grid>
                        )}
                        <Grid item xs>
                            <Typography
                                variant="overline"
                                style={{
                                    color: batteryLevelColors[getBatteryColor(battery.level)],
                                }}
                            >
                                {Math.round(battery.level)}%
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <BatteryProgress value={battery.level} variant="determinate"/>
                    </Grid>
                </Grid>
            );
        });
    }, [batteries, isBatteryError]);

    const attachmentDetails = React.useMemo(() => {
        if (isAttachmentError) {
            return (
                <Typography color="error">Error loading attachment state</Typography>
            );
        }

        if (attachments === undefined) {
            return null;
        }

        if (attachments.length === 0) {
            return (
                <Typography color="textSecondary">No attachments found</Typography>
            );
        }

        return (
            <ToggleButtonGroup size="small">
                {attachments.map(({type, attached}) => (
                    <ToggleButton selected={attached} key={type} value={type}>
                        {type}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        );
    }, [attachments, isAttachmentError]);

    return (
        <Accordion defaultExpanded={true}>
            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                <Grid
                    container
                    spacing={3}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Grid item>
                        <Typography>Status</Typography>
                    </Grid>
                    {isLoading && (
                        <Grid item>
                            <CircularProgress color="inherit" size="1rem"/>
                        </Grid>
                    )}
                </Grid>
            </AccordionSummary>
            <Divider/>
            <Box p={1}/>
            <AccordionDetails>
                <Grid container spacing={2} direction="column">
                    <Grid item container>
                        <Grid item xs container direction="column">
                            <Grid item>
                                <Typography variant="subtitle2">State</Typography>
                            </Grid>
                            <Grid item>{stateDetails}</Grid>
                        </Grid>
                        {batteries !== undefined && batteries.length > 0 && (
                            <Grid item xs container direction="column">
                                <Grid item>
                                    <Typography variant="subtitle2">Battery</Typography>
                                </Grid>
                                <Grid item>{batteriesDetails}</Grid>
                            </Grid>
                        )}
                    </Grid>
                    <Grid item container direction="column">
                        <Grid item>
                            <Typography variant="subtitle2">Attachments</Typography>
                        </Grid>
                        <Grid item>{attachmentDetails}</Grid>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};

export default RobotStatus;
