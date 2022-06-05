import { RENDER_LAYERS_TO_IMAGEDATA } from "./MapLayerRenderUtils";

self.postMessage({
    ready: true
});

self.addEventListener( "message", ( evt ) => {
    //According to SonarJS S2819, this might be problematic
    //I honestly have no idea if this check is actually needed in a webworker context, but I'll do as the tool says.
    if (evt.origin !== "") {
        // eslint-disable-next-line no-console
        console.warn(`Received event with unexpected origin "${evt.origin}"`);

        return;
    }

    const imageData = RENDER_LAYERS_TO_IMAGEDATA(
        evt.data.mapLayers,
        evt.data.pixelSize,
        evt.data.width,
        evt.data.height,
        evt.data.colorsToUse
    );

    self.postMessage( {
        pixels: imageData.data.buffer,
        width: evt.data.width,
        height: evt.data.height,
    }, {
        transfer: [imageData.data.buffer]
    });
} );
