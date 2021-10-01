import {
    Backdrop,
    Box,
    emphasize,
    SpeedDial,
    SpeedDialAction,
    speedDialClasses,
    SpeedDialProps,
    styled,
} from "@mui/material";
import React from "react";
import GoLayer from "./GoLayer";
import {MapLayersProps} from "./types";
import {
    BorderStyle as ZonesIcon,
    LayersOutlined as SegmentsIcon,
    PinDrop as GoIcon,
    Visibility as ViewIcon,
} from "@mui/icons-material";
import ViewLayer from "./ViewLayer";
import {Capability} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import SegmentsLayer from "./SegmentsLayer";
import ZonesLayer from "./ZonesLayer";

const StyledBackdrop = styled(Backdrop)(({theme}) => {
    return {
        zIndex: theme.zIndex.speedDial - 1,
    };
});

const Root = styled(Box)({
    position: "relative",
    width: "100%",
    height: "100%",
});

const StyledSpeedDial = styled(SpeedDial)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        top: theme.spacing(2),
        right: theme.spacing(2),
        zIndex: theme.zIndex.speedDial,
        [`& .${speedDialClasses.fab}`]: {
            color: theme.palette.text.secondary,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            "&:hover": {
                backgroundColor: emphasize(theme.palette.background.paper, 0.15),
            },
        },
    };
});

type Layer = "View" | "Go" | "Segments" | "Zones";

const layerToComponent: Record<Layer, React.ComponentType<MapLayersProps>> = {
    View: ViewLayer,
    Go: GoLayer,
    Segments: SegmentsLayer,
    Zones: ZonesLayer,
};
const layerToIcon: Record<Layer, JSX.Element> = {
    View: <ViewIcon/>,
    Go: <GoIcon/>,
    Segments: <SegmentsIcon/>,
    Zones: <ZonesIcon/>,
};

export interface MapLayersPropTypes {
    layer?: Layer;
}

const MapLayers = (props: Omit<MapLayersProps, "onDone"> & MapLayersPropTypes): JSX.Element => {
    const [
        goToLocation,
        mapSegmentation,
        zoneCleaning,
    ] = useCapabilitiesSupported(
        Capability.GoToLocation,
        Capability.MapSegmentation,
        Capability.ZoneCleaning
    );
    const layers = React.useMemo<Layer[]>(() => {
        const layers: Array<Layer> = [
            "View"
        ];

        if (goToLocation) {
            layers.push("Go");
        }
        if (mapSegmentation) {
            layers.push("Segments");
        }
        if (zoneCleaning) {
            layers.push("Zones");
        }

        return layers;

    },
    [goToLocation, mapSegmentation, zoneCleaning]
    );
    const [selectedLayer, setSelectedLayer] = React.useState<Layer>(props.layer ?? "View");
    const [open, setOpen] = React.useState(false);

    const selectLayer = (layer: Layer) => {
        return () => {
            setOpen(false);
            setSelectedLayer(layer);
        };
    };

    const handleOpen = React.useCallback<NonNullable<SpeedDialProps["onOpen"]>>(
        (_, reason) => {
            if (reason !== "toggle") {
                return;
            }

            setOpen(true);
        },
        []
    );

    const handleClose = React.useCallback<NonNullable<SpeedDialProps["onClose"]>>(
        (_, reason) => {
            if (
                reason !== "toggle" &&
                reason !== "blur" &&
                reason !== "escapeKeyDown"
            ) {
                return;
            }

            setOpen(false);
        },
        []
    );

    const LayerComponent = layerToComponent[props.layer ?? selectedLayer];

    if (layers.length === 1) {
        return (
            <Root>
                <LayerComponent {...props} onDone={selectLayer("View")}/>
            </Root>
        );
    }

    const showSpeedDial = !props.layer;

    return (
        <Root>
            <StyledBackdrop open={showSpeedDial && open}/>
            <LayerComponent {...props} onDone={selectLayer("View")}/>
            {showSpeedDial && (
                <StyledSpeedDial
                    direction="down"
                    color="inherit"
                    open={open}
                    icon={layerToIcon[props.layer ?? selectedLayer]}
                    onOpen={handleOpen}
                    onClose={handleClose}
                    ariaLabel="MapLayer SpeedDial"
                    FabProps={{size: "small"}}
                >
                    {layers.map((layer) => {
                        return (
                            <SpeedDialAction
                                key={layer}
                                tooltipOpen
                                tooltipTitle={layer}
                                icon={layerToIcon[layer]}
                                onClick={selectLayer(layer)}
                            />
                        );
                    })}
                </StyledSpeedDial>
            )}
        </Root>
    );
};

export default MapLayers;
