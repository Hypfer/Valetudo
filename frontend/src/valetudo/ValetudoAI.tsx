import React, {useState, useEffect, useRef} from "react";
import {Box, Paper, TextField, IconButton, Typography, Avatar, CircularProgress} from "@mui/material";
import {
    SmartToy as AiIcon,
    AccountCircle as UserIcon,
    Send as SendIcon,
    Replay as ReplayIcon,
} from "@mui/icons-material";
import PaperContainer from "../components/PaperContainer";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";
import ElizaBot from "eliza-as-promised";
import ValetudoBounce from "../components/ValetudoBounce";
import {filter} from "./res/Badwords";

interface AiChatMessage {
    sender: "user" | "ai";
    text: string;
}

const ValetudoAI = (): React.ReactElement => {
    const [messages, setMessages] = useState<AiChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [elizaInstance, setElizaInstance] = useState<ElizaBot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [showEgg, setShowEgg] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const eliza = new ElizaBot();
        setElizaInstance(eliza);

        setTimeout(() => {
            setMessages([{ sender: "ai", text: eliza.getInitial() }]);
            setIsLoading(false);

            setTimeout(() => inputRef.current?.focus(), 0);
        }, 800);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleSend = async () => {
        const filteredInput = filter(inputValue);
        const trimmedInput = filteredInput.trim();

        if (trimmedInput.toLowerCase() === "movienight") {
            setShowEgg(true);

            setInputValue("");
            inputRef.current?.blur();

            return;
        }

        if (!trimmedInput || !elizaInstance || isLoading || isFinished) {
            return;
        }
        setTimeout(() => inputRef.current?.focus(), 0); // Keeps the soft keyboard visible on mobile

        const userMessage: AiChatMessage = { sender: "user", text: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            const response: ElizaBot.ElizaResponse = await elizaInstance.getResponse(inputValue.replace(/\n/g, " ").trim());
            const aiResponseText = response.reply || response.final || "I seem to be at a loss for words.";

            setTimeout(() => {
                const aiMessage: AiChatMessage = { sender: "ai", text: filter(aiResponseText) };
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);

                if (response.final) {
                    setIsFinished(true);
                } else {
                    setTimeout(() => inputRef.current?.focus(), 0);
                }
            }, Math.random() * 800 + 400);

        } catch (error) {
            const errorMessage: AiChatMessage = {
                sender: "ai",
                text: "I'm sorry, I'm afraid I can't do that."
            };
            setMessages(prev => [...prev, errorMessage]);

            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleReset = () => {
        if (!elizaInstance) {
            return;
        }

        setMessages([]);
        setIsLoading(true);
        setIsFinished(false);
        setInputValue("");
        elizaInstance.reset();

        setTimeout(() => {
            setMessages([{ sender: "ai", text: elizaInstance.getInitial() }]);
            setIsLoading(false);

            setTimeout(() => inputRef.current?.focus(), 0);
        }, 1000);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey && !isFinished) {
            event.preventDefault();

            handleSend().catch(e => {
                /* intentional */
            });
        }
    };

    return (
        <PaperContainer>
            <Box sx={{ display: "flex", flexDirection: "column", height: "70vh", maxHeight:"90%" }}>
                <DetailPageHeaderRow
                    title="AI Assistant"
                    icon={<AiIcon/>}
                />
                <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                    {messages.map((msg, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                                alignItems: "flex-end",
                                gap: 1,
                            }}
                        >
                            {msg.sender === "ai" && <Avatar sx={{ bgcolor: "secondary.main" }}><AiIcon /></Avatar>}
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 1.5,
                                    maxWidth: "70%",
                                    bgcolor: msg.sender === "user" ? "primary.main" : "background.paper",
                                    color: msg.sender === "user" ? "primary.contrastText" : "text.primary",
                                    borderRadius: msg.sender === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px"
                                }}
                            >
                                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                    {msg.text}
                                </Typography>
                            </Paper>
                            {msg.sender === "user" && <Avatar><UserIcon /></Avatar>}
                        </Box>
                    ))}
                    {isLoading && (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-end",
                                gap: 1,
                            }}
                        >
                            <Avatar sx={{ bgcolor: "secondary.main" }}><AiIcon /></Avatar>
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 1.5,
                                    maxWidth: "70%",
                                    bgcolor: "background.paper",
                                    color: "text.primary",
                                    borderRadius: "20px 20px 20px 5px",
                                }}
                            >
                                <Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    {messages.length === 0 ? "Initializing..." : "Thinking..."}
                                    <CircularProgress size={16} />
                                </Typography>
                            </Paper>
                        </Box>
                    )}

                    <div ref={messagesEndRef} />
                </Box>
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TextField
                            inputRef={inputRef}
                            fullWidth
                            variant="outlined"
                            placeholder={isFinished ? "Session ended. Start a new one?" : "Tell me about your problems..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isFinished}
                            multiline
                            maxRows={4}
                        />

                        <IconButton
                            color={isFinished ? "secondary" : "primary"}
                            onClick={isFinished ? handleReset : handleSend}
                            disabled={!isFinished && (isLoading || !inputValue.trim())}
                        >
                            {isFinished ? <ReplayIcon /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </Box>
            </Box>
            {showEgg && <ValetudoBounce onClose={() => setShowEgg(false)} />}
        </PaperContainer>
    );
};

export default ValetudoAI;
