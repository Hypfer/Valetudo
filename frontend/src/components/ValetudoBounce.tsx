import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Box } from "@mui/material";
import { ReactComponent as SplashLogo } from "../assets/icons/valetudo_splash.svg";

type Size = { width: number; height: number };

const ValetudoBounce = ({ onClose }: { onClose: () => void }): React.ReactElement => {
    const logoRef = useRef<HTMLDivElement>(null);
    const position = useRef({ x: 0, y: 0 });
    const velocity = useRef({ dx: 0, dy: 0 });
    const logoSize = useRef<Size>({ width: 0, height: 0 });
    const lastFrameTime = useRef<number | null>(null);
    const animationFrameId = useRef<number | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (!logoRef.current) {
            return;
        }

        const rect = logoRef.current.getBoundingClientRect();
        logoSize.current = { width: rect.width, height: rect.height };

        position.current = {
            x: Math.random() * (window.innerWidth - logoSize.current.width),
            y: Math.random() * (window.innerHeight - logoSize.current.height),
        };

        const calculateAndSetVelocity = () => {
            const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
            const travelTime = 12_000;
            const speed = diagonal / travelTime;

            const currentMagnitude = Math.sqrt(velocity.current.dx ** 2 + velocity.current.dy ** 2);
            if (currentMagnitude > 0 && speed > 0) {
                velocity.current.dx = (velocity.current.dx / currentMagnitude) * speed;
                velocity.current.dy = (velocity.current.dy / currentMagnitude) * speed;
            } else {
                const angle = Math.random() * 2 * Math.PI;
                velocity.current = {
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                };
            }
        };

        calculateAndSetVelocity();
        setIsInitialized(true);

        const animate = (currentTime: number) => {
            if (!logoRef.current) {
                return;
            }

            if (lastFrameTime.current === null) {
                lastFrameTime.current = currentTime;
                animationFrameId.current = requestAnimationFrame(animate);
                return;
            }

            const deltaTime = currentTime - lastFrameTime.current;
            lastFrameTime.current = currentTime;

            position.current.x += velocity.current.dx * deltaTime;
            position.current.y += velocity.current.dy * deltaTime;

            if (position.current.x <= 0) {
                velocity.current.dx *= -1;
                position.current.x = 0;
            } else if (position.current.x + logoSize.current.width >= window.innerWidth) {
                velocity.current.dx *= -1;
                position.current.x = window.innerWidth - logoSize.current.width;
            }

            if (position.current.y <= 0) {
                velocity.current.dy *= -1;
                position.current.y = 0;
            } else if (position.current.y + logoSize.current.height >= window.innerHeight) {
                velocity.current.dy *= -1;
                position.current.y = window.innerHeight - logoSize.current.height;
            }

            logoRef.current.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
            animationFrameId.current = requestAnimationFrame(animate);
        };
        animationFrameId.current = requestAnimationFrame(animate);

        let debounceTimer: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (logoRef.current) {
                    const newRect = logoRef.current.getBoundingClientRect();
                    logoSize.current = { width: newRect.width, height: newRect.height };

                    calculateAndSetVelocity();

                    position.current.x = Math.max(0, Math.min(position.current.x, window.innerWidth - logoSize.current.width));
                    position.current.y = Math.max(0, Math.min(position.current.y, window.innerHeight - logoSize.current.height));

                    lastFrameTime.current = null;
                }
            }, 100);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener("resize", handleResize);
            clearTimeout(debounceTimer);
        };
    }, []);

    return createPortal(
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                bgcolor: "black",
                zIndex: 1500,
                overflow: "hidden",
                cursor: "pointer",
            }}
            onClick={onClose}
        >
            <Box
                ref={logoRef}
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "20vmin",
                    minWidth: "120px",
                    maxWidth: "350px",
                    color: "white",
                    visibility: isInitialized ? "visible" : "hidden",
                    "& svg": {
                        display: "block",
                        width: "100%",
                        height: "auto",
                    },
                }}
            >
                <SplashLogo />
            </Box>
        </Box>,
        document.body
    );
};

export default ValetudoBounce;
