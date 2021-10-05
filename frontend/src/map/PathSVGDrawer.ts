import {RawMapEntity, RawMapEntityType} from "../api";

export class PathSVGDrawer {
    static drawPathSVG(path: RawMapEntity, mapWidth: number, mapHeight: number, pixelSize: number) : Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (!(path.type === RawMapEntityType.Path || path.type === RawMapEntityType.PredictedPath)) {
                return reject("Not a path");
            }
            const img = new Image();

            if (path.points.length > 0) {
                img.src = PathSVGDrawer.createDataUrlFromPoints(path.points, path.type, mapWidth, mapHeight, pixelSize);
                img.decode().then(() => {
                    resolve(img);
                }).catch(err => {
                    reject(err);
                });
            } else {
                resolve(img);
            }
        });
    }


    private static createDataUrlFromPoints(points: Array<number>, type: RawMapEntityType, mapWidth: number, mapHeight: number, pixelSize: number) {
        let svgPath = `<svg xmlns="http://www.w3.org/2000/svg" width="${mapWidth}" height="${mapHeight}" viewBox="0 0 ${mapWidth} ${mapHeight}"><path d="`;

        for (let i = 0; i < points.length; i = i + 2) {
            let type = "L";

            if (i === 0) {
                type = "M";
            }

            svgPath += `${type} ${points[i] / pixelSize} ${points[i + 1] / pixelSize} `;
        }

        svgPath += "\" fill=\"none\" stroke=\"" + "#000000" + "\" stroke-width=\"0.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"";

        if (type === RawMapEntityType.PredictedPath) {
            svgPath += " stroke-dasharray=\"1,1\"";
        }

        svgPath += "/></svg>";

        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgPath);

    }
}
