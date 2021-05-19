type Point = {
  x: number;
  y: number;
};

export interface Zone {
  points: {
    pA: Point;
    pB: Point;
    pC: Point;
    pD: Point;
  };
  iterations: number;
}

export interface ZonePreset {
  id: string;
  name: string;
  zones: Zone[];
}

export interface ZoneProperties {
  zoneCount: {
    min: number;
    max: number;
  };
  iterationCount: {
    min: number;
    max: number;
  };
}
