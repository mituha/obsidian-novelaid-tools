import { NovelaidToolsPluginSettings } from "../novelaidToolsSettings";
import { AiFunction, ChatMessage, IGenericAiProvider } from './providers/IGenericAiProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { LMStudioProvider } from './providers/LMStudioProvider';
import { Notice } from 'obsidian';
import { A } from 'vitest/dist/chunks/environment.d.cL3nLXbE';

export class AiOrchestratorService {
    private provider: IGenericAiProvider | null;
    private settings: NovelaidToolsPluginSettings;

    constructor(settings: NovelaidToolsPluginSettings) {
        this.settings = settings;
        this.provider = this.createProvider();
    }

    private createProvider(): IGenericAiProvider | null {
        console.log("createProvider ", this.settings.aiProvider)
        try {
            if (this.settings.aiProvider === 'gemini') {
                return new GeminiProvider(this.settings.gemini);
            } else if (this.settings.aiProvider === 'lmstudio') {
                return new LMStudioProvider(this.settings.lmstudio);
            } else {
                return null;
            }
        } catch (error) {
            console.error("AIプロバイダーの初期化に失敗しました。設定を確認してください。");
            console.error(error);
            return null;
        }
    }

    public onSettingsChanged(): void {
        try {
            this.provider = this.createProvider();
        } catch (error) {
            new Notice("AIプロバイダーの初期化に失敗しました。設定を確認してください。");
            console.error(error);
        }
    }

    public getActiveProvider(): IGenericAiProvider | null {
        return this.provider;
    }





}
