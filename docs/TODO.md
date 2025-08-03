# TODOリスト


## 現在の作業

- [ ] **コンテキスト取得処理のリファクタリング**
    - [ ] `src/services/obsidianContextService.ts` を作成
    - [ ] 既存のコンテキスト取得処理を新サービスに移行
    - [ ] 関連モジュールを新サービスを利用するよう修正


## 次回作業予定

- [ ] **Gemini AIモデル選択機能の実装**
    - [ ] `src/novelaidToolsSettings.ts` に `geminiModel` と `customGeminiModel` を追加
    - [ ] `src/novelaidToolsSettingsTab.ts` にモデル選択用ドロップダウンとカスタム入力テキストボックスを追加
    - [ ] `src/services/geminiService.ts` で設定されたモデル名を参照するように修正
- [ ] ChatViewのUI・機能拡充（AI応答の表示、履歴管理など）
- [ ] Gemini APIの高度な活用（レビュー・校正・JSONレスポンス等の拡張）
- [ ] 校正機能のUIデザイン改善（縦並びレイアウト・色分け等の検討）
- [ ] ユーザーマニュアル（`docs/マニュアル.md`）の作成
- [ ] 仕様書・設計書の充実（`docs/プラグイン仕様書.md` ほか）