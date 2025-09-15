export interface AiProviderSettings {
	apiKey: string;
	model: string;
	customModel: string;
    baseUrl: string;
};

/**
 * Function CallingでAIに提供する関数の型定義
 */
export type AiFunction = {
    name: string;
    description: string;
    parameters: object; // JSON Schema format
    //任意の関数
    implementation: (...args: any[]) => any;
};

/**
 * チャットの履歴メッセージのロールの型定義
 */ 
export declare type ChatMessageRole = "model" | "user" | "system" | "tool";

/**
 * チャットの履歴メッセージの型定義
 */
export type ChatMessage = {
    role: ChatMessageRole;
    parts: {
        text?: string;
        functionCall?: {
            name: string;
            args: any;
            tool_call_id?: string; // OpenAIのFunction Callingで必須
        };
        functionResponse?: {
            name: string;
            response: any;
            tool_call_id?: string; // OpenAIのFunction Callingで必須
        };
    }[];
};

/**
 * 汎用AIプロバイダーのインターフェース
 */
export interface IGenericAiProvider {
    /**
     * AIサービスへの接続をテストします。
     * @param settings APIキー、使用するモデル名
     * @returns 接続が成功した場合は { success: true }, 失敗した場合は { success: false, error: string }
     */
    testConnection(settings: AiProviderSettings): Promise<{ success: boolean; error?: string }>;

    /**
     * チャット履歴を渡して、対話的な応答を生成します。
     * @param history チャット履歴
     * @returns AIからの応答テキスト
     */
    generateChatResponse(
        history: ChatMessage[]
    ): Promise<ChatMessage>;

    /**
     * プロンプトに対して、指定されたJSONスキーマに沿った応答を生成します。
     * @param prompt 指示プロンプト
     * @param schema 期待する出力のJSONスキーマ
     * @returns パース済みのJSONオブジェクト
     */
    generateStructuredResponse(prompt: string, schema: object): Promise<any>;

    /**
     * チャット履歴を基にFunction Callingを処理し、最終的な関数応答を生成します。
     * このメソッドは、Function Callingのループを管理し、必要に応じてツールを実行します。
     * @param prompt 指示プロンプト
     * @param tools AIが利用可能な関数の定義
     * @returns 最終的な関数応答、またはAIからの応答テキスト
     */
    generateFunctionResponse(
        prompt: string,
        tools?: AiFunction[]
    ): Promise<ChatMessage>;
}
