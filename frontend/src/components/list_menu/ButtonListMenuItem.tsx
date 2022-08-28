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
    confirmationDialog?: {
        title: string,
        body: string,
    }
    action: () => void,
    actionLoading: boolean,
}> = ({
    primaryLabel,
    secondaryLabel,
    icon,
    buttonLabel,
    buttonIsDangerous,
    confirmationDialog,
    action,
    actionLoading,
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
                <ListItemText
                    primary={primaryLabel}
                    secondary={secondaryLabel}
                    style={{marginRight: "2rem"}}
                />
                <LoadingButton
                    loading={actionLoading}
                    color={buttonIsDangerous ? "error" : undefined}
                    variant="outlined"
                    onClick={() => {
                        if (confirmationDialog) {
                            setDialogOpen(true);
                        } else {
                            action();
                        }
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
            {
                confirmationDialog !== undefined &&
                <ConfirmationDialog
                    title={confirmationDialog.title}
                    text={confirmationDialog.body}
                    open={dialogOpen}
                    onClose={() => {
                        setDialogOpen(false);
                    }}
                    onAccept={action}
                />
            }
        </>
    );
};
