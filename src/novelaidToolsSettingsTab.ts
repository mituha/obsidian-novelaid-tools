import { App, PluginSettingTab, Setting } from 'obsidian';
import NovelaidToolsPlugin from './main';

export class NovelaidToolsSettingsTab extends PluginSettingTab {
	plugin: NovelaidToolsPlugin;

	constructor(app: App, plugin: NovelaidToolsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('ルビ表示機能の有効化')
			.setDesc('ルビ表示機能を有効にします')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useRuby)
				.onChange(async (value) => {
					this.plugin.settings.useRuby = value;
					await this.plugin.saveSettings();
				}));	

		new Setting(containerEl)
			.setName('AI機能の有効化')
			.setDesc('AI機能を有効にします')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useAI)
				.onChange(async (value) => {
					this.plugin.settings.useAI = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Gemini API Key')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your Gemini API Key')
				.setValue(this.plugin.settings.geminApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminApiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
