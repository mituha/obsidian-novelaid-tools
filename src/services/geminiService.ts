import { GoogleGenAI } from "@google/genai";
import { NovelaidToolsPluginSettings } from "../novelaidToolsSettings";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";

let ai: GoogleGenAI | null = null;
let pluginSettings: NovelaidToolsPluginSettings | null = null;

export const initializeGeminiAI = (apiKey: string, settings: NovelaidToolsPluginSettings): boolean => {
    if (!apiKey || apiKey.trim() === "") {
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

/**
 * 現在アクティブなGeminiモデル名を取得します。
 * カスタムモデルが設定されていればそれを、なければ標準のモデル名を返します。
 * @returns {string} アクティブなモデル名
 */
const getActiveModel = (): string => {
    if (!pluginSettings) {
        // デフォルトのフォールバック
        return 'gemini-2.5-flash';
    }
    if (pluginSettings.geminiModel === 'custom' && pluginSettings.customGeminiModel) {
        return pluginSettings.customGeminiModel;
    }
    return pluginSettings.geminiModel;
};

export const testConnection = async (apiKey: string, model: string): Promise<{ success: boolean; error?: string }> => {
    if (!apiKey || apiKey.trim() === "") {
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return { success: false, error: "APIキーが入力されていません。" };
    }

    try {
        const testAI = new GoogleGenAI({ apiKey: apiKey });
        await testAI.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: "test" }] }],
        });
        return { success: true };
    } catch (error: any) {
        console.error("Gemini connection test failed:", error);
        return { success: false, error: error.message || "不明なエラーが発生しました。" };
    }
};
