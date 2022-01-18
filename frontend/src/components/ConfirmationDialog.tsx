import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from "@mui/material";
import React, {FunctionComponent} from "react";

interface YesNoDialogProps {
    title: string;
    text?: string | JSX.Element;
    open: boolean;
    children?: React.ReactNode;
    onClose: () => void;
    onAccept: () => void;
}

const ConfirmationDialog: FunctionComponent<YesNoDialogProps> = ({
    title,
    text,
    open,
    children,
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
                {text && (
                    <DialogContentText
                        style={{
                            whiteSpace: "pre-wrap"
                        }}
                    >
                        {text}
                    </DialogContentText>
                )}
                {children}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    onAccept();
                    onClose();
                }} autoFocus>
                    Yes
                </Button>
                <Button onClick={() => {
                    onClose();
                }}>No</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
