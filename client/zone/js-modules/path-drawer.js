const rocky = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAX2QAAF9kBNL4yoAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAVMSURBVFiFvZdfTJNpFsZ/56N/mDItraAbwJstBhMuRijaWf+glGzQHRJN5kZNNtl4uSZeTGZi1mbWfGESTMzulYnXoJPszZqNk01XowKmF0OsJiIGUBjmQp1uWkqn8qe0tJ69WD4iCrTj6j5XX973nPM875e85z2PUCbOnDnjrKmpCanqMRFpA34NeFe2fwZ+BO4D36VSqcFLly7lyqkrpQJM06xX1T+LyO9V9WMAp9OpPp9PXC4XAIuLi6TTac3lcgIgInPAt/l8/pve3t74OwkwTbMS+Br4QlVdW7dupbm5mZ07d1JXV4fI2lRVJR6PMzExwfj4OMlkEhFZBP4K9JqmuVS2gHA4XOdwOP6hqp9WV1frwYMHJRAIvEW6EVSVsbEx7ty5o7OzswIMLy8vf77e33irommanwARVW0IBoMcPnyYioqKsojfRKFQ4ObNm8RiMUTkJ+B3pmk+ej1mTeVwOFxXUVFx1zCM+u7ubjl06BCGYbwTOYBhGDQ1NVFVVcXU1NTHwNF9+/b9LRqNzr8lwDTNSsMw/gU0d3d3y+7du9+Z+E00NDTgdrvlyZMnHpvNFmptbb06PDxcAHj9eF8DvwkGg7xPcguBQIA9e/agqgGPx/Mna92A//564Aufz6ddXV1lFVRVMpkMmUwGVS0r58iRI2zZskVF5KsVTmwAdrv9vKq6Ojs7sdlsJQs9ePCAaDSK1Qey2Szt7e0EAoFN8yoqKgiFQnLt2jWX3W4/D/xRVjpcsra21n369OmSV21wcJAXL15w7Ngx3G43AC9fvuT69ets376dUCi0ab6qcvnyZWZmZhaBXxk+n69TVd3Nzc0lyZPJJGNjYxw/fnyVHMDj8XDixAnGxsaYmZnZtIaI0NLSgqq6Xr161W0TkaMADx8+5PHjx5sm53I59u7di91uf2vPbreza9cu+vr6cDqdm9YpFouWmE6biLSJCJlMZtMkAKfTidfr3XDf5/OxvLzM/Pz8hjEWDMNAVXfZAH9VVRX19fUlk9LpNMlkcsP9RCKB1+vdVKSFeDzO3Nyc3wZ4amtrOXnyZMmkTCZDX18fwWBw9QZYWFxc5NGjR5w6dQqPx1OyVn9/P3Nzc9W/qM9WV1dz4MABrl69yvPnz1fXnz17xpUrV2hvby+L/HXYgJdLS0s15Sa0tbXh9Xq5desWqVQKgJqaGrq6uvD7/WUTZ7NZgIxNVX+YnZ3doqpS7nPb2NhIY2Nj2WRvQlWZnZ1VVf3BEJEHuVxO4vFNB5f3ikQiQT6fFxEZMYDvACYmJv5vAiYnJ63PASOVSg2KyNz4+HjZj8r/AlVlZGTEGtcixsr0+m0ymWR0dPSDCxgdHbV6Sb9pmvPWNTRFZH5gYEALhcIHIy8WiwwODqqILAA9sDIRDQ0NLXR0dHy0tLR0KJvN0tTU9EEERCIRpqenRUQumKb5T1g7EfUCw7FYjFgs9t7J7927x/379xGR71Op1AVrfXUmHBoaKuzfvz9is9lOTE1NuV0ulzQ0NLwX8lgsxo0bNxR4Afz24sWLqy/fmqk4Go3Od3R03AaOPn361LOwsIDf73/nybhQKBCJRLh79y4i8lOxWPysp6dn+vWYdVvfuXPntjocjr8DBy1j0traWrYQy5jcvn1b0+m0iMj3wOemaf77zdhS1iwMfGlZs5aWFnbs2MG2bdvWtWaJRILJyUlGRkYsa7YA/CWVSl3YyKyWbP7hcLjObrefF5E/qOpHAA6HY11zms/nLXO6CPQDPeud+hcJsHD27Fl3ZWXlZ4ZhhIAWwM9aez4NPAQGgIhpmqXHIuA/yC0sye73xnkAAAAASUVORK5CYII=";
const img_rocky = new Image();
img_rocky.src = rocky;

const charger = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAX2QAAF9kBNL4yoAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARiSURBVFiFnZdfbBRVFMZ/Z3Z22e3ClqVUaK1iMRoM0j8BDD6IihiMJUYrAk9GH40YUkxEYtvcxEJkH5RI4oNPJkYgqWLEomlIIZryJwTFGox/QCCCLZVsae3u0t3ZzvWh05aFdnvH7+2e+53zfZOZe+4ZwRBKqZjrug0iskZEaoH7gLne9iBwGfgJOJrJZA4nEolhk7piIPyg1no7sBkoMfSbEZH9+Xx+d1tb2/n/ZaCpqSlSWlr6rtZ6K2AbChcWF3GAPUCrUmrE2EBzc/MDgUDgIPCwqVgv9xKwYIH711TbpxzHady1a1ff7RvW7YGWlpZ627aP+xEfJUCntZF0PjgdZVUwGDytlKopasB78k6tdbmpOMDZ4FpCoRALrP5itCqt9WGl1MIpDSilwrZtt/sVH9DzKKlYSnV0mCipmehVQEdTU1PkDgNAm9a61o84wJmSF9mzIUZ25KYRX2u9PBaLvV1gwDtqW/2K/2YtZ/OqMvIuRPJJP6nbxl+F5bnajs+jliVM/9zH2LI6TE+vJpa95Cd9NtAKIEqpmNa6D/MmA8B3oY188MpD1FUK73RkuHH6E+6y/jHOF5F0JpOpsFzXbfAr3qvvoXbJIuoqx9rIz1dzzLd8vQK01tFwOPysLSJr/CS6WJyb8xxH1kcnYumbWSxGfRkAEJE1lnexGONs8CneWhcnGhpbZxzQuRmP33SosbXW1absQR0nuGAZzy+b/F7PXYN+Zy5nohsmYo7jUJs9QolkZiq52AZipgbOlDTSvqmQXl8Jx98sA8oAuJCEbZ9eNBFHREqNj97vUkfjI+VUzCmMBwMQ9/qa1tByaJBV2YOmZbGBf4H5xUhZwhxz1xG/nmdLe2rcPa8/HmXJLY37o+4spckTJi3ZM6yHbBG5pLUuasDCZRMfwy+TsZ7QWgJPLJ1Y9w3DvhPXeXr0tJG4h4s2Y2PUymKsIDnikit0Hyrl/rLJ9WsHhlmR+cJgxpqEiPRYwFHzlEnMCkewPLEDPzpI/w/E5YavGq7rdllAh4ik/STepIS75401gqER+LArSU3+e1/iIpK2LOtbSymVAg74Se5zK3h0cRiAN9pT1Ke+RHB9GQD2KaVSFkA+n9/tDZBGGJxVzcpFQbrOj5K88ivlUnQSmgo54D3wrmNvdN5jmj1kV1Edh+avBqnPdfoVB3hfKXVxwoCHVuCUSXYwHKW5I83S1NfY5H0pi8jJgYEBNb6+dSYcEZEXRORKsQIOQXqzMf748zJVXPYlDvQ6jvPS3r17s3cY8ExcA9YDV6er0O8uJJnWrBg55EtZRK64rvvMzp07/y6IT0XesWNHeSgU+hxYffvedSrIWlGq3At+xE8Cjd4DFiAwVUJ3d3empqZmfyQScUVkBRAa34uSIqYHTLVzIpJIJpOvJhKJoSnNzVTBm15bgZe11tGZ+DDWZLTWn4nI7vGvfVquSUHPyGzXdRssy3oSqPMGmYnfc+9SOysix4BvvAY3I/4DDqOSzmvFa2wAAAAASUVORK5CYII=";
const img_charger = new Image();
img_charger.src = charger;

/**
 * Object for drawing the robot path onto its on canvas.
 * It's not displayed directly but used to easily paint the map image onto another canvas.
 *
 * I noticed that drawing the path (lines on the canvas) on each redraw is quite slow.
 * On the other hand drawing the path on a 1024 * 1024 canvas causes blurry lines when zoomed in.
 *
 * The idea here is, that the path is only redrawn after zooming is finished (scale function).
 * The resulting image is reused for redrawing while panning for example.
 *
 * @constructor
 */
export function PathDrawer() {
    let path = { current_angle: 0, points: [] };
    let predictedPath = undefined;
    let robotPosition = [25600, 25600];
    let chargerPosition = [25600, 25600];
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    // Used to draw smoother path when zoomed into the map
    let scaleFactor = 1;
    const maxScaleFactor = 6;

    /**
     * Public function for updating the path
     * @param {Array} newPath
     * @param newRobotPosition
     * @param newChargerPosition
     */
    function setPath(newPath, newRobotPosition, newChargerPosition, newPredictedPath) {
        path = newPath;
        predictedPath = newPredictedPath;
        robotPosition = newRobotPosition || robotPosition;
        chargerPosition = newChargerPosition || chargerPosition;
    }

    /**
     * Allows to set the scaling factor for the path drawing
     * The maximum scaling factor is limited in order to improve performance
     *
     * @param {number} factor - scaling factor for drawing the path in finer resolution
     */
    function scale(factor) {
        const newScaleFactor = Math.min(factor, maxScaleFactor);
        if (newScaleFactor === scaleFactor) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        scaleFactor = newScaleFactor;
        canvas.width = canvas.height = scaleFactor * 1024;
        draw();
    }

    function mmToCanvasPx(coords) {
        return coords.map(d => Math.floor(d / 50 * scaleFactor));
    }

    function drawCharger(position) {
        const ctx = canvas.getContext("2d");

        const chargerPositionInPixels = mmToCanvasPx(position);

        ctx.drawImage(
            img_charger,
            chargerPositionInPixels[0] - img_charger.height / 2,
            chargerPositionInPixels[1] - img_charger.width / 2
        );
    }

    function drawRobot(position, angle) {
        const ctx = canvas.getContext("2d");
        function rotateRobot(img, angle) {
            var canvasimg = document.createElement("canvas");
            canvasimg.width = img.width;
            canvasimg.height = img.height;
            var ctximg = canvasimg.getContext("2d");
            const offset = 90;
            ctximg.clearRect(0, 0, img.width, img.height);
            ctximg.translate(img.width / 2, img.width / 2);
            ctximg.rotate((angle + offset) * Math.PI / 180);
            ctximg.translate(-img.width / 2, -img.width / 2);
            ctximg.drawImage(img, 0, 0);
            return canvasimg;
        }

        const robotPositionInPixels = mmToCanvasPx(position);

        ctx.drawImage(
            rotateRobot(img_rocky, angle),
            robotPositionInPixels[0] - img_rocky.width / 2, // x
            robotPositionInPixels[1] - img_rocky.height / 2, // y
            img_rocky.width, // width
            img_rocky.height // height
        );
    }

    function drawLines(points, ctx) {
        let first = true;
        for (const coord of points) {
            const [x, y] = mmToCanvasPx(coord);
            if (first) {
                ctx.moveTo(x, y);
                first = false;
            } else {
                ctx.lineTo(x, y);
            }
        }
    }

    /**
     * Externally called function to (re)draw the path to the canvas
     */
    function draw() {
        const pathColor = (getComputedStyle(document.documentElement).getPropertyValue("--path") || "#ffffff").trim();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = pathColor;
        drawLines(path.points, ctx);
        ctx.stroke();

        drawCharger(chargerPosition);
        drawRobot(robotPosition, path.current_angle);

        if (predictedPath) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = pathColor;
            ctx.setLineDash([5, 5]);
            drawLines(predictedPath.points, ctx);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    // noinspection JSDuplicatedDeclaration
    return {
        setPath: setPath,
        scale: scale,
        getScaleFactor: function () {
            return scaleFactor;
        },
        canvas: canvas,
        draw: draw
    };
}
