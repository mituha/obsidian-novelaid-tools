import { TFile } from "obsidian";
import { TagView } from "./TagView";

export const CHARACTER_VIEW_TYPE = "novelaid-character-view";
export const CHARACTER_VIEW_ICON = "users";

export class CharacterView extends TagView {

    getViewType() {
        return CHARACTER_VIEW_TYPE;
    }

    getDisplayText() {
        return "キャラクタービュー";
    }

    getIcon() {
        return CHARACTER_VIEW_ICON;
    }

    protected getTagsToWatch(): string[] {
        return ['Character', '登場人物', '人物'];
    }

    protected renderFileItem(file: TFile, itemEl: HTMLElement): void {
        itemEl.createEl("span", { text: file.basename, cls: "character-name" });
        itemEl.onclick = async () => {
            await this.app.workspace.openLinkText(file.path, file.basename, true);
        };
    }
}
