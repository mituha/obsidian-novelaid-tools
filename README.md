# novelaid-tools / 小説執筆支援ツール

**novelaid-tools**は、Obsidianで小説を執筆するための支援ツールです。  
作者がカクヨムへの投稿作品の執筆のために使用するために開発しています。

## ✨ 主な機能

*   **カクヨム記法のサポート**:
    *   文章にルビ（ふりがな）や傍点を付与できる[カクヨム記法](https://kakuyomu.jp/help/entry/notation)をサポート。表現豊かな記述が可能です。
        *   ルビ: `|漢字《かんじ》` または `漢字《かんじ》`
        *   傍点: `《《傍点》》`

## 🚀 使い方

1.  **APIキーの設定**:
    *   プラグイン設定画面を開き、お使いのGoogle AI (Gemini) のAPIキーを入力してください。APIキーは [Google AI Studio](https://aistudio.google.com/apikey) から取得できます。

## ⚙️ 設定項目

プラグイン設定画面では、以下の項目をカスタマイズできます。

*   **Gemin API Key**: (必須) Gemini AIを利用するためのAPIキー。

//TODO

## 📦 インストール方法

### TODO

Obsidianのコミュニティプラグインには未登録です


### 手動

1.  このリポジトリの[Releasesページ](https://github.com/mituha/novelaid-tools/releases)から最新版のzipファイルをダウンロードします。
2.  ObsidianのVault（保管庫）にある `.obsidian/plugins/` ディレクトリ内に `novelaid-tools` という名前の新しいフォルダを作成します。
3.  ダウンロードしたzipファイルを解凍して、含まれる3つのファイルを、作成した `novelaid-tools` フォルダに移動します。
4.  Obsidianを再起動し、`設定` > `コミュニティプラグイン` から「Novelaid Tools」を有効化します。
5.  設定画面でAPIキーを入力すれば完了です。

## 🤝 貢献

バグ報告や機能提案は、このリポジトリの[Issues](https://github.com/mituha/novelaid-tools/issues)までお気軽にどうぞ。

## 📝 ライセンス

[MIT License](LICENSE)
