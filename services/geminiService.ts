import { GoogleGenAI } from "@google/genai";
import { NovelaidToolsPluginSettings } from "../novelaidToolsSettings";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;
let pluginSettings: NovelaidToolsPluginSettings | null = null;

export const initializeGeminiAI = (apiKey: string, settings: NovelaidToolsPluginSettings): boolean => {
    if (!apiKey || apiKey.trim() === "") {
        //APIキーが設定されていない場合、環境変数からの取得を試みる。
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
    pluginSettings = settings;
    return true;
};

const checkApiKey = (): boolean => {
    if (!ai) {
        console.error(API_KEY_ERROR_MESSAGE);
        alert(API_KEY_ERROR_MESSAGE);
        return false;
    }
    return true;
};

export const generateChatResponse = async (userInput: string, context: string): Promise<string> => {
    if (!checkApiKey() || !ai) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }

    const prompt = `あなたは優秀な文章アシスタントです。
ユーザーは以下の文章を編集中です

---
${context}
---

この文脈を踏まえて、ユーザーの次の質問に日本語で回答してください。

質問: "${userInput}"
`;

    try {
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const response = result.text;
        return response || "AIからの応答が得られませんでした。";
    } catch (error) {
        console.error("Error generating chat response from Gemini:", error);
        throw new Error("AIからの応答の生成に失敗しました。");
    }
};
