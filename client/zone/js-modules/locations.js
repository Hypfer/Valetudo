/**
 * The idea behind "locations" (for lack of a better term)
 * is that we can manage multiple goto points / zones or in the future nogo areas etc.
 *
 * They include the drawing logic (draw function) which is called by the vacuum-map,
 * and can define hooks for user-interaction such as tapping or panning.
 */

const robot = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGVsbGlwc2UgY3g9IjE2LjAwNiIgY3k9IjE2LjAwNiIgcng9IjE0Ljk0NSIgcnk9IjE0Ljk0NSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjN2Y3ZjdmIiBzdHJva2Utd2lkdGg9IjIuMTA5NCIvPgogPHJlY3QgeD0iMS41MTc4IiB5PSIxMi42MTEiIHdpZHRoPSIyOC44ODkiIGhlaWdodD0iMi4xMDk0IiBmaWxsPSIjN2Y3ZjdmIiBzdHJva2Utd2lkdGg9IjUuNTI0MSIvPgogPGNpcmNsZSBjeD0iMTUuOTYyIiBjeT0iMTMuNjY1IiByPSI0LjA5MzEiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzdmN2Y3ZiIgc3Ryb2tlLXdpZHRoPSIxLjA1NDciLz4KPC9zdmc+Cg==";
const img_robot = new Image();
img_robot.src = robot;

const charger = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGNpcmNsZSBjeD0iMTYuMDA2IiBjeT0iMTYuMDA2IiByPSIxNC45NDYiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjEwODciLz4KIDxwYXRoIGQ9Im0xMi45NSAyOC4zODUgOC43NjMyLTEzLjYxNGgtNC42NDc2bDIuMDM3NS0xMS4xNDEtOC44MTE1IDE0LjE0NGg0LjY3NTR6IiBmaWxsPSIjZmZmIiBzdHJva2U9IiMwMDc2ZmYiIHN0cm9rZS13aWR0aD0iMS4wNDMxIi8+Cjwvc3ZnPgo=";
const img_charger = new Image();
img_charger.src = charger;

const delete_button = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGNpcmNsZSBjeD0iMTYuMDA2IiBjeT0iMTYuMDA2IiByPSIxNC45NDYiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjEwODciLz4KIDxwYXRoIGQ9Im05LjQ2MDcgNy40NDg2IDE1LjExMiAxNS4xMTItMi4wMTE5IDIuMDExOS0xNS4xMTItMTUuMTEyem0tMi4wMTE5IDE1LjExMiAxNS4xMTItMTUuMTEyIDIuMDExOSAyLjAxMTktMTUuMTEyIDE1LjExMnoiIGZpbGw9IiMzMzMiIHN0cm9rZS13aWR0aD0iNi4xMjEzIi8+Cjwvc3ZnPgo=";
const img_delete_button = new Image();
img_delete_button.src = delete_button;

const scale_button = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGNpcmNsZSBjeD0iMTYuMDA2IiBjeT0iMTYuMDA2IiByPSIxNC45NDYiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjEwODciLz4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KC00LjMyODQgLTQuMzI4NCA0LjMyODQgLTQuMzI4NCAtMzYuMTM0IC0xNS40NzEpIiBmaWxsPSIjMzMzIj4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjAxMDgxNCAtLjAwMzA5MzEpIj4KICAgPHBhdGggZD0ibS03LjUwMTIgMi4zODk5LTAuNzY2OTYgMC40NDI4di0wLjg4NTZsMC4zODM0OCAwLjIyMTR6Ii8+CiAgIDxwYXRoIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGQ9Im0xMS43OTggMi4zODk5LTAuNzY2OTYgMC40NDI4di0wLjg4NTZsMC4zODM0OCAwLjIyMTR6Ii8+CiAgPC9nPgogIDxyZWN0IHg9Ii0xMS40MDYiIHk9IjIuMTUzOCIgd2lkdGg9IjMuNDkwNyIgaGVpZ2h0PSIuNDY2MiIvPgogPC9nPgo8L3N2Zz4K";
const img_scale_button = new Image();
img_scale_button.src = scale_button;

const move_button = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDMyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGNpcmNsZSBjeD0iMTYuMDA2IiBjeT0iMTYuMDA2IiByPSIxNC45NDYiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjEwODciLz4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KDYuMTIxMyAwIDAgNi4xMjEzIDM0LjgzOSAtOC4xODUpIiBmaWxsPSIjMzMzIj4KICA8cGF0aCBkPSJtLTIuODQzNiAyLjIwNzctMWUtNyAzLjQ5MTItMC40NjQ4MyAxZS03IDFlLTcgLTMuNDkxMnptLTEuOTc4IDEuNTEzMmgzLjQ5MTJ2MC40NjQ4M2wtMy40OTEyLTFlLTd6Ii8+CiAgPHBhdGggZD0ibS0wLjkyNzE5IDMuOTUzMy0wLjc2Njk2IDAuNDQyOHYtMC44ODU2bDAuMzgzNDggMC4yMjE0eiIvPgogIDxwYXRoIHRyYW5zZm9ybT0ic2NhbGUoLTEsMSkiIGQ9Im01LjIyMzcgMy45NTMzLTAuNzY2OTYgMC40NDI4di0wLjg4NTZsMC4zODM0OCAwLjIyMTR6Ii8+CiAgPHBhdGggdHJhbnNmb3JtPSJtYXRyaXgoMCAtMSAuOTk5OTYgMCAtNS42MDE3IC0uODI1MDgpIiBkPSJtLTIuNjMwNCAyLjUyNTctMC43NjY5NiAwLjQ0Mjh2LTAuODg1NmwwLjM4MzQ4IDAuMjIxNHoiLz4KICA8cGF0aCB0cmFuc2Zvcm09InJvdGF0ZSg5MCwtMi43MjIxLDQuNDAzOSkiIGQ9Im0tMS4wMjYzIDQuNzU3Ny0wLjc2Njk2IDAuNDQyOHYtMC44ODU2bDAuMzgzNDggMC4yMjE0eiIvPgogPC9nPgo8L3N2Zz4K";
const img_move_button = new Image();
img_move_button.src = move_button;

const marker = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDQ4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPHBhdGggZD0ibTMwLjA2MyAyMy43NzEtMTQuMDYgMjQuMjI5LTE0LjA2LTI0LjIyOWgxNC4wNTl6IiBmaWxsPSIjMzMzIiBzdHJva2Utd2lkdGg9IjYuMjA4MyIvPgogPGVsbGlwc2UgY3g9IjE2IiBjeT0iMTYuMTg2IiByeD0iMTQuOTQiIHJ5PSIxNS4xMjUiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjEyMDkiLz4KPC9zdmc+Cg==";
const img_marker = new Image();
img_marker.src = marker;

const marker_active = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iNDgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDQ4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPHBhdGggZD0ibTMwLjA2MyAyMy43NzEtMTQuMDYgMjQuMjI5LTE0LjA2LTI0LjIyOWgxNC4wNTl6IiBmaWxsPSIjMzMzIiBzdHJva2Utd2lkdGg9IjYuMjA4MyIvPgogPGVsbGlwc2UgY3g9IjE2IiBjeT0iMTYuMTg2IiByeD0iMTMuMjgzIiByeT0iMTMuNDQ4IiBmaWxsPSIjN2Y3ZjdmIiBzdHJva2U9IiMwMDc2ZmYiIHN0cm9rZS13aWR0aD0iMy4yNTgiLz4KIDxlbGxpcHNlIGN4PSIxNiIgY3k9IjE2LjE4NiIgcng9IjE0Ljk0IiByeT0iMTUuMTI1IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMi4xMjA5Ii8+Cjwvc3ZnPgo=";
const img_marker_active = new Image();
img_marker_active.src = marker_active;

const segment = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS4zMTUzOSAtMy44NDIzKSI+CiAgPHBhdGggZD0ibTMwLjQ2MyAzMC43NjctMTQuMTQ3LTI0Ljc1OC0xNC4xNDcgMjQuNzU4aDE0LjE0N3oiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjE1MDYiLz4KIDwvZz4KIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0uMzE1MzkgLTMuODQyMykiIGRpc3BsYXk9Im5vbmUiPgogIDxwYXRoIGQ9Im0yNy4yMjggMjguODUxLTEwLjkxMi0xOS4wOTYtMTAuOTEyIDE5LjA5NmgxMC45MTJ6IiBkaXNwbGF5PSJpbmxpbmUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwNzZmZiIgc3Ryb2tlLXdpZHRoPSIxLjY1ODgiLz4KIDwvZz4KIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0uMzE1MzkgLTMuODQyMykiIGRpc3BsYXk9Im5vbmUiPgogIDxwYXRoIGQ9Im0zMC40NjMgMzAuNzY3LTE0LjE0Ny0yNC43NTgtMTQuMTQ3IDI0Ljc1OGgxNC4xNDd6IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMi4xNTA2Ii8+CiA8L2c+Cjwvc3ZnPgo=";
const img_segment = new Image();
img_segment.src = segment;

const segment_active = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDMyIDI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS4zMTUzOSAtMy44NDIzKSI+CiAgPHBhdGggZD0ibTMwLjQ2MyAzMC43NjctMTQuMTQ3LTI0Ljc1OC0xNC4xNDcgMjQuNzU4aDE0LjE0N3oiIGZpbGw9IiM3ZjdmN2YiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIyLjE1MDYiLz4KIDwvZz4KIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0uMzE1MzkgLTMuODQyMykiPgogIDxwYXRoIGQ9Im0yNy4yMjggMjguODUxLTEwLjkxMi0xOS4wOTYtMTAuOTEyIDE5LjA5NmgxMC45MTJ6IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDc2ZmYiIHN0cm9rZS13aWR0aD0iMS42NTg4Ii8+CiA8L2c+CiA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjMxNTM5IC0zLjg0MjMpIj4KICA8cGF0aCBkPSJtMzAuNDYzIDMwLjc2Ny0xNC4xNDctMjQuNzU4LTE0LjE0NyAyNC43NThoMTQuMTQ3eiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIuMTUwNiIvPgogPC9nPgo8L3N2Zz4K";
const img_segment_active = new Image();
img_segment_active.src = segment_active;


export class Robot {
    constructor(x ,y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
    }

    draw(ctx, transformFromMapSpace, scaleFactor) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        function rotateRobot(img, scaledSize, angle) {
            var canvasimg = document.createElement("canvas");
            canvasimg.width = scaledSize.width;
            canvasimg.height = scaledSize.height;
            var ctximg = canvasimg.getContext("2d");
            ctximg.clearRect(0, 0, scaledSize.width, scaledSize.height);
            ctximg.translate(scaledSize.width / 2, scaledSize.width / 2);
            ctximg.rotate(angle * Math.PI / 180);
            ctximg.translate(-scaledSize.width / 2, -scaledSize.width / 2);
            ctximg.drawImage(img, 0, 0, scaledSize.width, scaledSize.height);
            return canvasimg;
        }

        const scaledSize = {
            width: Math.max(img_robot.width / (2.5 / scaleFactor), img_robot.width),
            height: Math.max(img_robot.height / (2.5 / scaleFactor), img_robot.height)
        };

        ctx.drawImage(
            rotateRobot(img_robot, scaledSize, this.angle),
            p1.x - scaledSize.width / 2,
            p1.y - scaledSize.height / 2,
            scaledSize.width,
            scaledSize.height
        );
    }
}

export class Charger {
    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace, scaleFactor) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        const scaledSize = {
            width: Math.max(img_charger.width / (2.5 / scaleFactor), img_charger.width),
            height: Math.max(img_charger.height / (2.5 / scaleFactor), img_charger.height)
        };

        ctx.drawImage(
            img_charger,
            p1.x - scaledSize.width / 2,
            p1.y - scaledSize.height / 2,
            scaledSize.width,
            scaledSize.height
        );
    }
}

/**
 * Represents a point the robot can be sent to.
 */
export class GotoPoint {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        ctx.drawImage(
            img_marker,
            p1.x - img_marker.width / 2,
            p1.y - img_marker.height
        );
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
        this.isResizing = false;

        this.x1 = Math.min(x1, x2);
        this.x2 = Math.max(x1, x2);

        this.y1 = Math.min(y1, y2);
        this.y2 = Math.max(y1, y2);
    }

    draw(ctx, transformMapToScreenSpace, scaleFactor) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const dimensions = { //TODO: why do I have to divide these by 2?
            x: (this.x2 - this.x1) / 20,
            y: (this.y2 - this.y1) / 20
        };
        const label = dimensions.x.toFixed(1) + " x " + dimensions.y.toFixed(1) + "m";



        ctx.save();
        if (!this.active) {
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        } else {
            ctx.setLineDash([15, 5]);
            ctx.strokeStyle = "rgb(255, 255, 255)";
            ctx.fillStyle = "rgba(255, 255, 255, 0)";
        }

        ctx.lineWidth = 2;
        ctx.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.restore();

        ctx.save();
        ctx.textAlign = "start";
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.font = Math.round(6 * scaleFactor).toString(10) + "px sans-serif";
        ctx.fillText(label, p1.x, p1.y - 4);
        ctx.strokeText(label, p1.x, p1.y - 4);

        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p2.x - img_delete_button.width / 2,
                p1.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p2.x - img_scale_button.width / 2,
                p2.y - img_scale_button.height / 2
            );
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

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
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
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p2.x, 2) + Math.pow(last.y - p2.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= this.buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x1 + 5 && this.x2 + dx > this.x1 + 5) {
                    this.x2 += dx;
                }
                if (currentInMapSpace.y > this.y1 + 5 && this.y2 + dy > this.y1 + 5) {
                    this.y2 += dy;
                }

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
export class GotoTarget {

    constructor(x ,y) {
        this.x = x;
        this.y = y;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);


        ctx.drawImage(
            img_marker_active,
            p1.x - img_marker_active.width / 2,
            p1.y - img_marker_active.height / 2
        );
    }
}

/**
 * Represents the currently cleaned zone
 */
export class CurrentCleaningZone {

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

        ctx.save();
        ctx.strokeStyle = "rgb(53, 145, 26)";
        ctx.fillStyle = "rgba(107, 244, 66, 0.3)";

        ctx.lineWidth = 2;
        ctx.fillRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);
        ctx.strokeRect(p1Screen.x, p1Screen.y, p2Screen.x - p1Screen.x, p2Screen.y - p1Screen.y);

        ctx.restore();
    }
}

/**
 * Represents a virtual wall the robot does not pass
 */
export class VirtualWall {

    constructor(x1 ,y1, x2, y2, editable) {
        this.editable = editable || false;

        if (editable) {
            this.active = true;
            this.buttonSize = 30;
        } else {
            this.active = false;
        }

        this.x1 = x1;
        this.x2 = x2;

        this.y1 = y1;
        this.y2 = y2;
    }

    draw(ctx, transformFromMapSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformFromMapSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformFromMapSpace);

        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "red";
        if (this.editable && this.active) {
            ctx.setLineDash([8, 6]);
        }
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = "red";
        ctx.stroke();

        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p1.x - img_delete_button.width / 2,
                p1.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_move_button,
                p2.x - img_move_button.width / 2,
                p2.y - img_move_button.height / 2
            );
        }
        if (this.editable) {
            this.matrix = new DOMMatrix().rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x);
            this.sp1 = p1.matrixTransform(new DOMMatrix().translate(-10).rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x));
            this.sp2 = p2.matrixTransform(new DOMMatrix().translate(+10).rotateFromVectorSelf(p2.y - p1.y,p2.x - p1.x));
        }
    }
    /**
     * Handler for intercepting tap events on the canvas
     * Used for activating / deleting the wall
     *
     * @param {{x: number, y: number}} tappedPoint - The tapped point in screen coordinates
     * @param {DOMMatrix} transformMapToScreenSpace - The transformation for transforming map-space coordinates into screen-space.
     * This is the transform applied by the vacuum-map canvas.
     */
    tap(tappedPoint, transformMapToScreenSpace) {
        if (!this.editable) {
            return {
                updatedLocation: this,
                stopPropagation: false
            };
        }

        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        // eslint-disable-next-line no-unused-vars
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p1.x, 2) + Math.pow(tappedPoint.y - p1.y, 2)
        );

        const sTappedPoint = new DOMPoint(tappedPoint.x,tappedPoint.y).matrixTransform(this.matrix);

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            sTappedPoint.x >= this.sp1.x
            && sTappedPoint.x <= this.sp2.x
            && sTappedPoint.y >= this.sp1.y
            && sTappedPoint.y <= this.sp2.y
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
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            // eslint-disable-next-line no-unused-vars
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p2.x, 2) + Math.pow(last.y - p2.y, 2)
            );

            const lastInMapSpace = new DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            const sLast = new DOMPoint(last.x,last.y).matrixTransform(this.matrix);

            if (distanceFromResize <= this.buttonSize / 2) {
                this.x2 += dx;
                this.y2 += dy;

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                sLast.x >= this.sp1.x
                && sLast.x <= this.sp2.x
                && sLast.y >= this.sp1.y
                && sLast.y <= this.sp2.y
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

/**
 * Represents a nogo zone the robot does not enter
 */
export class ForbiddenZone {

    constructor(x1, y1, x2, y2, x3, y3, x4, y4, editable) {
        this.editable = editable || false;

        if (editable) {
            this.active = true;
            this.isResizing = false;
            this.buttonSize = 30;
        } else {
            this.active = false;
        }

        this.x1 = x1;
        this.x2 = x2;
        this.x3 = x3;
        this.x4 = x4;

        this.y1 = y1;
        this.y2 = y2;
        this.y3 = y3;
        this.y4 = y4;
    }

    draw(ctx, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        ctx.save();
        if (!this.active) {
            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        } else {
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = "rgb(255, 0, 0)";
            ctx.fillStyle = "rgba(255, 0, 0, 0)";
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p2.x - img_delete_button.width / 2,
                p2.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p3.x - img_scale_button.width / 2,
                p3.y - img_scale_button.height / 2
            );
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
        if (!this.editable) {
            return {
                updatedLocation: this,
                stopPropagation: false
            };
        }

        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        // eslint-disable-next-line no-unused-vars
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p2.x, 2) + Math.pow(tappedPoint.y - p2.y, 2)
        );

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p1.x
            && tappedPoint.x <= p3.x
            && tappedPoint.y >= p1.y
            && tappedPoint.y <= p3.y
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
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
            const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p3.x, 2) + Math.pow(last.y - p3.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= this.buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x1 + 5 && this.x2 + dx > this.x1 + 5) {
                    this.x2 += dx;
                    this.x3 += dx;
                }
                if (currentInMapSpace.y > this.y1 + 5 && this.y3 + dy > this.y1 + 5) {
                    this.y3 += dy;
                    this.y4 += dy;
                }

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                last.x >= p1.x
                && last.x <= p3.x
                && last.y >= p1.y
                && last.y <= p3.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;
                this.x4 += dx;
                this.y4 += dy;

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

/**
 * Represents a no-mopping zone the robot does not enter when the mop is attached
 */
export class ForbiddenMopZone {

    constructor(x1, y1, x2, y2, x3, y3, x4, y4, editable) {
        this.editable = editable || false;

        if (editable) {
            this.active = true;
            this.isResizing = false;
            this.buttonSize = 30;
        } else {
            this.active = false;
        }

        this.x1 = x1;
        this.x2 = x2;
        this.x3 = x3;
        this.x4 = x4;

        this.y1 = y1;
        this.y2 = y2;
        this.y3 = y3;
        this.y4 = y4;
    }

    draw(ctx, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        ctx.save();
        if (!this.active) {
            ctx.strokeStyle = "rgb(200, 0, 255)";
            ctx.fillStyle = "rgba(200, 0, 255, 0.4)";
        } else {
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = "rgb(200, 0, 255)";
            ctx.fillStyle = "rgba(200, 0, 255, 0)";
        }

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (this.active) {
            ctx.drawImage(
                img_delete_button,
                p2.x - img_delete_button.width / 2,
                p2.y - img_delete_button.height / 2
            );

            ctx.drawImage(
                img_scale_button,
                p3.x - img_scale_button.width / 2,
                p3.y - img_scale_button.height / 2
            );
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
        if (!this.editable) {
            return {
                updatedLocation: this,
                stopPropagation: false
            };
        }

        const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
        const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
        const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
        // eslint-disable-next-line no-unused-vars
        const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

        const distanceFromDelete = Math.sqrt(
            Math.pow(tappedPoint.x - p2.x, 2) + Math.pow(tappedPoint.y - p2.y, 2)
        );

        if (this.active && distanceFromDelete <= this.buttonSize / 2) {
            return {
                updatedLocation: null,
                stopPropagation: true
            };
        } else if (
            tappedPoint.x >= p1.x
            && tappedPoint.x <= p3.x
            && tappedPoint.y >= p1.y
            && tappedPoint.y <= p3.y
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
        if (this.active) {
            const transformCanvasToMapSpace = transformMapToScreenSpace.inverse();
            const p1 = new DOMPoint(this.x1, this.y1).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p2 = new DOMPoint(this.x2, this.y2).matrixTransform(transformMapToScreenSpace);
            const p3 = new DOMPoint(this.x3, this.y3).matrixTransform(transformMapToScreenSpace);
            // eslint-disable-next-line no-unused-vars
            const p4 = new DOMPoint(this.x4, this.y4).matrixTransform(transformMapToScreenSpace);

            const distanceFromResize = Math.sqrt(
                Math.pow(last.x - p3.x, 2) + Math.pow(last.y - p3.y, 2)
            );
            if (!this.isResizing && distanceFromResize <= this.buttonSize / 2) {
                this.isResizing = true;
            }

            const lastInMapSpace = new DOMPoint(last.x, last.y).matrixTransform(transformCanvasToMapSpace);
            const currentInMapSpace = new DOMPoint(current.x, current.y).matrixTransform(transformCanvasToMapSpace);

            const dx = currentInMapSpace.x - lastInMapSpace.x;
            const dy = currentInMapSpace.y - lastInMapSpace.y;

            if (this.isResizing) {
                if (currentInMapSpace.x > this.x1 + 5 && this.x2 + dx > this.x1 + 5) {
                    this.x2 += dx;
                    this.x3 += dx;
                }
                if (currentInMapSpace.y > this.y1 + 5 && this.y3 + dy > this.y1 + 5) {
                    this.y3 += dy;
                    this.y4 += dy;
                }

                return {
                    updatedLocation: this,
                    stopPropagation: true
                };
            } else if (
                last.x >= p1.x
                && last.x <= p3.x
                && last.y >= p1.y
                && last.y <= p3.y
            ) {
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;
                this.x4 += dx;
                this.y4 += dy;

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

/**
 * Label of a segment
 */
export class SegmentLabel {

    constructor(x ,y, id, selected, active, area, name) {
        this.x = x;
        this.y = y;
        this.id = id;

        this.selected = selected === true;
        this.active = active === true;
        this.name = name;

        this.scaledIconSize = {
            width: 0,
            height: 0
        };

        this.area = area;
    }

    draw(ctx, transformFromMapSpace, scaleFactor) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformFromMapSpace);

        if (this.selected === true) {
            this.image = img_segment_active;
        } else {
            this.image = img_segment;
        }

        this.scaledIconSize = {
            width: Math.max(
                Math.min(
                    this.image.width / (18 / scaleFactor),
                    this.image.width
                ),
                this.image.width / 5
            ),
            height: Math.max(
                Math.min(
                    this.image.height / (18 / scaleFactor),
                    this.image.height
                ),
                this.image.height / 5
            )
        };

        ctx.save();

        if (this.active) {
            ctx.translate(p1.x, p1.y);
            ctx.rotate(Math.PI);
            ctx.translate(-p1.x, -p1.y);
        }

        ctx.drawImage(
            this.image,
            p1.x - this.scaledIconSize.width / 2,
            p1.y - this.scaledIconSize.height / 2,
            this.scaledIconSize.width,
            this.scaledIconSize.height
        );

        ctx.restore();

        if (scaleFactor >= 11) {
            ctx.save();
            ctx.textAlign = "center";
            ctx.font = "45px sans-serif";
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            let text = this.name ? this.name : this.id;
            ctx.fillText(text, p1.x , p1.y + this.scaledIconSize.height + 5);
            ctx.strokeText(text, p1.x , p1.y + this.scaledIconSize.height + 5);


            if (this.area) {
                let areaString = (this.area / 10000).toPrecision(2) + " m²";
                if (this.name) {
                    areaString += `\n(id=${this.id})`;
                }

                ctx.font = "35px sans-serif";
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(areaString, p1.x , p1.y + this.scaledIconSize.height + 5 + 45);
                ctx.strokeText(areaString, p1.x , p1.y + this.scaledIconSize.height + 5 + 45);
            }

            ctx.restore();
        }
    }

    tap(tappedPoint, transformMapToScreenSpace) {
        const p1 = new DOMPoint(this.x, this.y).matrixTransform(transformMapToScreenSpace);

        if (
            tappedPoint.x >= p1.x - this.scaledIconSize.width / 2
            && tappedPoint.x <= p1.x + this.scaledIconSize.width / 2
            && tappedPoint.y >= p1.y - this.scaledIconSize.height / 2
            && tappedPoint.y <= p1.y + this.scaledIconSize.height / 2
        ) {
            this.selected = !this.selected;

            return {
                updatedLocation: this,
                stopPropagation: true
            };
        }

        return {
            updatedLocation: this,
            stopPropagation: false
        };
    }
}
