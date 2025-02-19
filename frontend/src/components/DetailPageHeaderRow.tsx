import {Divider, Grid2, IconButton, styled, Typography} from "@mui/material";
import React, {FunctionComponent} from "react";
import {
    Help as HelpIcon,
    Refresh as RefreshIcon,
} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";
import HelpDialog from "./HelpDialog";

const TopRightRefreshButton = styled(LoadingButton)(({theme}) => {
    return {
        minWidth: 0
    };
});

interface DetailPageHeaderRowProps {
    title: string;
    icon: React.ReactElement;
    helpText?: string,
    onRefreshClick?: () => void,
    isRefreshing?: boolean
}

const DetailPageHeaderRow: FunctionComponent<DetailPageHeaderRowProps> = ({
    title,
    icon,
    helpText,
    onRefreshClick,
    isRefreshing
}): React.ReactElement => {
    const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);

    return (
        <>
            <Grid2 container alignItems="center" spacing={1} justifyContent="space-between">
                <Grid2 style={{display:"flex"}}>
                    <Grid2 style={{paddingRight: "8px"}}>
                        {icon}
                    </Grid2>
                    <Grid2>
                        <Typography>{title}</Typography>
                    </Grid2>
                </Grid2>
                <Grid2>
                    <Grid2 container>
                        {
                            helpText !== undefined &&
                            <>
                                <Grid2
                                    style={{marginTop:"-0.125rem"}} //:(
                                >
                                    <IconButton
                                        onClick={() => {
                                            return setHelpDialogOpen(true);
                                        }}
                                        title="Help"
                                    >
                                        <HelpIcon/>
                                    </IconButton>
                                </Grid2>

                                <HelpDialog
                                    dialogOpen={helpDialogOpen}
                                    setDialogOpen={(open: boolean) => {
                                        setHelpDialogOpen(open);
                                    }}
                                    helpText={helpText}
                                />
                            </>
                        }

                        {
                            onRefreshClick !== undefined &&
                            <Grid2>
                                <TopRightRefreshButton
                                    loading={isRefreshing ?? false}
                                    onClick={onRefreshClick}
                                    title="Refresh"
                                >
                                    <RefreshIcon/>
                                </TopRightRefreshButton>
                            </Grid2>
                        }
                    </Grid2>
                </Grid2>
            </Grid2>
            <Divider sx={{mt: 1}}/>
        </>
    );
};

export default DetailPageHeaderRow;
