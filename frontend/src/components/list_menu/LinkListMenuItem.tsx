import React from "react";
import {Avatar, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {ArrowForwardIos as ArrowIcon} from "@mui/icons-material";
import {Link} from "react-router-dom";

export const LinkListMenuItem: React.FunctionComponent<{
    url: string,
    primaryLabel: string,
    secondaryLabel: string,
    icon: React.ReactElement
}> = ({
    url,
    primaryLabel,
    secondaryLabel,
    icon
}): React.ReactElement => {
    return (
        <ListItem
            secondaryAction={
                <ArrowIcon />
            }
            style={{
                cursor: "pointer",
                userSelect: "none",

                color: "inherit" //for the link
            }}

            component={Link}
            to={url}
        >
            <ListItemAvatar>
                <Avatar>
                    {icon}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={primaryLabel}
                secondary={secondaryLabel}
                style={{marginRight: "2rem"}}
            />
        </ListItem>
    );
};
