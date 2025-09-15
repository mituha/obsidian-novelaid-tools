import {
    AiProviderSettings,
    IGenericAiProvider,
    ChatMessage,
    AiFunction,
} from "./IGenericAiProvider";

const MAX_FUNCTION_CALLS = 10; // 無限ループを防ぐための最大関数呼び出し回数

/**
 * IGenericAiProviderインターフェースを実装するAIプロバイダークラスの基本的な機能を提供する抽象クラス。
 * このクラスは、関数呼び出しのループ処理など、プロバイダー間で共通のロジックを実装することを目的としています。
 */
export abstract class BaseAiProvider implements IGenericAiProvider {
    /**
     * AIプロバイダーの設定を保持します。
     * @protected
     */
    protected settings: AiProviderSettings;

    /**
     * BaseAiProviderの新しいインスタンスを初期化します。
     * @param settings AIプロバイダーの設定。
     */
    constructor(settings: AiProviderSettings) {
        this.settings = settings;
    }

    protected getModel(settings: AiProviderSettings): string {
        if (settings.model === 'custom' && settings.customModel) {
            return settings.customModel;
        }
        return settings.model;
    }

    /**
     * AIサービスへの接続をテストします。
     * このメソッドは、サブクラスで具体的に実装する必要があります。
     * @param settings APIキー、使用するモデル名
     * @returns 接続が成功した場合は { success: true }, 失敗した場合は { success: false, error: string }
     */
    abstract testConnection(settings: AiProviderSettings): Promise<{ success: boolean; error?: string }>;

    /**
     * チャット履歴を渡して、対話的な応答を生成します。
     * @param history チャット履歴
     * @returns AIからの応答テキスト
     */
    abstract generateChatResponse(
        history: ChatMessage[]
    ): Promise<ChatMessage>;

    /**
     * プロンプトに対して、指定されたJSONスキーマに沿った応答を生成します。
     * このメソッドは、サブクラスで具体的に実装する必要があります。
     * @param prompt 指示プロンプト
     * @param schema 期待する出力のJSONスキーマ
     * @returns パース済みのJSONオブジェクト
     */
    abstract generateStructuredResponse(
        prompt: string,
        schema: object
    ): Promise<any>;

    /**
     * チャット履歴を基にFunction Callingを処理し、最終的な関数応答を生成します。
     * このメソッドは、Function Callingのループを管理し、必要に応じてツールを実行します。
     * @param prompt 指示プロンプト
     * @param tools AIが利用可能な関数の定義
     * @returns 最終的な関数応答、またはAIからの応答テキスト
     */
    abstract generateFunctionResponse(
        prompt: string,
        tools?: AiFunction[]
    ): Promise<ChatMessage>;







    /**
     * チャット履歴と利用可能なツール（関数）を渡して、対話的な応答を生成します。
     * Function Callingが発生した場合、内部でループ処理を行い、最終的なAIの応答を返します。
     * @param history チャット履歴
     * @param tools AIが利用可能な関数の定義
     * @returns AIからの最終的なテキスト応答
     */
    async _generateChatResponse(
        history: ChatMessage[],
        tools?: AiFunction[]
    ): Promise<ChatMessage> {
        let currentHistory = [...history];
        let functionCallCount = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (functionCallCount >= MAX_FUNCTION_CALLS) {
                throw new Error(`関数呼び出しが最大回数(${MAX_FUNCTION_CALLS})に達しました。`);
            }

            const response = await this._generateContent(currentHistory, tools);
            const functionCallPart = response.parts.find(p => p.functionCall);

            if (!functionCallPart || !functionCallPart.functionCall) {
                // Function Callingが発生しなかったので、ループを終了
                return response;
            }

            // AIからのfunctionCall要求を履歴に追加
            currentHistory.push(response);

            const { name, args } = functionCallPart.functionCall;
            //使用するツールの取得
            const tool = tools?.find(t => t.name === name);
            let functionResult: any;
            if (tool) {
                try {
                    // 引数がオブジェクト形式であることを期待
                    const argsArray = args ? Object.values(args) : [];
                    functionResult = await Promise.resolve(tool.implementation(...argsArray));
                } catch (error) {
                    functionResult = { error: `関数 ${name} の実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}` };
                }
            } else {
                functionResult = { error: `関数 ${name} は定義されていません。` };
            }

            // 関数の実行結果を履歴に追加
            currentHistory.push({
                role: 'tool',
                parts: [{
                    functionResponse: {
                        name: name,
                        response: functionResult,
                        // OpenAIの場合、ここにtool_call_idを設定する必要がある
                        tool_call_id: functionCallPart.functionCall.tool_call_id,
                    }
                }]
            });

            functionCallCount++;
        }
    }

    /**
     * サブクラスで実装される、AIモデルとの対話を行うためのコアメソッド。
     * @param history チャット履歴
     * @param tools 利用可能な関数リスト
     * @returns AIからの応答
     * @protected
     */
    protected abstract _generateContent(
        history: ChatMessage[],
        tools?: AiFunction[]
    ): Promise<ChatMessage>;
}
