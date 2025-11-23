import { TFile } from "obsidian";
import { TagView } from "./TagView";

export const PLOT_VIEW_TYPE = "novelaid-plot-view";
export const PLOT_VIEW_ICON = "milestone";

export class PlotView extends TagView {

    getViewType() {
        return PLOT_VIEW_TYPE;
    }

    getDisplayText() {
        return "プロットビュー";
    }

    getIcon() {
        return PLOT_VIEW_ICON;
    }

    protected getTagsToWatch(): string[] {
        return ['Plot', 'プロット', 'あらすじ'];
    }

    protected getListTitle(): string {
        return "プロット一覧";
    }

    protected renderFileItem(file: TFile, itemEl: HTMLElement): void {
        itemEl.createEl("span", { text: file.basename, cls: "plot-name" });
        itemEl.onclick = async () => {
            await this.app.workspace.openLinkText(file.path, file.basename, true);
        };
    }
}
