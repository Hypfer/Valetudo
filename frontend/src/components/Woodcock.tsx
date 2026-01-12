import React, { useState, useRef, useCallback, useEffect } from "react";

const DURATION = 0.277;

const LPC_COEFFS = [
    1.0, -3.0394, 5.1791, -6.4772, 7.5411, -7.8998,
    7.2166, -5.6645, 4.2915, -3.0583, 1.8871, -0.8014, 0.2003
];

const PITCH_ENV = [
    { t: 0.053, v: 183.93 }, { t: 0.064, v: 184.99 }, { t: 0.074, v: 184.99 },
    { t: 0.085, v: 186.06 }, { t: 0.096, v: 186.06 }, { t: 0.106, v: 186.06 },
    { t: 0.117, v: 184.99 }, { t: 0.128, v: 184.99 }, { t: 0.138, v: 183.93 },
    { t: 0.149, v: 183.93 }, { t: 0.160, v: 183.93 }, { t: 0.170, v: 183.93 },
    { t: 0.181, v: 182.87 }, { t: 0.192, v: 182.87 }, { t: 0.202, v: 181.81 },
    { t: 0.213, v: 180.77 }, { t: 0.224, v: 180.77 }, { t: 0.234, v: 179.73 },
    { t: 0.245, v: 179.73 }, { t: 0.256, v: 174.61 }
];

const AMP_ENV = [
    { t: 0.000, v: 0.112 }, { t: 0.010, v: 0.430 }, { t: 0.021, v: 0.757 },
    { t: 0.032, v: 0.972 }, { t: 0.042, v: 1.000 }, { t: 0.053, v: 0.963 },
    { t: 0.064, v: 0.972 }, { t: 0.074, v: 0.953 }, { t: 0.085, v: 0.916 },
    { t: 0.096, v: 0.869 }, { t: 0.106, v: 0.832 }, { t: 0.117, v: 0.794 },
    { t: 0.128, v: 0.757 }, { t: 0.138, v: 0.729 }, { t: 0.149, v: 0.729 },
    { t: 0.160, v: 0.738 }, { t: 0.170, v: 0.748 }, { t: 0.181, v: 0.766 },
    { t: 0.192, v: 0.813 }, { t: 0.202, v: 0.860 }, { t: 0.213, v: 0.916 },
    { t: 0.224, v: 0.953 }, { t: 0.234, v: 0.953 }, { t: 0.245, v: 0.729 },
    { t: 0.256, v: 0.308 }, { t: 0.266, v: 0.047 }, { t: 0.277, v: 0.000 }
];

class PeentEngine {
    private ctx: AudioContext | null = null;
    private mixNode: GainNode | null = null;
    private noiseBuffer: AudioBuffer | null = null;

    private get AudioContextClass(): typeof AudioContext | null {
        return AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext ||
            null;
    }

    public get isSupported(): boolean {
        return !!this.AudioContextClass;
    }

    private init() {
        const CtxClass = this.AudioContextClass;
        if (!CtxClass) {
            return;
        }

        if (!this.ctx || this.ctx.state === "closed") {
            this.ctx = new CtxClass({ latencyHint: "interactive" });
            this.createGraph();
        }

        if (this.ctx.state === "suspended") {
            void this.ctx.resume();
        }
    }

    private createGraph() {
        if (!this.ctx) {
            return;
        }

        const mix = this.ctx.createGain();
        const lpc = this.ctx.createIIRFilter([1], LPC_COEFFS);

        const eq = this.ctx.createBiquadFilter();
        eq.type = "highshelf";
        eq.frequency.value = 2500;
        eq.gain.value = 5;

        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.ratio.value = 12;

        const master = this.ctx.createGain();
        master.gain.value = 0.25;

        mix.connect(lpc);
        lpc.connect(eq);
        eq.connect(comp);
        comp.connect(master);
        master.connect(this.ctx.destination);

        this.mixNode = mix;

        const sampleRate = this.ctx.sampleRate;
        const bufferSize = sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);

        for (let c = 0; c < 2; c++) {
            const data = this.noiseBuffer.getChannelData(c);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
    }

    public play() {
        if (!this.isSupported) {
            return;
        }

        this.init();

        if (!this.ctx || !this.mixNode || !this.noiseBuffer) {
            return;
        }

        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(PITCH_ENV[0].v, t);

        PITCH_ENV.forEach((p) => {
            osc.frequency.linearRampToValueAtTime(p.v, t + p.t);
        });

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        noise.loop = true;

        const oscEnv = this.ctx.createGain();
        const noiseEnv = this.ctx.createGain();

        oscEnv.gain.setValueAtTime(0, t);
        noiseEnv.gain.setValueAtTime(0, t);

        AMP_ENV.forEach((p) => {
            oscEnv.gain.linearRampToValueAtTime(p.v * 0.85, t + p.t);
            noiseEnv.gain.linearRampToValueAtTime(p.v * 0.15, t + p.t);
        });

        osc.connect(oscEnv);
        oscEnv.connect(this.mixNode);

        noise.connect(noiseEnv);
        noiseEnv.connect(this.mixNode);

        osc.start(t);
        noise.start(t);

        const stopTime = t + DURATION + 0.1;
        osc.stop(stopTime);
        noise.stop(stopTime);

        osc.onended = () => {
            osc.disconnect();
            noise.disconnect();
            oscEnv.disconnect();
            noiseEnv.disconnect();
        };
    }

    public dispose() {
        if (this.ctx) {
            this.ctx.close().catch((e) => {
                // eslint-disable-next-line no-console
                console.error("Error closing AudioContext", e);
            });

            this.ctx = null;
        }

        this.mixNode = null;
        this.noiseBuffer = null;
    }
}

const AudioManager = {
    instance: null as PeentEngine | null,
    listeners: 0,

    acquire: function(): PeentEngine {
        if (!this.instance) {
            this.instance = new PeentEngine();
        }

        this.listeners++;

        return this.instance;
    },

    release: function() {
        this.listeners--;

        if (this.listeners <= 0) {
            if (this.instance) {
                this.instance.dispose();
                this.instance = null;
            }

            this.listeners = 0;
        }
    }
};

interface WoodcockProps {
    facing?: "left" | "right";
}

const Woodcock: React.FC<WoodcockProps> = ({ facing = "right" }) => {
    const [active, setActive] = useState(false);
    const timer = useRef<NodeJS.Timeout | null>(null);

    const engineRef = useRef<PeentEngine | null>(null);

    useEffect(() => {
        engineRef.current = AudioManager.acquire();

        trigger();

        return () => {
            AudioManager.release();
            engineRef.current = null;

            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const trigger = useCallback((e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setActive(true);
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
            setActive(false);
        }, 150);

        engineRef.current?.play();
    }, []);

    const isFlipped = facing === "left";
    const transformScale = isFlipped ? "scaleX(-1)" : "scaleX(1)";
    const transformActive = active ? "scale(1.02) rotate(-1deg)" : "scale(1) rotate(0deg)";
    const transformStyle = `${transformScale} ${transformActive}`;

    return (
        <span
            onClick={trigger}
            style={{
                display: "inline-block",
                height: "2em",
                width: "3.65em",
                verticalAlign: "middle",
                margin: "0 0.1em",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)",
                transformOrigin: "50% 80%",
                transform: transformStyle,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none"
            }}
        >
            <svg
                viewBox="0 0 135.09 74.134"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
            >
                <path
                    d="m73.586 33.634 55 20q6 2 6 8t-6 4l-55-7q-15 15-35 15c-30 0-45-30-35-60 10-20 45-20 70 20z"
                    fill="#fff"
                    stroke="#fff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="14"
                />
                <path
                    d="m73.586 33.634 55 20q6 2 6 8t-6 4l-55-7q-15 15-35 15c-30 0-45-30-35-60 10-20 45-20 70 20z"
                    fill="#c19a6b"
                />
                <path
                    d="m73.586 33.634 55 20q6 2 6 8t-6 4l-55-7z"
                    fill="#e09e86"
                />
                <path
                    d="m73.586 45.634 55 14q6 4 0 6l-55-7z"
                    fill="#bf7e68"
                />
                <g
                    transform="translate(-31.414 -46.366)"
                    fill="none"
                    stroke="#3e2723"
                    strokeLinecap="round"
                    strokeWidth="5"
                >
                    <path d="m45 55q20-5 40 5"/>
                    <path d="m40 75q20-5 40 5"/>
                    <path d="m45 95q20-5 35 5"/>
                </g>
                <ellipse
                    transform="rotate(-20)"
                    cx="18.347"
                    cy="47.791"
                    rx="10"
                    ry="12"
                    fill="#8b5a2b"
                    opacity="0.2"
                />
                <g transform="translate(-31.414 -46.366)">
                    <circle cx="85" cy="76" r="9" opacity="0.2"/>
                    <circle cx="85" cy="75" r="9" fill="#1a1a1a"/>
                    <circle cx="88" cy="72" r="3" fill="#fff"/>
                </g>
            </svg>
        </span>
    );
};

export default Woodcock;
