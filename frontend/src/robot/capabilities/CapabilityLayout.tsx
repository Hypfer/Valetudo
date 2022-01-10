import React from "react";
import {Grid, useMediaQuery, useTheme} from "@mui/material";
import MasonryItem from "@mui/lab/MasonryItem";
import Masonry from "@mui/lab/Masonry";
import ReloadableCard from "../../components/ReloadableCard";

const useWideLayout = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.up("md"));
};

export const CapabilityContainer: React.FunctionComponent<{ children: React.ReactNode }> = ({children}): JSX.Element => {
    const wideLayout = useWideLayout();
    if (wideLayout && children) {
        return (
            <Masonry columns={3} spacing={2} style={{padding: "0.2rem"}}>
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

export const CapabilityItem: React.FunctionComponent<
{
    children: React.ReactNode,
    title: string,
    loading?: boolean,
    onReload?: () => void,
    helpText?: string
}> = ({
    children,
    title,
    onReload,
    loading = false,
    helpText
}): JSX.Element => {
    const wideLayout = useWideLayout();
    const content = (
        <ReloadableCard
            title={title}
            onReload={onReload}
            loading={loading}
            boxShadow={3}
            helpText={helpText}
        >
            {children}
        </ReloadableCard>
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
