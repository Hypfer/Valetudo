import {
    RobotAttributeClass,
    useRobotAttributeQuery,
} from "../api";
import {Grid2, Typography, ToggleButton, ToggleButtonGroup} from "@mui/material";
import React from "react";
import ControlsCard from "./ControlsCard";
import {Extension} from "@mui/icons-material";

const Attachments = (): React.ReactElement | null => {
    const {
        data: attachments,
        isPending: isAttachmentPending,
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
            <Grid2 size="grow" container direction="row" alignItems="center" pt={1}>
                <Grid2 size="grow" sx={{flexGrow: 1}}>
                    <ToggleButtonGroup size="small" fullWidth>
                        {attachments.map(({ type, attached }) => {
                            return (
                                <ToggleButton disabled selected={attached} key={type} value={type} fullWidth>
                                    {type}
                                </ToggleButton>
                            );
                        })}
                    </ToggleButtonGroup>
                </Grid2>
            </Grid2>
        );
    }, [attachments, isAttachmentError]);

    return (
        <ControlsCard
            icon={Extension}
            title="Attachments"
            isLoading={isAttachmentPending}
        >
            <Grid2 container direction="row" sx={{maxHeight: "4em"}}>
                {attachmentDetails}
            </Grid2>
        </ControlsCard>
    );
};

export default Attachments;
