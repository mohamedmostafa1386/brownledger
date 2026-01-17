import OpenAI from "openai";

// Lazy-loaded OpenAI client to avoid build-time errors when API key is not available
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    if (!_openai) {
        _openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-for-build",
        });
    }
    return _openai;
}
