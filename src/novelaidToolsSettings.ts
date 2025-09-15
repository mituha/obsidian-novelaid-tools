import { AiProviderSettings } from "./services/providers/IGenericAiProvider";

export interface NovelaidToolsPluginSettings {
	//各種機能のON/OFF
	useRuby: boolean;

	//
	useAI: boolean;
	geminApiKey: string;

	// Geminiモデル設定
	geminiModel: string;
	customGeminiModel: string;

			// AIプロバイダー設定
	aiProvider: 'gemini' | 'lmstudio' | 'none';

	// Gemini設定
	gemini: AiProviderSettings;

	// LMStudio設定
	lmstudio: AiProviderSettings;
}

export const DEFAULT_SETTINGS: NovelaidToolsPluginSettings = {
	useRuby: true,

	useAI: true,

	//APIキーは初期値として空文字列を設定
	geminApiKey: '',

	// デフォルトのGeminiモデル
	geminiModel: 'gemini-2.5-flash',
	customGeminiModel: '',

	aiProvider: 'lmstudio',

	gemini: {
		apiKey: '',
		model: 'gemini-2.0-flash', // 最新のモデルに更新
		customModel: '',
		baseUrl: ''
	},

	lmstudio: {
		apiKey: '',	//APIキーは不要
		model: 'qwen/qwen3-4b-2507',  
		customModel: '',
		baseUrl: ''
	},
}
