import React from "react";
import {Box, emphasize, Grid2, Popover} from "@mui/material";
import {ActionButton} from "./Styled";

interface MapActionsCombinedActionsMenuPopoverButtonProperties {
    icon: React.ReactNode;
    label: string;
    disabled?: boolean;
    children: (close: () => void) => React.ReactNode;
}

const MapActionsCombinedActionsMenuPopoverButton = (props: MapActionsCombinedActionsMenuPopoverButtonProperties): React.ReactElement => {
    const {
        icon,
        label,
        disabled = false,
        children,
    } = props;

    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        if (disabled) {
            setAnchorEl(null);
        }
    }, [disabled]);

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        const target = e.currentTarget;
        setAnchorEl(prev => prev !== null ? null : target);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <Grid2 sx={{
            position: "relative",
            ...(anchorEl !== null && {
                zIndex: (theme) => theme.zIndex.modal + 1,
            })
        }}>
            <ActionButton
                color="inherit"
                size="medium"
                variant="extended"
                disableRipple
                disabled={disabled}
                onClick={handleToggle}
                sx={{
                    transition: "none",
                    userSelect: "none",
                    ...(anchorEl !== null && {
                        backgroundColor: (theme) => emphasize(theme.palette.background.paper, 0.15),
                        "&:hover": {
                            backgroundColor: (theme) => emphasize(theme.palette.background.paper, 0.15),
                        },
                    })
                }}
            >
                <Box component="span" sx={{mr: "0.25rem", ml: "-0.25rem", display: "flex"}}>
                    {icon}
                </Box>
                {label}
            </ActionButton>
            <Popover
                open={anchorEl !== null}
                anchorEl={anchorEl}
                onClose={handleClose}
                transitionDuration={0}
                disableScrollLock
                disableRestoreFocus
                disableAutoFocus
                disableEnforceFocus
                slotProps={{
                    backdrop: {
                        invisible: false,
                        transitionDuration: 0,
                    },
                    paper: {
                        sx: {
                            backgroundColor: "transparent",
                            backgroundImage: "none",
                            boxShadow: "none",
                        }
                    }
                }}
                anchorOrigin={{vertical: "top", horizontal: "right"}}
                transformOrigin={{vertical: "bottom", horizontal: "right"}}
            >
                <Box sx={{display: "flex", flexDirection: "column", gap: 1, pb: 1.5}}>
                    {children(handleClose)}
                </Box>
            </Popover>
        </Grid2>
    );
};

export default MapActionsCombinedActionsMenuPopoverButton;
