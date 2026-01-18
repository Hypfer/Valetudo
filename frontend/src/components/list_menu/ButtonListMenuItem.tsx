import React from "react";
import {Avatar, Button, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import ConfirmationDialog from "../ConfirmationDialog";

export const ButtonListMenuItem: React.FunctionComponent<{
    primaryLabel: string,
    secondaryLabel: string | React.ReactElement,
    icon?: React.ReactElement,
    buttonLabel: string,
    buttonColor?: "warning" | "error",
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
    buttonColor,
    confirmationDialog,
    action,
    actionLoading,
}): React.ReactElement => {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <ListItem
                style={{
                    userSelect: "none"
                }}
            >
                {
                    icon &&
                    <ListItemAvatar>
                        <Avatar>
                            {icon}
                        </Avatar>
                    </ListItemAvatar>
                }
                <ListItemText
                    primary={primaryLabel}
                    secondary={secondaryLabel}
                    style={{marginRight: "2rem"}}
                />
                <Button
                    loading={actionLoading}
                    color={buttonColor}
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
                </Button>
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
