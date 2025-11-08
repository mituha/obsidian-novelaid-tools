import { ItemView, WorkspaceLeaf, TFile } from "obsidian";

export const CHARACTER_VIEW_TYPE = "novelaid-character-view";
export const CHARACTER_VIEW_ICON = "users";

export class CharacterView extends ItemView {
    private characterListEl: HTMLElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return CHARACTER_VIEW_TYPE;
    }

    getDisplayText() {
        return "キャラクタービュー";
    }

    getIcon() {
        return CHARACTER_VIEW_ICON;
    }


    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h2", { text: "キャラクター一覧" });

        this.characterListEl = container.createEl("div", { cls: "character-list" });
        this.loadCharacters();

        // ファイルの変更を監視し、キャラクターリストを更新
        this.app.workspace.on("file-open", this.loadCharacters.bind(this));
        this.app.vault.on("modify", this.loadCharacters.bind(this));
        this.app.vault.on("create", this.loadCharacters.bind(this));
        this.app.vault.on("delete", this.loadCharacters.bind(this));
        this.app.vault.on("rename", this.loadCharacters.bind(this));
    }

    async onClose() {
        // イベントリスナーの解除
        this.app.workspace.off("file-open", this.loadCharacters.bind(this));
        this.app.vault.off("modify", this.loadCharacters.bind(this));
        this.app.vault.off("create", this.loadCharacters.bind(this));
        this.app.vault.off("delete", this.loadCharacters.bind(this));
        this.app.vault.off("rename", this.loadCharacters.bind(this));
    }

    private async loadCharacters() {
        this.characterListEl.empty();
        const characterTags = ['Character', '登場人物', '人物']; // 固定タグ

        const markdownFiles = this.app.vault.getMarkdownFiles();
        const characters: TFile[] = [];

        for (const file of markdownFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.tags) {
                const tags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags.map((tag: string) => tag.toLowerCase()) 
                    : String(cache.frontmatter.tags).split(' ').map(tag => tag.toLowerCase());

                if (characterTags.some(ct => tags.includes(ct.toLowerCase()))) {
                    characters.push(file);
                }
            }
        }

        // ファイル名でソート
        characters.sort((a, b) => a.basename.localeCompare(b.basename));

        if (characters.length === 0) {
            this.characterListEl.createEl("p", { text: "キャラクターが見つかりません。" });
            return;
        }

        for (const characterFile of characters) {
            const charEl = this.characterListEl.createEl("div", { cls: "character-item" });
            charEl.createEl("span", { text: characterFile.basename, cls: "character-name" });
            charEl.onclick = async () => {
                await this.app.workspace.openLinkText(characterFile.path, characterFile.basename, true);
            };
        }
    }
}
