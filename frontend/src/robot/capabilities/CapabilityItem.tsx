import React from "react";
import {Card, CardContent, Divider, Grid, Stack, Typography} from "@mui/material";
import LoadingFade from "../../components/LoadingFade";

const CapabilityItem: React.FunctionComponent<{ children: React.ReactNode, title: string, loading?: boolean }> = ({
    children,
    title,
    loading = false
}): JSX.Element => {
    return (
        <Grid item xs={12} sm={6} md={4}>
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
        </Grid>
    );
};

export default CapabilityItem;
