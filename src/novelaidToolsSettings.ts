
export interface NovelaidToolsPluginSettings {
	//各種機能のON/OFF
	useRuby: boolean;

	//
	useAI: boolean;
	geminApiKey: string;

	// Geminiモデル設定
	geminiModel: string;
	customGeminiModel: string;
}

export const DEFAULT_SETTINGS: NovelaidToolsPluginSettings = {
	useRuby: true,

	useAI: true,

	//APIキーは初期値として空文字列を設定
	geminApiKey: '',

	// デフォルトのGeminiモデル
	geminiModel: 'gemini-2.5-flash',
	customGeminiModel: '',
}
