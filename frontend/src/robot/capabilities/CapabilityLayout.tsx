import React from "react";
import {Card, CardContent, Divider, Grid, Stack, Typography, useMediaQuery, useTheme} from "@mui/material";
import LoadingFade from "../../components/LoadingFade";
import MasonryItem from "@mui/lab/MasonryItem";
import Masonry from "@mui/lab/Masonry";

const useWideLayout = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.up("md"));
};

export const CapabilityContainer: React.FunctionComponent<{children: React.ReactNode}> = ({children}): JSX.Element => {
    const wideLayout = useWideLayout();
    if (wideLayout && children) {
        return (
            <Masonry columns={3} spacing={2}>
                {children}
            </Masonry>
        );
    } else {
        return (
            <Grid container spacing={2}>
                {children}
            </Grid>
        );
    }
};

export const CapabilityItem: React.FunctionComponent<{ children: React.ReactNode, title: string, loading?: boolean }> = ({
    children,
    title,
    loading = false
}): JSX.Element => {
    const wideLayout = useWideLayout();

    const content = (
        <Card>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        {title}
                    </Typography>
                    <LoadingFade in={loading} size={20}/>
                </Stack>
                <Divider sx={{mb: 1}}/>
                {children}
            </CardContent>
        </Card>
    );

    if (wideLayout) {
        return (
            <MasonryItem>
                {content}
            </MasonryItem>
        );
    } else {
        return (
            <Grid item xs={12} sm={6} md={4}>
                {content}
            </Grid>
        );
    }
};
