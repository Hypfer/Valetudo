import PaperContainer from "../components/PaperContainer";
import {Box, Grid} from "@mui/material";
import {Help as HelpIcon} from "@mui/icons-material";
import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import style from "./Help.module.css";
import {HelpText} from "./res/HelpText";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";

const Help = (): React.ReactElement => {
    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="General Help"
                        icon={<HelpIcon/>}
                    />

                    <ReactMarkdown
                        remarkPlugins={[gfm]}
                        rehypePlugins={[rehypeRaw]}
                        className={style.reactMarkDown}
                    >
                        {HelpText}
                    </ReactMarkdown>
                </Box>
            </Grid>
        </PaperContainer>
    );
};

export default Help;
