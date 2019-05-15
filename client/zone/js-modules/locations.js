/**
 * The idea behind "locations" (for lack of a better term)
 * is that we can manage multiple goto points / zones or in the future nogo areas etc.
 *
 * They include the drawing logic (draw function) which is called by the vacuum-map,
 * and can define hooks for user-interaction such as tapping or panning.
 */

/**
 * Represents a point the robot can be sent to.
 */
export class GotoPoint  {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.arc(p1.x, p1.y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.strokeStyle = '#550000';
        ctx.stroke();
    }

    toZone(x2, y2) {
        return new Zone(this.x, this.y, x2, y2);
    }
}

/**
 * Represents a zone for zoned_cleanup.
 */
export class Zone {

    constructor(x1 ,y1, x2, y2) {
        this.buttonSize = 30;

        this.active = true;

        this.x1 = Math.min(x1, x2);
        this.x2 = Math.max(x1, x2);

        this.y1 = Math.min(y1, y2);
        this.y2 = Math.max(y1, y2);
    }

    draw(ctx, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        ctx.save();
        if(!this.active) {
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
        } else {
            ctx.setLineDash([15, 5]);
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0)"
        }

        ctx.lineWidth = 2;
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.restore();

        if(this.active) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p2.x, p1.y, this.buttonSize / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.strokeStyle = '#550000';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(p2.x, p2.y, this.buttonSize / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'green';
            ctx.fill();
            ctx.strokeStyle = '#005500';
            ctx.stroke();
        }
    }

    /**
     * Handler for intercepting tap events on the canvas
     * Used for activating / deleting the zone
     *
     * @param {{x: number, y: number}} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p2.x, 2) + Math.pow(tappedPoint.y - p1.y, 2)
        );

        if(this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p1.x
            && tappedPoint.x <= p2.x
            && tappedPoint.y >= p1.y
            && tappedPoint.y <= p2.y
        ) {
            this.active = true;

            return {
                updatedLocation: this,
                stopPropagation: false
            };
        } else {
            this.active = false;
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

    /**
     * Handler for intercepting pan events on the canvas
     * Used for resizing / moving the zone
     *
     * @param {{x: number, y: number}} start - The coordinates where the panning started
     * @param {{x: number, y: number}} last - The coordinates from the last call
     * @param {{x: number, y: number}} current - The current coordinates of the pointer
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    translate(start, last, current, transformMapToScreenSpace) {
        if(this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p2.x, 2) + Math.pow(last.y - p2.y, 2)
            );

            const lastInMapSpace = new  DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new  DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if(distanceFromResize <= this.buttonSize / 2) {
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                last.x >= p1.x
                && last.x <= p2.x
                && last.y >= p1.y
                && last.y <= p2.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else {
                this.active = false;
            }
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }
}

/**
 * Current goto target point
 */
export class GotoTarget  {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.arc(p1.x, p1.y, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgb(107, 244, 66)';
        ctx.fill();
        ctx.strokeStyle = 'rgb(53, 145, 26)';
        ctx.stroke();
    }
}

/**
 * Represents the currently cleaned zone
 */
export class CurrentCleaningZone  {

    /**
     * @param {DOMPoint} p1
     * @param {DOMPoint} p2
     */
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    draw(ctx, transformFromMapSpace) {
        const p1Screen = this.p1.matrixTransform(transformFromMapSpace);
        const p2Screen = this.p2.matrixTransform(transformFromMapSpace);

        ctx.strokeStyle = "rgb(53, 145, 26)";
        ctx.fillStyle = "rgba(107, 244, 66, 0.3)";

        ctx.lineWidth = 2;
        ctx.fillRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);
        ctx.strokeRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);
    }
}

/**
 * Represents a virtual wall the robot does not pass
 */
export class VirtualWall  {

    /**
     * @param {DOMPoint} p1
     * @param {DOMPoint} p2
     */
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    draw(ctx, transformFromMapSpace) {
        const p1Screen = this.p1.matrixTransform(transformFromMapSpace);
        const p2Screen = this.p2.matrixTransform(transformFromMapSpace);

        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.moveTo(p1Screen.x, p1Screen.y);
        ctx.lineTo(p2Screen.x, p2Screen.y);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }
}

/**
 * Represents a nogo zone the robot does not enter
 */
export class NoGoZone  {

    /**
     * @param {DOMPoint} p1
     * @param {DOMPoint} p2
     * @param {DOMPoint} p3
     * @param {DOMPoint} p4
     */
    constructor(p1, p2, p3, p4) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.p4 = p4;
    }

    draw(ctx, transformFromMapSpace) {
        const p1Screen = this.p1.matrixTransform(transformFromMapSpace);
        const p2Screen = this.p2.matrixTransform(transformFromMapSpace);
        const p3Screen = this.p3.matrixTransform(transformFromMapSpace);
        const p4Screen = this.p4.matrixTransform(transformFromMapSpace);

        ctx.strokeStyle = "rgb(255, 0, 0)";
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(p1Screen.x, p1Screen.y);
        ctx.lineTo(p2Screen.x, p2Screen.y);
        ctx.lineTo(p3Screen.x, p3Screen.y);
        ctx.lineTo(p4Screen.x, p4Screen.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}