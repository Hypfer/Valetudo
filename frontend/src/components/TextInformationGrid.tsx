import React from "react";
import {Grid2, Typography} from "@mui/material";

const TextInformationGrid: React.FunctionComponent<{ items: Array<{ header: string, body: string }> }> = ({
    items
}): React.ReactElement => {
    return (
        <Grid2
            container
            spacing={2}
            style={{wordBreak: "break-all"}}
        >
            {items.map((item) => {
                return (
                    <Grid2 key={item.header}>
                        <Typography variant="caption" color="textSecondary">
                            {item.header}
                        </Typography>
                        <Typography variant="body2">{item.body}</Typography>
                    </Grid2>
                );
            })}
        </Grid2>
    );
};

export default TextInformationGrid;
