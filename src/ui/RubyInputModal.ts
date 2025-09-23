import { App, Modal, Setting } from 'obsidian';

/**
 * ルビ入力を求めるモーダルダイアログ。
 * ユーザーが入力したルビ文字列をコールバック経由で返します。
 */
export class RubyInputModal extends Modal {
    // 入力されたルビ文字列
    private rubyText: string;
    // ユーザーが「決定」を押したときに呼ばれるコールバック
    private onSubmit: (rubyText: string) => void;

    /**
     * @param app ObsidianのAppインスタンス
     * @param onSubmit ユーザーがルビを入力して「決定」を押したときのコールバック関数
     */
    constructor(app: App, onSubmit: (rubyText: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.rubyText = '';
    }

    /**
     * モーダルが表示されたときに呼ばれるライフサイクルメソッド。
     * UIの構築はここで行います。
     */
    onOpen() {
        const { contentEl } = this;

        // モーダルのタイトルを設定
        contentEl.createEl('h2', { text: 'ルビを入力' });

        // ルビ入力用のテキストフィールド
        new Setting(contentEl)
            .setName('ルビ')
            .addText(text => {
                text.setPlaceholder('るび')
                    .onChange(value => {
                        this.rubyText = value;
                    });
                // テキストフィールドに自動でフォーカスを当てる
                text.inputEl.focus();
            });

        // 決定・キャンセルボタンの設置
        new Setting(contentEl)
            .addButton(btn =>
                btn
                    .setButtonText('決定')
                    .setCta() // Primary action style
                    .onClick(() => {
                        this.submit();
                    }))
            .addButton(btn =>
                btn
                    .setButtonText('キャンセル')
                    .onClick(() => {
                        this.close();
                    }));
        
        // Enterキーで決定できるようにイベントリスナーを追加
        contentEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.submit();
            }
        });
    }

    /**
     * モーダルが閉じる前に呼ばれるライフサイクルメソッド。
     */
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    /**
     * フォームの送信処理。
     * 入力値でコールバックを呼び出し、モーダルを閉じます。
     */
    private submit() {
        // 入力値が空でなければコールバックを実行
        if (this.rubyText.trim()) {
            this.onSubmit(this.rubyText);
        }
        this.close();
    }
}
