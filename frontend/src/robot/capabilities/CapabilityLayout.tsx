import React from "react";
import { Grid2, useMediaQuery, useTheme, Box } from "@mui/material";
import ReloadableCard from "../../components/ReloadableCard";

const useWideLayout = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(theme.breakpoints.up("md"));
};

export const CapabilityContainer: React.FunctionComponent<{ children: React.ReactNode }> = ({ children }): React.ReactElement => {
    const wideLayout = useWideLayout();

    if (wideLayout && children) {
        return (
            <Box sx={{
                columnCount: 3,
                columnGap: 2,
                "& > *": {
                    breakInside: "avoid",
                    marginBottom: 2,
                    display: "block"
                }
            }}>
                {children}
            </Box>
        );
    } else {
        return (
            <Grid2 container spacing={2}>
                {children}
            </Grid2>
        );
    }
};

export const CapabilityItem: React.FunctionComponent<{
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
        <Box sx={{ width: "100%" }}>
            <ReloadableCard
                title={title}
                onReload={onReload}
                loading={loading}
                boxShadow={3}
                helpText={helpText}
            >
                {children}
            </ReloadableCard>
        </Box>
    );

    if (wideLayout) {
        return content;
    } else {
        return (
            <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                {content}
            </Grid2>
        );
    }
};
