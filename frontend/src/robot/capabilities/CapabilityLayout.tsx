import React from "react";
import {Grid, useMediaQuery, useTheme} from "@mui/material";
import Masonry from "@mui/lab/Masonry";
import ReloadableCard from "../../components/ReloadableCard";

const useWideLayout = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.up("md"));
};

export const CapabilityContainer: React.FunctionComponent<{ children: React.ReactNode }> = ({children}): JSX.Element => {
    const wideLayout = useWideLayout();
    if (wideLayout && children) {
        //As of "@mui/lab": "5.0.0-alpha.82", for some reason, in our setup we need to override flex-flow or else the items will be in a single column
        return (
            <Masonry columns={3} spacing={2} style={{flexFlow: "row wrap"}}>
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
        return content;
    } else {
        return (
            <Grid item xs={12} sm={6} md={4}>
                {content}
            </Grid>
        );
    }
};
