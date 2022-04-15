import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    PaletteMode,
    Switch,
    Toolbar,
    Typography
} from "@mui/material";
import React from "react";
import {
    AccessTime as TimeIcon,
    Build as BuildIcon,
    Equalizer as StatisticsIcon,
    DarkMode as DarkModeIcon,
    Map as MapManagementIcon,
    Home as HomeIcon,
    List as ListIcon,
    Menu as MenuIcon,
    ArrowBack as BackIcon,
    PendingActions as PendingActionsIcon,
    Power as PowerIcon,
    SystemUpdateAlt as UpdaterIcon,
    SettingsRemote as SettingsRemoteIcon,
    GitHub as GithubIcon,
    Favorite as DonateIcon,
    MenuBook as DocsIcon,
    DeveloperBoard as SystemInformationIcon,
    Info as AboutIcon,
    Help as HelpIcon,
    SvgIconComponent
} from "@mui/icons-material";
import {Link, useRouteMatch} from "react-router-dom";
import ValetudoEvents from "./ValetudoEvents";
import {Capability} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {SwaggerUIIcon} from "./CustomIcons";

interface MenuEntry {
    kind: "MenuEntry";
    routeMatch: string;
    title: string;
    menuIcon: SvgIconComponent;
    menuText: string;
    requiredCapabilities?: {
        capabilities: Capability[];
        type: "allof" | "anyof"
    };
}

interface MenuSubEntry {
    kind: "MenuSubEntry",
    routeMatch: string,
    title: string,
    parentRoute: string
}

interface MenuSubheader {
    kind: "Subheader";
    title: string;
}



//Note that order is important here
const menuTree: Array<MenuEntry | MenuSubEntry | MenuSubheader> = [
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
        routeMatch: "/robot/total_statistics",
        title: "Statistics",
        menuIcon: StatisticsIcon,
        menuText: "Statistics",
        requiredCapabilities: {
            capabilities: [Capability.TotalStatistics],
            type: "allof"
        }
    },
    {
        kind: "Subheader",
        title: "Settings"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/map_management",
        title: "Map Management",
        menuIcon: MapManagementIcon,
        menuText: "Map Management",
        requiredCapabilities: {
            capabilities: [
                Capability.PersistentMapControl,
                Capability.MappingPass,
                Capability.MapReset,

                Capability.MapSegmentEdit,
                Capability.MapSegmentRename,

                Capability.CombinedVirtualRestrictions
            ],
            type: "anyof"
        }
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/map_management/segments",
        title: "Segment Management",
        parentRoute: "/settings/map_management"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/map_management/virtual_restrictions",
        title: "Virtual Restriction Management",
        parentRoute: "/settings/map_management"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/connectivity",
        title: "Connectivity",
        menuIcon: PowerIcon,
        menuText: "Connectivity"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/connectivity/auth",
        title: "Auth Settings",
        parentRoute: "/settings/connectivity"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/connectivity/mqtt",
        title: "MQTT Connectivity",
        parentRoute: "/settings/connectivity"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/connectivity/networkadvertisement",
        title: "Network Advertisement",
        parentRoute: "/settings/connectivity"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/connectivity/ntp",
        title: "NTP Connectivity",
        parentRoute: "/settings/connectivity"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/settings/connectivity/wifi",
        title: "Wi-Fi Connectivity",
        parentRoute: "/settings/connectivity"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/robot/settings",
        title: "Robot settings",
        menuIcon: BuildIcon,
        menuText: "Robot settings"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/robot/settings/misc",
        title: "Misc Settings",
        parentRoute: "/robot/settings"
    },
    {
        kind: "MenuSubEntry",
        routeMatch: "/robot/settings/quirks",
        title: "Quirks",
        parentRoute: "/robot/settings"
    },
    {
        kind: "Subheader",
        title: "Misc"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/timers",
        title: "Timers",
        menuIcon: TimeIcon,
        menuText: "Timers"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/log",
        title: "Log",
        menuIcon: ListIcon,
        menuText: "Log"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/updater",
        title: "Updater",
        menuIcon: UpdaterIcon,
        menuText: "Updater"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/system_information",
        title: "System Information",
        menuIcon: SystemInformationIcon,
        menuText: "System Information"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/help",
        title: "General Help",
        menuIcon: HelpIcon,
        menuText: "General Help"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/valetudo/about",
        title: "About Valetudo",
        menuIcon: AboutIcon,
        menuText: "About Valetudo"
    },
];

const ValetudoAppBar: React.FunctionComponent<{ paletteMode: PaletteMode, setPaletteMode: (newMode: PaletteMode) => void }> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const [drawerOpen, setDrawerOpen] = React.useState<boolean>(false);
    const robotCapabilities = useCapabilitiesSupported(...Object.values(Capability));

    const routeMatch = useRouteMatch(menuTree.filter(e => {
        return "routeMatch" in e;
    }).map(e => {
        // Make TS happy
        return "routeMatch" in e ? e.routeMatch : "";
    }).reverse()); // Reverse because order is important (deep => shallow)
    const currentTab = routeMatch?.path;

    const currentMenuEntry = menuTree.find(e => {
        return "routeMatch" in e && e.routeMatch === routeMatch?.path;
    }) ?? menuTree[0];

    const pageTitle = React.useMemo(() => {
        let ret = "";

        menuTree.forEach((value) => {
            if ("routeMatch" in value && value.routeMatch === currentTab && value.title) {
                if (ret !== "") {
                    ret += " — ";
                }

                ret += value.title;
            }
        });


        if (ret !== "") {
            document.title = `Valetudo - ${ret}`;
        } else {
            document.title = "Valetudo";
        }

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
                style={{
                    scrollbarWidth: "thin",
                    overflowX: "hidden"
                }}
            >
                <List>
                    {menuTree.filter(item => {
                        return item.kind !== "MenuSubEntry";
                    }).map((value, idx) => {
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

                                const ItemIcon = value.menuIcon;

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


                    <ListSubheader
                        sx={{background: "transparent"}}>
                        Links
                    </ListSubheader>
                    <ListItem
                        button
                        component="a"
                        href="./swagger/"
                        target="_blank"
                    >
                        <ListItemIcon>
                            <SwaggerUIIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Swagger UI"/>
                    </ListItem>
                    <Divider/>
                    <ListItem
                        button
                        component="a"
                        href="https://valetudo.cloud"
                        target="_blank"
                    >
                        <ListItemIcon>
                            <DocsIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Docs"/>
                    </ListItem>
                    <ListItem
                        button
                        component="a"
                        href="https://github.com/Hypfer/Valetudo"
                        target="_blank"
                    >
                        <ListItemIcon>
                            <GithubIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Hypfer/Valetudo"/>
                    </ListItem>
                    <ListItem
                        button
                        component="a"
                        href="https://github.com/sponsors/Hypfer"
                        target="_blank"
                    >
                        <ListItemIcon>
                            <DonateIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Donate"/>
                    </ListItem>


                </List>
            </Box>
        );
    }, [currentTab, paletteMode, setPaletteMode, robotCapabilities]);

    const toolbarContent = React.useMemo(() => {
        switch (currentMenuEntry.kind) {
            case "MenuEntry":
                return (
                    <>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{mr: 2}}
                            onClick={() => {
                                setDrawerOpen(true);
                            }}
                            title="Menu"
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                            {pageTitle}
                        </Typography>
                    </>
                );
            case "MenuSubEntry":
                return (
                    <>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="back"
                            sx={{mr: 2}}

                            component={Link}
                            to={currentMenuEntry.parentRoute}
                        >
                            <BackIcon/>
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
                            {pageTitle}
                        </Typography>
                    </>
                );
            case "Subheader":
                //This can never happen
                return (<></>);
        }
    }, [currentMenuEntry, setDrawerOpen, pageTitle]);

    return (
        <Box
            sx={{
                userSelect: "none"
            }}
        >
            <AppBar position="fixed">
                <Toolbar>
                    {toolbarContent}
                    <div>
                        <ValetudoEvents/>
                    </div>
                </Toolbar>
            </AppBar>
            <Toolbar/>
            {
                currentMenuEntry.kind !== "MenuSubEntry" &&
                <Drawer
                    anchor={"left"}
                    open={drawerOpen}
                    onClose={() => {
                        setDrawerOpen(false);
                    }}
                >
                    {drawerContent}
                </Drawer>
            }
        </Box>
    );
};

export default ValetudoAppBar;
