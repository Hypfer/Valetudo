import React from "react";
import {Avatar, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {ArrowForwardIos as ArrowIcon} from "@mui/icons-material";
import {Link} from "react-router-dom";

export const LinkListMenuItem: React.FunctionComponent<{
    key: string,
    url: string,
    primaryLabel: string,
    secondaryLabel: string,
    icon: JSX.Element
}> = ({
    url,
    primaryLabel,
    secondaryLabel,
    icon
}): JSX.Element => {
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
