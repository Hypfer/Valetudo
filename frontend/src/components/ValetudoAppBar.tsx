import {
    AppBar,
    Box,
    createSvgIcon,
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
    Home as HomeIcon,
    Info as InfoIcon,
    List as ListIcon,
    Menu as MenuIcon,
    PendingActions as PendingActionsIcon,
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
    requiredCapabilities?: Capability[];
}

interface MenuSubheader {
    kind: "Subheader";
    title: string;
}

// Extracted from https://raw.githubusercontent.com/mqtt/mqttorg-graphics/master/svg/mqtt-hor.svg
const MQTTIcon = createSvgIcon(
    <path
        d="M 2.06 13.34 H 2 v 7.65 c 0 0.55 0.45 1.01 1.01 1.01 H 10.88 c -0.07 -4.78 -3.99 -8.65 -8.82 -8.65 z m 0 -6.31 H 2 v 3.25 c 6.5 0.03 11.78 5.25 11.85 11.71 h 3.37 C 17.16 13.73 10.39 7.03 2.06 7.03 Z M 22 20.99 V 14.08 C 19.71 8.49 15.11 4.06 9.38 2 H 3.01 C 2.45 2 2 2.45 2 3.01 v 0.98 C 12 4.01 20.13 12.06 20.19 22 h 0.81 c 0.56 -0.01 1.01 -0.45 1.01 -1.01 z M 19.37 4.79 c 0.93 0.93 1.87 2.1 2.63 3.13 V 3 A 0.99 0.99 0 0 0 21 2 H 15.93 c 1.18 0.82 2.41 1.75 3.44 2.79 z"/>,
    "MQTT",
);

const menuTree: Array<MenuEntry | MenuSubheader> = [
    {
        kind: "MenuEntry",
        routeMatch: "/",
        title: "",
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
        requiredCapabilities: [Capability.ConsumableMonitoring],
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/manual_control",
        title: "Manual control",
        menuIcon: SettingsRemoteIcon,
        menuText: "Manual control",
        requiredCapabilities: [Capability.ManualControl],
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
        routeMatch: "/settings/mqtt",
        title: "MQTT",
        menuIcon: MQTTIcon,
        menuText: "MQTT"
    },
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
        let ret = "Valetudo";
        menuTree.forEach((value) => {
            if (value.kind === "MenuEntry" && value.routeMatch === currentTab && value.title) {
                ret += " — " + value.title;
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
                                    if (!value.requiredCapabilities.every(capability => {
                                        const idx = Object.values(Capability).indexOf(capability);
                                        return robotCapabilities[idx];
                                    })) {
                                        return null;
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
                            <DarkModeIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dark mode" />
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
