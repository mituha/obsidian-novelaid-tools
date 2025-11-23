# novelaid-tools / 小説執筆支援ツール

[![Release Obsidian Plugin](https://github.com/mituha/obsidian-novelaid-tools/actions/workflows/release.yml/badge.svg)](https://github.com/mituha/obsidian-novelaid-tools/actions/workflows/release.yml)

**novelaid-tools**は、Obsidianで小説を執筆するための支援ツールです。  
作者がカクヨムへの投稿作品の執筆のために使用するために開発しています。

## ✨ 主な機能

*   **カクヨム記法のサポート**:
    *   文章にルビ（ふりがな）や傍点を付与できる[カクヨム記法](https://kakuyomu.jp/help/entry/notation)をサポート。閲覧モードで自動的にレンダリングされます。
        *   ルビ: `|漢字《かんじ》` または `漢字《かんじ》`
        *   傍点: `《《傍点》》`
*   **コンテキストメニューからの高速入力**:
    *   **ルビを振る**: テキストを選択して右クリックするだけで、簡単に対話形式でルビを挿入できます。
    *   **日付を挿入**: 右クリックメニューから日付ピッカーを開き、`YYYY/MM/DD(曜日)` 形式で日付を素早く挿入できます。執筆日誌や時系列のメモに便利です。
*   **キャラクター/地理ビュー**:
    *   サイドバーにキャラクターや地名の一覧を表示し、関連ファイルへ素早くアクセスできます。執筆中の設定確認や移動がスムーズになります。
*   **プロットビュー**:
    *   サイドバーにプロットファイルの一覧を表示し、関連ファイルへ素早くアクセスできます。物語の構成や流れの確認に便利です。

*   **AI執筆支援 (Gemini API)**:
    *   **AIチャット**: 執筆中の文章をコンテキストとして、AIと対話しながらアイデア出しや推敲ができます。
    *   **AIレビュー**: 個性豊かなAIエージェントが、あなたの作品をランダムにレビュー。思わぬ視点からのフィードバックが得られます。

## 各ビューへのファイルの登録方法

キャラクター、地理、プロットの各ビューにファイルを表示させるには、ファイルの先頭にある**YAMLフロントマター**に、それぞれの機能に応じたタグを追加する必要があります。

**例:** キャラクター「猫乃わん太」のファイルを作成する場合

```yaml
---
tags:
  - Character
  - 登場人物
---

# 猫乃わん太

...キャラクターの詳細...
```

このファイルを保存すると、サイドバーのキャラクタービューに「猫乃わん太」が自動的に表示されます。

**各ビューに対応するタグ:**

*   **キャラクタービュー**: `Character`, `登場人物`, `人物`
*   **地理ビュー**: `Geography`, `地理`, `地名`, `Geo`, `places`
*   **プロットビュー**: `Plot`, `プロット`, `あらすじ`

## ⚙️ 設定項目

プラグイン設定画面では、以下の項目をカスタマイズできます。

*   **Google Gemini API Key**: (必須) Gemini AIを利用するためのAPIキー。APIキーは [Google AI Studio](https://aistudio.google.com/apikey) から取得できます。
*   **Gemini AI Model**: AI機能で使用するモデルを選択します。（例: `gemini-1.5-flash`）

## 📦 インストール方法

### 手動

1.  このリポジトリの[Releasesページ](https://github.com/mituha/obsidian-novelaid-tools/releases)から最新版のzipファイルをダウンロードします。
2.  ObsidianのVault（保管庫）にある `.obsidian/plugins/` ディレクトリ内に `obsidian-novelaid-tools` という名前の新しいフォルダを作成します。
3.  ダウンロードしたzipファイルを解凍して、含まれる3つのファイルを、作成した `obsidian-novelaid-tools` フォルダに移動します。
4.  Obsidianを再起動し、`設定` > `コミュニティプラグイン` から「Novelaid Tools」を有効化します。
5.  設定画面でAPIキーを入力すれば完了です。

## 🤝 貢献

バグ報告や機能提案は、このリポジトリの[Issues](https://github.com/mituha/obsidian-novelaid-tools/issues)までお気軽にどうぞ。

## 📝 ライセンス

[MIT License](LICENSE)