import {considerHiDPI} from "./helpers";

export class ValetudoMapCanvasImageAsset extends HTMLImageElement {

    get hiDPIAwareHeight() {
        return considerHiDPI(this.height);
    }

    get hiDPIAwareWidth() {
        return considerHiDPI(this.width);
    }
}

customElements.define("valetudo-map-canvas-image-asset", ValetudoMapCanvasImageAsset, { extends: "img" });
