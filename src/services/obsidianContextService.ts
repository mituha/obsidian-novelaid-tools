import { App, MarkdownView, TFile, TFolder } from 'obsidian';

/**
 * Obsidianのコンテキスト情報（アクティブなファイル、フォルダ内のファイルなど）を
 * 取得するためのサービス。
 */
export class ObsidianContextService {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 現在アクティブなエディタのコンテンツを取得します。
   * @returns アクティブなファイルのコンテンツ。ファイルが開かれていない場合はnull。
   */
  getActiveFileContent(): string | null {
    //メインのエディター部分でのアクティブなleafを確認
    // ルートスプリットの最新のleafを取得
    const rootLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
    const activeView = rootLeaf?.view as MarkdownView;
    if (activeView) {
      return activeView.editor.getValue();
    }
    return null;
  }

  /**
   * 現在アクティブなファイルが格納されているフォルダ内のファイルリストを取得します。
   * @returns ファイルパスの配列。アクティブなファイルがない場合は空の配列。
   */
  async getFilesInCurrentFolder(): Promise<string[]> {
    //メインのエディター部分でのアクティブなleafを確認
    // ルートスプリットの最新のleafを取得
    const rootLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
    const activeView = rootLeaf?.view as MarkdownView;
    if(!activeView) {
      return [];
    }
    const activeFile = activeView.file;
    if (!activeFile) {
      return [];
    }

    const parentFolder = activeFile.parent;
    if (!parentFolder) {
      return [];
    }

    const files = parentFolder.children.filter(
      (child): child is TFile => child instanceof TFile
    );

    return files.map(file => file.path);
  }

  /**
   * 指定されたパスのファイルコンテンツを読み取ります。
   * @param path 読み込むファイルのパス。
   * @returns ファイルのコンテンツ。ファイルが見つからない、または読めない場合はnull。
   */
  async getFileContent(path: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      try {
        return await this.app.vault.read(file);
      } catch (error) {
        console.error(`Error reading file "${path}":`, error);
        return null;
      }
    }
    return null;
  }
}
