import {Box, Grid2, Paper, Skeleton, SvgIconProps, Typography} from "@mui/material";
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
    <Grid2>
        <Paper>
            <Grid2 container direction="column">
                <Box px={1.5} py={1.5}>
                    <Grid2 container alignItems="center" spacing={1}>
                        <Grid2><Icon fontSize="small" /></Grid2>
                        <Grid2 style={{paddingTop: 0}}>
                            <Typography variant="subtitle1">
                                {title}
                            </Typography>
                        </Grid2>
                        <Grid2>
                            <LoadingFade
                                in={pending}
                                transitionDelay={pending ? "500ms" : "0ms"}
                                size={20}
                            />
                        </Grid2>
                    </Grid2>
                    <Grid2 px={0.5}>
                        {
                            isLoading ? (
                                <Skeleton height="4rem" />
                            ) : (
                                children
                            )
                        }
                    </Grid2>
                </Box>
            </Grid2>
        </Paper>
    </Grid2>
);

export default ControlsCard;
