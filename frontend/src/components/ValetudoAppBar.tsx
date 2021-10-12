import {
    AppBar,
    Box,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    PaletteMode,
    SwipeableDrawer,
    Switch,
    Toolbar,
    Typography
} from "@mui/material";
import React from "react";
import {
    AccessTime as TimeIcon,
    Build as BuildIcon,
    DarkMode as DarkModeIcon,
    Edit as EditMapIcon,
    Home as HomeIcon,
    Info as InfoIcon,
    List as ListIcon,
    Menu as MenuIcon,
    PendingActions as PendingActionsIcon,
    Power as PowerIcon,
    SettingsRemote as SettingsRemoteIcon,
    SvgIconComponent
} from "@mui/icons-material";
import {Link, useRouteMatch} from "react-router-dom";
import ValetudoEvents from "./ValetudoEvents";
import {Capability} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";

interface MenuEntry {
    kind: "MenuEntry";
    routeMatch: string;
    title: string;
    menuIcon: SvgIconComponent;
    menuText: string;
    requiredCapabilities?: {
        capabilities: Capability[];
        type: "allof" | "anyof"
    }
}

interface MenuSubheader {
    kind: "Subheader";
    title: string;
}

const menuTree: Array<MenuEntry | MenuSubheader> = [
    {
        kind: "MenuEntry",
        routeMatch: "/",
        title: "Home",
        menuIcon: HomeIcon,
        menuText: "Home"
    },
    {
        kind: "Subheader",
        title: "Robot"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/consumables",
        title: "Consumables",
        menuIcon: PendingActionsIcon,
        menuText: "Consumables",
        requiredCapabilities: {
            capabilities: [Capability.ConsumableMonitoring],
            type: "allof"
        }
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/edit_map",
        title: "Edit Map",
        menuIcon: EditMapIcon,
        menuText: "Edit Map",
        requiredCapabilities: {
            capabilities: [
                Capability.CombinedVirtualRestrictions,

                Capability.MapSegmentEdit,
                Capability.MapSegmentRename
            ],
            type: "anyof"
        }
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/manual_control",
        title: "Manual control",
        menuIcon: SettingsRemoteIcon,
        menuText: "Manual control",
        requiredCapabilities: {
            capabilities: [Capability.ManualControl],
            type: "allof"
        }
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/settings",
        title: "Robot settings",
        menuIcon: BuildIcon,
        menuText: "Robot settings"
    },
    {
        kind: "Subheader",
        title: "Settings"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/about",
        title: "About",
        menuIcon: InfoIcon,
        menuText: "About"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/log",
        title: "Log",
        menuIcon: ListIcon,
        menuText: "Log"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/timers",
        title: "Timers",
        menuIcon: TimeIcon,
        menuText: "Timers"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/interfaces",
        title: "Interfaces",
        menuIcon: PowerIcon,
        menuText: "Interfaces"
    }
];

const ValetudoAppBar: React.FunctionComponent<{ paletteMode: PaletteMode, setPaletteMode: (newMode: PaletteMode) => void }> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const robotCapabilities = useCapabilitiesSupported(...Object.values(Capability));

    const routeMatch = useRouteMatch(menuTree.filter(e => {
        return e.kind === "MenuEntry";
    }).map(e => {
        // Make TS happy
        return e.kind === "MenuEntry" ? e.routeMatch : "";
    }).reverse()); // Reverse because order is important (deep => shallow)
    const currentTab = routeMatch?.path;

    const pageTitle = React.useMemo(() => {
        let ret = "";
        menuTree.forEach((value) => {
            if (value.kind === "MenuEntry" && value.routeMatch === currentTab && value.title) {
                if (ret !== "") {
                    ret += " — ";
                }

                ret += value.title;
            }
        });
        return ret;
    }, [currentTab]);

    const drawerContent = React.useMemo(() => {
        return (
            <Box
                sx={{width: 250}}
                role="presentation"
                onClick={() => {
                    setDrawerOpen(false);
                }}
                onKeyDown={() => {
                    setDrawerOpen(false);
                }}
            >
                <List>
                    {menuTree.map((value, idx) => {
                        switch (value.kind) {
                            case "Subheader":
                                return (
                                    <ListSubheader key={`${idx}`}
                                        sx={{background: "transparent"}}>
                                        {value.title}
                                    </ListSubheader>
                                );

                            case "MenuEntry": {
                                if (value.requiredCapabilities) {
                                    switch (value.requiredCapabilities.type) {
                                        case "allof": {
                                            if (!value.requiredCapabilities.capabilities.every(capability => {
                                                const idx = Object.values(Capability).indexOf(capability);
                                                return robotCapabilities[idx];
                                            })) {
                                                return null;
                                            }

                                            break;
                                        }
                                        case "anyof": {
                                            if (!value.requiredCapabilities.capabilities.some(capability => {
                                                const idx = Object.values(Capability).indexOf(capability);
                                                return robotCapabilities[idx];
                                            })) {
                                                return null;
                                            }

                                            break;
                                        }
                                    }
                                }

                                const ItemIcon = value.menuIcon as SvgIconComponent;

                                return (
                                    <ListItem key={value.routeMatch} button
                                        selected={value.routeMatch === currentTab}
                                        component={Link} to={value.routeMatch}>
                                        <ListItemIcon>
                                            <ItemIcon/>
                                        </ListItemIcon>
                                        <ListItemText primary={value.menuText}/>
                                    </ListItem>
                                );
                            }
                        }
                    })}

                    <Divider/>
                    <ListItem>
                        <ListItemIcon>
                            <DarkModeIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Dark mode"/>
                        <Switch
                            edge="end"
                            onChange={(e) => {
                                setPaletteMode(e.target.checked ? "dark" : "light");
                            }}
                            checked={paletteMode === "dark"}
                        />
                    </ListItem>
                </List>
            </Box>
        );
    }, [currentTab, paletteMode, setPaletteMode, robotCapabilities]);

    return (
        <Box>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        sx={{mr: 2}}
                        onClick={() => {
                            setDrawerOpen(true);
                        }}
                    >
                        <MenuIcon/>
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                        {pageTitle}
                    </Typography>
                    <div>
                        <ValetudoEvents/>
                    </div>
                </Toolbar>
            </AppBar>
            <Toolbar/>

            <SwipeableDrawer
                anchor={"left"}
                open={drawerOpen}
                onOpen={() => {
                    setDrawerOpen(true);
                }}
                onClose={() => {
                    setDrawerOpen(false);
                }}>
                {drawerContent}
            </SwipeableDrawer>
        </Box>
    );
};

export default ValetudoAppBar;
