import {
    GoogleGenAI,
    FunctionDeclaration,
    Content,
    Tool,
    Part,
} from "@google/genai";
import {
    AiProviderSettings,
    AiFunction,
    ChatMessage,
} from "./IGenericAiProvider";
import { BaseAiProvider } from "./BaseAiProvider";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";

export class GeminiProvider extends BaseAiProvider {
    private ai: GoogleGenAI;

    private getApiKey(settings: AiProviderSettings, throwExpection: boolean = true): string {
        let apiKey = settings.apiKey || "";
        if (!apiKey || apiKey.trim() === "") {
            apiKey = process.env.GEMINI_API_KEY || "";
            if (!apiKey || apiKey.trim() === "") {
                if (throwExpection) {
                    throw new Error("環境変数 : " + API_KEY_ERROR_MESSAGE);
                }
            }
        }
        if (!apiKey || apiKey.trim() === "") {
            if (throwExpection) {
                throw new Error(API_KEY_ERROR_MESSAGE);
            }
        }
        return apiKey;
    }

    constructor(settings: AiProviderSettings) {
        super(settings);
        const apiKey = this.getApiKey(settings);
        this.ai = new GoogleGenAI({ apiKey: apiKey });
    }

    async testConnection(settings: AiProviderSettings): Promise<{ success: boolean; error?: string; }> {
        console.log('接続テスト...');
        const apiKey = this.getApiKey(settings, false);
        if (!apiKey || apiKey.trim() === "") {
            console.error(API_KEY_ERROR_MESSAGE);
            return { success: false, error: "APIキーが入力されていません。" };
        }
        const model = settings.model;
        try {
            // テスト専用のクライアントを初期化
            const testAI = new GoogleGenAI({ apiKey: apiKey });
            const prompt = "これは接続テストです。応答してください。";
            console.log('テスト接続中...', prompt);
            const response = await testAI.models.generateContent({
                model: model,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            console.log("返信:", response.text);
            return { success: true };
        } catch (error: any) {
            console.error("Gemini connection test failed:", error);
            return { success: false, error: error.message || "不明なエラーが発生しました。" };
        }
    }

    async generateChatResponse(history: ChatMessage[]): Promise<ChatMessage> {
        try{
            const result = await this.ai.models.generateContent({
                model: this.getActiveModel(),
                contents: this.convertToGeminiHistory(history),
            });

            /*
            const candidate = result.candidates?.[0];
            if (!candidate) {
                return { role: 'model', parts: [{ text: "AIからの応答がありませんでした。" }] };
            }
            const text = candidate.content?.parts?.map(p => p.text).join('') || "AIからの応答がありませんでした。";
            */
            const text = result.text ?? "AIからの応答がありませんでした。";
            return { role: 'model', parts: [{ text }] };
        } catch (error) {
            console.error("Error generating response from Gemini:", error);
            throw new Error(`AIからの応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateStructuredResponse(prompt: string, schema: object): Promise<any> {
        try {
            const result = await this.ai.models.generateContent({
                model: this.getActiveModel(),
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });

            const text = result.text ?? "{}";
            // レスポンスがマークダウンのコードブロックで囲まれている場合、それを除去する
            const cleanedText = text.replace(/^```json\n?/, '').replace(/```$/, '');
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("Error generating JSON from Gemini:", error);
            throw new Error(`AIからのJSON応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateFunctionResponse(prompt: string, tools?: AiFunction[]): Promise<ChatMessage> {
        const initialMessage: ChatMessage = { role: "user", parts: [{ text: prompt }] };
        return this._generateChatResponse([initialMessage], tools);
    }

    // --- Protected Methods ---

    protected async _generateContent(history: ChatMessage[], tools?: AiFunction[]): Promise<ChatMessage> {
        const geminiHistory = this.convertToGeminiHistory(history);
        const geminiTools: Tool[] | undefined = tools?.map(t => ({
            functionDeclarations: [this.convertToGeminiFunction(t)]
        }));

        try {
            const result = await this.ai.models.generateContent({
                model: this.getActiveModel(),
                contents: geminiHistory,
                config: {
                    tools: geminiTools
                }
            });

            const candidate = result.candidates?.[0];
            if (!candidate) {
                return { role: 'model', parts: [{ text: "AIからの応答がありませんでした。" }] };
            }

            const functionCallPart = candidate.content?.parts?.find(p => p.functionCall);

            if (functionCallPart && functionCallPart.functionCall) {
                const fc = functionCallPart.functionCall;
                return {
                    role: 'model',
                    parts: [{
                        functionCall: {
                            name: fc.name!,
                            args: fc.args,
                        }
                    }]
                };
            }

            const text = candidate.content?.parts?.map(p => p.text).join('') || "AIからの応答がありませんでした。";
            return { role: 'model', parts: [{ text }] };

        } catch (error) {
            console.error("Error generating chat response from Gemini:", error);
            throw new Error(`AIからの応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    // --- Private Helper Methods ---

    private convertToGeminiHistory(history: ChatMessage[]): Content[] {
        return history.map(msg => {
            const parts: Part[] = msg.parts.map(p => {
                if (p.functionCall) {
                    return { functionCall: { name: p.functionCall.name, args: p.functionCall.args } };
                }
                if (p.functionResponse) {
                    return { functionResponse: { name: p.functionResponse.name, response: p.functionResponse.response } };
                }
                // textがundefinedやnullの場合を考慮して空文字にフォールバック
                return { text: p.text ?? "" };
            });

            // Gemini APIのContent型に合わせる
            // role 'tool' は functionResponse を持つ part を含む
            if (msg.role === 'tool') {
                return {
                    role: 'tool',
                    parts: parts,
                };
            }

            return { role: msg.role, parts };
        }) as Content[];
    }


    private convertToGeminiFunction(func: AiFunction): FunctionDeclaration {
        return {
            name: func.name,
            description: func.description,
            parameters: func.parameters,
        };
    }

    private getActiveModel(): string {
        return this.getModel(this.settings);
    }
}

