import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import NovelaidToolsPlugin from './main';
import { testConnection } from './services/geminiService';

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

		new Setting(containerEl)
			.setName('AI機能の有効化')
			.setDesc('チャット、レビュー、校正などのAI機能全体を有効にします。')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useAI)
				.onChange(async (value) => {
					this.plugin.settings.useAI = value;
					// この変更を反映するためにUIを再描画
					this.display();
					await this.plugin.saveSettings();
				}));

		// AI機能が有効な場合のみ、APIキーとモデル設定を表示
		if (this.plugin.settings.useAI) {
			new Setting(containerEl)
				.setName('Google Gemini API Key')
				.setDesc('Google AI Studioで取得したAPIキーを入力してください。')
				.addText(text => text
					.setPlaceholder('Enter your Gemini API Key')
					.setValue(this.plugin.settings.geminApiKey)
					.onChange(async (value) => {
						this.plugin.settings.geminApiKey = value;
						await this.plugin.saveSettings();
					}));

			// 接続テストボタン
			new Setting(containerEl)
				.setName('接続テスト')
				.setDesc('入力されたAPIキーと選択されたモデルで、Gemini APIへの接続をテストします。')
				.addButton(button => {
					button
						.setButtonText('テスト実行')
						.onClick(async () => {
							const apiKey = this.plugin.settings.geminApiKey;
							const model = this.plugin.settings.geminiModel === 'custom'
								? this.plugin.settings.customGeminiModel
								: this.plugin.settings.geminiModel;

							if (!model) {
								new Notice('テストするモデルが選択または入力されていません。');
								return;
							}

							button.setButtonText('テスト中...').setDisabled(true);
							const result = await testConnection(apiKey, model);
							button.setButtonText('テスト実行').setDisabled(false);

							if (result.success) {
								new Notice('✅ 接続に成功しました！');
							} else {
								new Notice(`❌ 接続に失敗しました。\nエラー: ${result.error}`);
							}
						});
				});


			// Geminiモデル選択ドロップダウン
			const modelSetting = new Setting(containerEl)
				.setName('Gemini AI Model')
				.setDesc('使用するAIモデルを選択してください。カスタムを選択すると、任意のモデル名を入力できます。');

			modelSetting.addDropdown(dropdown => {
				dropdown
					.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (推奨)')
					.addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite')
					.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro')
					.addOption('gemini-2.0-flash', 'Gemini 2.0 Flash')
					.addOption('gemini-2.0-flash-lite', 'Gemini 2.0 Flash Lite')
					.addOption('custom', 'カスタム')
					.setValue(this.plugin.settings.geminiModel)
					.onChange(async (value) => {
						this.plugin.settings.geminiModel = value;
						await this.plugin.saveSettings();
						// 変更を反映するためにUIを再描画
						this.display();
					});
			});

			// カスタムモデル入力用のテキストボックス
			if (this.plugin.settings.geminiModel === 'custom') {
				new Setting(containerEl)
					.setName('カスタムモデル名')
					.setDesc('使用したいモデルの正確な名前を入力してください。（例: models/gemini-1.5-pro-latest）')
					.addText(text => text
						.setPlaceholder('Enter custom model name')
						.setValue(this.plugin.settings.customGeminiModel)
						.onChange(async (value) => {
							this.plugin.settings.customGeminiModel = value;
							await this.plugin.saveSettings();
						}));
			}
		}

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
