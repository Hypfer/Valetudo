const rocky = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAfCAMAAAHGjw8oAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADbUExURQAAAICAgICAgICAgICAgICAgHx8fH19fX19fYCAgIGBgX5+foCAgH5+foCAgH9/f39/f35+foCAgH9/f39/f4CAgH5+foGBgYCAgICAgIGBgX9/f39/f35+foCAgH9/f39/f4CAgIODg4eHh4mJiZCQkJycnJ2dnZ6enqCgoKSkpKenp62trbGxsbKysry8vL29vcLCwsXFxcbGxsvLy87OztPT09XV1d/f3+Tk5Ojo6Ozs7O3t7e7u7vHx8fLy8vPz8/X19fb29vf39/j4+Pn5+f39/f7+/v///9yECocAAAAgdFJOUwAGChgcKCkzOT5PVWZnlJmfsLq7wcrS1Nre4OXz+vr7ZhJmqwAAAAlwSFlzAAAXEQAAFxEByibzPwAAAcpJREFUKFNlkolaWkEMhYPggliBFiwWhGOx3AqCsggI4lZt8/5P5ElmuEX5P5hMMjeZJBMRafCvUKnbIqpcioci96owTQWqP0QKC54nImUAyr9k7VD1me4YvibHlJKpVUzQhR+dmdTRSDUvdHh8NK8nhqUVch7cITmXA3rtYDmH+3OL4XI1T+BhJUcXczQxOBXJuve0/daeUr5A6g9muJzo5NI2kPKtyRSGBStKQZ5RC1hENWn6NSRTrDUqLD/lsNKoFTNRETlGMn9dDoGdoDcT1fHPi7EuUDD9dMBw4+6vMQVyInnPXDsdW+8tjWfbYTbzg/OstcagzSlb0+wL/6k+1KPhCrj6YFhzS5eXuHcYNF4bsGtDYhFLTOSMqTsx9e3iyKfynb1SK+RqtEq70RzZPwEGKwv7G0OK1QA42Y+HIgct9P3WWG9ItI/mQTgvoeuWAMdlTRclO/+Km2jwlhDvinGNbyJH6EWV84AJ1wl8JowejqTqTmv+0GqDmVLlg/wLX5Mp2rO3WRs2Zs5fznAVd1EzRh10OONr7hhhM4ctevhiVVxHdYsbq+JzHzaIfdjs5CZ9tGInSfoWEXuL7//fwtn9+Jp7wSryDjBFqnOGeuUxAAAAAElFTkSuQmCC";
const img_rocky = new Image();
img_rocky.src = rocky;

const charger = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAMAAADXqc3KAAAAdVBMVEUAAAA44Yo44Yo44Yo44Yo44Yo44Yo44Yo44Yp26q844Yr///9767Kv89DG9t2g8Md26q5C44/5/vvz/fjY+ei19NNV5ZtJ45T2/fmY78KP7r1v6atq6Kjs/PPi+u7e+uvM9+Gb8MSS7r+H7bhm6KVh56JZ5p3ZkKITAAAACnRSTlMABTr188xpJ4aepd0A4wAAANZJREFUKM9VklmCgzAMQwkQYCSmLKWl2+zL/Y9YcIUL7wvkJHIUJyKkVcyy+JIGCZILGF//QLEqlTmMdsBEXi56igfH/QVGqvXSu49+1KftCbn+dtxB5LOPfNGQNRaKaQNkTJ46OMGczZg8wJB/9TB+J3nFkyqJMp44vBrnWYhJJmOn/5uVzAotV/zACnbUtTbOpHcQzVx8kxw6mavdpYP90dsNcE5k6xd8RoIb2Xgk6xAbfm5C9NiHtxGiXD/U2P96UJunrS/LOeV2GG4wfBi241P5+NwBnAEUFx9FUdUAAAAASUVORK5CYII=";
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
    let robotPosition = [25600, 25600];
    let chargerPosition = [25600, 25600];
    const canvas = document.createElement('canvas');
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
    function setPath(newPath, newRobotPosition, newChargerPosition) {
        path = newPath;
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
            var ctximg = canvasimg.getContext('2d');
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

    /**
     * Externally called function to (re)draw the path to the canvas
     */
    function draw() {
        const pathColor = (getComputedStyle(document.documentElement).getPropertyValue('--path') || '#ffffff').trim();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let first = true;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = pathColor;
        for (const coord of path.points) {
            const [x, y] = mmToCanvasPx(coord);
            if (first) {
                ctx.moveTo(x, y);
                first = false;
            }
            else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        drawCharger(chargerPosition);
        drawRobot(robotPosition, path.current_angle);
    }

    // noinspection JSDuplicatedDeclaration
    return {
        setPath: setPath,
        scale: scale,
        getScaleFactor: function () { return scaleFactor; },
        canvas: canvas,
        draw: draw
    }
}
