import Konva from 'konva';
import { KonvaEventObject, Node } from 'konva/lib/Node';
import React from 'react';
import { Stage, StageProps } from 'react-konva';
import { useHTMLElement } from '../hooks';
import {
  bound,
  getCenter,
  getDistance,
  isTouchEnabled,
  ZeroVector,
} from './utils';
import { Box, styled, useTheme } from '@material-ui/core';
import { Vector2d } from 'konva/lib/types';

Konva.hitOnDragEnabled = isTouchEnabled;
const MaxScaleBound = 10;

const Container = styled(Box)({
  position: 'relative',
  height: '100%',
  width: '100%',
});
const StyledStage = styled(Stage)({
  position: 'absolute',
});

const scalePersistentNodes = (stage: Konva.Stage) => {
  stage
    .find(
      (node: Node) =>
        node.getAttr('minimumScale') !== undefined ||
        node.getAttr('maximumScale')
    )
    .forEach((shape) => {
      const stageScaleX = stage.scaleX();
      const stageScaleY = stage.scaleY();
      const minimumScale = shape.getAttr('minimumScale') ?? -Infinity;
      const maximumScale = shape.getAttr('maximumScale') ?? Infinity;
      shape.scale({
        x: bound(stageScaleX, minimumScale, maximumScale) / stageScaleX,
        y: bound(stageScaleY, minimumScale, maximumScale) / stageScaleY,
      });
    });
};

export interface MapStageProps extends StageProps {
  children: JSX.Element;
  width: number;
  padding?: number;
  height: number;
  offset?: never;
  scale?: never;
  scaleX?: never;
  scaleY?: never;
}

export interface MapStageRef {
  redraw(): void;
  view(): {
    width: number;
    height: number;
    scale: number;
    position: {
      x: number;
      y: number;
    };
  };
  map(): {
    width: number;
    height: number;
    scale: number;
    origin: {
      x: number;
      y: number;
    };
  };
}

const MapStage = React.forwardRef<MapStageRef | null, MapStageProps>(
  (props, ref): JSX.Element => {
    const {
      children,
      padding = 0,
      offsetX = 0,
      offsetY = 0,
      width,
      height,
      onWheel,
      onTouchMove,
      onTouchEnd,
      onDragEnd,
      ...stageConfig
    } = props;
    const theme = useTheme();
    const lastCenter = React.useRef<Vector2d | null>(null);
    const lastDist = React.useRef<number>(0);

    const [containerRef, { containerWidth, containerHeight }] = useHTMLElement(
      { containerWidth: 0, containerHeight: 0 },
      React.useCallback(
        (element: HTMLDivElement) => ({
          containerWidth: element.offsetWidth,
          containerHeight: element.offsetHeight,
        }),
        []
      )
    );
    const stageRef = React.useRef<Konva.Stage>(null);

    const stageScaleX = (containerWidth - padding * 2) / width;
    const stageScaleY = (containerHeight - padding * 2) / height;
    const stageScale = Math.min(stageScaleX, stageScaleY);

    React.useImperativeHandle<MapStageRef | null, MapStageRef | null>(
      ref,
      () => {
        const stage = stageRef.current;
        if (stage === null) {
          return null;
        }

        return {
          view: () => ({
            width: containerWidth,
            height: containerHeight,
            position: stage.position(),
            scale: stageScale,
          }),
          map: () => ({
            width,
            height,
            scale: stage.scaleX(),
            origin: stage.offset(),
          }),
          redraw() {
            scalePersistentNodes(stage);
            stage.batchDraw();
          },
        };
      },
      [containerHeight, containerWidth, height, stageScale, width]
    );

    // Update scale of nodes that should have a specific size
    React.useEffect(() => {
      const stage = stageRef.current;
      if (stage === null) {
        return;
      }
      stage.scale({ x: stageScale, y: stageScale });
      scalePersistentNodes(stage);
      stage.batchDraw();
    }, [stageScale]);

    const scaleStage = React.useCallback(
      (
        stage: Konva.Stage,
        center: Vector2d,
        scaleDelta: number,
        centerDelta: Vector2d = ZeroVector
      ) => {
        const currentScale = stage.scaleX();

        // local coordinates of center point
        const localCenter = {
          x: (center.x - stage.x()) / currentScale,
          y: (center.y - stage.y()) / currentScale,
        };

        const newScale = bound(
          currentScale * scaleDelta,
          stageScale * (theme.breakpoints.values.sm / 2 / containerWidth),
          stageScale * MaxScaleBound
        );

        const newPos = {
          x: center.x - localCenter.x * newScale + centerDelta.x,
          y: center.y - localCenter.y * newScale + centerDelta.y,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);

        scalePersistentNodes(stage);

        stage.batchDraw();
      },
      [containerWidth, stageScale, theme.breakpoints.values.sm]
    );

    const handleScroll = React.useCallback(
      (event: KonvaEventObject<WheelEvent>) => {
        onWheel?.(event);
        if (event.evt.defaultPrevented) {
          return;
        }

        event.evt.preventDefault();
        const { currentTarget: stage } = event;
        if (!(stage instanceof Konva.Stage)) {
          return;
        }

        scaleStage(
          stage,
          stage.getPointerPosition() ?? ZeroVector,
          (100 - event.evt.deltaY) / 100
        );
      },
      [onWheel, scaleStage]
    );

    const dragBoundFunc = React.useMemo(
      () =>
        function (this: Konva.Node, pos: Vector2d): Vector2d {
          const scale = this.scaleX();

          const boundAxis = (value: number, container: number, map: number) =>
            bound(
              value,
              -(map * stageScale) * (scale / stageScale) + padding,
              container - padding
            );

          return {
            x: boundAxis(pos.x, containerWidth, width),
            y: boundAxis(pos.y, containerHeight, height),
          };
        },
      [containerHeight, containerWidth, height, padding, stageScale, width]
    );

    const handleTwoTouches = React.useCallback(
      (stage: Konva.Stage, touches: [Vector2d, Vector2d]) => {
        const [touch1, touch2] = touches;
        const newCenter = getCenter(touch1, touch2);
        const dist = getDistance(touch1, touch2);

        stage.stopDrag();

        if (!lastCenter.current) {
          lastCenter.current = newCenter;
        }
        if (!lastDist.current) {
          lastDist.current = dist;
        }

        const scaleDelta = dist / lastDist.current;
        const centerDelta = {
          x: newCenter.x - lastCenter.current.x,
          y: newCenter.y - lastCenter.current.y,
        };

        scaleStage(stage, lastCenter.current, scaleDelta, centerDelta);

        lastDist.current = dist;
        lastCenter.current = newCenter;
      },
      [scaleStage]
    );

    const handleTouchMove = React.useCallback(
      (event: KonvaEventObject<TouchEvent>) => {
        onTouchMove?.(event);
        if (event.evt.defaultPrevented) {
          return;
        }

        const { currentTarget: stage } = event;

        if (!(stage instanceof Konva.Stage)) {
          return;
        }

        event.evt.preventDefault();

        if (event.evt.touches.length === 2) {
          const [touch1, touch2] = event.evt.touches;
          const p1 = { x: touch1.clientX, y: touch1.clientY };
          const p2 = { x: touch2.clientX, y: touch2.clientY };
          handleTwoTouches(stage, [p1, p2]);
        }
      },
      [handleTwoTouches, onTouchMove]
    );

    const handleTouchEnd = React.useCallback(
      (event: KonvaEventObject<TouchEvent>) => {
        lastDist.current = 0;

        if (lastCenter.current !== null) {
          lastCenter.current = null;
          event.evt.preventDefault();
          return;
        }

        onTouchEnd?.(event);
      },
      [onTouchEnd]
    );

    // Used to supress react-konva warning.
    const handleDragEnd = React.useCallback(
      (event: KonvaEventObject<DragEvent>) => {
        onDragEnd?.(event);
      },
      [onDragEnd]
    );

    return (
      <Container ref={containerRef}>
        <StyledStage
          {...stageConfig}
          ref={stageRef}
          draggable
          dragBoundFunc={dragBoundFunc}
          onWheel={handleScroll}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragEnd={handleDragEnd}
          width={containerWidth}
          height={containerHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={(containerWidth - width * stageScale) / 2}
          y={(containerHeight - height * stageScale) / 2}
          offsetX={offsetX}
          offsetY={offsetY}
        >
          {children}
        </StyledStage>
      </Container>
    );
  }
);

export default MapStage;
