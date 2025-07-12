import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { NovelaidToolsPluginSettings } from '../novelaidToolsSettings';
import { generateChatResponse } from '../services/geminiService';

export const CHAT_VIEW_TYPE = 'novelaid-chat-view';

export class ChatView extends ItemView {
    settings: NovelaidToolsPluginSettings;
    messagesContainer: HTMLElement;
    inputEl: HTMLInputElement;
    sendButton: HTMLButtonElement;

    constructor(leaf: WorkspaceLeaf, settings: NovelaidToolsPluginSettings) {
        super(leaf);
        this.settings = settings;
    }

    getViewType() {
        return CHAT_VIEW_TYPE;
    }

    getDisplayText() {
        return 'AI Chat';
    }

    getIcon() {
        return 'message-square';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('novelaid-chat-view-container');

        this.messagesContainer = container.createEl('div');
        this.messagesContainer.addClass('messages-container');

        const inputContainer = container.createEl('div');
        inputContainer.addClass('input-container');

        this.inputEl = inputContainer.createEl('input', { type: 'text', placeholder: 'メッセージを送信...' });
        this.inputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        });

        this.sendButton = inputContainer.createEl('button', { text: '送信' });
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
    }

    async sendMessage() {
        const message = this.inputEl.value;
        if (!message.trim()) return;

        this.addMessage(message, 'user');
        this.inputEl.value = '';
        this.inputEl.disabled = true;
        this.sendButton.disabled = true;

        // "Thinking" indicator
        const thinkingMessage = this.addMessage('...', 'assistant');
        thinkingMessage.addClass('streaming');


        try {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            const editorContent = activeView ? activeView.editor.getValue() : '';

            const response = await generateChatResponse(message, editorContent);
            this.updateMessage(thinkingMessage, response, 'assistant');

        } catch (error) {
            console.error('Error getting AI response:', error);
            this.updateMessage(thinkingMessage, `エラーが発生しました: ${error.message}`, 'assistant-error');
        } finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            this.inputEl.focus();
        }
    }

    addMessage(content: string, sender: 'user' | 'assistant' | 'assistant-error'): HTMLElement {
        const messageEl = this.messagesContainer.createEl('div', {
            cls: `message ${sender}`,
        });
        messageEl.setText(content);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return messageEl;
    }

    updateMessage(element: HTMLElement, content: string, sender: 'user' | 'assistant' | 'assistant-error') {
        element.setText(content);
        element.className = `message ${sender}`;
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async onClose() {
        // Cleanup if needed
    }
}
