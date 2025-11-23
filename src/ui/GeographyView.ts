import { TFile } from "obsidian";
import { TagView } from "./TagView";

export const GEOGRAPHY_VIEW_TYPE = "novelaid-geography-view";
export const GEOGRAPHY_VIEW_ICON = "map";

export class GeographyView extends TagView {

    getViewType() {
        return GEOGRAPHY_VIEW_TYPE;
    }

    getDisplayText() {
        return "地理ビュー";
    }
    
    getIcon() {
        return GEOGRAPHY_VIEW_ICON;
    }

    protected getTagsToWatch(): string[] {
        return ['Geography', '地理', '地名', 'Geo', 'places'];
    }

    protected getListTitle(): string {
        return "地理一覧";
    }

    protected renderFileItem(file: TFile, itemEl: HTMLElement): void {
        itemEl.createEl("span", { text: file.basename, cls: "geography-name" });
        itemEl.onclick = async () => {
            await this.app.workspace.openLinkText(file.path, file.basename, true);
        };
    }
}
