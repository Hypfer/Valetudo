import React from "react";
import {Skeleton} from "@mui/material";
import {Capability, useObstacleImagesPropertiesQuery, valetudoAPIBaseURL} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";

function getScaledConfusedPlaceholderDog(newWidth: number, newHeight: number) {
    const oldWidth = 56;
    const oldHeight = 50;

    const viewBoxWidth = newWidth / 4;
    const viewBoxHeight = newHeight / 4;

    const viewBoxX = (viewBoxWidth - oldWidth) / 2;
    const viewBoxY = (viewBoxHeight - oldHeight) / 2;

    const svgDog = (`
        <svg width="${newWidth}" height="${newHeight}" viewBox="-${viewBoxX} -${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <filter id="filter6" x="0" y="-.010638" width="1" height="1.0213" color-interpolation-filters="sRGB">
                    <feColorMatrix values="0.21 0.72 0.072 0 0 0.21 0.72 0.072 0 0 0.21 0.72 0.072 0 0 0 0 0 1 0 "/>
                </filter>
            </defs>
            <g transform="translate(5,1)" filter="url(#filter6)" opacity=".1">
                <g transform="translate(-25,-3)">
                    <path d="m31 20h32m-32 1h1m30 0h1m-32 1h1m30 0h2m-37 1h5m31 0h2m-39 1h2m36 0h2m-40 1h1m38 0h2m-41 1h1m39 0h2m-42 1h2m39 0h4m-44 1h2m41 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m1 0h3m-48 1h1m42 0h3m1 0h1m-48 1h1m42 0h2m1 0h2m-48 1h1m42 0h1m1 0h2m-47 1h1m43 0h2m-46 1h1m42 0h2m-45 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-44 1h1m42 0h1m-46 1h3m42 0h3m-48 1h1m46 0h1m-48 1h1m5 0h36m5 0h1m-48 1h1m5 0h1m34 0h1m5 0h1m-48 1h7m34 0h7" stroke="#fff"/>
                    <path d="m32 21h30m-30 1h1m28 0h1m-30 1h1m12 0h1m16 0h1m-35 1h5m30 0h1m-37 1h1m36 0h1m-38 1h18m20 0h1m-38 1h1m37 0h1m0 1h3m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m3 0h1m-46 1h1m40 0h1m2 0h1m-45 1h1m40 0h1m1 0h1m-44 1h1m40 0h2m-43 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-42 1h1m40 0h1m-44 1h3m1 0h38m1 0h3m-46 1h1m3 0h1m36 0h1m3 0h1m-46 1h5m36 0h5" stroke="#000"/>
                    <path d="m33 22h28m-28 1h12m1 0h16m-29 1h30m-35 1h36m-19 1h20m-36 1h37m-37 1h38m-38 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h40m-40 1h1m38 0h1m-42 1h3m38 0h3" stroke="#da7446"/>
                </g>
                <g transform="translate(-10.5,-9)">
                    <path d="m27 9h8m-9 1h2m6 0h2m-10 1h1m8 0h1m-10 1h1m2 0h4m2 0h1m-10 1h1m2 0h1m1 0h2m2 0h1m-10 1h6m3 0h1m-7 1h2m3 0h2m-7 1h1m3 0h2m-6 1h1m2 0h2m-5 1h1m2 0h1m-4 1h4m-4 1h1m2 0h1m-4 1h1m2 0h1m-4 1h4" stroke="#fff"/>
                    <path d="m28 10h6m-7 1h8m-8 1h2m4 0h2m-8 1h2m4 0h2m-3 1h3m-4 1h3m-4 1h3m-3 1h2m-2 1h2m-2 2h2m-2 1h2" stroke="#000"/>
                </g>
            </g>
        </svg>
    `);

    return `data:image/svg+xml,${encodeURIComponent(svgDog)}`;
}

const ActualObstacleImage = (props: { id: string }): React.ReactElement => {
    const [imageLoadFailed, setImageLoadFailed] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageSrc, setImageSrc] = React.useState(`${valetudoAPIBaseURL}/robot/capabilities/${Capability.ObstacleImages}/img/${props.id}`);

    const {
        data: obstacleImagesCapabilityProperties,
    } = useObstacleImagesPropertiesQuery();

    // Since the LiveMapPage prefetches the properties, this should never be displayed
    if (!obstacleImagesCapabilityProperties) {
        return (
            <div style={{textAlign: "center"}}>
                <Skeleton height={"3rem"} />
            </div>
        );
    }

    const style: Record<string, any> = {
        maxWidth: "100%",
        maxHeight: "85%",
        height: "auto",
        borderRadius: "4px",
        display: "block",
        objectFit: "contain",
        border: !imageLoaded ? "1px inset black" : undefined, // Imitate the style browsers use for a broken image
    };

    return (
        <img
            style={style}
            src={imageSrc}
            width={obstacleImagesCapabilityProperties.dimensions.width}
            height={obstacleImagesCapabilityProperties.dimensions.height}
            onLoad={() => {
                if (!imageLoadFailed) {
                    setImageLoaded(true);
                }
            }}
            onError={() => {
                if (!imageLoadFailed) {
                    setImageLoadFailed(true);

                    setImageSrc(getScaledConfusedPlaceholderDog(
                        obstacleImagesCapabilityProperties.dimensions.width,
                        obstacleImagesCapabilityProperties.dimensions.height
                    ));
                }
            }}
        />
    );
};

const ObstacleImage = (props: { id: string}): React.ReactElement => {
    const [
        obstacleImagesSupported,
    ] = useCapabilitiesSupported(
        Capability.ObstacleImages,
    );

    if (!obstacleImagesSupported) {
        return <></>;
    } else {
        return <ActualObstacleImage id={props.id}/>;
    }
};

export default ObstacleImage;
