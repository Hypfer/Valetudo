// MIT License

// Copyright (c) 2018 Jarek Foksa

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// https://github.com/jarek-foksa/geometry-polyfill

// @info
//   DOMPoint polyfill
// @src
//   https://drafts.fxtf.org/geometry/#DOMPoint
//   https://github.com/chromium/chromium/blob/master/third_party/blink/renderer/core/geometry/dom_point_read_only.cc
{
    class DOMPoint {
      constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
      }

      static fromPoint(otherPoint) {
        return new DOMPoint(
          otherPoint.x,
          otherPoint.y,
          otherPoint.z !== undefined ? otherPoint.z : 0,
          otherPoint.w !== undefined ? otherPoint.w : 1
        );
      }

      matrixTransform(matrix) {
        if (
          (matrix.is2D || matrix instanceof SVGMatrix) &&
          this.z === 0 &&
          this.w === 1
        ) {
          return new DOMPoint(
            this.x * matrix.a + this.y * matrix.c + matrix.e,
            this.x * matrix.b + this.y * matrix.d + matrix.f,
            0, 1
          );
        }
        else {
          return new DOMPoint(
            this.x * matrix.m11 + this.y * matrix.m21 + this.z * matrix.m31 + this.w * matrix.m41,
            this.x * matrix.m12 + this.y * matrix.m22 + this.z * matrix.m32 + this.w * matrix.m42,
            this.x * matrix.m13 + this.y * matrix.m23 + this.z * matrix.m33 + this.w * matrix.m43,
            this.x * matrix.m14 + this.y * matrix.m24 + this.z * matrix.m34 + this.w * matrix.m44
          );
        }
      }
    }

    window.DOMPoint = DOMPoint;
  }

  // @info
  //   DOMRect polyfill
  // @src
  //   https://drafts.fxtf.org/geometry/#DOMRect
  //   https://github.com/chromium/chromium/blob/master/third_party/blink/renderer/core/geometry/dom_rect_read_only.cc
  {
    class DOMRect {
      constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }

      static fromRect(otherRect) {
        return new DOMRect(otherRect.x, otherRect.y, otherRect.width, otherRect.height);
      }

      get top() {
        return this.y;
      }

      get left() {
        return this.x;
      }

      get right() {
        return this.x + this.width;
      }

      get bottom() {
        return this.y + this.height;
      }
    }

    window.DOMRect = DOMRect;
  }

  // @info
  //   DOMMatrix polyfill (SVG 2)
  // @src
  //   https://github.com/chromium/chromium/blob/master/third_party/blink/renderer/core/geometry/dom_matrix_read_only.cc
  //   https://github.com/tocharomera/generativecanvas/blob/master/node-canvas/lib/DOMMatrix.js
  {
    const M11 =  0,  M12 =  1,  M13 =  2,  M14 =  3;
    const M21 =  4,  M22 =  5,  M23 =  6,  M24 =  7;
    const M31 =  8,  M32 =  9,  M33 = 10,  M34 = 11;
    const M41 = 12,  M42 = 13,  M43 = 14,  M44 = 15;

    const A = M11, B = M12;
    const C = M21, D = M22;
    const E = M41, F = M42;

    const DEGREE_PER_RAD = 180 / Math.PI;
    const RAD_PER_DEGREE = Math.PI / 180;

    const $values = Symbol();
    const $is2D = Symbol();

    let parseMatrix = (init) => {
      let parsed = init.replace(/matrix\(/, "");
      parsed = parsed.split(/,/, 7);

      if (parsed.length !== 6) {
        throw new Error(`Failed to parse ${init}`);
      }

      parsed = parsed.map(parseFloat);

      return [
        parsed[0], parsed[1], 0, 0,
        parsed[2], parsed[3], 0, 0,
                0,         0, 1, 0,
        parsed[4], parsed[5], 0, 1
      ];
    };

    let parseMatrix3d = (init) => {
      let parsed = init.replace(/matrix3d\(/, "");
      parsed = parsed.split(/,/, 17);

      if (parsed.length !== 16) {
        throw new Error(`Failed to parse ${init}`);
      }

      return parsed.map(parseFloat);
    };

    let parseTransform = (tform) => {
      let type = tform.split(/\(/, 1)[0];

      if (type === "matrix") {
        return parseMatrix(tform);
      }
      else if (type === "matrix3d") {
        return parseMatrix3d(tform);
      }
      else {
        throw new Error(`${type} parsing not implemented`)
      }
    };

    let setNumber2D = (receiver, index, value) => {
      if (typeof value !== "number") {
        throw new TypeError("Expected number");
      }

      receiver[$values][index] = value;
    };

    let setNumber3D = (receiver, index, value) => {
      if (typeof value !== "number") {
        throw new TypeError("Expected number");
      }

      if (index === M33 || index === M44) {
        if (value !== 1) {
          receiver[$is2D] = false;
        }
      }
      else if (value !== 0) {
        receiver[$is2D] = false;
      }

      receiver[$values][index] = value;
    };

    let newInstance = (values) => {
      let instance = Object.create(DOMMatrix.prototype);
      instance.constructor = DOMMatrix;
      instance[$is2D] = true;
      instance[$values] = values;

      return instance;
    };

    let multiply = (first, second) => {
      let dest = new Float64Array(16);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          let sum = 0;

          for (let k = 0; k < 4; k++) {
            sum += first[i * 4 + k] * second[k * 4 + j];
          }

          dest[i * 4 + j] = sum;
        }
      }

      return dest;
    };

    class DOMMatrix {
      get m11() { return this[$values][M11]; } set m11(value) { setNumber2D(this, M11, value); }
      get m12() { return this[$values][M12]; } set m12(value) { setNumber2D(this, M12, value); }
      get m13() { return this[$values][M13]; } set m13(value) { setNumber3D(this, M13, value); }
      get m14() { return this[$values][M14]; } set m14(value) { setNumber3D(this, M14, value); }
      get m21() { return this[$values][M21]; } set m21(value) { setNumber2D(this, M21, value); }
      get m22() { return this[$values][M22]; } set m22(value) { setNumber2D(this, M22, value); }
      get m23() { return this[$values][M23]; } set m23(value) { setNumber3D(this, M23, value); }
      get m24() { return this[$values][M24]; } set m24(value) { setNumber3D(this, M24, value); }
      get m31() { return this[$values][M31]; } set m31(value) { setNumber3D(this, M31, value); }
      get m32() { return this[$values][M32]; } set m32(value) { setNumber3D(this, M32, value); }
      get m33() { return this[$values][M33]; } set m33(value) { setNumber3D(this, M33, value); }
      get m34() { return this[$values][M34]; } set m34(value) { setNumber3D(this, M34, value); }
      get m41() { return this[$values][M41]; } set m41(value) { setNumber2D(this, M41, value); }
      get m42() { return this[$values][M42]; } set m42(value) { setNumber2D(this, M42, value); }
      get m43() { return this[$values][M43]; } set m43(value) { setNumber3D(this, M43, value); }
      get m44() { return this[$values][M44]; } set m44(value) { setNumber3D(this, M44, value); }

      get a() { return this[$values][A]; } set a(value) { setNumber2D(this, A, value); }
      get b() { return this[$values][B]; } set b(value) { setNumber2D(this, B, value); }
      get c() { return this[$values][C]; } set c(value) { setNumber2D(this, C, value); }
      get d() { return this[$values][D]; } set d(value) { setNumber2D(this, D, value); }
      get e() { return this[$values][E]; } set e(value) { setNumber2D(this, E, value); }
      get f() { return this[$values][F]; } set f(value) { setNumber2D(this, F, value); }

      get is2D() {
        return this[$is2D];
      }

      get isIdentity() {
        let values = this[$values];

        return values[M11] === 1 && values[M12] === 0 && values[M13] === 0 && values[M14] === 0 &&
               values[M21] === 0 && values[M22] === 1 && values[M23] === 0 && values[M24] === 0 &&
               values[M31] === 0 && values[M32] === 0 && values[M33] === 1 && values[M34] === 0 &&
               values[M41] === 0 && values[M42] === 0 && values[M43] === 0 && values[M44] === 1;
      }

      static fromMatrix(init) {
        if (init instanceof DOMMatrix) {
          return new DOMMatrix(init[$values]);
        }
        else if (init instanceof SVGMatrix) {
          return new DOMMatrix([init.a, init.b, init.c, init.d, init.e, init.f]);
        }
        else {
          throw new TypeError("Expected DOMMatrix");
        }
      }

      static fromFloat32Array(init) {
        if (!(init instanceof Float32Array)) throw new TypeError("Expected Float32Array");
        return new DOMMatrix(init);
      }

      static fromFloat64Array(init) {
        if (!(init instanceof Float64Array)) throw new TypeError("Expected Float64Array");
        return new DOMMatrix(init);
      }

      // @type
      // (Float64Array) => void
      constructor(init) {
        this[$is2D] = true;

        this[$values] = new Float64Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]);

        // Parse CSS transformList
        if (typeof init === "string") {
          if (init === "") {
            return;
          }
          else {
            let tforms = init.split(/\)\s+/, 20).map(parseTransform);

            if (tforms.length === 0) {
              return;
            }

            init = tforms[0];

            for (let i = 1; i < tforms.length; i++) {
              init = multiply(tforms[i], init);
            }
          }
        }

        let i = 0;

        if (init && init.length === 6) {
          setNumber2D(this, A, init[i++]);
          setNumber2D(this, B, init[i++]);
          setNumber2D(this, C, init[i++]);
          setNumber2D(this, D, init[i++]);
          setNumber2D(this, E, init[i++]);
          setNumber2D(this, F, init[i++]);
        }
        else if (init && init.length === 16) {
          setNumber2D(this, M11, init[i++]);
          setNumber2D(this, M12, init[i++]);
          setNumber3D(this, M13, init[i++]);
          setNumber3D(this, M14, init[i++]);
          setNumber2D(this, M21, init[i++]);
          setNumber2D(this, M22, init[i++]);
          setNumber3D(this, M23, init[i++]);
          setNumber3D(this, M24, init[i++]);
          setNumber3D(this, M31, init[i++]);
          setNumber3D(this, M32, init[i++]);
          setNumber3D(this, M33, init[i++]);
          setNumber3D(this, M34, init[i++]);
          setNumber2D(this, M41, init[i++]);
          setNumber2D(this, M42, init[i++]);
          setNumber3D(this, M43, init[i++]);
          setNumber3D(this, M44, init[i]);
        }
        else if (init !== undefined) {
          throw new TypeError("Expected string or array.");
        }
      }

      inspect(depth, options) {
        if (depth < 0) {
          return "[DOMMatrix]";
        }

        return `DOMMatrix [
          a: ${this.a}
          b: ${this.b}
          c: ${this.c}
          d: ${this.d}
          e: ${this.e}
          f: ${this.f}
          m11: ${this.m11}
          m12: ${this.m12}
          m13: ${this.m13}
          m14: ${this.m14}
          m21: ${this.m21}
          m22: ${this.m22}
          m23: ${this.m23}
          m23: ${this.m23}
          m31: ${this.m31}
          m32: ${this.m32}
          m33: ${this.m33}
          m34: ${this.m34}
          m41: ${this.m41}
          m42: ${this.m42}
          m43: ${this.m43}
          m44: ${this.m44}
          is2D: ${this.is2D}
          isIdentity: ${this.isIdentity} ]`;
      }

      multiply(other) {
        return newInstance(this[$values]).multiplySelf(other);
      }

      multiplySelf(other) {
        this[$values] = multiply(other[$values], this[$values]);

        if (!other.is2D) {
          this[$is2D] = false;
        }

        return this;
      }

      preMultiplySelf(other) {
        this[$values] = multiply(this[$values], other[$values]);

        if (!other.is2D) {
          this[$is2D] = false;
        }

        return this;
      }

      translate(tx, ty, tz) {
        return newInstance(this[$values]).translateSelf(tx, ty, tz);
      }

      translateSelf(tx = 0, ty = 0, tz = 0) {
        this[$values] = multiply([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          tx, ty, tz, 1
        ], this[$values]);

        if (tz !== 0) {
          this[$is2D] = false;
        }

        return this;
      }

      scale(scaleX, scaleY, scaleZ, originX, originY, originZ) {
        return newInstance(this[$values]).scaleSelf(scaleX, scaleY, scaleZ, originX, originY, originZ);
      }

      scale3d(scale, originX, originY, originZ) {
        return newInstance(this[$values]).scale3dSelf(scale, originX, originY, originZ);
      }

      scale3dSelf(scale, originX, originY, originZ) {
        return this.scaleSelf(scale, scale, scale, originX, originY, originZ);
      }

      scaleSelf(scaleX, scaleY, scaleZ, originX, originY, originZ) {
        // Not redundant with translate's checks because we need to negate the values later.
        if (typeof originX !== "number") originX = 0;
        if (typeof originY !== "number") originY = 0;
        if (typeof originZ !== "number") originZ = 0;

        this.translateSelf(originX, originY, originZ);

        if (typeof scaleX !== "number") scaleX = 1;
        if (typeof scaleY !== "number") scaleY = scaleX;
        if (typeof scaleZ !== "number") scaleZ = 1;

        this[$values] = multiply([
          scaleX, 0, 0, 0,
          0, scaleY, 0, 0,
          0, 0, scaleZ, 0,
          0, 0, 0, 1
        ], this[$values]);

        this.translateSelf(-originX, -originY, -originZ);

        if (scaleZ !== 1 || originZ !== 0) {
          this[$is2D] = false;
        }

        return this;
      }

      rotateFromVector(x, y) {
        return newInstance(this[$values]).rotateFromVectorSelf(x, y);
      }

      rotateFromVectorSelf(x = 0, y = 0) {
        let theta = (x === 0 && y === 0) ? 0 : Math.atan2(y, x) * DEGREE_PER_RAD;
        return this.rotateSelf(theta);
      }

      rotate(rotX, rotY, rotZ) {
        return newInstance(this[$values]).rotateSelf(rotX, rotY, rotZ);
      }

      rotateSelf(rotX, rotY, rotZ) {
        if (rotY === undefined && rotZ === undefined) {
          rotZ = rotX;
          rotX = rotY = 0;
        }

        if (typeof rotY !== "number") rotY = 0;
        if (typeof rotZ !== "number") rotZ = 0;

        if (rotX !== 0 || rotY !== 0) {
          this[$is2D] = false;
        }

        rotX *= RAD_PER_DEGREE;
        rotY *= RAD_PER_DEGREE;
        rotZ *= RAD_PER_DEGREE;

        let c = Math.cos(rotZ);
        let s = Math.sin(rotZ);

        this[$values] = multiply([
          c, s, 0, 0,
          -s, c, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ], this[$values]);

        c = Math.cos(rotY);
        s = Math.sin(rotY);

        this[$values] = multiply([
          c, 0, -s, 0,
          0, 1, 0, 0,
          s, 0, c, 0,
          0, 0, 0, 1
        ], this[$values]);

        c = Math.cos(rotX);
        s = Math.sin(rotX);

        this[$values] = multiply([
          1, 0, 0, 0,
          0, c, s, 0,
          0, -s, c, 0,
          0, 0, 0, 1
        ], this[$values]);

        return this;
      }

      rotateAxisAngle(x, y, z, angle) {
        return newInstance(this[$values]).rotateAxisAngleSelf(x, y, z, angle);
      }

      rotateAxisAngleSelf(x = 0, y = 0, z = 0, angle = 0) {
        let length = Math.sqrt(x * x + y * y + z * z);

        if (length === 0) {
          return this;
        }

        if (length !== 1) {
          x /= length;
          y /= length;
          z /= length;
        }

        angle *= RAD_PER_DEGREE;

        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let t = 1 - c;
        let tx = t * x;
        let ty = t * y;

        this[$values] = multiply([
          tx * x + c,      tx * y + s * z,  tx * z - s * y,  0,
          tx * y - s * z,  ty * y + c,      ty * z + s * x,  0,
          tx * z + s * y,  ty * z - s * x,  t * z * z + c,   0,
          0,               0,               0,               1
        ], this[$values]);

        if (x !== 0 || y !== 0) {
          this[$is2D] = false;
        }

        return this;
      }

      skewX(sx) {
        return newInstance(this[$values]).skewXSelf(sx);
      }

      skewXSelf(sx) {
        if (typeof sx !== "number") {
          return this;
        }

        let t = Math.tan(sx * RAD_PER_DEGREE);

        this[$values] = multiply([
          1, 0, 0, 0,
          t, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ], this[$values]);

        return this;
      }

      skewY(sy) {
        return newInstance(this[$values]).skewYSelf(sy);
      }

      skewYSelf(sy) {
        if (typeof sy !== "number") {
          return this;
        }

        let t = Math.tan(sy * RAD_PER_DEGREE);

        this[$values] = multiply([
          1, t, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ], this[$values]);

        return this;
      }

      flipX() {
        return newInstance(multiply([
          -1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ], this[$values]));
      }

      flipY() {
        return newInstance(multiply([
          1, 0, 0, 0,
          0, -1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ], this[$values]));
      }

      inverse () {
        return newInstance(this[$values]).invertSelf();
      }

      invertSelf() {
        if (this[$is2D]) {
          let det = this[$values][A] * this[$values][D] - this[$values][B] * this[$values][C];

          // Invertable
          if (det !== 0) {
            let result = new DOMMatrix();

            result.a =  this[$values][D] / det;
            result.b = -this[$values][B] / det;
            result.c = -this[$values][C] / det;
            result.d =  this[$values][A] / det;
            result.e = (this[$values][C] * this[$values][F] - this[$values][D] * this[$values][E]) / det;
            result.f = (this[$values][B] * this[$values][E] - this[$values][A] * this[$values][F]) / det;

            return result;
          }

          // Not invertable
          else {
            this[$is2D] = false;

            this[$values] = [
              NaN, NaN, NaN, NaN,
              NaN, NaN, NaN, NaN,
              NaN, NaN, NaN, NaN,
              NaN, NaN, NaN, NaN
            ];
          }
        }
        else {
          throw new Error("3D matrix inversion is not implemented.");
        }
      }

      setMatrixValue(transformList) {
        let temp = new DOMMatrix(transformList);

        this[$values] = temp[$values];
        this[$is2D] = temp[$is2D];

        return this;
      }

      transformPoint(point) {
        point = new DOMPoint(point);

        let x = point.x;
        let y = point.y;
        let z = point.z;
        let w = point.w;

        let values = this[$values];

        let nx = values[M11] * x + values[M21] * y + values[M31] * z + values[M41] * w;
        let ny = values[M12] * x + values[M22] * y + values[M32] * z + values[M42] * w;
        let nz = values[M13] * x + values[M23] * y + values[M33] * z + values[M43] * w;
        let nw = values[M14] * x + values[M24] * y + values[M34] * z + values[M44] * w;

        return new DOMPoint(nx, ny, nz, nw);
      }

      toFloat32Array() {
        return Float32Array.from(this[$values]);
      }

      toFloat64Array() {
        return this[$values].slice(0);
      }

      toString() {
        if (this.is2D) {
          return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
        }
        else {
          return `matrix3d(${this[$values].join(", ")})`;
        }
      }
    }

    window.DOMMatrix = DOMMatrix;
  }