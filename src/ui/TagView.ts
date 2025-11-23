import { ItemView, WorkspaceLeaf, TFile, setIcon } from "obsidian";

/**
 * タグに基づいてファイルを表示するビューの抽象基本クラス。
 * 
 * このクラスは、指定されたタグを持つMarkdownファイルを監視し、
 * 一覧表示するための共通機能を提供します。
 * 
 * サブクラスは、以下の抽象メソッド/プロパティを実装する必要があります:
 * - `getViewType()`: ビューのユニークなタイプを返す。
 * - `getDisplayText()`: ビューの表示名を返す。
 * - `getIcon()`: ビューのアイコン名を返す。
 * - `getTagsToWatch()`: 監視対象のタグの配列を返す。
 * - `renderFileItem(file: TFile, itemEl: HTMLElement)`: 個々のファイル項目をレンダリングする。
 */
export abstract class TagView extends ItemView {
    protected fileListEl: HTMLElement;
    private refreshDebounceTimer: number | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    /**
     * ビューのタイプを取得します。サブクラスで実装する必要があります。
     */
    abstract getViewType(): string;

    /**
     * ビューの表示テキストを取得します。サブクラスで実装する必要があります。
     */
    abstract getDisplayText(): string;

    /**
     * ビューのアイコンを取得します。サブクラスで実装する必要があります。
     */
    abstract getIcon(): string;

    /**
     * このビューで監視するタグのリストを取得します。
     * サブクラスで実装する必要があります。
     */
    protected abstract getTagsToWatch(): string[];

    /**
     * ファイルリストの各項目をレンダリングします。
     * サブクラスで実装する必要があります。
     * @param file - レンダリング対象のファイル
     * @param itemEl - ファイル項目を描画するためのコンテナ要素
     */
    protected abstract renderFileItem(file: TFile, itemEl: HTMLElement): void;
    
    /**
     * ビューのタイトルを返します。
     */
    protected getListTitle(): string {
        // デフォルトのタイトル。必要に応じてサブクラスでオーバーライドできます。
        return `${this.getDisplayText()} 一覧`;
    }

    async onOpen() {
        // Obsidianのビューのコンテナ要素を取得します。
        // this.containerEl.children[1] は、ビューのコンテンツ部分を指します。
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h2", { text: this.getListTitle() });

        this.fileListEl = container.createEl("div", { cls: "file-list" });
        
        // 初回読み込み
        this.loadFiles();

        // ファイルシステムの変更を監視し、ファイルリストを更新します。
        // metadataCacheの変更、ファイルのリネーム、削除、作成を監視対象とします。
        this.registerEvent(this.app.metadataCache.on('changed', this.requestRefresh.bind(this)));
        this.registerEvent(this.app.vault.on('rename', this.requestRefresh.bind(this)));
        this.registerEvent(this.app.vault.on('delete', this.requestRefresh.bind(this)));
        this.registerEvent(this.app.vault.on('create', this.requestRefresh.bind(this)));
    }

    async onClose() {
        // このビューに関連付けられたイベントリスナーは onOpen で
        // registerEvent を使用して登録されているため、Obsidianが自動的にクリーンアップします。
        // そのため、ここで明示的にリスナーを解除する必要はありません。
        if (this.refreshDebounceTimer) {
            window.clearTimeout(this.refreshDebounceTimer);
        }
    }
    
    /**
     * 短期間に何度も更新が走るのを防ぐため、デバウンスをかけて更新を要求します。
     */
    private requestRefresh() {
        if (this.refreshDebounceTimer) {
            window.clearTimeout(this.refreshDebounceTimer);
        }
        this.refreshDebounceTimer = window.setTimeout(() => this.loadFiles(), 250);
    }

    /**
     * 指定されたタグを持つファイルを検索し、ビューを更新します。
     */
    private async loadFiles() {
        this.fileListEl.empty();
        const tagsToWatch = this.getTagsToWatch().map(t => t.toLowerCase());

        if (tagsToWatch.length === 0) {
            this.fileListEl.createEl("p", { text: "監視対象のタグが指定されていません。" });
            return;
        }

        const markdownFiles = this.app.vault.getMarkdownFiles();
        const matchedFiles: TFile[] = [];

        for (const file of markdownFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.tags) {
                const fileTags = (Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : String(cache.frontmatter.tags).split(' ').map(tag => tag.trim()))
                    .map((tag: string) => tag.toLowerCase());

                if (tagsToWatch.some(watchTag => fileTags.includes(watchTag))) {
                    matchedFiles.push(file);
                }
            }
        }

        // ファイル名でソート
        matchedFiles.sort((a, b) => a.basename.localeCompare(b.basename));

        if (matchedFiles.length === 0) {
            this.fileListEl.createEl("p", { text: `${this.getDisplayText()}が見つかりません。` });
            return;
        }

        for (const file of matchedFiles) {
            // 各ファイルアイテムのコンテナを作成
            const itemEl = this.fileListEl.createEl("div", { cls: "file-item" });
            // サブクラスのレンダリングロジックを呼び出し
            this.renderFileItem(file, itemEl);
        }
    }
}
