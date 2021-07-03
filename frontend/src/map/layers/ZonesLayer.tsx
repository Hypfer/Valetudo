import {
  Box,
  Button,
  CircularProgress,
  Fade,
  Grid,
  styled,
  Typography,
  Zoom,
} from '@material-ui/core';
import React from 'react';
import * as uuid from 'uuid';
import {
  Capability,
  RawMapEntityType,
  useCleanTemporaryZonesMutation,
  useRobotStatusQuery,
  useZonePropertiesQuery,
  ZoneProperties,
} from '../../api';
import Map from '../Map';
import { LayerActionsContainer, LayerActionButton } from './Styled';
import { MapLayersProps } from './types';
import { useMapEntities, useMapLayers } from './hooks';
import { Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { MapStageRef } from '../MapStage';
import { bound } from '../utils';

interface Zone {
  id: string;
  iterations: number;
  position: {
    x: number;
    y: number;
  };
  width: number;
  height: number;
}

interface ZoneEntityProps {
  zone: Zone;
  onSelect(): void;
  onChange(zone: Zone): void;
  pixelSize: number;
  isSelected: boolean;
}
const ZoneEntityShape = (props: ZoneEntityProps): JSX.Element => {
  const { zone, isSelected, pixelSize, onSelect, onChange } = props;
  const { position, width, height } = zone;
  const shapeRef = React.useRef<Konva.Rect>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const minimumSize = 5 * pixelSize;

  React.useEffect(() => {
    if (isSelected) {
      const transformer = transformerRef.current;
      const shape = shapeRef.current;
      if (transformer === null || shape === null) {
        return;
      }
      // we need to attach transformer manually
      transformer.nodes([shape]);
      transformer.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        {...position}
        width={width}
        height={height}
        strokeWidth={5}
        stroke="#404040"
        fill="#FAFAFAAA"
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        ref={shapeRef}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...zone,
            position: {
              x: e.target.x(),
              y: e.target.y(),
            },
          });
        }}
        onTransformEnd={() => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          if (node === null) {
            return;
          }

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...zone,
            position: { x: node.x(), y: node.y() },
            // set minimal value
            width: Math.max(minimumSize, node.width() * scaleX),
            height: Math.max(minimumSize, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < minimumSize || newBox.height < minimumSize) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

interface ZonesLayerOverlayProps {
  zones: Zone[];
  properties: ZoneProperties;
  onClear(): void;
  onDelete?(): void;
  onDone(): void;
  onAdd(): void;
}

const ZonesLayerOverlay = (props: ZonesLayerOverlayProps): JSX.Element => {
  const { zones, properties, onDelete, onClear, onDone, onAdd } = props;
  const { data: status } = useRobotStatusQuery((state) => state.value);
  const { mutate, isLoading: isMutating } = useCleanTemporaryZonesMutation({
    onSuccess: onDone,
  });

  const canClean = status === 'idle' || status === 'docked';
  const didSelectZones = zones.length > 0;

  const handleClick = React.useCallback(() => {
    if (!didSelectZones || !canClean) {
      return;
    }

    mutate(
      zones.map(({ iterations, position: { x, y }, width, height }) => ({
        iterations,
        points: {
          pA: {
            x: x,
            y: y,
          },
          pB: {
            x: x + width,
            y: y,
          },
          pC: {
            x: x + width,
            y: y + height,
          },
          pD: {
            x: x,
            y: y + height,
          },
        },
      }))
    );
  }, [canClean, didSelectZones, mutate, zones]);

  return (
    <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
      <Grid item>
        <Zoom in>
          <LayerActionButton
            disabled={!didSelectZones || isMutating || !canClean}
            color="inherit"
            size="medium"
            variant="extended"
            onClick={handleClick}
          >
            Clean {zones.length} zones
            {isMutating && (
              <CircularProgress
                color="inherit"
                size={18}
                style={{ marginLeft: 10 }}
              />
            )}
          </LayerActionButton>
        </Zoom>
      </Grid>
      <Grid item>
        <Zoom in>
          <LayerActionButton
            disabled={zones.length === properties.zoneCount.max || isMutating}
            color="inherit"
            size="medium"
            variant="extended"
            onClick={onAdd}
          >
            Add ({zones.length}/{properties.zoneCount.max})
          </LayerActionButton>
        </Zoom>
      </Grid>
      <Grid item>
        <Zoom in={didSelectZones} unmountOnExit>
          <LayerActionButton
            disabled={isMutating}
            color="inherit"
            size="medium"
            variant="extended"
            onClick={onClear}
          >
            Clear
          </LayerActionButton>
        </Zoom>
      </Grid>
      <Grid item>
        <Zoom in={onDelete !== undefined} unmountOnExit>
          <LayerActionButton
            disabled={isMutating}
            color="inherit"
            size="medium"
            variant="extended"
            onClick={onDelete}
          >
            Delete
          </LayerActionButton>
        </Zoom>
      </Grid>
      <Grid item>
        <Fade in={didSelectZones && !canClean} unmountOnExit>
          <Typography variant="caption" color="textSecondary">
            Can only start zone cleaning when idle
          </Typography>
        </Fade>
      </Grid>
    </Grid>
  );
};

const ShownEntities = [
  RawMapEntityType.NoGoArea,
  RawMapEntityType.NoMopArea,
  RawMapEntityType.VirtualWall,
  RawMapEntityType.RobotPosition,
  RawMapEntityType.ChargerLocation,
];

const Container = styled(Box)({
  flex: '1',
  height: '100%',
  display: 'flex',
  flexFlow: 'column',
  justifyContent: 'center',
  alignItems: 'center',
});

const ZonesLayer = (props: MapLayersProps): JSX.Element => {
  const { data, padding, onDone } = props;
  const {
    data: properties,
    isLoading,
    isError,
    refetch,
  } = useZonePropertiesQuery();
  const [zones, setZones] = React.useState<Zone[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>();
  const stageRef = React.useRef<MapStageRef>(null);

  const layers = useMapLayers(data);
  const entities = useMapEntities(data.entities, ShownEntities);

  const handleClear = React.useCallback(() => {
    setZones([]);
    setSelectedId(undefined);
  }, []);

  const handleAdd = React.useCallback(() => {
    const stage = stageRef.current;
    if (
      stage === null ||
      properties === undefined ||
      zones.length >= properties.zoneCount.max
    ) {
      return;
    }

    const id = uuid.v4();
    const map = stage.map();
    const view = stage.view();

    const axisPosition = (axis: 'x' | 'y') =>
      bound(
        map.origin[axis] +
          view[axis === 'x' ? 'width' : 'height'] / 2 / map.scale -
          view.position[axis] / map.scale,
        map.origin[axis],
        map.origin[axis] + map[axis === 'x' ? 'width' : 'height']
      );

    const x = axisPosition('x');
    const y = axisPosition('y');

    setZones((prev) => [
      ...prev,
      {
        id,
        iterations: 1,
        position: { x: x - 50, y: y - 50 },
        width: 100,
        height: 100,
      },
    ]);
    setSelectedId(id);
  }, [properties, zones]);

  const handleDelete = (id: string) => () => {
    setSelectedId(undefined);
    setZones((prev) => prev.filter((zone) => zone.id !== id));
  };

  const zoneEntities = React.useMemo(
    () =>
      zones.map((zone) => (
        <ZoneEntityShape
          key={zone.id}
          zone={zone}
          pixelSize={data.pixelSize}
          isSelected={selectedId === zone.id}
          onSelect={() => {
            setSelectedId(zone.id);
          }}
          onChange={(zone) => {
            setZones((prev) =>
              prev.map((old) => (old.id === zone.id ? zone : old))
            );
          }}
        />
      )),
    [data.pixelSize, selectedId, zones]
  );

  if (isError) {
    return (
      <Container>
        <Typography color="error">
          Error loading {Capability.ZoneCleaning} properties
        </Typography>
        <Box m={1} />
        <Button color="primary" variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  if (properties === undefined && isLoading) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  if (properties === undefined) {
    return (
      <Container>
        <Typography align="center">
          No {Capability.ZoneCleaning} properties
        </Typography>
        ;
      </Container>
    );
  }
  return (
    <>
      <Map
        ref={stageRef}
        layers={layers}
        entities={entities.concat(zoneEntities)}
        padding={padding}
      />
      <LayerActionsContainer>
        <ZonesLayerOverlay
          zones={zones}
          properties={properties}
          onClear={handleClear}
          onAdd={handleAdd}
          onDone={onDone}
          onDelete={
            selectedId !== undefined ? handleDelete(selectedId) : undefined
          }
        />
      </LayerActionsContainer>
    </>
  );
};

export default ZonesLayer;
