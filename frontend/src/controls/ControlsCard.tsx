import {Box, Grid, Paper, Skeleton, SvgIconProps, Typography} from "@mui/material";
import React, {ReactNode} from "react";
import LoadingFade from "../components/LoadingFade";


interface ControlsCardProps {
    icon: React.ComponentType<SvgIconProps>;
    title: string;
    pending?: boolean;
    children: ReactNode;
    isLoading?: boolean
}

const ControlsCard: React.FC<ControlsCardProps> = ({ icon: Icon, title, pending = false, children, isLoading }) => (
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
                        <Grid item>
                            <LoadingFade
                                in={pending}
                                transitionDelay={pending ? "500ms" : "0ms"}
                                size={20}
                            />
                        </Grid>
                    </Grid>
                    <Grid item px={0.5}>
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
