import { PROCESS_LAYERS } from "./MapLayerManagerUtils";

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

    const rendered = PROCESS_LAYERS(
        evt.data.mapLayers,
        evt.data.pixelSize,
        evt.data.colors,
        evt.data.backgroundColors,
        evt.data.selectedSegmentIds
    );

    self.postMessage( {
        pixelData: rendered.pixelData.buffer,
        width: rendered.width,
        height: rendered.height,
        left: rendered.left,
        top: rendered.top,

        segmentLookupData: rendered.segmentLookupData.buffer,
        segmentLookupIdMapping: rendered.segmentLookupIdMapping
    }, {
        transfer: [
            rendered.pixelData.buffer,
            rendered.segmentLookupData.buffer
        ]
    });
} );
