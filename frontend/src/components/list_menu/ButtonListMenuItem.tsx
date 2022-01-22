import React from "react";
import {Avatar, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import ConfirmationDialog from "../ConfirmationDialog";

export const ButtonListMenuItem: React.FunctionComponent<{
    primaryLabel: string,
    secondaryLabel: string,
    icon: JSX.Element,
    buttonLabel: string,
    buttonIsDangerous?: boolean,
    confirmationDialogTitle: string,
    confirmationDialogBody: string,
    dialogAction: () => void,
    dialogActionLoading: boolean
}> = ({
    primaryLabel,
    secondaryLabel,
    icon,
    buttonLabel,
    buttonIsDangerous,
    confirmationDialogTitle,
    confirmationDialogBody,
    dialogAction,
    dialogActionLoading
}): JSX.Element => {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <ListItem
                style={{
                    userSelect: "none"
                }}
            >
                <ListItemAvatar>
                    <Avatar>
                        {icon}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={primaryLabel} secondary={secondaryLabel} />
                <LoadingButton
                    loading={dialogActionLoading}
                    color={buttonIsDangerous ? "error" : undefined}
                    variant="outlined"
                    onClick={() => {
                        setDialogOpen(true);
                    }}
                    sx={{
                        mt: 1,
                        mb: 1,
                        minWidth: 0
                    }}
                >
                    {buttonLabel}
                </LoadingButton>
            </ListItem>
            <ConfirmationDialog
                title={confirmationDialogTitle}
                text={confirmationDialogBody}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={dialogAction}
            />
        </>
    );
};
