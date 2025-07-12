import { ItemView, WorkspaceLeaf, MarkdownView, Notice, setIcon, MarkdownRenderer } from 'obsidian';
import { NovelaidToolsPluginSettings } from '../novelaidToolsSettings';
import { generateChatResponse, generateReview } from '../services/geminiService';

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
        return 'AIチャット';
    }

    getIcon() {
        return 'message-square';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('novelaid-chat-view-container');

        //右側のペインではヘッダー表示が無効なため、表示されない。
        // 内部的には存在するが、非表示にされている。
        this.addAction(
            'star',
            'AIレビューを実行',
            (evt) => this.runReview()
        );
        this.addNavButtons();

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
    private addNavButtons(): void {
        //TODO addActionで追加されている要素をコピーして追加する構造にしたい。
        const navHeader = this.contentEl.createDiv("nav-header");
        const navButContainer = navHeader.createDiv("nav-buttons-container");
        let actionButton = navButContainer.createDiv("nav-action-button");
        actionButton.ariaLabel = "AIレビューを実行";
        setIcon(actionButton, "star");
        actionButton.addEventListener("click", (evt) => {
            this.runReview();
        });
    }
    private getCurrentContext(): string {
        const allMarkdownLeaves: WorkspaceLeaf[] = this.app.workspace.getLeavesOfType('markdown');
        const firstMarkdownView = allMarkdownLeaves[0]?.view as MarkdownView | undefined;
        const activeView = firstMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
        return activeView ? activeView.editor.getValue() : '';
    }

    async runReview() {
        this.addMessage('AIレビューを開始します...', 'assistant');
        this.inputEl.disabled = true;
        this.sendButton.disabled = true;

        const thinkingMessage = this.addMessage('レビュー中...', 'assistant');
        thinkingMessage.addClass('streaming');

        try {
            document.body.style.cursor = 'wait';
            const notice = new Notice(`AIがレビューを生成中です...`, 0);

            const editorContent = this.getCurrentContext();
            if (!editorContent.trim()) {
                this.updateMessage(thinkingMessage, 'レビュー対象の文章がありません。', 'assistant-error');
                notice.hide();
                return;
            }

            const response = await generateReview(editorContent);
            this.messagesContainer.removeChild(thinkingMessage);
            this.displayReview(response);
            notice.hide();

        } catch (error) {
            console.error('Error getting AI review:', error);
            this.updateMessage(thinkingMessage, `レビューの取得中にエラーが発生しました: ${error.message}`, 'assistant-error');
        } finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            document.body.style.cursor = 'auto';
            this.inputEl.focus();
        }
    }

    async sendMessage() {
        const message = this.inputEl.value;
        if (!message.trim()) return;

        this.addMessage(message, 'user');
        this.inputEl.value = '';
        this.inputEl.disabled = true;
        this.sendButton.disabled = true;

        const thinkingMessage = this.addMessage('...', 'assistant');
        thinkingMessage.addClass('streaming');

        try {
            document.body.style.cursor = 'wait';
            const notice = new Notice(`AIが応答を生成中です...`, 0);

            const editorContent = this.getCurrentContext();
            const response = await generateChatResponse(message, editorContent);
            this.updateMessage(thinkingMessage, response, 'assistant');

            notice.hide();
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.updateMessage(thinkingMessage, `エラーが発生しました: ${error.message}`, 'assistant-error');
        } finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            document.body.style.cursor = 'auto';
            this.inputEl.focus();
        }
    }

    private displayReview(reviewText: string) {
        const reviewContainer = this.messagesContainer.createEl('div', {
            cls: 'message assistant review-result',
        });

        const lines = reviewText.split('\n');
        const agentNameLine = lines[0] || '';
        const restOfLines = lines.slice(1);

        // Render Agent Name
        const agentNameEl = reviewContainer.createEl('div', { cls: 'review-agent-name' });
        MarkdownRenderer.render(this.app, agentNameLine, agentNameEl, '', this);

        // Find and render rating
        const ratingLineIndex = restOfLines.findIndex(line => line.startsWith('評価：'));
        if (ratingLineIndex > -1) {
            const ratingLine = restOfLines[ratingLineIndex];
            const ratingMatch = ratingLine.match(/評価：(★*☆*)/);
            if (ratingMatch && ratingMatch[1]) {
                const stars = ratingMatch[1];
                const rating = (stars.match(/★/g) || []).length;

                const ratingEl = reviewContainer.createEl('div', { cls: 'review-rating' });
                ratingEl.createEl('strong', { text: '評価: ' });
                for (let i = 0; i < 5; i++) {
                    const starEl = ratingEl.createSpan({ cls: 'review-star' });
                    setIcon(starEl, i < rating ? 'star' : 'star-off');
                }
            }
        }

        // Render the rest of the review content as Markdown
        const contentEl = reviewContainer.createEl('div', { cls: 'review-content' });
        const content = restOfLines.filter((line, index) => index !== ratingLineIndex).join('\n').trim();
        MarkdownRenderer.render(this.app, content, contentEl, '', this);

        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addMessage(content: string, sender: 'user' | 'assistant' | 'assistant-error'): HTMLElement {
        const messageEl = this.messagesContainer.createEl('div', {
            cls: `message ${sender}`,
        });
        MarkdownRenderer.render(this.app, content, messageEl, '', this);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return messageEl;
    }

    updateMessage(element: HTMLElement, content: string, sender: 'user' | 'assistant' | 'assistant-error') {
        element.empty();
        MarkdownRenderer.render(this.app, content, element, '', this);
        element.className = `message ${sender}`;
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async onClose() {
        // Cleanup if needed
    }
}