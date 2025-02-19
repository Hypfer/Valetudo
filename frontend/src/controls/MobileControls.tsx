import {Box, Grid2, Icon, Paper, styled} from "@mui/material";
import ControlsBody from "./ControlsBody";
import {ReactComponent as Logo} from "../assets/icons/valetudo_logo_with_name.svg";
import {ExpandLess as OpenIcon, ExpandMore as CloseIcon,} from "@mui/icons-material";
import React from "react";

const MobileControls: React.FunctionComponent<{ open: boolean, setOpen: (newOpen: boolean) => void }> = ({
    open,
    setOpen
}): React.ReactElement => {
    const StyledIcon = styled(Icon)(({theme}) => {
        return {
            fontSize: "2.5em"
        };
    });
    const ControlsSheetContainer = styled(Box)(({ theme }) => {
        const color = theme.palette.mode === "light" ? "#ededed" : "#242424";

        return {
            backgroundColor: color,
            borderColor: color,
            borderTopWidth: "4px",
            borderLeftWidth: "1px",
            borderRightWidth: "1px",
            borderBottomWidth: "1px",
            borderStyle: "solid",
            borderTopLeftRadius: "4px",
            borderTopRightRadius: "4px",
            paddingTop: "0.125rem",
        };
    });


    return (
        <Paper sx={{
            height: "100%"
        }}>
            <ControlsSheetContainer
                style={{
                    display: open ? "" : "none",
                    height: "calc(95% - 68px)",
                }}
            >
                <Box p={1} sx={{
                    overflow: open ? "scroll" : "hidden",
                    height: "100%",
                }}>
                    <ControlsBody />
                </Box>
            </ControlsSheetContainer>
            <Grid2
                container
                direction="row"
                sx={{
                    height: "68px"
                }}
                onClick={() => {
                    setOpen(!open);
                }}
            >
                <Grid2>
                    <Box px={2} pt={2} pb={1}>
                        <Logo
                            style={{}}
                            width={200}
                            height={36}
                        />
                    </Box>
                </Grid2>
                <Grid2 sx={{
                    marginLeft: "auto"
                }}>
                    <Box px={2} pt={2} pb={1}>
                        <StyledIcon as={open ? CloseIcon : OpenIcon}/>
                    </Box>
                </Grid2>
            </Grid2>
        </Paper>
    );
};

export default MobileControls;
