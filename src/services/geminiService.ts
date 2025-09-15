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

export interface ProofreadResult {
    before: string;
    after: string;
    reason: string;
}

export const generateProofread = async (context: string): Promise<ProofreadResult[]> => {
    if (!checkApiKey() || !ai) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }

    const prompt = `あなたは優秀な校正者です。
以下の文章を校正し、誤字脱字や不自然な表現を修正してください。
修正箇所のみを、以下のJSON形式の配列で返却してください。修正がない場合は空の配列を返却してください。

- 修正前の文章は before キーに、修正後の文章は after キーに、修正理由は reason キーに格納してください。
- 修正理由には「誤字」「てにおはの誤り」「より自然な表現へ変更」のように、具体的な理由を簡潔に記述してください。
- 文脈を維持するため、修正箇所は単語や文節ではなく、ある程度の長さの文章を含めてください。
- JSON以外の説明や前置きは一切不要です。

[
  {
    "before": "修正前の文章の一部",
    "after": "修正後の文章の一部",
    "reason": "修正理由（例：誤字）"
  }
]

# 原稿
---
${context}
---
`;

    try {
        const result = await ai.models.generateContent({
            model: getActiveModel(),
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            before: { type: "string" },
                            after: { type: "string" },
                            reason: { type: "string" },
                        },
                        required: ["before", "after", "reason"],
                    },
                },
            },
        });

        const jsonString = result.text;
        if (!jsonString) {
            return [];
        }
        return JSON.parse(jsonString) as ProofreadResult[];

    } catch (error) {
        console.error("Error generating proofread from Gemini:", error);
        throw new Error("AI校正の生成に失敗しました。");
    }
};
