import { App, Modal, Setting } from 'obsidian';

/**
 * 日付入力を求めるモーダルダイアログ。
 * ユーザーが選択した日付をコールバック経由で返します。
 */
export class DatePickerModal extends Modal {
    // ユーザーが日付を選択したときに呼ばれるコールバック
    private onSubmit: (date: string) => void;
    // 初期表示する日付 (YYYY-MM-DD形式)
    private initialDate: string | undefined;
    // 現在選択されている日付
    private selectedDateValue: string;

    /**
     * @param app ObsidianのAppインスタンス
     * @param onSubmit ユーザーが日付を選択したときのコールバック関数
     * @param initialDate オプション: 初期表示する日付 (YYYY-MM-DD形式)。指定がなければ現在の日付が使われます。
     */
    constructor(app: App, onSubmit: (date: string) => void, initialDate?: string) {
        super(app);
        this.onSubmit = onSubmit;
        this.initialDate = initialDate;
        this.selectedDateValue = initialDate || new Date().toISOString().slice(0, 10);
    }

    /**
     * モーダルが表示されたときに呼ばれるライフサイクルメソッド。
     * UIの構築はここで行います。
     */
    onOpen() {
        const { contentEl } = this;

        // モーダルのタイトルを設定
        contentEl.createEl('h2', { text: '日付を選択' });

        // 日付入力用の`<input type="date">`を作成
        const dateInput = contentEl.createEl('input', { type: 'date' });
        
        // 初期日付が有効であればそれを設定、そうでなければ現在の日付を設定
        if (this.initialDate && !isNaN(new Date(this.initialDate).getTime())) {
            dateInput.value = this.initialDate;
        } else {
            dateInput.value = new Date().toISOString().slice(0, 10);
        }
        this.selectedDateValue = dateInput.value;

        // 日付が変更されたら値を保持する
        dateInput.addEventListener('change', () => {
            this.selectedDateValue = dateInput.value;
        });

        // 入力フィールドに自動でフォーカスを当てる
        dateInput.focus();

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
     * 選択された日付でコールバックを呼び出し、モーダルを閉じます。
     */
    private submit() {
        if (this.selectedDateValue) {
            const selectedDate = new Date(this.selectedDateValue);
            // YYYY/MM/DD(曜日) 形式にフォーマット
            const formattedDate = selectedDate.getFullYear() + '/' +
                                  String(selectedDate.getMonth() + 1).padStart(2, '0') + '/' +
                                  String(selectedDate.getDate()).padStart(2, '0') +
                                  '(' + selectedDate.toLocaleString('ja-JP', { weekday: 'short' }) + ')';
            
            this.onSubmit(formattedDate);
        }
        this.close();
    }
}
