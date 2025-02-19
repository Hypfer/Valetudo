import {Card, CardContent, Divider, Grid2, IconButton, styled, Typography} from "@mui/material";
import React, {FunctionComponent} from "react";
import {Help as HelpIcon, Refresh as RefreshIcon} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";
import HelpDialog from "./HelpDialog";

const TopRightIconButton = styled(LoadingButton)(({theme}) => {
    return {
        marginTop: -theme.spacing(1),
        minWidth: 0
    };
});

interface ReloadableCardProps {
    title: string;
    onReload?: () => void;
    reloadButton?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    divider?: boolean;
    boxShadow?: number;
    helpText?: string;
}

const ReloadableCard: FunctionComponent<ReloadableCardProps> = ({
    title,
    onReload,
    reloadButton,
    children,
    loading = false,
    divider = true,
    boxShadow,
    helpText,
}): React.ReactElement => {
    const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);


    return (
        <>
            <Card
                sx={{boxShadow: boxShadow}}
            >
                <CardContent>
                    <Grid2
                        container
                        spacing={4}
                        alignItems="center"
                        justifyContent="space-between"
                    >
                        <Grid2>
                            <Typography variant="h6" gutterBottom>
                                {title}
                            </Typography>
                        </Grid2>
                        <Grid2>
                            <Grid2 container>
                                {helpText && (
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
                                )}
                                {reloadButton || (onReload && (
                                    <Grid2>
                                        <TopRightIconButton loading={loading} onClick={onReload} title="Refresh">
                                            <RefreshIcon/>
                                        </TopRightIconButton>
                                    </Grid2>
                                ))}
                            </Grid2>
                        </Grid2>
                    </Grid2>
                    {divider && <Divider sx={{mb: 1}}/>}
                    {children}
                </CardContent>
            </Card>
            {
                helpText &&
                <HelpDialog
                    dialogOpen={helpDialogOpen}
                    setDialogOpen={(open: boolean) => {
                        setHelpDialogOpen(open);
                    }}
                    helpText={helpText}
                />
            }
        </>
    );
};

export default ReloadableCard;
