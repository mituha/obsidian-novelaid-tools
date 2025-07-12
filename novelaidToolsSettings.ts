
export interface NovelaidToolsPluginSettings {
	//各種機能のON/OFF
	useRuby: boolean;

	//
	useAI: boolean;
	geminApiKey: string;
}

export const DEFAULT_SETTINGS: NovelaidToolsPluginSettings = {
	useRuby: true,

	useAI: true,

	//APIキーは初期値として空文字列を設定
	geminApiKey: '',
}
