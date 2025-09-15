import { App, MarkdownView, Modal, Notice, Plugin, TFile, Setting } from 'obsidian';
import { NovelaidToolsPluginSettings, DEFAULT_SETTINGS } from './novelaidToolsSettings';
import { NovelaidToolsSettingsTab } from './novelaidToolsSettingsTab';
import * as path from 'path';
import { applyRubyToElement } from './services/rubyTextFormatter';
import { ChatView, CHAT_VIEW_TYPE } from './ui/ChatView';
import { ObsidianContextService } from './services/obsidianContextService';
import { AiOrchestratorService } from './services/AiOrchestratorService';

export default class NovelaidToolsPlugin extends Plugin {
	settings: NovelaidToolsPluginSettings;
	contextService: ObsidianContextService;
	aiOrchestrator: AiOrchestratorService;
	
	async onload() {
		await this.loadSettings();

		this.contextService = new ObsidianContextService(this.app);

		// Add a ribbon icon for the chat view
		this.addRibbonIcon('message-square', 'AI Chat', () => {
			this.activateChatView();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NovelaidToolsSettingsTab(this.app, this));

		// Register the view
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new ChatView(leaf,this, this.settings, this.contextService)
		);

		//ルビの表示
		this.registerMarkdownPostProcessor((element, context) => {
			applyRubyToElement(element);
		});
	}

	async activateChatView() {
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

   		// AI Orchestratorの初期化
		this.aiOrchestrator = new AiOrchestratorService(this.settings);
		console.log('ai orchestrator loaded');

	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}