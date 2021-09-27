import { useTheme } from "@mui/material";
import Konva from "konva";
import { ShapeConfig } from "konva/lib/Shape";
import React from "react";
import { KonvaNodeEvents, Shape } from "react-konva";

export type ChipShapeProps = KonvaNodeEvents &
    Konva.ShapeConfig & {
    text: string;
    textFill?: string;
    fontSize?: string;
    fontFamily?: string;
    sceneFunc?: never;
    width?: never;
    height?: never;
    icon?: CanvasImageSource;
    iconFill?: string;
};

const drawIcon = (
    icon: CanvasImageSource,
    context: Konva.Context,
    shape: Konva.Shape,
    scale: number
) => {
    context.scale(scale, scale);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
        // eslint-disable-next-line no-console
        console.warn("No context for layer image");
        return;
    }
    canvas.width = 24;
    canvas.height = 24;

    ctx.drawImage(icon, 0, 0);

    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = shape.getAttr("iconFill");
    ctx.fillRect(0, 0, 24, 24);

    context.drawImage(canvas, 4, 2, 20, 20);
};

const ChipShape = (props: ChipShapeProps): JSX.Element => {
    const { ...shapeConfig } = props;
    const theme = useTheme();

    const sceneFunc = React.useCallback<Required<ShapeConfig>["sceneFunc"]>(
        (context, shape) => {
            context.setAttr(
                "font",
                `  ${shape.getAttr("fontSize")} ${shape.getAttr("fontFamily")}`
            );
            context.setAttr("textBaseline", "bottom");

            const text = shape.getAttr("text");
            const icon: HTMLImageElement | undefined = shape.getAttr("icon");
            const { width: textWidth, fontBoundingBoxAscent: height } =
                context.measureText(text);
            const iconScale = height / 24;
            const baseWidth = textWidth + (icon ? iconScale * 20 : 0);
            const width = Math.max(baseWidth, 20);
            const radius = Math.min(width / 2, height / 2);

            context.translate(-width / 2, -height / 2);
            context.beginPath();
            context.moveTo(0, 0);
            context.lineTo(width, 0);
            context.arc(
                width,
                height / 2,
                radius,
                (Math.PI * 3) / 2,
                Math.PI / 2,
                false
            );

            context.lineTo(radius, height);
            context.arc(
                0,
                height - radius,
                radius,
                Math.PI / 2,
                (Math.PI * 3) / 2,
                false
            );

            context.closePath();

            context.setAttr("fillStyle", shape.getAttr("fill"));
            context.fillStrokeShape(shape);

            context.translate(0, height);
            context.setAttr("fillStyle", shape.getAttr("textFill"));
            context.fillText(text, (width - baseWidth) / 2, 0);

            if (icon) {
                context.translate(width - 20 * iconScale, -height);
                drawIcon(icon, context, shape, iconScale);
            }
        },
        []
    );

    return (
        <Shape
            listening={false}
            fill={theme.palette.background.paper}
            shadowEnabled={true}
            shadowColor="#000000"
            shadowOffset={{ x: 2, y: 4 }}
            shadowBlur={10}
            shadowOpacity={0.4}
            textFill={theme.palette.text.primary}
            iconFill={theme.palette.text.primary}
            fontSize={"1em"}
            fontFamily={theme.typography.fontFamily}
            maximumScale={1}
            minimumScale={1}
            {...shapeConfig}
            sceneFunc={sceneFunc}
        />
    );
};

export default ChipShape;
