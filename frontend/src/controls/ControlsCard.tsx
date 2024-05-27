import {Box, Grid, Paper, Skeleton, SvgIconProps, Typography} from "@mui/material";
import React, {ReactNode} from "react";


interface ControlsCardProps {
    icon: React.ComponentType<SvgIconProps>;
    title: string;
    children: ReactNode;
    isLoading?: boolean
}

const ControlsCard: React.FC<ControlsCardProps> = ({ icon: Icon, title, children, isLoading }) => (
    <Grid item>
        <Paper>
            <Grid container direction="column">
                <Box px={1.5} py={1.5}>
                    <Grid item container alignItems="center" spacing={1}>
                        <Grid item><Icon fontSize="small" /></Grid>
                        <Grid item style={{paddingTop: 0}}>
                            <Typography variant="subtitle1">
                                {title}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item>
                        {
                            isLoading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                children
                            )
                        }
                    </Grid>
                </Box>
            </Grid>
        </Paper>
    </Grid>
);

export default ControlsCard;
