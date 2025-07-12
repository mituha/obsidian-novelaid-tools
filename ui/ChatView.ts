import { ItemView, WorkspaceLeaf, MarkdownView, Notice } from 'obsidian';
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
            document.body.style.cursor = 'wait';
            const notice = new Notice(`入力中...`);

            //メイン領域のマークダウンの内容を取得します。
            //チャットタブからはgetActiveViewOfType(MarkdownView)が取得できないため、全てのマークダウンビューを取得して、最初のものを使用します。
            const allMarkdownLeaves: WorkspaceLeaf[] = this.app.workspace.getLeavesOfType('markdown');
            console.log('All Markdown leaves:', allMarkdownLeaves);

            //全てのマークダウンビューから最初のものを取得
            const firstMarkdownView = allMarkdownLeaves[0]?.view as MarkdownView | undefined;
            if (firstMarkdownView) {
                console.log('Using first Markdown view found.');
            } else {
                console.warn('No Markdown view found.');
            }
            //TODO 複数やフォルダー内のすべての内容からの取得等。
            const activeView = firstMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
            //activeViewが取得されているか等をログ出力
            console.log('Active view:', activeView);
            if (activeView) {
                console.log('Active Markdown view found.');
                console.log('Editor content:', activeView.editor.getValue());
            }
            const editorContent = activeView ? activeView.editor.getValue() : '';

            const response = await generateChatResponse(message, editorContent);
            this.updateMessage(thinkingMessage, response, 'assistant');
            
            //通知を消す
            notice.hide();
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.updateMessage(thinkingMessage, `エラーが発生しました: ${error.message}`, 'assistant-error');
        } finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            document.body.style.cursor = 'auto'; // カーソルを元に戻す 'default'では駄目っぽい
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
