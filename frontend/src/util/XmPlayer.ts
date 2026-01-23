interface Envelope {
    points: number[][]; // [tick, value]
    type: number;
    sustain: number;
    loopStart: number;
    loopEnd: number;
}

interface Sample {
    data: Float32Array;
    length: number;
    loopType: number;
    loopStart: number;
    loopEnd: number;
    loopLength: number;
    volume: number;
    fineTune: number;
    relativeNote: number;
    pan: number;
}

interface Instrument {
    name: string;
    samples: Sample[];
    sampleMap: Uint8Array;
    volEnv: Envelope;
    panEnv: Envelope;
    fadeout: number;
    vibType: number;
    vibSweep: number;
    vibDepth: number;
    vibRate: number;
}

interface Note {
    note: number;
    inst: number;
    vol: number;
    effT: number;
    effP: number;
}

interface Pattern {
    rows: number;
    data: Note[][];
}

export interface XmSong {
    songName: string;
    channelsNum: number;
    patterns: Pattern[];
    instruments: Instrument[];
    orders: number[];
    defaultSpeed: number;
    defaultBPM: number;
    songLength: number;
    restartPos: number;
}

export interface ChannelState {
    sample: Sample | null;
    samplePos: number;
    playDir: number;
    note: number;
    period: number;
    targetPeriod: number;
    finalPeriod: number;
    vol: number;
    finalVol: number;
    pan: number;
    finalPan: number;
    inst: Instrument | null;
    volEnvPos: number;
    panEnvPos: number;
    fadeoutVol: number;
    keyOn: boolean;
    vibPos: number;
    vibDepth: number;
    vibSpeed: number;
    tremPos: number;
    tremDepth: number;
    tremSpeed: number;
    portaSpeed: number;
    volSlide: number;
    autoVibPos: number;
    autoVibSweep: number;
    memVolSlide: number;
    memPorta: number;
    memVib: number;
    memSampleOffset: number;
    noteCutTick: number;
    keyOffTick: number;
    vNote: string;
    vInst: string;
}

const SAMPLERATE = 44100;
const BUFFER_SIZE = 4096;

function parseXM(buffer: ArrayBuffer): XmSong {
    const dv = new DataView(buffer);
    let p = 60 + dv.getUint32(60, true);

    const str = (o: number, l: number) => {
        let s = "";
        for (let i = 0; i < l; i++) {
            const c = dv.getUint8(o + i);
            if (c === 0) {
                break;
            }
            s += String.fromCharCode(c);
        }
        return s.trim();
    };

    const songName = str(17, 20);
    const songLen = dv.getUint16(64, true);
    const restart = dv.getUint16(66, true);
    const chNum = dv.getUint16(68, true);
    const patNum = dv.getUint16(70, true);
    const instNum = dv.getUint16(72, true);
    const defSpd = dv.getUint16(76, true);
    const defBPM = dv.getUint16(78, true);

    const orders: number[] = [];
    for (let i = 0; i < songLen; i++) {
        orders.push(dv.getUint8(80 + i));
    }

    const patterns: Pattern[] = [];
    for (let i = 0; i < patNum; i++) {
        const len = dv.getUint32(p, true);
        const rows = dv.getUint16(p + 5, true);
        const size = dv.getUint16(p + 7, true);
        p += len;

        const data: Note[][] = [];
        if (size > 0) {
            let pp = p;
            for (let r = 0; r < rows; r++) {
                const row: Note[] = [];
                for (let c = 0; c < chNum; c++) {
                    const n: Note = { note: 0, inst: 0, vol: 0, effT: 0, effP: 0 };
                    const b = dv.getUint8(pp++);
                    if (b & 0x80) {
                        if (b & 1) {
                            n.note = dv.getUint8(pp++);
                        }
                        if (b & 2) {
                            n.inst = dv.getUint8(pp++);
                        }
                        if (b & 4) {
                            n.vol = dv.getUint8(pp++);
                        }
                        if (b & 8) {
                            n.effT = dv.getUint8(pp++);
                        }
                        if (b & 16) {
                            n.effP = dv.getUint8(pp++);
                        }
                    } else {
                        n.note = b;
                        n.inst = dv.getUint8(pp++);
                        n.vol = dv.getUint8(pp++);
                        n.effT = dv.getUint8(pp++);
                        n.effP = dv.getUint8(pp++);
                    }
                    row.push(n);
                }
                data.push(row);
            }
            p += size;
        } else {
            for (let r = 0; r < rows; r++) {
                const row: Note[] = [];
                for (let c = 0; c < chNum; c++) {
                    row.push({ note: 0, inst: 0, vol: 0, effT: 0, effP: 0 });
                }
                data.push(row);
            }
        }
        patterns.push({ rows: rows, data: data });
    }

    const instruments: Instrument[] = [];
    for (let i = 0; i < instNum; i++) {
        const size = dv.getUint32(p, true);
        const name = str(p + 4, 22);
        const numSamp = dv.getUint16(p + 27, true);

        const inst: Instrument = {
            name: name,
            samples: [],
            sampleMap: new Uint8Array(96),
            volEnv: { points: [], type: 0, sustain: 0, loopStart: 0, loopEnd: 0 },
            panEnv: { points: [], type: 0, sustain: 0, loopStart: 0, loopEnd: 0 },
            fadeout: 0,
            vibType: 0,
            vibSweep: 0,
            vibDepth: 0,
            vibRate: 0
        };

        if (numSamp > 0) {
            const headSize = dv.getUint32(p + 29, true);
            for (let k = 0; k < 96; k++) {
                inst.sampleMap[k] = dv.getUint8(p + 33 + k);
            }

            let ep = p + 129;
            for (let k = 0; k < 12; k++) {
                inst.volEnv.points.push([dv.getUint16(ep, true), dv.getUint16(ep + 2, true)]); ep += 4;
            }
            for (let k = 0; k < 12; k++) {
                inst.panEnv.points.push([dv.getUint16(ep, true), dv.getUint16(ep + 2, true)]); ep += 4;
            }

            const volPts = dv.getUint8(ep);
            inst.volEnv.sustain = dv.getUint8(ep + 2);
            inst.volEnv.loopStart = dv.getUint8(ep + 3);
            inst.volEnv.loopEnd = dv.getUint8(ep + 4);
            inst.panEnv.sustain = dv.getUint8(ep + 5);
            inst.panEnv.loopStart = dv.getUint8(ep + 6);
            inst.panEnv.loopEnd = dv.getUint8(ep + 7);
            inst.volEnv.type = dv.getUint8(ep + 8);
            inst.panEnv.type = dv.getUint8(ep + 9);
            inst.vibType = dv.getUint8(ep + 10);
            inst.vibSweep = dv.getUint8(ep + 11);
            inst.vibDepth = dv.getUint8(ep + 12);
            inst.vibRate = dv.getUint8(ep + 13);
            inst.fadeout = dv.getUint16(ep + 14, true);

            if (volPts < 12) {
                inst.volEnv.points.length = volPts;
            }
            const panPts = dv.getUint8(ep + 1);
            if (panPts < 12) {
                inst.panEnv.points.length = panPts;
            }

            p += size;

            const headers = [];
            for (let s = 0; s < numSamp; s++) {
                headers.push({
                    len: dv.getUint32(p, true),
                    loopStart: dv.getUint32(p + 4, true),
                    loopLen: dv.getUint32(p + 8, true),
                    vol: dv.getUint8(p + 12),
                    fine: dv.getInt8(p + 13),
                    type: dv.getUint8(p + 14),
                    pan: dv.getUint8(p + 15),
                    rel: dv.getInt8(p + 16)
                });
                p += headSize;
            }

            for (let s = 0; s < numSamp; s++) {
                const h = headers[s];
                const is16 = (h.type & 16) !== 0;
                const count = is16 ? Math.floor(h.len / 2) : h.len;
                const data = new Float32Array(count);
                let old = 0;

                for (let k = 0; k < count; k++) {
                    let val = 0;
                    if (is16) {
                        val = dv.getInt16(p, true);
                        p += 2;
                        old += val;
                        if (old > 32767) {
                            old -= 65536;
                        }
                        if (old < -32768) {
                            old += 65536;
                        }
                        data[k] = old / 32768.0;
                    } else {
                        val = dv.getInt8(p);
                        p++;
                        old += val;
                        if (old > 127) {
                            old -= 256;
                        }
                        if (old < -128) {
                            old += 256;
                        }
                        data[k] = old / 128.0;
                    }
                }

                let ls = is16 ? h.loopStart / 2 : h.loopStart;
                let ll = is16 ? h.loopLen / 2 : h.loopLen;
                if (ls > count) {
                    ls = 0;
                }
                if (ls + ll > count) {
                    ll = count - ls;
                }

                inst.samples.push({
                    data: data,
                    length: count,
                    loopType: h.type & 3,
                    loopStart: ls,
                    loopEnd: ls + ll,
                    loopLength: ll,
                    volume: h.vol,
                    fineTune: h.fine,
                    relativeNote: h.rel,
                    pan: h.pan
                });
            }
        } else {
            p += size;
        }
        instruments.push(inst);
    }

    return { songName: songName, channelsNum: chNum, patterns: patterns, instruments: instruments, orders: orders, defaultSpeed: defSpd, defaultBPM: defBPM, songLength: songLen, restartPos: restart };
}

export class XmPlayer {
    private ctx: AudioContext | null = null;
    // noinspection JSDeprecatedSymbols
    private node: ScriptProcessorNode | null = null;
    public xm: XmSong | null = null;
    public playing: boolean = false;
    public loop: boolean = true;
    public channels: ChannelState[] = [];
    private sineTable: Float32Array;

    public state = {
        row: 0, orderIdx: 0, tick: 0, speed: 6, bpm: 125, globalVol: 64,
        samplesPerTick: 0, sampleCounter: 0,
        nextRow: -1, nextOrder: -1, breakPattern: false,
        patLoopRow: 0, patLoopCount: 0, patDelay: 0
    };

    constructor() {
        this.sineTable = new Float32Array(32);
        for (let i = 0; i < 32; i++) {
            this.sineTable[i] = Math.sin(i * Math.PI * 2 / 64.0);
        }
        for (let i = 0; i < 32; i++) {
            this.channels.push(this.newChannel());
        }
    }

    private newChannel(): ChannelState {
        return {
            sample: null, samplePos: 0, playDir: 1,
            note: 0, period: 0, targetPeriod: 0, finalPeriod: 0,
            vol: 64, finalVol: 0, pan: 128, finalPan: 128,
            inst: null, volEnvPos: 0, panEnvPos: 0, fadeoutVol: 65536, keyOn: false,
            vibPos: 0, vibDepth: 0, vibSpeed: 0,
            tremPos: 0, tremDepth: 0, tremSpeed: 0,
            portaSpeed: 0, volSlide: 0,
            autoVibPos: 0, autoVibSweep: 0,
            memVolSlide: 0, memPorta: 0, memVib: 0, memSampleOffset: 0,
            noteCutTick: -1, keyOffTick: -1,
            vNote: "...", vInst: ".."
        };
    }

    public async load(buffer: ArrayBuffer): Promise<boolean> {
        try {
            this.stop();
            this.xm = parseXM(buffer);
            this.reset();
            return true;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("XM Load Error", e);
            return false;
        }
    }

    private reset() {
        if (!this.xm) {
            return;
        }
        const s = this.state;
        s.row = 0; s.orderIdx = 0; s.tick = 0;
        s.speed = this.xm.defaultSpeed; s.bpm = this.xm.defaultBPM;
        s.globalVol = 64;
        s.nextRow = -1; s.nextOrder = -1;
        s.patLoopRow = 0; s.patLoopCount = 0; s.patDelay = 0;
        this.updateTiming();
        this.cutAllNotes();
    }

    private updateTiming() {
        this.state.samplesPerTick = (SAMPLERATE * 2.5) / this.state.bpm;
    }

    private cutAllNotes() {
        for (let i = 0; i < 32; i++) {
            this.channels[i] = this.newChannel();
        }
    }

    public toggle() {
        if (this.playing) {
            this.stop();
        } else {
            this.play();
        }
    }

    public play() {
        if (this.playing || !this.xm) {
            return;
        }
        const AC = AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AC({ sampleRate: SAMPLERATE });
        this.ctx?.resume();

        // noinspection JSDeprecatedSymbols
        this.node = this.ctx!.createScriptProcessor(BUFFER_SIZE, 0, 2);
        // noinspection JSDeprecatedSymbols
        this.node.onaudioprocess = (e) => this.mix(e);
        this.node.connect(this.ctx!.destination);

        this.playing = true;
    }

    public stop() {
        if (!this.playing) {
            return;
        }
        if (this.node) {
            this.node.disconnect(); this.node = null;
        }
        if (this.ctx) {
            this.ctx.close(); this.ctx = null;
        }
        this.playing = false;
        this.cutAllNotes();
        this.reset();
    }

    private mix(e: AudioProcessingEvent) {
        const L = e.outputBuffer.getChannelData(0);
        const R = e.outputBuffer.getChannelData(1);
        const s = this.state;
        const chNum = this.xm!.channelsNum;

        for (let i = 0; i < L.length; i++) {
            if (s.sampleCounter <= 0) {
                this.processTick();
                s.sampleCounter = s.samplesPerTick;
            }
            s.sampleCounter--;

            let outL = 0.0, outR = 0.0;
            for (let c = 0; c < chNum; c++) {
                const ch = this.channels[c];
                if (!ch.sample || !ch.sample.data || ch.finalVol < (1.0 / 256.0)) {
                    continue;
                }

                const idx = Math.floor(ch.samplePos);
                if (idx < 0 || idx >= ch.sample.data.length) {
                    continue;
                }

                const s1 = ch.sample.data[idx];
                let s2 = s1;
                if (idx + 1 < ch.sample.data.length) {
                    s2 = ch.sample.data[idx + 1];
                } else if (ch.sample.loopType) {
                    s2 = ch.sample.data[ch.sample.loopStart];
                }

                const frac = ch.samplePos - idx;
                const smp = s1 + (s2 - s1) * frac;

                let p = ch.finalPan; if (p < 0) {
                    p = 0;
                } if (p > 255) {
                    p = 255;
                }
                const vL = Math.sqrt((255 - p) / 255.0);
                const vR = Math.sqrt(p / 255.0);

                outL += smp * ch.finalVol * vL * 0.25;
                outR += smp * ch.finalVol * vR * 0.25;

                const freq = 8363 * Math.pow(2, (4608 - ch.finalPeriod) / 768.0);
                const step = freq / SAMPLERATE;

                if (ch.playDir === 1) {
                    ch.samplePos += step;
                    if (ch.sample.loopType && ch.samplePos >= ch.sample.loopEnd) {
                        if (ch.sample.loopType === 2) {
                            ch.samplePos = ch.sample.loopEnd - (ch.samplePos - ch.sample.loopEnd);
                            ch.playDir = -1;
                        } else {
                            const len = ch.sample.loopLength;
                            if (len > 0) {
                                ch.samplePos = ch.sample.loopStart + (ch.samplePos - ch.sample.loopEnd) % len;
                            }
                        }
                    } else if (ch.samplePos >= ch.sample.length) {
                        ch.sample = null;
                    }
                } else {
                    ch.samplePos -= step;
                    if (ch.samplePos <= ch.sample.loopStart) {
                        ch.playDir = 1;
                        ch.samplePos = ch.sample.loopStart + (ch.sample.loopStart - ch.samplePos);
                    }
                }
            }
            L[i] = outL; R[i] = outR;
        }
    }

    private processTick() {
        const s = this.state;
        if (s.tick === 0) {
            this.processRow();
        } else {
            for (let i = 0; i < this.xm!.channelsNum; i++) {
                const ch = this.channels[i];

                ch.noteCutTick = -1;
                ch.keyOffTick = -1;

                const slot = this.getSlot(i);
                if (slot) {
                    this.runEffects(ch, slot);
                }
                if (ch.inst && ch.inst.vibDepth > 0) {
                    ch.autoVibPos = (ch.autoVibPos + ch.inst.vibRate) & 255;
                    if (ch.autoVibSweep < ch.inst.vibSweep) {
                        ch.autoVibSweep++;
                    }
                }
                if (ch.noteCutTick === s.tick) {
                    ch.finalVol = 0; ch.vol = 0; ch.fadeoutVol = 0; ch.keyOn = false;
                }
                if (ch.keyOffTick === s.tick) {
                    ch.keyOn = false;
                }
            }
        }

        for (let i = 0; i < this.xm!.channelsNum; i++) {
            const ch = this.channels[i];
            let envVol = 64;
            if (ch.inst && (ch.inst.volEnv.type & 1)) {
                envVol = this.getEnv(ch.inst.volEnv, ch, "volEnvPos");
            }

            let envPan = 32;
            if (ch.inst && (ch.inst.panEnv.type & 1)) {
                envPan = this.getEnv(ch.inst.panEnv, ch, "panEnvPos");
            }

            if (!ch.keyOn && ch.inst) {
                ch.fadeoutVol = Math.max(0, ch.fadeoutVol - ch.inst.fadeout);
            }

            let tremVol = 64;
            if (ch.tremDepth > 0) {
                tremVol = 64 + this.sineTable[ch.tremPos & 31] * (ch.tremDepth * 4) / 2;
            }

            ch.finalVol = (ch.vol / 64) * (s.globalVol / 64) * (ch.sample ? ch.sample.volume / 64 : 1) * (envVol / 64) * (ch.fadeoutVol / 65536) * (tremVol / 64);
            const pOff = (envPan - 32) * (128 - Math.abs(ch.pan - 128)) / 32;
            ch.finalPan = Math.max(0, Math.min(255, ch.pan + pOff));

            let p = ch.period;
            const slot = this.getSlot(i);
            if (slot && (slot.effT === 4 || slot.effT === 6 || (slot.vol >= 0xB0 && slot.vol <= 0xBF))) {
                p += this.sineTable[ch.vibPos & 31] * (ch.vibDepth * 4);
            }
            if (ch.inst && ch.inst.vibDepth > 0) {
                const sw = (ch.inst.vibSweep > 0) ? (ch.autoVibSweep / ch.inst.vibSweep) : 1.0;
                p -= Math.sin(ch.autoVibPos * Math.PI * 2 / 255.0) * (ch.inst.vibDepth * sw * 4);
            }

            if (slot && slot.effT === 0 && slot.effP) {
                const step = s.tick % 3;
                if (step === 1) {
                    p -= (slot.effP >> 4) * 64;
                }
                if (step === 2) {
                    p -= (slot.effP & 0xF) * 64;
                }
            }
            ch.finalPeriod = p;
        }

        s.tick++;
        if (s.tick >= s.speed) {
            if (s.patDelay > 0) {
                s.patDelay--;
                s.tick = 0;
            } else {
                s.tick = 0;
                this.advanceRow();
            }
        }
    }

    private advanceRow() {
        const s = this.state;
        if (s.nextOrder !== -1) {
            if (s.nextOrder === s.orderIdx && s.nextOrder >= this.xm!.songLength - 1) {
                this.handleEnd(); return;
            }
            s.orderIdx = s.nextOrder;
            s.row = (s.nextRow !== -1) ? s.nextRow : 0;
            s.nextOrder = -1; s.nextRow = -1;
        } else if (s.nextRow !== -1) {
            if (s.breakPattern) {
                s.orderIdx++; s.row = s.nextRow;
            } else {
                s.row = s.nextRow;
            }
            s.nextRow = -1; s.breakPattern = false;
        } else {
            s.row++;
        }

        if (s.orderIdx >= this.xm!.songLength) {
            this.handleEnd(); return;
        }
        const pat = this.xm!.patterns[this.xm!.orders[s.orderIdx]];
        if (!pat || s.row >= pat.rows) {
            s.row = 0; s.orderIdx++;
            if (s.orderIdx >= this.xm!.songLength) {
                this.handleEnd(); return;
            }
        }
    }

    private handleEnd() {
        this.cutAllNotes();
        if (this.loop) {
            this.state.orderIdx = (this.xm!.restartPos >= this.xm!.songLength - 1) ? 0 : this.xm!.restartPos;
            this.state.row = 0;
        } else {
            this.stop();
        }
    }

    private getEnv(env: Envelope, ch: ChannelState, idxKey: "volEnvPos" | "panEnvPos"): number {
        const pts = env.points;
        const len = pts.length;
        if (len === 0) {
            return 0;
        }

        if (ch.keyOn && (env.type & 2) && env.sustain < len) {
            if (ch[idxKey] < pts[env.sustain][0]) {
                ch[idxKey]++;
            }
        } else if ((env.type & 4) && env.loopEnd < len && ch[idxKey] >= pts[env.loopEnd][0]) {
            ch[idxKey] = pts[env.loopStart][0];
        } else {
            if (ch[idxKey] < pts[len - 1][0]) {
                ch[idxKey]++;
            }
        }

        const x = ch[idxKey];
        for (let i = 0; i < len - 1; i++) {
            if (x >= pts[i][0] && x <= pts[i + 1][0]) {
                const x1 = pts[i][0], y1 = pts[i][1], x2 = pts[i + 1][0], y2 = pts[i + 1][1];
                return x2 === x1 ? y1 : y1 + (y2 - y1) * ((x - x1) / (x2 - x1));
            }
        }
        return pts[len - 1][1];
    }

    private processRow() {
        const s = this.state;
        const patIdx = this.xm!.orders[s.orderIdx];
        const pat = this.xm!.patterns[patIdx];
        if (!pat) {
            return;
        }
        const rowData = pat.data[s.row];

        for (let i = 0; i < this.xm!.channelsNum; i++) {
            const ch = this.channels[i];
            const slot = rowData[i];
            if (!slot) {
                continue;
            }

            if (slot.inst > 0) {
                const inst = this.xm!.instruments[slot.inst - 1];
                if (inst) {
                    ch.inst = inst;
                    ch.vol = inst.samples.length ? inst.samples[0].volume : 64;
                    ch.pan = inst.samples.length ? inst.samples[0].pan : 128;
                    ch.autoVibPos = 0; ch.autoVibSweep = 0;
                    ch.vInst = (slot.inst).toString(16).toUpperCase();
                }
            }

            const isPorta = (slot.effT === 3) || (slot.effT === 5) || (slot.vol >= 0xF0 && slot.vol <= 0xFF);
            if (slot.note > 0 && slot.note < 97) {
                const note0 = slot.note - 1;
                let samp = null;
                if (ch.inst && ch.inst.samples.length > 0) {
                    const sIdx = ch.inst.sampleMap[note0];
                    if (sIdx < ch.inst.samples.length) {
                        samp = ch.inst.samples[sIdx];
                    }
                }
                const per = 7680 - (note0 + (samp ? samp.relativeNote : 0)) * 64 - (samp ? samp.fineTune : 0) / 2;

                if (isPorta) {
                    ch.targetPeriod = per;
                    if (!ch.sample) {
                        ch.sample = samp; ch.period = per; ch.samplePos = 0; ch.playDir = 1;
                    }
                } else {
                    ch.sample = samp;

                    if (ch.sample) {
                        ch.vol = ch.sample.volume;
                    }

                    ch.period = per; ch.playDir = 1;
                    ch.keyOn = true;
                    if (slot.effT === 0x9) {
                        ch.samplePos = (slot.effP ? slot.effP : ch.memSampleOffset) * 256;
                        if (slot.effP) {
                            ch.memSampleOffset = slot.effP;
                        }
                    } else {
                        ch.samplePos = 0;
                    }
                    ch.volEnvPos = 0; ch.panEnvPos = 0; ch.fadeoutVol = 65536;
                    ch.autoVibPos = 0; ch.autoVibSweep = 0;
                    if (slot.effT !== 4 && slot.effT !== 6) {
                        ch.vibPos = 0;
                    }
                    if (slot.effT !== 7) {
                        ch.tremPos = 0;
                    }

                    const notes = ["C-", "C#", "D-", "D#", "E-", "F-", "F#", "G-", "G#", "A-", "A#", "B-"];
                    ch.vNote = notes[note0 % 12] + Math.floor(note0 / 12);
                }
            } else if (slot.note === 97) {
                ch.keyOn = false; ch.vNote = "OFF";
            }

            if (slot.vol >= 0x10 && slot.vol <= 0x50) {
                ch.vol = slot.vol - 0x10;
            }
            if (slot.vol >= 0x60 && slot.vol <= 0x6F) {
                ch.vol = Math.max(0, ch.vol - (slot.vol & 0xF));
            }
            if (slot.vol >= 0x70 && slot.vol <= 0x7F) {
                ch.vol = Math.min(64, ch.vol + (slot.vol & 0xF));
            }
            if (slot.vol >= 0x80 && slot.vol <= 0x8F) {
                ch.vol = Math.max(0, ch.vol - (slot.vol & 0xF));
            }
            if (slot.vol >= 0x90 && slot.vol <= 0x9F) {
                ch.vol = Math.min(64, ch.vol + (slot.vol & 0xF));
            }
            if (slot.vol >= 0xC0 && slot.vol <= 0xCF) {
                ch.pan = (slot.vol & 0xF) * 17;
            }
            if (slot.vol >= 0xF0 && slot.vol <= 0xFF) {
                if (slot.vol & 0xF) {
                    ch.portaSpeed = (slot.vol & 0xF) * 16;
                }
            }

            switch (slot.effT) {
                case 0x1: if (slot.effP) {
                    ch.memPorta = slot.effP;
                } break;
                case 0x2: if (slot.effP) {
                    ch.memPorta = slot.effP;
                } break;
                case 0x3: if (slot.effP) {
                    ch.portaSpeed = slot.effP;
                } break;
                case 0x4: if (slot.effP & 0xF) {
                    ch.vibDepth = slot.effP & 0xF;
                } if (slot.effP >> 4) {
                        ch.vibSpeed = slot.effP >> 4;
                    } break;
                case 0x7: if (slot.effP & 0xF) {
                    ch.tremDepth = slot.effP & 0xF;
                } if (slot.effP >> 4) {
                        ch.tremSpeed = slot.effP >> 4;
                    } break;
                case 0x8: ch.pan = slot.effP; break;
                case 0xA: if (slot.effP) {
                    ch.memVolSlide = slot.effP;
                } break;
                case 0xB: s.nextOrder = slot.effP; s.nextRow = 0; break;
                case 0xC: ch.vol = Math.min(64, slot.effP); break;
                case 0xD: s.nextRow = (slot.effP >> 4) * 10 + (slot.effP & 0xF); s.breakPattern = true; break;
                case 0xF: if (slot.effP < 32) {
                    s.speed = slot.effP;
                } else {
                    s.bpm = slot.effP; this.updateTiming();
                } break;
                case 0x10: s.globalVol = Math.min(64, slot.effP); break;
                case 0x14: ch.keyOffTick = slot.effP; if (ch.keyOffTick === 0) {
                    ch.keyOn = false;
                } break;
                case 0x15: ch.volEnvPos = slot.effP; ch.panEnvPos = slot.effP; break;
            }

            if (slot.effT === 0xE) {
                const cmd = slot.effP >> 4;
                const param = slot.effP & 0xF;
                if (cmd === 0x1) {
                    ch.period = Math.max(0, ch.period - param * 4);
                }
                if (cmd === 0x2) {
                    ch.period += param * 4;
                }
                if (cmd === 0x6) {
                    if (param === 0) {
                        s.patLoopRow = s.row;
                    } else {
                        if (s.patLoopCount === 0) {
                            s.patLoopCount = param; s.nextRow = s.patLoopRow; s.breakPattern = false;
                        } else {
                            s.patLoopCount--; if (s.patLoopCount > 0) {
                                s.nextRow = s.patLoopRow; s.breakPattern = false;
                            }
                        }
                    }
                }
                if (cmd === 0xA) {
                    ch.vol = Math.min(64, ch.vol + param);
                }
                if (cmd === 0xB) {
                    ch.vol = Math.max(0, ch.vol - param);
                }
                if (cmd === 0xC) {
                    ch.noteCutTick = param; if (ch.noteCutTick === 0) {
                        ch.vol = 0; ch.finalVol = 0;
                    }
                }
                if (cmd === 0xE) {
                    s.patDelay = param;
                }
            }
        }
    }

    private runEffects(ch: ChannelState, slot: Note) {
        if (slot.effT === 0xA) {
            const val = slot.effP ? slot.effP : ch.memVolSlide;
            const u = val >> 4, d = val & 0xF;
            if (u) {
                ch.vol += u;
            } else {
                ch.vol -= d;
            }
            if (ch.vol > 64) {
                ch.vol = 64;
            } if (ch.vol < 0) {
                ch.vol = 0;
            }
        }
        if (slot.effT === 1) {
            const p = slot.effP ? slot.effP : ch.memPorta;
            ch.period = Math.max(1, ch.period - p * 4);
        }
        if (slot.effT === 2) {
            const p = slot.effP ? slot.effP : ch.memPorta;
            ch.period += p * 4;
        }
        if (slot.effT === 3 || (slot.vol >= 0xF0 && slot.vol <= 0xFF && (slot.vol & 0xF) === 0)) {
            if (ch.targetPeriod) {
                if (ch.period < ch.targetPeriod) {
                    ch.period = Math.min(ch.targetPeriod, ch.period + ch.portaSpeed * 4);
                } else if (ch.period > ch.targetPeriod) {
                    ch.period = Math.max(ch.targetPeriod, ch.period - ch.portaSpeed * 4);
                }
            }
        }
        if (slot.effT === 4 || (slot.vol >= 0xB0 && slot.vol <= 0xBF)) {
            ch.vibPos = (ch.vibPos + ch.vibSpeed) & 63;
        }
        if (slot.effT === 5) {
            if (ch.targetPeriod) {
                if (ch.period < ch.targetPeriod) {
                    ch.period = Math.min(ch.targetPeriod, ch.period + ch.portaSpeed * 4);
                } else if (ch.period > ch.targetPeriod) {
                    ch.period = Math.max(ch.targetPeriod, ch.period - ch.portaSpeed * 4);
                }
            }
            const val = slot.effP ? slot.effP : ch.memVolSlide;
            const u = val >> 4, d = val & 0xF;
            if (u) {
                ch.vol += u;
            } else {
                ch.vol -= d;
            }
            if (ch.vol > 64) {
                ch.vol = 64;
            } if (ch.vol < 0) {
                ch.vol = 0;
            }
        }
        if (slot.effT === 6) {
            ch.vibPos = (ch.vibPos + ch.vibSpeed) & 63;
            const val = slot.effP ? slot.effP : ch.memVolSlide;
            const u = val >> 4, d = val & 0xF;
            if (u) {
                ch.vol += u;
            } else {
                ch.vol -= d;
            }
            if (ch.vol > 64) {
                ch.vol = 64;
            } if (ch.vol < 0) {
                ch.vol = 0;
            }
        }
        if (slot.effT === 7) {
            ch.tremPos = (ch.tremPos + ch.tremSpeed) & 63;
        }
        if (slot.effT === 17 && slot.effP) {
            const u = slot.effP >> 4, d = slot.effP & 0xF;
            if (u) {
                this.state.globalVol += u;
            } else {
                this.state.globalVol -= d;
            }
            if (this.state.globalVol > 64) {
                this.state.globalVol = 64;
            }
            if (this.state.globalVol < 0) {
                this.state.globalVol = 0;
            }
        }
        if (slot.effT === 0xE && (slot.effP >> 4) === 0x9) {
            const interval = slot.effP & 0xF;
            if (interval > 0 && (this.state.tick % interval) === 0) {
                ch.samplePos = 0;
                ch.volEnvPos = 0; ch.panEnvPos = 0;
            }
        }
        if (slot.effT === 0xE && (slot.effP >> 4) === 0xC) {
            if (this.state.tick === (slot.effP & 0xF)) {
                ch.vol = 0;
            }
        }
    }

    private getSlot(chIdx: number): Note | null {
        const pat = this.xm!.patterns[this.xm!.orders[this.state.orderIdx]];
        return pat ? pat.data[this.state.row][chIdx] : null;
    }
}
