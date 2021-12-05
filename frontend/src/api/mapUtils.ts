import {RawMapData} from "./RawMapData";

export function preprocessMap(data : RawMapData) : RawMapData {
    if (data.metaData?.version === 2 && Array.isArray(data.layers)) {
        data.layers.forEach(layer => {
            if (layer.pixels.length === 0 && layer.compressedPixels && layer.compressedPixels.length !== 0) {
                for (let i = 0; i < layer.compressedPixels.length; i = i + 3) {
                    const xStart = layer.compressedPixels[i];
                    const y = layer.compressedPixels[i+1];
                    const count = layer.compressedPixels[i+2];

                    for (let j = 0; j < count; j++) {
                        layer.pixels.push(
                            xStart + j,
                            y
                        );
                    }
                }

                delete(layer.compressedPixels);
            }
        });
    }

    return data;
}
