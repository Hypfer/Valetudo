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
    Edit as EditMapIcon,
    Home as HomeIcon,
    Info as InfoIcon,
    List as ListIcon,
    Menu as MenuIcon,
    PendingActions as PendingActionsIcon,
    Power as PowerIcon,
    SystemUpdateAlt as UpdaterIcon,
    SettingsRemote as SettingsRemoteIcon,
    Elderly as OldFrontendIcon,
    GitHub as GithubIcon,
    Favorite as DonateIcon,
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
    };
}

interface MenuSubheader {
    kind: "Subheader";
    title: string;
}

// Extracted from https://static1.smartbear.co/swagger/media/assets/images/swagger_logo.svg
const SwaggerUIIcon = createSvgIcon(
    <path
        d="m12.001 1c-6.065 0-11.001 4.935-11.001 11.001s4.935 10.999 11.001 10.999 10.999-4.933 10.999-10.999-4.934-11.001-10.999-11.001zm0 1.048c5.496 0 9.951 4.456 9.951 9.952s-4.455 9.951-9.951 9.951-9.952-4.455-9.952-9.951 4.456-9.952 9.952-9.952zm-3.326 4.331c-.133-.001-.261-.001-.388.006-.9.05-1.443.474-1.591 1.349-.106.609-.087 1.235-.13 1.848-.012.322-.046.639-.106.952-.122.558-.363.731-.93.761-.076.008-.148.021-.224.038v1.341c1.032.051 1.172.415 1.256 1.494.03.393-.013.787.012 1.18.016.372.067.741.144 1.101.237.985 1.198 1.315 2.361 1.117v-1.178c-.186 0-.35.004-.511 0-.394-.012-.542-.111-.58-.491-.051-.491-.039-.99-.069-1.485-.059-.918-.161-1.823-1.057-2.407.461-.338.795-.744.901-1.282.076-.376.123-.751.153-1.132.025-.381-.022-.771.012-1.147h.001c.056-.609.094-.858.826-.833.11 0 .215-.017.338-.025v-1.202c-.146 0-.283-.003-.416-.006zm6.958.008c-.231-.007-.48.012-.745.056v1.166c.224 0 .397.001.57.006.3.004.53.117.559.452.03.304.03.613.059.922.059.614.093 1.235.199 1.84.093.499.436.871.863 1.176-.748.503-.969 1.222-1.007 2.03-.021.554-.034 1.112-.063 1.671-.025.508-.203.673-.715.686-.144.004-.283.017-.444.025v1.197c.3 0 .576.017.851 0 .855-.051 1.37-.466 1.539-1.295.072-.457.115-.919.128-1.38.03-.423.026-.849.069-1.268.063-.656.362-.926 1.018-.969.063-.008.124-.021.183-.042v-1.342c-.11-.013-.187-.025-.267-.03v.001c-.491-.021-.736-.187-.859-.652-.076-.296-.123-.605-.139-.91-.034-.567-.03-1.137-.069-1.704-.072-1.093-.728-1.608-1.729-1.637zm-.931 4.839v.001c-.432-.008-.791.333-.804.765 0 .432.348.779.779.779h.008c.389.068.783-.309.808-.762.021-.419-.359-.783-.79-.783zm-5.384.001c-.423-.021-.787.308-.808.731-.021.427.308.791.731.812h.051c.419.025.778-.295.804-.714v-.043c.008-.427-.333-.778-.761-.787zm2.669 0c-.41-.013-.752.308-.765.714 0 .025 0 .047.004.072 0 .461.313.757.787.757.465 0 .757-.304.757-.783-.004-.461-.313-.765-.783-.761z"/>,
    "swagger"
);

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
        routeMatch: "/settings/connectivity",
        title: "Connectivity",
        menuIcon: PowerIcon,
        menuText: "Connectivity"
    },
    {
        kind: "MenuEntry",
        routeMatch: "/settings/updater",
        title: "Updater",
        menuIcon: UpdaterIcon,
        menuText: "Updater"
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
                    <ListItem
                        button
                        component="a"
                        href="./old_frontend/"
                        target="_blank"
                    >
                        <ListItemIcon>
                            <OldFrontendIcon/>
                        </ListItemIcon>
                        <ListItemText primary="Old Frontend"/>
                    </ListItem>
                    <Divider/>
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

    return (
        <Box
            sx={{
                userSelect: "none"
            }}
        >
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
