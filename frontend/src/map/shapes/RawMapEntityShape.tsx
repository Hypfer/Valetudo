import { useTheme } from "@material-ui/core";
import { LineConfig } from "konva/lib/shapes/Line";
import { Image, Line } from "react-konva";
import { RawMapEntity, RawMapEntityType } from "../../api";
import robotSrc from "./assets/robot.svg";
import chargerSrc from "./assets/charger.svg";
import markerActiveSrc from "./assets/marker_active.svg";
import { ImageConfig } from "konva/lib/shapes/Image";

const robotImage = new window.Image();
robotImage.src = robotSrc;

const chargerImage = new window.Image();
chargerImage.src = chargerSrc;

const markerActiveImage = new window.Image();
markerActiveImage.src = markerActiveSrc;

export interface MapEntityShapeProps {
    entity: RawMapEntity;
    listening?: boolean;
}

const RawMapEntityShape = (props: MapEntityShapeProps): JSX.Element | null => {
    const { entity } = props;
    const theme = useTheme();

    const commonImageProps = (image: HTMLImageElement): ImageConfig => {
        return {
            image: image,
            x: entity.points[0],
            y: entity.points[1],
            offsetX: image.width / 2,
            offsetY: image.height / 2,
            minimumScale: 1,
            rotation: entity.metaData.angle,
            listening: false,
        };
    };

    const commonLineProps: LineConfig = {
        points: entity.points,
        strokeWidth: 5,
        lineCap: "round",
        lineJoin: "round",
        listening: false,
    };

    switch (entity.type) {
        case RawMapEntityType.RobotPosition:
            return <Image {...commonImageProps(robotImage)} />;
        case RawMapEntityType.ChargerLocation:
            return <Image {...commonImageProps(chargerImage)} />;
        case RawMapEntityType.GoToTarget:
            return (
                <Image
                    {...commonImageProps(markerActiveImage)}
                    offsetY={markerActiveImage.height}
                />
            );
        case RawMapEntityType.Path:
            return <Line {...commonLineProps} stroke={theme.map.path} />;
        case RawMapEntityType.PredictedPath:
            return (
                <Line {...commonLineProps} stroke={theme.map.path} dash={[25, 10]} />
            );
        case RawMapEntityType.VirtualWall:
            return <Line {...commonLineProps} {...theme.map.noGo} />;
        case RawMapEntityType.NoGoArea:
            return <Line {...commonLineProps} {...theme.map.noGo} closed />;
        case RawMapEntityType.NoMopArea:
            return <Line {...commonLineProps} {...theme.map.noMop} closed />;
        case RawMapEntityType.ActiveZone:
            return <Line {...commonLineProps} {...theme.map.active} closed />;
        default:
            return null;
    }
};

export default RawMapEntityShape;
