import { Chat, ChatMessageRoleData, LLM, LMStudioClient } from "@lmstudio/sdk";
import {
    AiProviderSettings,
    AiFunction,
    ChatMessage as FWChatMessage,
    ChatMessageRole,
} from "./IGenericAiProvider";
import { BaseAiProvider } from "./BaseAiProvider";

export class LMStudioProvider extends BaseAiProvider {
    private client: LMStudioClient;

    constructor(settings: AiProviderSettings) {
        super(settings);
        this.client = this.getClient(settings);
    }
    private getClient(settings: AiProviderSettings): LMStudioClient {
        console.log('getClient >>');
        let baseUrl = settings.baseUrl;
        if (!baseUrl || baseUrl.trim() === "") {
            baseUrl = process.env.LMSTUDIO_BASE_URL || "";
        }
        if (!baseUrl || baseUrl.trim() === "") {
            //Obsidianのプラグイン内からはhttpではエラーとなり、wsの必要がありそう。
            //指定しない方法での接続がエラーとなるため、明示的に指定する。
            //baseUrl = "http://127.0.0.1:1234";
            baseUrl = "ws://localhost:1234";
        }

        console.log('baseUrl:', baseUrl);
        //TODO baseUrl有無での扱い
        const client = baseUrl ? new LMStudioClient({
            baseUrl: baseUrl,
        }) : new LMStudioClient();
        console.log('getClient << ', client);
        return client;
    }
    private async getLLMModel(client: LMStudioClient, settings: AiProviderSettings, throwExpection: boolean = true): Promise<LLM | null> {
        console.log('getLLMModel >>');
        let modelId = this.getModel(settings);
        const model = await client.llm.model(modelId);
        if (!model) {
            console.error(`Model '${modelId}' not found.`);
            if (throwExpection) {
                throw new Error(`Model '${modelId}' not found.`);
            }
            return null;
        }
        console.log('getLLMModel << ', model);
        return model;
    }

    async testConnection(settings: AiProviderSettings): Promise<{ success: boolean; error?: string; }> {
        try {
            const client = this.getClient(settings);
            const downloadedModels = await client.system.listDownloadedModels();
            console.log("Downloaded Models:");
            if (downloadedModels.length === 0) {
                console.log("    No models downloaded. Get some in LM Studio.");
                return { success: false, error: `モデルが見つかりません。LM Studioでロードされているか確認してください。` };
            }

            // Limit to printing 5 models
            for (const model of downloadedModels.slice(0, 5)) {
                console.log(`  - ${model.modelKey} (${model.displayName})`);
            }
            if (downloadedModels.length > 5) {
                console.log(`    (... and ${downloadedModels.length - 5} more)`);
            }

            // LMStudioではモデルの存在確認に `llms.get` を使うと良い
            const model = await this.getLLMModel(client, settings, false);
            if (!model) {
                return { success: false, error: `モデルが見つかりません。LM Studioでロードされているか確認してください。` };
            }

            const prompt = "これは接続テストです。応答してください。";
            console.log('テスト接続中...', prompt);
            const response = await model.respond(prompt);
            console.log("返信:", response.content);
            return { success: true };
        } catch (error: any) {
            console.error("LMStudio connection test failed:", error);
            return { success: false, error: error.message || "不明なエラーが発生しました。" };
        }
    }

    async generateChatResponse(history: FWChatMessage[]): Promise<FWChatMessage> {
        const chat = this.convertToChat(history);

        try {
            const model = await this.getLLMModel(this.client, this.settings);
            const response = await model!.respond(chat);

            const content = response.content;
            if (!content) {
                return { role: 'model', parts: [{ text: "AIからの応答がありませんでした。" }] };
            }
            return { role: 'model', parts: [{ text: content }] };
        } catch (error) {
            console.error("Error generating JSON from LMStudio:", error);
            throw new Error(`AIからのJSON応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    async generateStructuredResponse(prompt: string, schema: object): Promise<any> {
        const jsonPrompt = `${prompt}\n\nレスポンスは以下のJSONスキーマに準拠したJSONオブジェクトのみを生成してください:\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``;

        try {
            const model = await this.getLLMModel(this.client, this.settings);
            //TODO ツール対応
            const response = await model!.respond(prompt);

            const content = response.content;
            if (!content) {
                throw new Error("AIからのJSON応答が空です。");
            }
            // レスポンスがマークダウンのコードブロックで囲まれている場合、それを除去する
            const cleanedText = content.replace(/^```json\n?/, '').replace(/```$/, '');
            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("Error generating JSON from LMStudio:", error);
            throw new Error(`AIからのJSON応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async generateFunctionResponse(prompt: string, tools?: AiFunction[]): Promise<FWChatMessage> {
        const initialMessage: FWChatMessage = { role: "user", parts: [{ text: prompt }] };
        //TODO ツール対応
        return this._generateChatResponse([initialMessage], tools);
    }

    // --- Protected Methods ---

    protected async _generateContent(history: FWChatMessage[], tools?: AiFunction[]): Promise<FWChatMessage> {
        const chat = this.convertToChat(history);

        try {
            const model = await this.getLLMModel(this.client, this.settings);
            const modelInfo = await model!.getModelInfo();
            //LMStudioはモデルによってツールサポート有無が異なる
            // LMStudioは関数呼び出しをサポートしていないため、toolsは無視します。
            if (tools && tools.length > 0 && !(modelInfo?.trainedForToolUse ?? false)) {
                console.warn("LMStudioProvider does not support function calling (tools).");
            }
            //TODO ツール対応
            //     ツールはactで専用の呼び出しになっている。
            const response = await model!.respond(chat);

            const content = response.content;
            if (!content) {
                return { role: 'model', parts: [{ text: "AIからの応答がありませんでした。" }] };
            }
            return { role: 'model', parts: [{ text: content }] };
        } catch (error) {
            console.error("Error generating chat response from LMStudio:", error);
            throw new Error(`AIからの応答の生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
        }
    }






    private convertToChat(history: FWChatMessage[]): Chat {
        const chat = Chat.empty();
        history.forEach(h => {
            if (h.role !== 'tool') {
                const role: ChatMessageRoleData = this.getChatMessageRoleData(h.role);

                h.parts.forEach(p => {
                    if (p.functionCall) {
                    } else if (p.functionResponse) {

                    } else if (p.text) {
                        chat.append(role, p.text);
                    }
                })
            }
        })
        return chat;
    }
    private getChatMessageRoleData(role: ChatMessageRole): ChatMessageRoleData {
        switch (role) {
            case 'model':
                return 'assistant';
            case 'user':
                return 'user';
            case 'system':
                return 'system';
            case 'tool':
                return 'tool';
            default:
                throw new Error(`Unknown role: ${role}`);
        }
    }
}
