export const noTransform = new DOMMatrix([1, 0, 0, 1, 0, 0]);
export const flipX = new DOMMatrix([1, 0, 0, -1, 0, 0]);

export const transformFromMeter = new DOMMatrix([1, 0, 0, 1, 0, 0])
    .translateSelf(512, 512)
    .scaleSelf(20);
