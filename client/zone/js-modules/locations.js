export class GotoPoint  {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        ctx.strokeStyle = "red";
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        ctx.fillRect(p1.x - 10, p1.y - 10, 20, 20);
    }

    toZone(x2, y2) {
        return new Zone(this.x, this.y, x2, y2);
    }
}

export class Zone {

    constructor(x1 ,y1, x2, y2) {
        this.buttonSize = 30;

        this.active = true;

        this.x1 = Math.min(x1, x2);
        this.x2 = Math.max(x1, x2);
        
        this.y1 = Math.min(y1, y2);
        this.y2 = Math.max(y1, y2);
    }

    draw(ctx, transformMapToCanvasSpace) {
        ctx.strokeStyle = "red";
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToCanvasSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToCanvasSpace);

        if(!this.active) {
            ctx.setLineDash([15, 5]);
        }

        ctx.lineWidth = 2;
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

        if(this.active) {
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

    tap(tappedPoint, transformMapToCanvasSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToCanvasSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToCanvasSpace);

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
                stopPropagation: true
            };
        } else {
            this.active = false;
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }

    translate(start, last, current, transformMapToCanvasSpace) {
        if(this.active) {
            const transformCanvasToMapSpace = transformMapToCanvasSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToCanvasSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToCanvasSpace);

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
            }
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }
}