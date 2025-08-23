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
		const {containerEl} = this;

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
	}
}
