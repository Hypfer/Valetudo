import { Backdrop, Box, makeStyles, styled } from '@material-ui/core';
import { SpeedDial, SpeedDialAction, SpeedDialProps } from '@material-ui/lab';
import React from 'react';
import GoLayer from './GoLayer';
import { MapLayersProps } from './types';
import {
  LayersOutlined as SegmentsIcon,
  PinDrop as GoIcon,
  BorderStyle as ZonesIcon,
  Visibility as ViewIcon,
} from '@material-ui/icons';
import ViewLayer from './ViewLayer';
import { Capability } from '../../api';
import { useCapabilitiesSupported } from '../../CapabilitiesProvider';
import SegmentsLayer from './SegmentsLayer';
import ZonesLayer from './ZonesLayer';

const useStyles = makeStyles((theme) => ({
  speedDial: {
    position: 'absolute',
    pointerEvents: 'none',
    top: theme.spacing(2),
    right: theme.spacing(2),
    zIndex: theme.zIndex.speedDial,
  },
  backdrop: {
    zIndex: theme.zIndex.speedDial - 1,
  },
}));

const Root = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
});

const StyledSpeedDial = styled(SpeedDial)({
  '& .MuiSpeedDial-fab': {
    backgroundColor: 'rgba(0,0,0,0.5)',
    border: '1px solid',
  },
});

type Layer = 'View' | 'Go' | 'Segments' | 'Zones';

const layerToComponent: Record<Layer, React.ComponentType<MapLayersProps>> = {
  View: ViewLayer,
  Go: GoLayer,
  Segments: SegmentsLayer,
  Zones: ZonesLayer,
};
const layerToIcon: Record<Layer, JSX.Element> = {
  View: <ViewIcon />,
  Go: <GoIcon />,
  Segments: <SegmentsIcon />,
  Zones: <ZonesIcon />,
};

const MapLayers = (props: Omit<MapLayersProps, 'onDone'>): JSX.Element => {
  const classes = useStyles();
  const [
    goToLocation,
    mapSegmentation,
    zoneCleaning,
  ] = useCapabilitiesSupported(
    Capability.GoToLocation,
    Capability.MapSegmentation,
    Capability.ZoneCleaning
  );
  const layers = React.useMemo<Layer[]>(
    () =>
      ([
        'View',
        goToLocation ? 'Go' : undefined,
        mapSegmentation ? 'Segments' : undefined,
        zoneCleaning ? 'Zones' : undefined,
      ] as const).filter(
        <T,>(value: T | undefined): value is T => value !== undefined
      ),
    [goToLocation, mapSegmentation, zoneCleaning]
  );
  const [selectedLayer, setSelectedLayer] = React.useState<Layer>('View');
  const [open, setOpen] = React.useState(false);

  const selectLayer = (layer: Layer) => () => {
    setOpen(false);
    setSelectedLayer(layer);
  };

  const handleOpen = React.useCallback<NonNullable<SpeedDialProps['onOpen']>>(
    (_, reason) => {
      if (reason !== 'toggle') {
        return;
      }

      setOpen(true);
    },
    []
  );

  const handleClose = React.useCallback<NonNullable<SpeedDialProps['onClose']>>(
    (_, reason) => {
      if (
        reason !== 'toggle' &&
        reason !== 'blur' &&
        reason !== 'escapeKeyDown'
      ) {
        return;
      }

      setOpen(false);
    },
    []
  );

  const LayerComponent = layerToComponent[selectedLayer];

  if (layers.length === 1) {
    return (
      <Root>
        <LayerComponent {...props} onDone={selectLayer('View')} />
      </Root>
    );
  }

  return (
    <Root>
      <Backdrop open={open} className={classes.backdrop} />
      <LayerComponent {...props} onDone={selectLayer('View')} />
      <StyledSpeedDial
        className={classes.speedDial}
        direction="down"
        color="inherit"
        open={open}
        icon={layerToIcon[selectedLayer]}
        onOpen={handleOpen}
        onClose={handleClose}
        ariaLabel="MapLayer SpeedDial"
        FabProps={{ size: 'small' }}
      >
        {layers.map((layer) => (
          <SpeedDialAction
            key={layer}
            tooltipOpen
            tooltipTitle={layer}
            icon={layerToIcon[layer]}
            onClick={selectLayer(layer)}
          />
        ))}
      </StyledSpeedDial>
    </Root>
  );
};

export default MapLayers;
