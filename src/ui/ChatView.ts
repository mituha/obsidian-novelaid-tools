import { ItemView, WorkspaceLeaf, MarkdownView, Notice, setIcon, MarkdownRenderer, IconName } from 'obsidian';
import { NovelaidToolsPluginSettings } from '../novelaidToolsSettings';
import { generateChatResponse, generateReview, generateProofread, ProofreadResult } from '../services/geminiService';

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
        this.initNavButtons();

        //const container = this.containerEl.children[1];
        //view-containerを探す
        const container = this.containerEl.querySelector('.view-content');
        if (container === null) {
            console.error("view-containerが見つかりません。");
            return;
        }
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

        //containerElの確認
        console.log('containerEl:', this.containerEl);
    }
    private initNavButtons(): void {
        console.log('initNavButtons() called');
        console.log('this.containerEl:', this.containerEl);

        // nav-buttons-container
        const navButtonsContainer = this.getNavButtonsContainer();
        if (navButtonsContainer === null) { console.error("nav-buttons-containerが見つかりません。") };
        console.log('this.containerEl:', this.containerEl);

        //追加する前にクリア
        navButtonsContainer.empty();

        console.log('this.containerEl:', this.containerEl);

        //右側のペインではヘッダー表示が無効なため、表示されない。
        // 内部的には存在するが、非表示にされている。
        this.addNavAction('star', 'AIレビューを実行', (evt) => this.runReview());
        this.addNavAction('check-check', 'AI校正を実行', (evt) => this.runProofread());
    }
    private getNavButtonsContainer(): Element {
        // nav-header
        const navHeader = this.containerEl.querySelector('.nav-header') ?? this.containerEl.createDiv("nav-header");
        if (navHeader === null) { console.error("nav-headerが見つかりません。") };
        const viewHeader = this.containerEl.querySelector('.view-header')
        if (viewHeader === null) { console.error("view-headerが見つかりません。") };
        if (viewHeader) {
            //順序の調整
            this.containerEl.insertBefore(navHeader, viewHeader);
        }
        console.log('navHeader:', navHeader);
        console.log('this.containerEl:', this.containerEl);
        // nav-buttons-container
        const navButtonsContainer = navHeader.querySelector('.nav-buttons-container') ?? navHeader.createDiv("nav-buttons-container");
        if (navButtonsContainer === null) { console.error("nav-buttons-containerが見つかりません。") };
        console.log('navButtonsContainer:', navButtonsContainer);
        return navButtonsContainer;
    }
    private addNavAction(icon: IconName, title: string, callback: (evt: MouseEvent) => any): HTMLElement {
        const navButtonsContainer = this.getNavButtonsContainer();

        let actionButton = navButtonsContainer.createDiv("nav-action-button");
        actionButton.ariaLabel = title;
        setIcon(actionButton, icon);
        actionButton.addEventListener("click", callback);
        return actionButton;
    }

    private getCurrentContext(): string {
        const allMarkdownLeaves: WorkspaceLeaf[] = this.app.workspace.getLeavesOfType('markdown');
        console.log('allMarkdownLeaves:', allMarkdownLeaves);
        const firstMarkdownView = allMarkdownLeaves[0]?.view as MarkdownView | undefined;
        console.log('firstMarkdownView:', firstMarkdownView);
        const activeView = firstMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
        console.log('activeView:', activeView);
        //acitveViewまでは取れるが、editoが取れなくなっている？
        const editor = activeView?.editor;
        console.log('editor:', editor);
        if (editor) {
            return editor.getValue();
        }
        console.log('activeView?.data:', activeView?.data);
        const editorContent = activeView?.data;
        console.log('editorContent:', editorContent);
        return editorContent ?? '';
    }

    async runProofread() {
        this.addMessage('AI校正を開始します...', 'assistant');
        this.inputEl.disabled = true;
        this.sendButton.disabled = true;

        const thinkingMessage = this.addMessage('校正中...', 'assistant');
        thinkingMessage.addClass('streaming');

        try {
            document.body.style.cursor = 'wait';
            const notice = new Notice(`AIが校正中です...`, 0);

            const editorContent = this.getCurrentContext();
            if (!editorContent.trim()) {
                this.updateMessage(thinkingMessage, '校正対象の文章がありません。', 'assistant-error');
                notice.hide();
                return;
            }

            const results = await generateProofread(editorContent);
            this.messagesContainer.removeChild(thinkingMessage);
            this.displayProofreadResult(results);
            notice.hide();

        } catch (error) {
            console.error('Error getting AI proofread:', error);
            this.updateMessage(thinkingMessage, `校正結果の取得中にエラーが発生しました: ${error.message}`, 'assistant-error');
        } finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            document.body.style.cursor = 'auto';
            this.inputEl.focus();
        }
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

    private displayProofreadResult(results: ProofreadResult[]) {
        const resultContainer = this.messagesContainer.createEl('div', {
            cls: 'message assistant proofread-result',
        });

        if (results.length === 0) {
            resultContainer.createEl('p', { text: 'AIによる校正の結果、修正すべき点はありませんでした。' });
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            return;
        }

        resultContainer.createEl('strong', { text: 'AIによる校正結果' });

        for (const result of results) {
            const block = resultContainer.createEl('div', { cls: 'proofread-block' });

            const before = block.createEl('div', { cls: 'proofread-before' });
            before.createEl('span', { cls: 'proofread-label', text: '修正前: ' });
            before.createEl('span', { cls: 'proofread-before-text', text: result.before });

            const after = block.createEl('div', { cls: 'proofread-after' });
            after.createEl('span', { cls: 'proofread-label', text: '修正後: ' });
            after.createEl('span', { cls: 'proofread-after-text', text: result.after });

            const reason = block.createEl('div', { cls: 'proofread-reason' });
            reason.createEl('span', { cls: 'proofread-label', text: '理由: ' });
            reason.createEl('span', { cls: 'proofread-reason-text', text: result.reason });
        }

        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
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