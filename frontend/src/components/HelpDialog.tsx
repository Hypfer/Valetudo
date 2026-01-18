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
}): React.ReactElement => {
    return (
        <StyledDialog
            onClose={() =>{
                setDialogOpen(false);
            }}
            open={dialogOpen}
        >
            <div className={style.reactMarkDown}>
                <ReactMarkdown
                    remarkPlugins={[gfm]}
                    rehypePlugins={[rehypeRaw]}
                >
                    {helpText}
                </ReactMarkdown>
            </div>
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
