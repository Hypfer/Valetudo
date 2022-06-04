
/**
 * This wrapper is used by the map to allow for panning and zooming
 * It went through multiple iterations. This certainly won't be the last one
 *
 * At some point it was adapted from https://codepen.io/techslides/pen/zowLd
 */
export class Canvas2DContextTrackingWrapper {
    private ctx: CanvasRenderingContext2D;
    private currentTransform: DOMMatrix;
    private savedTransforms: Array<DOMMatrix>;


    constructor(ctx : CanvasRenderingContext2D) {
        this.ctx = ctx;

        this.currentTransform = new DOMMatrix();
        this.savedTransforms = [];
    }

    getTransform() {
        return this.currentTransform.translate(0, 0);
    }

    save() {
        this.savedTransforms.push(this.currentTransform.translate(0, 0));

        this.ctx.save();
    }

    restore() {
        if (this.savedTransforms.length > 0) {
            this.currentTransform = this.savedTransforms.pop()!;
        }

        this.ctx.restore();
    }

    scale(sx : number, sy : number) {
        this.currentTransform = this.currentTransform.scale(sx, sy);

        this.ctx.scale(sx, sy);
    }

    rotate(radians: number) {
        this.currentTransform = this.currentTransform.rotate(radians * 180 / Math.PI);

        this.ctx.rotate(radians);
    }

    translate(dx: number, dy: number) {
        this.currentTransform = this.currentTransform.translate(dx, dy);

        this.ctx.translate(dx, dy);
    }

    transform(a: number, b: number, c: number, d: number, e: number, f: number) {
        const m2 = new DOMMatrix();
        m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
        this.currentTransform = this.currentTransform.multiply(m2);

        this.ctx.transform(a, b, c, d, e, f);
    }

    setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.currentTransform.a = a;
        this.currentTransform.b = b;
        this.currentTransform.c = c;
        this.currentTransform.d = d;
        this.currentTransform.e = e;
        this.currentTransform.f = f;

        this.ctx.setTransform(a, b, c, d, e, f);
    }

    mapPointToCurrentTransform(x: number, y: number) {
        const pt = new DOMPoint(x, y);

        return pt.matrixTransform(DOMMatrix.fromMatrix(this.currentTransform).invertSelf());
    }

    getScaleFactor() {
        return {
            scaleX: Math.sqrt(this.currentTransform.a * this.currentTransform.a + this.currentTransform.b + this.currentTransform.b),
            scaleY: Math.sqrt(this.currentTransform.c * this.currentTransform.c + this.currentTransform.d * this.currentTransform.d)
        };
    }

    getContext() {
        return this.ctx;
    }
}
