import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@material-ui/core";
import React, {FunctionComponent} from "react";

interface YesNoDialogProps {
    title: string;
    text: string;
    open: boolean;
    onClose: () => void;
    onAccept: () => void;
}

const ConfirmationDialog: FunctionComponent<YesNoDialogProps> = ({
    title,
    text,
    open,
    onClose,
    onAccept,
}): JSX.Element => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {text}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    onClose();
                }}>No</Button>
                <Button onClick={() => {
                    onAccept();
                    onClose();
                }} autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
