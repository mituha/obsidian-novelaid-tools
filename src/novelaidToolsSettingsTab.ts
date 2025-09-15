import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import NovelaidToolsPlugin from './main';

export class NovelaidToolsSettingsTab extends PluginSettingTab {
	plugin: NovelaidToolsPlugin;

	constructor(app: App, plugin: NovelaidToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: '全般設定' });

		new Setting(containerEl)
			.setName('ルビ表示機能の有効化')
			.setDesc('カクヨム記法（`|親文字《ルビ》`）のルビをエディタ上で表示します。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useRuby)
				.onChange(async (value) => {
					this.plugin.settings.useRuby = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h2', { text: 'AI機能設定' });

		// AIプロバイダー選択
		new Setting(containerEl)
			.setName('AI Provider')
			.setDesc('使用するAIサービスを選択してください。')
			.addDropdown(dropdown => {
				dropdown
					.addOption('gemini', 'Google Gemini')
					.addOption('lmstudio', 'LM Studio')
					.addOption('none', 'なし')
					.setValue(this.plugin.settings.aiProvider)
					.onChange(async (value: 'gemini' | 'lmstudio' | 'none') => {
						this.plugin.settings.aiProvider = value;
						await this.plugin.saveSettings();
						this.display(); // UIを再描画
					});
			});

		// 選択されたプロバイダーの設定UIを表示
		this.displayProviderSettings(containerEl, this.plugin.settings.aiProvider);
	}

	private displayProviderSettings(containerEl: HTMLElement, provider: 'gemini' | 'lmstudio' | 'none'): void {
		if (provider === 'none') {
			containerEl.createEl('p', { text: 'AI機能は使用されません。' });
			return;
		}
		const providerName = provider === 'gemini' ? 'Google Gemini' : 'LM Studio';
		const providerSettings = this.plugin.settings[provider];

		//LM Studio は APIキー不要
		if (provider !== 'lmstudio') {
			new Setting(containerEl)
				.setName(`${providerName} API Key`)
				.setDesc(`お使いの${providerName}のAPIキーを入力してください。`)
				.addText(text => text
					.setPlaceholder(`Enter your ${providerName} API Key`)
					.setValue(providerSettings.apiKey)
					.onChange(async (value) => {
						providerSettings.apiKey = value;
						await this.plugin.saveSettings();
					}));
		}
		const modelSetting = new Setting(containerEl)
			.setName(`${providerName} AI Model`)
			.setDesc('使用するAIモデルを選択してください。');

		modelSetting.addDropdown(dropdown => {
			if (provider === 'gemini') {
				dropdown
					.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (推奨)')
					.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro')
					.addOption('gemini-2.0-flash', 'Gemini 2.0 Flash')
					.addOption('gemini-2.0-pro', 'Gemini 2.0 Pro');
			} else if (provider === 'lmstudio') {
				dropdown
					.addOption('qwen/qwen3-4b-2507', 'qwen3-4b-2507 (推奨)')
					.addOption('qwen/qwen3-4b-thinking-2507', 'qwen3-4b-thinking-2507 (推論特化)')
					.addOption('google/gemma-3-4b', 'gemma-3-4b')
					.addOption('openai/gpt-oss-20b', 'gpt-oss-20b');
			}
			dropdown
				.addOption('custom', 'カスタム')
				.setValue(providerSettings.model)
				.onChange(async (value) => {
					providerSettings.model = value;
					await this.plugin.saveSettings();
					this.display(); // カスタムモデル入力欄の表示切替
				});
		});

		if (providerSettings.model === 'custom') {
			new Setting(containerEl)
				.setName('カスタムモデル名')
				.addText(text => text
					.setPlaceholder('Enter custom model name')
					.setValue(providerSettings.customModel)
					.onChange(async (value) => {
						providerSettings.customModel = value;
						await this.plugin.saveSettings();
					}));
		}
		if (provider !== 'gemini') {
			//LM Studioはローカルの接続のため、別PCへの接続等でbaseUrl指定が必要
			//OpenAI互換としてLM Studio等を動作させる場合、OpenAIもbaseUrl指定が必要
			const placeHolder = provider === 'lmstudio' ? "ws://localhost:1234" : "http://localhost1234/v1";
			new Setting(containerEl)
				.setName(`${providerName} baseUrl`)
				.setDesc(`接続先指定が必要な場合のみ入力してください。`)
				.addText(text => text
					.setPlaceholder(placeHolder)
					.setValue(providerSettings.baseUrl)
					.onChange(async (value) => {
						providerSettings.baseUrl = value;
						await this.plugin.saveSettings();
					}));
		}
		this.addConnectionTestButton(containerEl, provider);
	}

	private addConnectionTestButton(containerEl: HTMLElement, provider: 'gemini' | 'lmstudio'): void {
		new Setting(containerEl)
			.setName('接続テスト')
			.setDesc(`入力されたAPIキーと選択されたモデルで、${provider === 'gemini' ? 'Gemini' : 'LM Studio'} APIへの接続をテストします。`)
			.addButton(button => {
				button
					.setButtonText('テスト実行')
					.onClick(async () => {
						const providerInstance = this.plugin.aiOrchestrator.getActiveProvider();
						if (!providerInstance) {
							new Notice('AIプロバイダーが初期化されていません。');
							return;
						}

						const providerSettings = this.plugin.settings[provider];
						button.setButtonText('テスト中...').setDisabled(true);
						const result = await providerInstance.testConnection(providerSettings);
						button.setButtonText('テスト実行').setDisabled(false);

						if (result.success) {
							new Notice('✅ 接続に成功しました！');
						} else {
							new Notice(`❌ 接続に失敗しました。\nエラー: ${result.error}`);
						}
					});
			});
	}
}
