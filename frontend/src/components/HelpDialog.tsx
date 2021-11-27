import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {Button, Dialog, DialogActions, styled} from "@mui/material";
import style from "./HelpDialog.module.css";

const StyledDialog = styled(Dialog)(({ theme }) => {
    return {
        "& .MuiDialogContent-root": {
            padding: theme.spacing(2),
        },
        "& .MuiDialogActions-root": {
            padding: theme.spacing(1),
        },
    };
});

const HelpDialog: React.FunctionComponent<{
    dialogOpen: boolean,
    setDialogOpen: (newOpen: boolean) => void,
    helpText: string
}> = ({
    dialogOpen,
    setDialogOpen,
    helpText
}): JSX.Element => {
    return (
        <StyledDialog
            onClose={() =>{
                setDialogOpen(false);
            }}
            open={dialogOpen}
        >
            <ReactMarkdown
                remarkPlugins={[gfm]}
                rehypePlugins={[rehypeRaw]}
                className={style.reactMarkDown}
            >
                {helpText}
            </ReactMarkdown>
            <DialogActions>
                <Button autoFocus onClick={() => {
                    setDialogOpen(false);
                }}>
                    OK
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default HelpDialog;
