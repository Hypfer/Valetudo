import React from "react";
import {Grid2, useMediaQuery, useTheme} from "@mui/material";
import Masonry from "@mui/lab/Masonry";
import ReloadableCard from "../../components/ReloadableCard";

const useWideLayout = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.up("md"));
};

export const CapabilityContainer: React.FunctionComponent<{ children: React.ReactNode }> = ({children}): React.ReactElement => {
    const wideLayout = useWideLayout();
    if (wideLayout && children) {
        return (
            <Masonry columns={3} spacing={2}>
                {children}
            </Masonry>
        );
    } else {
        return (
            <Grid2 container spacing={2}>
                {children}
            </Grid2>
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
}): React.ReactElement => {
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
            <Grid2 size={{xs: 12, sm:6, md: 4}}>
                {content}
            </Grid2>
        );
    }
};
