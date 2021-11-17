import {Box, Divider, Grid, Icon, Paper, styled} from "@mui/material";
import ControlsBody from "./ControlsBody";
import {ReactComponent as Logo} from "./icons/valetudo_logo_with_name.svg";
import {ExpandLess as OpenIcon, ExpandMore as CloseIcon,} from "@mui/icons-material";
import React from "react";

const MobileControls: React.FunctionComponent<{ open: boolean, setOpen: (newOpen: boolean) => void }> = ({
    open,
    setOpen
}): JSX.Element => {
    const StyledIcon = styled(Icon)(({theme}) => {
        return {
            fontSize: "2.5em"
        };
    });
    const Sheet = styled(Box)(({ theme }) => {
        return {
            backgroundColor: theme.palette.background.default,
        };
    });


    return (
        <Paper sx={{
            height: "100%"
        }}>
            <Grid
                container
                direction="row"
                sx={{
                    height: "68px"
                }}
                onClick={() => {
                    setOpen(!open);
                }}
            >
                <Grid item>
                    <Box px={2} pt={2} pb={1}>
                        <Logo
                            style={{}}
                            width={200}
                            height={36}
                        />
                    </Box>
                </Grid>
                <Grid item sx={{
                    marginLeft: "auto"
                }}>
                    <Box px={2} pt={2} pb={1}>
                        <StyledIcon as={open ? CloseIcon : OpenIcon}/>
                    </Box>
                </Grid>
            </Grid>
            <Divider/>
            <Sheet p={1} sx={{
                overflow: open ? "scroll" : "hidden",
                height: "calc(95% - 68px)"
            }}>
                <ControlsBody />
            </Sheet>
        </Paper>
    );
};

export default MobileControls;
