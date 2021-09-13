import { RobotAttribute, RobotAttributeClass } from "./RawRobotState";

export const isAttribute = <C extends RobotAttributeClass>(
    clazz: C
): ((
    attribute: RobotAttribute
) => attribute is Extract<RobotAttribute, { __class: C }>) => {
    return (attribute): attribute is Extract<RobotAttribute, { __class: C }> => {
        return attribute.__class === clazz;
    };
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const floorObject = <T extends object>(obj: T): T => {
    if (Array.isArray(obj)) {
        return obj.map(floorObject) as T;
    }

    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
            if (typeof v === "number") {
                return [k, Math.floor(v)];
            }
            if (typeof v === "object" && v !== null) {
                if (Array.isArray(v)) {
                    return [k, v.map(floorObject)];
                }

                return [k, floorObject(v)];
            }
            return [k, v];
        })
    ) as T;
};

export const getIn = (obj: Record<string, any>, path: Array<string>): any => {
    if (path.length === 1) {
        return obj[path[0]];
    } else {
        return getIn(obj[path[0]], path.slice(1));
    }
};

export const setIn = (obj: Record<string, any>, value: unknown, path: Array<string>): void => {
    if (path.length === 1) {
        obj[path[0]] = value;
    } else {
        setIn(obj[path[0]], value, path.slice(1));
    }
};
