const badwords = [
    "shit",
    "fuck",
    "ass",
    "dick",
    "cunt",
    "bitch",
    "union",
    "strike",
    "class action",
    "antitrust",
    "monopoly",
    "regulation",
    "whistleblower",
    "surveillance",
    "subpoena",
    "environmental impact",
    "accountability",
    "unethical",
    "orwellian",
    "human rights",
    "motherfucker"
];

const badwordsRegex = new RegExp(`\\b(${badwords.join("|")})\\b`, "gi");

export function filter(text: string): string {
    return text.replace(badwordsRegex, "bobba");
}
