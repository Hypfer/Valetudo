import {
    RobotAttributeClass,
    useRobotAttributeQuery,
} from "../api";
import {Box, Grid, Paper, Typography, ToggleButton, ToggleButtonGroup} from "@mui/material";
import React from "react";
import LoadingFade from "../components/LoadingFade";

const Attachments = (): JSX.Element | null => {
    const {
        data: attachments,
        isLoading: isAttachmentLoading,
        isError: isAttachmentError,
    } = useRobotAttributeQuery(RobotAttributeClass.AttachmentState);

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
            <ToggleButtonGroup size="small" fullWidth>
                {attachments.map(({ type, attached }) => {
                    return (
                        <ToggleButton disabled selected={attached} key={type} value={type} fullWidth>
                            {type}
                        </ToggleButton>
                    );
                })}
            </ToggleButtonGroup>
        );
    }, [attachments, isAttachmentError]);

    return (
        <Grid item>
            <Paper>
                <Grid container direction="column">
                    <Box px={2} pt={1}>
                        <Grid item container alignItems="center" spacing={1}>
                            <Grid item>
                                <Typography variant="subtitle1">
                                    Attachments
                                </Typography>
                            </Grid>
                            <Grid item>
                                <LoadingFade
                                    in={isAttachmentLoading}
                                    transitionDelay={isAttachmentLoading ? "500ms" : "0ms"}
                                    size={20}
                                />
                            </Grid>
                        </Grid>
                        <Grid container direction="row" sx={{paddingBottom: "8px", paddingTop: "8px", maxHeight: "4em"}}>
                            {attachmentDetails}
                        </Grid>
                    </Box>
                </Grid>
            </Paper>
        </Grid>
    );
};

export default Attachments;
