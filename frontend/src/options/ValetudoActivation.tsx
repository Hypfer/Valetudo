import React, {useEffect, useRef, useState} from "react";
import {
    alpha,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    LinearProgress,
    TextField,
    Typography,
    useTheme
} from "@mui/material";
import {
    Business,
    CloudOff,
    CloudSync,
    ExitToApp,
    GppBad as UnverifiedIcon,
    MusicNote,
    MusicOff,
    Phone,
    Terminal,
    VerifiedUser as VerifiedIcon,
    VpnKey
} from "@mui/icons-material";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {useLocalStorage} from "../hooks";
import {XmPlayer} from "../util/XmPlayer";
import {useValetudoColorsInverse} from "../hooks/useValetudoColors";
import {lightPalette} from "../colors";

import keygenMusicUrl from "../assets/raw/keygen.xm.gz";
import robotJsonUrl from "../assets/raw/robot.json.gz";

const VALID_KEYS = [
    "00000-00000-00000-00000-00000",
    "FCKGW-RHQQ2-YXRKT-8TG6W-2B7Q8",
    "J3QQ4-H7H2V-2HCH4-M3HK8-6M8VW",
];

interface Point3D { x: number; y: number; z: number; }
interface Edge { a: number; b: number; }
interface Mesh { vertices: Point3D[]; edges: Edge[]; }

interface OptimizedMesh {
    v: number[];
    e: number[];
}

interface Assets {
    audioBuffer: ArrayBuffer;
    mesh: Mesh;
}

const fetchAndDecompress = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
    }
    if (!response.body) {
        throw new Error("No body");
    }
    const ds = new DecompressionStream("gzip");
    const decompressedStream = response.body.pipeThrough(ds);
    return await new Response(decompressedStream).arrayBuffer();
};

const KeygenOverlay = ({ onComplete, isReplay, assets }: { onComplete: () => void, isReplay: boolean, assets: Assets }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const playerRef = useRef<XmPlayer | null>(null);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const valetudoColors = lightPalette;

    const [cracked, setCracked] = useState(isReplay);
    const crackedRef = useRef(isReplay);

    useEffect(() => {
        const player = new XmPlayer();
        playerRef.current = player;

        const initAudio = async () => {
            try {
                const audioSuccess = await player.load(assets.audioBuffer);
                if (audioSuccess && musicEnabled) {
                    player.play();
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn("Audio init failed", e);
            }
        };

        initAudio();

        return () => {
            player.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (playerRef.current && playerRef.current.xm) {
            if (musicEnabled) {
                playerRef.current.play();
            } else {
                playerRef.current.stop();
            }
        }
    }, [musicEnabled]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        const tinyFontSize = 24;
        const offCanvas = document.createElement("canvas");
        offCanvas.width = tinyFontSize * 2;
        offCanvas.height = tinyFontSize * 2;
        const offCtx = offCanvas.getContext("2d", { alpha: true });

        let animId = 0;
        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            ctx.imageSmoothingEnabled = false;
        };
        window.addEventListener("resize", resize);
        resize();

        const rotate = (p: Point3D, pitch: number, yaw: number) => {
            const x = p.x, y = p.y, z = p.z;
            const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
            const z1 = z * Math.cos(yaw) + x * Math.sin(yaw);
            const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
            const z2 = z1 * Math.cos(pitch) + y * Math.sin(pitch);
            return {x: x1, y: y2, z: z2};
        };

        const stars = Array.from({length: 400}, () => ({
            x: (Math.random() - 0.5) * width * 1.5,
            y: (Math.random() - 0.5) * height * 1.5,
            z: Math.random() * width
        }));

        let scrollX = width;
        let currentKey = "INITIALIZING...";
        let lastKeyUpdate = 0;
        let progress = isReplay ? 100 : 0;

        let lastTime = performance.now();
        const startTime = lastTime;

        const scrollText = " *** PROUDLY PRESENTING >> VALETUDO << ON APRIL FIRST! +++ MORE THAN SEVEN YEARS OF CLOUD FREE VACUUM ROBOTS +++ GREETINGS TO YOU AND OTHER PEOPLE I GUESS +++ I REALLY DO NOT KNOW WHAT TO PUT HERE ... I AM JUST COPYING THIS AESTHETIC WITHOUT HAVING DEEPER TIES TO OR UNDERSTANDING OF IT!!! THIS IS ESSENTIALLY JUST POSING +++ SONG: REZ - UNREEEAL SUPERHERO 2 (CC-BY-NC-SA, APPARENTLY) ***";
        const randomBlock = () => Math.random().toString(36).substring(2, 7).toUpperCase();

        const draw = () => {
            const now = performance.now();
            const dt = (now - lastTime) / 1000;
            const time = (now - startTime) / 1000;
            lastTime = now;

            const isCracked = crackedRef.current;

            ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
            ctx.fillRect(0, 0, width, height);
            ctx.imageSmoothingEnabled = false;

            const isSmallScreen = width < 600;
            const cx = width / 2;
            const cy = height / 2;

            ctx.fillStyle = "#FFF";
            stars.forEach(star => {
                const speed = isCracked ? 900 : 480;
                star.z -= speed * dt;

                if (star.z <= 0) {
                    star.z = width + Math.random() * 200;
                    star.x = (Math.random() - 0.5) * width * 1.5;
                    star.y = (Math.random() - 0.5) * height * 1.5;
                }
                const k = 256 / star.z;
                const px = star.x * k + cx;
                const py = star.y * k + cy;

                if (px >= 0 && px <= width && py >= 0 && py <= height) {
                    const size = (1 - star.z / width) * 3;
                    ctx.fillRect(px, py, Math.max(1, size), Math.max(1, size));
                }
            });

            ctx.lineWidth = 2;
            const topWaveBase = 50;
            const botWaveBase = height - 120;

            for (let i = 0; i < width; i+=10) {
                ctx.strokeStyle = `hsl(${(time * 60 + i) % 360}, 70%, 50%)`;
                const y1 = topWaveBase + Math.sin(i * 0.02 + time * 4) * 20;
                ctx.beginPath(); ctx.moveTo(i, topWaveBase); ctx.lineTo(i, y1); ctx.stroke();
                const y2 = botWaveBase + Math.sin(i * 0.03 - time * 4) * 20;
                ctx.beginPath(); ctx.moveTo(i, botWaveBase); ctx.lineTo(i, y2); ctx.stroke();
            }

            const titleText = "VALETUDO";
            const targetHeight = Math.max(30, Math.min(height * 0.08, width * 0.12));
            const pixelScale = Math.floor(targetHeight / tinyFontSize);
            const actualScale = Math.max(2, pixelScale);
            const titleY = topWaveBase + 50 + ((tinyFontSize * actualScale) / 2);

            if (offCtx) {
                offCtx.font = `900 ${tinyFontSize}px monospace`;
                offCtx.textBaseline = "top";
                offCtx.textAlign = "left";
                const charWidth = offCtx.measureText("A").width;
                offCanvas.width = Math.ceil(charWidth);
                offCanvas.height = Math.ceil(tinyFontSize * 1.2);
                offCtx.font = `900 ${tinyFontSize}px monospace`;
                offCtx.textBaseline = "top";
                offCtx.textAlign = "left";

                const totalWidthScreen = charWidth * actualScale * titleText.length;
                const startX = cx - (totalWidthScreen / 2);

                titleText.split("").forEach((char, i) => {
                    offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                    const hue = (time * 120 + i * 30) % 360;
                    offCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                    offCtx.fillText(char, 0, 0);

                    const yOffset = Math.sin((time * 7) + (i * 0.5)) * (isSmallScreen ? 10 : 20);
                    const destX = startX + (i * charWidth * actualScale);
                    const destY = titleY + yOffset - ((tinyFontSize * actualScale) / 2);
                    const destW = charWidth * actualScale;
                    const destH = offCanvas.height * actualScale;

                    ctx.globalAlpha = 0.6;
                    ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height,
                        destX + actualScale, destY + actualScale, destW, destH);
                    ctx.globalAlpha = 1.0;
                    ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height,
                        destX, destY, destW, destH);
                });
            }

            const scrollerY = titleY + (tinyFontSize * actualScale) + 30;
            ctx.font = `${Math.max(14, width/40)}px monospace`;
            ctx.fillStyle = valetudoColors.lightBlue;
            ctx.textAlign = "left";
            ctx.fillText(scrollText, scrollX, scrollerY);

            const scrollSpeed = isSmallScreen ? 140 : 210;
            scrollX -= scrollSpeed * dt;

            if (scrollX < -ctx.measureText(scrollText).width) {
                scrollX = width;
            }

            if (assets.mesh) {
                const yaw = time * 1.2;
                const pitch = -0.5 + Math.sin(time * 0.6) * 0.21;
                const renderScale = Math.min(width, height) / 2;

                ctx.lineWidth = 1;
                ctx.strokeStyle = `hsla(${time * 60 % 360}, 100%, 50%, 0.8)`;

                const projectedVerts = assets.mesh.vertices.map(v => {
                    const r = rotate(v, pitch, yaw);
                    const dist = 3.5;
                    const perspective = 1 / Math.max(0.1, dist - r.z);
                    return {
                        x: r.x * perspective * renderScale + cx,
                        y: r.y * perspective * renderScale + cy + (isSmallScreen ? 20 : 0)
                    };
                });

                ctx.beginPath();
                const edges = assets.mesh.edges;
                const len = edges.length;
                for (let i = 0; i < len; i++) {
                    const e = edges[i];
                    const v1 = projectedVerts[e.a];
                    const v2 = projectedVerts[e.b];

                    ctx.moveTo(v1.x, v1.y);
                    ctx.lineTo(v2.x, v2.y);
                }
                ctx.stroke();
            }

            const keySectionY = botWaveBase - 80;
            const keyFontSize = Math.max(14, Math.min(24, width / 20));
            const barWidth = Math.min(400, width * 0.8);
            ctx.textAlign = "center";

            if (!isCracked) {
                if (now - lastKeyUpdate > 60) {
                    currentKey = `${randomBlock()}-${randomBlock()}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
                    lastKeyUpdate = now;
                }

                const elapsedMs = now - startTime;
                progress = Math.min(100, (elapsedMs / 13700) * 100);

                if (progress >= 100) {
                    crackedRef.current = true;
                    setCracked(true);
                }

                ctx.font = `${keyFontSize}px monospace`;
                ctx.fillStyle = "#FFF";
                ctx.fillText(currentKey, cx, keySectionY);

                const barH = 15;
                const barY = keySectionY + 20;
                ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2;
                ctx.strokeRect(cx - barWidth/2, barY, barWidth, barH);
                ctx.fillStyle = valetudoColors.yellow;
                ctx.fillRect(cx - barWidth/2 + 2, barY + 2, ((barWidth - 4) * (progress/100)), barH - 4);
            } else {
                ctx.font = `${keyFontSize}px monospace`;
                ctx.fillStyle = valetudoColors.yellow;

                if (Math.floor(time / 0.33) % 2 === 0) {
                    ctx.fillStyle = "#0F0";
                    ctx.fillText(">>> LICENSE PATCHED <<<", cx, keySectionY);
                }
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animId);
        };
    }, [isReplay, assets.mesh, valetudoColors]);

    return (
        <div style={{
            position: "fixed", top: 0, left: 0,
            width: "100vw",
            height: "100dvh",
            zIndex: 99999, background: "#000", fontFamily: "monospace", overflow: "hidden"
        }}>
            <canvas ref={canvasRef} style={{display: "block"}}/>

            <div style={{
                position: "fixed",
                bottom: 20,
                right: 20,
                display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center",
                gap: "10px", zIndex: 100000, maxWidth: "100%", flexWrap: "wrap"
            }}>
                <Button
                    variant="contained"
                    onClick={() => setMusicEnabled(!musicEnabled)}
                    startIcon={musicEnabled ? <MusicNote /> : <MusicOff />}
                    sx={{
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        bgcolor: valetudoColors.purple,
                        "&:hover": { bgcolor: alpha(valetudoColors.purple, 0.8) }
                    }}
                >
                    MUTE
                </Button>

                {cracked && (
                    <Button
                        variant="contained"
                        onClick={onComplete}
                        startIcon={<ExitToApp />}
                        sx={{
                            fontFamily: "monospace", fontWeight: "bold",
                            background: valetudoColors.green, color: "#000",
                            "&:hover": { background: alpha(valetudoColors.green, 0.8) }
                        }}
                    >
                        EXIT
                    </Button>
                )}
            </div>
        </div>
    );
};

export const ActivationListMenuItem = (): React.ReactElement => {
    const [isActivated, setIsActivated] = useLocalStorage<boolean>("aprilfools-valetudo-activation", false);

    const [open, setOpen] = useState(false);
    const [keyInput, setKeyInput] = useState("");
    const [error, setError] = useState(false);

    const [cloudStatus, setCloudStatus] = useState<"idle" | "connecting" | "failed">("idle");
    const [assets, setAssets] = useState<Assets | null>(null);
    const [loadingAssets, setLoadingAssets] = useState(false);

    const [showKeygen, setShowKeygen] = useState(false);
    const [isReplay, setIsReplay] = useState(false);

    const theme = useTheme();
    const valetudoColors = useValetudoColorsInverse();

    const handleClose = () => {
        setOpen(false);
        setKeyInput("");
        setError(false);
        setCloudStatus("idle");
    };

    const handleKeygenExit = () => {
        setIsActivated(true);
        setShowKeygen(false);
        setIsReplay(false);
        setOpen(false);
    };

    const handleManualActivate = () => {
        if (VALID_KEYS.includes(keyInput.trim().toUpperCase())) {
            handleClose();
            setIsActivated(true);
        } else {
            setError(true);
        }
    };

    const loadAssets = async (): Promise<Assets> => {
        if (assets) {
            return assets;
        }

        const [audioBuffer, jsonBuffer] = await Promise.all([
            fetchAndDecompress(keygenMusicUrl),
            fetchAndDecompress(robotJsonUrl)
        ]);

        const textDecoder = new TextDecoder("utf-8");
        const jsonText = textDecoder.decode(jsonBuffer);
        const rawData: OptimizedMesh = JSON.parse(jsonText);

        const vertices: Point3D[] = [];
        for (let i = 0; i < rawData.v.length; i += 3) {
            vertices.push({
                x: rawData.v[i],
                y: rawData.v[i + 1],
                z: rawData.v[i + 2]
            });
        }

        const edges: Edge[] = [];
        for (let i = 0; i < rawData.e.length; i += 2) {
            edges.push({
                a: rawData.e[i],
                b: rawData.e[i + 1]
            });
        }

        const newAssets = { audioBuffer: audioBuffer, mesh: { vertices: vertices, edges: edges } };
        setAssets(newAssets);
        return newAssets;
    };

    const handleCloudSync = async () => {
        setCloudStatus("connecting");
        try {
            await loadAssets();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Asset pre-load failed", e);
        }
        setTimeout(() => {
            setCloudStatus("failed");
        }, 2500);
    };

    const handleBypass = async () => {
        setIsReplay(false);
        if (!assets) {
            setLoadingAssets(true);
            try {
                await loadAssets();
                setShowKeygen(true);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
            } finally {
                setLoadingAssets(false);
            }
        } else {
            setShowKeygen(true);
        }
    };

    const handleReplay = async () => {
        setIsReplay(true);
        if (!assets) {
            setLoadingAssets(true);
            try {
                await loadAssets();
                setShowKeygen(true);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
            } finally {
                setLoadingAssets(false);
            }
        } else {
            setShowKeygen(true);
        }
    };

    if (showKeygen && assets) {
        return <KeygenOverlay onComplete={handleKeygenExit} isReplay={isReplay} assets={assets} />;
    }

    return (
        <>
            <ButtonListMenuItem
                primaryLabel="Valetudo Activation"
                secondaryLabel={isActivated ? "Activated with a digital license" : "Valetudo is not activated"}
                icon={isActivated ? <VerifiedIcon sx={{color: valetudoColors.green}}/> : <UnverifiedIcon/>}
                buttonLabel={isActivated ? "Details" : "Activate"}
                action={() => setOpen(true)}
                actionLoading={false}
            />

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>
                    {isActivated ? "Valetudo Genuine Advantage" : "Activation Required"}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{display: "flex", flexDirection: "column", gap: 2, mt: 1}}>
                        {isActivated ? (
                            <>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1}}>
                                    <VerifiedIcon sx={{color: valetudoColors.green}} fontSize="large" />
                                    <Typography variant="h6">Licensed Product</Typography>
                                </Box>
                                <DialogContentText>
                                    Valetudo is activated with a digital license.
                                </DialogContentText>

                                <Box sx={{
                                    p: 2,
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                    borderRadius: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    color: theme.palette.text.primary,
                                    fontFamily: "monospace",
                                    boxShadow: 2
                                }}>
                                    <Box sx={{mb: 1}}>
                                        <Typography variant="caption" sx={{color: theme.palette.text.secondary, display: "block"}}>LICENSE TYPE</Typography>
                                        <Typography variant="body2" sx={{color: valetudoColors.lightBlue, fontWeight: "bold"}}>
                                            Unlimited Company License
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ mb: 1}} />

                                    <Box sx={{mb: 1}}>
                                        <Typography variant="caption" sx={{color: theme.palette.text.secondary, display: "block"}}>REGISTERED TO</Typography>
                                        <Typography variant="body2" sx={{color: valetudoColors.lightBlue}}>
                                            Hackerman
                                        </Typography>
                                    </Box>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Box>
                                    <DialogContentText sx={{ color: "text.primary", fontWeight: 500 }}>
                                        Your Evaluation License for Valetudo has expired.
                                    </DialogContentText>
                                    <DialogContentText sx={{ fontSize: "0.9rem", mt: 1 }}>
                                        Continued use of this software requires a valid <strong>Valetudo</strong> subscription.
                                    </DialogContentText>
                                </Box>

                                <Box sx={{
                                    p: 2,
                                    border: "1px solid",
                                    borderColor: cloudStatus === "failed" ? theme.palette.error.main : theme.palette.divider,
                                    borderRadius: 1,
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                    color: theme.palette.text.primary,
                                    boxShadow: 2
                                }}>
                                    <Typography variant="subtitle2" gutterBottom sx={{color: cloudStatus === "failed" ? theme.palette.error.main : valetudoColors.lightBlue, fontWeight: "bold", fontFamily: "monospace"}}>
                                        {">"} Cloud Activation
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{mb: 2, color: theme.palette.text.secondary, fontFamily: "monospace"}}>
                                        Automatically fetch a license from the Valetudo Licensing Server.<br/>
                                        Requires an active internet connection.
                                    </Typography>

                                    {cloudStatus === "idle" && (
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={<CloudSync />}
                                            onClick={handleCloudSync}
                                        >
                                            Activate Valetudo now
                                        </Button>
                                    )}
                                    {cloudStatus === "connecting" && (
                                        <Box sx={{ width: "100%" }}>
                                            <LinearProgress />
                                            <Typography variant="caption" align="center" display="block" sx={{mt: 1, color: theme.palette.text.secondary, fontFamily: "monospace"}}>
                                                Handshaking with licensing.valetudo.cloud...
                                            </Typography>
                                        </Box>
                                    )}
                                    {cloudStatus === "failed" && (
                                        <Box sx={{ textAlign: "center" }}>
                                            <CloudOff color="error" fontSize="large" />
                                            <Typography color="error" variant="body2" fontWeight="bold" sx={{fontFamily: "monospace", mt: 1}}>
                                                CONNECTION TIMED OUT (Error 000)
                                            </Typography>
                                            <Typography variant="caption" display="block" sx={{color: theme.palette.text.secondary, fontFamily: "monospace", mb: 2}}>
                                                The licensing server is unreachable.
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                color="inherit"
                                                size="small"
                                                startIcon={<Phone />}
                                                onClick={handleBypass}
                                                loading={loadingAssets}
                                                loadingPosition="start"
                                                sx={{
                                                    borderColor: theme.palette.divider,
                                                    color: theme.palette.text.primary,
                                                    textTransform: "none"
                                                }}
                                            >
                                                Activate by Phone
                                            </Button>
                                        </Box>
                                    )}
                                </Box>

                                <Typography variant="caption" align="center" sx={{ display: "block", my: 1, color: theme.palette.text.secondary }}>
                                    — OR —
                                </Typography>

                                <TextField
                                    id="license-key"
                                    label="Enter License Key"
                                    type="text"
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                                    value={keyInput}
                                    onChange={(e) => {
                                        setKeyInput(e.target.value);
                                        setError(false);
                                    }}
                                    error={error}
                                    helperText={error ? "Error: Invalid checksum or revoked key." : "If you have a license key, enter it here."}
                                    InputProps={{
                                        style: {fontFamily: "monospace"},
                                        endAdornment: <VpnKey color="action" />
                                    }}
                                />
                            </>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        {isActivated ? "Close" : "Cancel"}
                    </Button>

                    {!isActivated ? (
                        <Button
                            onClick={handleManualActivate}
                            disabled={keyInput.length < 5}
                            startIcon={<Business />}
                        >
                            Activate
                        </Button>
                    ) : (
                        <Button
                            onClick={handleReplay}
                            color="secondary"
                            startIcon={<Terminal />}
                            loading={loadingAssets}
                            loadingPosition="start"
                        >
                            View Keygen again
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
};
