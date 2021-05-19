import { Vector2d } from 'konva/types/types';

export const pairWise = function* <T>(arr: T[]): Generator<[T, T]> {
  for (let i = 0; i < arr.length; i = i + 2) {
    yield arr.slice(i, i + 2) as [T, T];
  }
};

export const pairWiseArray = <T>(arr: T[]): [T, T][] => [...pairWise(arr)];

export const inside = (
  [x, y]: [x: number, y: number],
  box: { x: [min: number, max: number]; y: [min: number, max: number] }
): boolean => x >= box.x[0] && x <= box.x[1] && y >= box.y[0] && y <= box.y[1];

export const bound = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const manhatten = (p1: [number, number], p2: [number, number]): number =>
  Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]);

export const pointClosestTo = (
  points: [number, number][],
  target: [number, number]
): [number, number] =>
  points.reduce(
    (prev, cur) =>
      manhatten(cur, target) < manhatten(prev, target) ? cur : prev,
    points[0]
  );

export const ZeroVector: Vector2d = { x: 0, y: 0 };

export const getDistance = (p1: Vector2d, p2: Vector2d): number =>
  Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

export const getCenter = (p1: Vector2d, p2: Vector2d): Vector2d => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
});

export const isTouchEnabled =
  'ontouchstart' in window ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0;
