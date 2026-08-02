import React from "react";
import {Skeleton} from "@mui/material";
import {Capability, useObstacleImagesPropertiesQuery, valetudoAPIBaseURL} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {getScaledConfusedPlaceholderDog} from "./res/ValetudogPlaceholder";

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
                        obstacleImagesCapabilityProperties!.dimensions.width,
                        obstacleImagesCapabilityProperties!.dimensions.height
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
