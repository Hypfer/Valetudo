import {Card, CardContent, Divider, Grid, styled, Typography} from "@material-ui/core";
import React, {FunctionComponent} from "react";
import {Refresh as RefreshIcon} from "@material-ui/icons";
import {LoadingButton} from "@material-ui/lab";

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
}

const ReloadableCard: FunctionComponent<ReloadableCardProps> = ({
    title,
    onReload,
    reloadButton,
    children,
    loading = false,
    divider = true,
}): JSX.Element => {
    return (
        <Card>
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
                        {reloadButton || (
                            <TopRightIconButton loading={loading} onClick={onReload}>
                                <RefreshIcon/>
                            </TopRightIconButton>
                        )}
                    </Grid>
                </Grid>
                {divider && <Divider/>}
                {children}
            </CardContent>
        </Card>
    );
};

export default ReloadableCard;
