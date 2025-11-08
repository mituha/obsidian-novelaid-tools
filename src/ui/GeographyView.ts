import { ItemView, WorkspaceLeaf, TFile } from "obsidian";

export const GEOGRAPHY_VIEW_TYPE = "novelaid-geography-view";
export const GEOGRAPHY_VIEW_ICON = "map";

export class GeographyView extends ItemView {
    private geographyListEl: HTMLElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return GEOGRAPHY_VIEW_TYPE;
    }

    getDisplayText() {
        return "地理ビュー";
    }
    
    getIcon() {
        return GEOGRAPHY_VIEW_ICON;
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl("h2", { text: "地理一覧" });

        this.geographyListEl = container.createEl("div", { cls: "geography-list" });
        this.loadGeographies();

        // ファイルの変更を監視し、地理リストを更新
        this.app.workspace.on("file-open", this.loadGeographies.bind(this));
        this.app.vault.on("modify", this.loadGeographies.bind(this));
        this.app.vault.on("create", this.loadGeographies.bind(this));
        this.app.vault.on("delete", this.loadGeographies.bind(this));
        this.app.vault.on("rename", this.loadGeographies.bind(this));
    }

    async onClose() {
        // イベントリスナーの解除
        this.app.workspace.off("file-open", this.loadGeographies.bind(this));
        this.app.vault.off("modify", this.loadGeographies.bind(this));
        this.app.vault.off("create", this.loadGeographies.bind(this));
        this.app.vault.off("delete", this.loadGeographies.bind(this));
        this.app.vault.off("rename", this.loadGeographies.bind(this));
    }

    private async loadGeographies() {
        this.geographyListEl.empty();
        const geographyTags = ['Geography', '地理', '地名', 'Geo']; // 固定タグ

        const markdownFiles = this.app.vault.getMarkdownFiles();
        const geographies: TFile[] = [];

        for (const file of markdownFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.tags) {
                const tags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags.map((tag: string) => tag.toLowerCase()) 
                    : String(cache.frontmatter.tags).split(' ').map(tag => tag.toLowerCase());

                if (geographyTags.some(gt => tags.includes(gt.toLowerCase()))) {
                    geographies.push(file);
                }
            }
        }

        // ファイル名でソート
        geographies.sort((a, b) => a.basename.localeCompare(b.basename));

        if (geographies.length === 0) {
            this.geographyListEl.createEl("p", { text: "地名が見つかりません。" });
            return;
        }

        for (const geographyFile of geographies) {
            const geoEl = this.geographyListEl.createEl("div", { cls: "geography-item" });
            geoEl.createEl("span", { text: geographyFile.basename, cls: "geography-name" });
            geoEl.onclick = async () => {
                await this.app.workspace.openLinkText(geographyFile.path, geographyFile.basename, true);
            };
        }
    }
}
