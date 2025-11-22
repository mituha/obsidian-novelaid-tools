# TODOリスト

## 完了した作業

### 日付挿入機能の追加

- 右クリックのコンテキストメニューにDatePickerによる日付入力の機能を追加しました。
- 選択した日付を `YYYY/MM/DD(曜日)` 形式でカーソル位置に挿入します。
- エディタの選択範囲から日付（例: `YYYY`, `YYYY/MM`, `YYYY-MM`, `YYYY/MM/DD`, `YYYY-MM-DD`）を抽出し、Date Pickerの初期値として設定します。

## 次回作業予定

- [ ] **物語の構成分析機能の実装**
    - [ ] AIプロンプトとJSONスキーマの設計 (`docs/AIプロンプト仕様書_物語構成分析.md` を作成)
    - [ ] `src/services/AiOrchestratorService.ts` に `analyzeStoryStructure(text: string)` メソッドを追加
    - [ ] `src/main.ts` にコマンド「物語の構成を分析する」を追加
    - [ ] `src/ui/ChatView.ts` に分析結果を整形して表示する機能を追加
    - [ ] `styles.css` に分析結果表示用のスタイルを追加
- [ ] **地理ビューの実装**
    - [x] `docs/地理ビュー.md` の作成
    - [ ] `src/ui/GeographyView.ts` の作成
    - [ ] `main.ts` に地理ビューを登録する処理を追加
    - [ ] `styles.css` に地理ビュー用のスタイルを追加
- [ ] **コンテキスト取得処理のリファクタリング**
    - [ ] `src/services/obsidianContextService.ts` を作成
    - [ ] 既存のコンテキスト取得処理を新サービスに移行
    - [ ] 関連モジュールを新サービスを利用するよう修正
- [ ] ChatViewのUI・機能拡充（AI応答の表示、履歴管理など）
- [ ] Gemini APIの高度な活用（レビュー・校正・JSONレスポンス等の拡張）
- [ ] 校正機能のUIデザイン改善（縦並びレイアウト・色分け等の検討）
- [ ] ユーザーマニュアル（`docs/マニュアル.md`）の作成
- [ ] 仕様書・設計書の充実（`docs/プラグイン仕様書.md` ほか）
