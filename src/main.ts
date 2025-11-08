import { App, MarkdownView, Modal, Notice, Plugin, TFile, Setting, Editor, MenuItem } from 'obsidian';
import { NovelaidToolsPluginSettings, DEFAULT_SETTINGS } from './novelaidToolsSettings';
import { NovelaidToolsSettingsTab } from './novelaidToolsSettingsTab';
import * as path from 'path';
import { applyRubyToElement, createRubyKakuyomuFormat } from './services/rubyTextFormatter';
import { ChatView, CHAT_VIEW_TYPE, CHAT_VIEW_ICON} from './ui/ChatView';
import { CharacterView, CHARACTER_VIEW_TYPE, CHARACTER_VIEW_ICON} from './ui/CharacterView';
import { GeographyView, GEOGRAPHY_VIEW_TYPE, GEOGRAPHY_VIEW_ICON} from './ui/GeographyView';
import { ObsidianContextService } from './services/obsidianContextService';
import { AiOrchestratorService } from './services/AiOrchestratorService';
import { RubyInputModal } from './ui/RubyInputModal';

export default class NovelaidToolsPlugin extends Plugin {
	settings: NovelaidToolsPluginSettings;
	contextService: ObsidianContextService;
	aiOrchestrator: AiOrchestratorService;
	
	async onload() {
		await this.loadSettings();

		this.contextService = new ObsidianContextService(this.app);

		// Add a ribbon icon for the chat view
		this.addRibbonIcon(CHAT_VIEW_ICON, 'AI Chat', () => {
			this.activateChatView();
		});

		// Add a ribbon icon for the character view
		this.addRibbonIcon(CHARACTER_VIEW_ICON, 'キャラクタービュー', () => {
			this.activateCharacterView();
		});

		// Add a ribbon icon for the geography view
		this.addRibbonIcon(GEOGRAPHY_VIEW_ICON, '地理ビュー', () => {
			this.activateGeographyView();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new NovelaidToolsSettingsTab(this.app, this));

		// Register the views
		this.registerView(
			CHAT_VIEW_TYPE,
			(leaf) => new ChatView(leaf,this, this.settings, this.contextService)
		);
		this.registerView(
			CHARACTER_VIEW_TYPE,
			(leaf) => new CharacterView(leaf)
		);
		this.registerView(
			GEOGRAPHY_VIEW_TYPE,
			(leaf) => new GeographyView(leaf)
		);

		//ルビの表示
		this.registerMarkdownPostProcessor((element, context) => {
			applyRubyToElement(element);
		});

		// エディタのコンテキストメニューに「ルビを振る」を追加
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				// テキストが選択されている場合のみメニュー項目を追加
				if (editor.somethingSelected()) {
					menu.addItem((item: MenuItem) => {
						item
							.setTitle('ルビを振る')
							.setIcon('pencil') // お好みでアイコンを変更してください
							.onClick(() => {
								const selectedText = editor.getSelection();
								
								// ルビ入力モーダルを開く
								new RubyInputModal(this.app, (rubyText) => {
									const formattedText = createRubyKakuyomuFormat(selectedText, rubyText);
									editor.replaceSelection(formattedText);
								}).open();
							});
					});
				}
			})
		);
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

	async activateCharacterView() {
		this.app.workspace.detachLeavesOfType(CHARACTER_VIEW_TYPE);

		await this.app.workspace.getLeftLeaf(false)?.setViewState({
			type: CHARACTER_VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(CHARACTER_VIEW_TYPE)[0]
		);
	}

	async activateGeographyView() {
		this.app.workspace.detachLeavesOfType(GEOGRAPHY_VIEW_TYPE);

		await this.app.workspace.getLeftLeaf(false)?.setViewState({
			type: GEOGRAPHY_VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(GEOGRAPHY_VIEW_TYPE)[0]
		);
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(CHAT_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(CHARACTER_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(GEOGRAPHY_VIEW_TYPE);
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