import {Card, CardContent, Divider, Grid, styled, Typography} from "@mui/material";
import React, {FunctionComponent} from "react";
import {Refresh as RefreshIcon} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";

const TopRightIconButton = styled(LoadingButton)(({theme}) => {
    return {
        marginTop: -theme.spacing(1),
    };
});

interface ReloadableCardProps {
    title: string;
    onReload?: () => void;
    reloadButton?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    divider?: boolean;
    boxShadow?: number
}

const ReloadableCard: FunctionComponent<ReloadableCardProps> = ({
    title,
    onReload,
    reloadButton,
    children,
    loading = false,
    divider = true,
    boxShadow
}): JSX.Element => {
    return (
        <Card
            sx={{boxShadow: boxShadow}}
        >
            <CardContent>
                <Grid
                    container
                    spacing={4}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Grid item>
                        <Typography variant="h6" gutterBottom>
                            {title}
                        </Typography>
                    </Grid>
                    <Grid item>
                        {reloadButton || (onReload && (
                            <TopRightIconButton loading={loading} onClick={onReload}>
                                <RefreshIcon/>
                            </TopRightIconButton>
                        ))}
                    </Grid>
                </Grid>
                {divider && <Divider sx={{mb: 1}}/>}
                {children}
            </CardContent>
        </Card>
    );
};

export default ReloadableCard;
