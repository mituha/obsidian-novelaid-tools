import { App, MarkdownView, Modal, Notice, Plugin, TFile, Setting } from 'obsidian';
import { initializeGeminiAI } from './services/geminiService'; // Import the function to initialize Gemini AI
import { NovelaidToolsPluginSettings, DEFAULT_SETTINGS } from './novelaidToolsSettings';
import { NovelaidToolsSettingsTab } from './novelaidToolsSettingsTab';
import * as path from 'path';
import { applyRubyToElement } from './services/rubyTextFormatter';
import { ChatView, CHAT_VIEW_TYPE } from './ui/ChatView';

export default class NovelaidToolsPlugin extends Plugin {
	settings: NovelaidToolsPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// Add a ribbon icon for the chat view
		this.addRibbonIcon('message-square', 'AI Chat', () => {
			this.activateView();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NovelaidToolsSettingsTab(this.app, this));

		// Register the view
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new ChatView(leaf, this.settings)
		);

		//ルビの表示
		this.registerMarkdownPostProcessor((element, context) => {
			applyRubyToElement(element);
		});
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);

		await this.app.workspace.getRightLeaf(false)?.setViewState({
			type: CHAT_VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(CHAT_VIEW_TYPE)[0]
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		if (this.settings.useAI) {
			//APIキーがある場合、AIエージェントの初期化を行う。
			if (initializeGeminiAI(this.settings.geminApiKey, this.settings)) {
				console.log('Gemini AI initialized with provided API key.');
			} else {
				console.warn('No valid Gemini API key found. AI features may not work as expected.');
			}
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



