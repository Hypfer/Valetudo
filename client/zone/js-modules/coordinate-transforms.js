export const noTransform = new DOMMatrix([1, 0, 0, 1, 0, 0]);
export const flipX = new DOMMatrix([1, 0, 0, -1, 0, 0]);

export const transformFromMeter = noTransform
    .translateSelf(512, 512)
    .scaleSelf(20);
