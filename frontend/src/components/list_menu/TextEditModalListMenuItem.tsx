import React from "react";
import {
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Input,
    ListItem,
    ListItemAvatar,
    ListItemText
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import { Edit as EditIcon } from "@mui/icons-material";

export const TextEditModalListMenuItem: React.FunctionComponent<{
    primaryLabel: string,
    secondaryLabel: string,
    icon: JSX.Element,
    dialog: {
        title: string,
        description: string,

        validatingTransformer?: (value: string) => string,
        onSave: (value: string) => void
    }
    value: string,
    isLoading: boolean,
}> = ({
    primaryLabel,
    secondaryLabel,
    icon,
    dialog,
    value,
    isLoading,
}): JSX.Element => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editorValue, setEditorValue] = React.useState(value);

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
                    loading={isLoading}
                    variant="outlined"
                    onClick={() => {
                        setEditorValue(value);
                        setDialogOpen(true);
                    }}
                    sx={{
                        mt: 1,
                        mb: 1,
                        minWidth: 0
                    }}
                >
                    <EditIcon/>
                </LoadingButton>
            </ListItem>

            <TextEditModal
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}

                title={dialog.title}
                description={dialog.description}

                value={editorValue}
                setValue={(newValue: string) => {
                    if (typeof dialog.validatingTransformer === "function") {
                        setEditorValue(dialog.validatingTransformer(newValue));
                    } else {
                        setEditorValue(newValue);
                    }
                }}
                onSave={dialog.onSave}
            />
        </>
    );
};

const TextEditModal: React.FunctionComponent<{
    dialogOpen: boolean,
    setDialogOpen: (open: boolean) => void,

    title: string,
    description: string,

    value: string,
    setValue: (value: string) => void,
    onSave: (value: string) => void
}> = ({
    dialogOpen,
    setDialogOpen,

    title,
    description,

    value,
    setValue,
    onSave
}): JSX.Element => {
    return (
        <Dialog
            open={dialogOpen}
            onClose={() => {
                setDialogOpen(false);
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {description && (
                    <>
                        <DialogContentText
                            style={{
                                whiteSpace: "pre-wrap"
                            }}
                        >
                            {description}
                        </DialogContentText>
                        <br/>
                    </>
                )}

                <Input
                    type={"text"}
                    fullWidth
                    value={value}
                    sx={{mb: 1}}
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}/>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        onSave(value);

                        setDialogOpen(false);
                    }}
                    autoFocus
                >
                    Save
                </Button>
                <Button
                    onClick={() => {
                        setDialogOpen(false);
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
