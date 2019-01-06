
/**
 * This allows to save and retrieve the currently applied transfroms from the RenderingContext.
 * There is a native browser feature not really supported today:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/currentTransform
 *
 *
 * Large amounts of this code are from here: https://codepen.io/techslides/pen/zowLd
 * @param {CanvasRenderingContext2D} ctx
 */
export function trackTransforms(ctx) {
    let xform = new DOMMatrix();
    ctx.getTransform = function () { return xform.translate(0, 0); };

    const savedTransforms = [];
    const save = ctx.save;
    ctx.save = function () {
        savedTransforms.push(xform.translate(0, 0));
        return save.call(ctx);
    };

    const restore = ctx.restore;
    ctx.restore = function () {
        xform = savedTransforms.pop();
        return restore.call(ctx);
    };

    const scale = ctx.scale;
    ctx.scale = function (sx, sy) {
        xform = xform.scale(sx, sy);
        return scale.call(ctx, sx, sy);
    };

    const rotate = ctx.rotate;
    ctx.rotate = function (radians) {
        xform = xform.rotate(radians * 180 / Math.PI);
        return rotate.call(ctx, radians);
    };

    const translate = ctx.translate;
    ctx.translate = function (dx, dy) {
        xform = xform.translate(dx, dy);
        return translate.call(ctx, dx, dy);
    };

    const transform = ctx.transform;
    ctx.transform = function (a, b, c, d, e, f) {
        const m2 = new DOMMatrix();
        m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
        xform = xform.multiply(m2);
        return transform.call(ctx, a, b, c, d, e, f);
    };

    const setTransform = ctx.setTransform;
    ctx.setTransform = function (a, b, c, d, e, f) {
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(ctx, a, b, c, d, e, f);
    };

    const pt = new DOMPoint();
    ctx.transformedPoint = function (x, y) {
        pt.x = x; pt.y = y;
        return pt.matrixTransform(xform.inverse());
    }

    ctx.getScaleFactor2d = function () {
        const sx = Math.sqrt(xform.a * xform.a + xform.b + xform.b);
        const sy = Math.sqrt(xform.c * xform.c + xform.d * xform.d);

        return [sx, sy];
    }
}
