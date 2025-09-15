# AIプロンプト仕様書: 物語構成分析

## 1. 概要

この仕様書は、ユーザーが提供した文章の物語構成を分析し、評価と改善点を提示するためのAIプロンプトと、AIからのレスポンスとして期待するJSON形式を定義する。

## 2. 目的

-   文章が物語の基本要素（5W1H、起承転結）をどの程度満たしているかを客観的に評価する。
-   構成上の弱点や欠けている要素を具体的に指摘し、改善のためのヒントを提供する。
-   執筆者が自身のプロットや文章を多角的に見直すきっかけを作る。

## 3. AIへの指示（プロンプト）

```text
あなたはプロの小説編集者です。以下の文章を分析し、物語の構成要素がどの程度満たされているかを評価してください。

評価項目は「5W1H」と「起承転結」です。
それぞれの項目について、1から5の5段階で評価し、その評価の理由と具体的な改善案を日本語で記述してください。

レスポンスは必ず指定されたJSON形式で返してください。

---

{text}
```

## 4. AIからのレスポンス（JSONスキーマ）

AIには、以下のJSONスキーマに従った形式でレスポンスを返すように要求する。

```json
{
  "analysis": {
    "fiveW1H": {
      "who": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "when": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "where": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "what": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "why": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "how": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      }
    },
    "kishotenketsu": {
      "ki": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "sho": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "ten": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      },
      "ketsu": {
        "rating": "number (1-5)",
        "reason": "string",
        "suggestion": "string"
      }
    }
  },
  "summary": {
    "overallRating": "number (1-5)",
    "positiveFeedback": "string",
    "improvementPoints": "string"
  }
}
```

## 5. 各項目の説明

-   **rating**: 評価（1: 不足, 2: やや不足, 3: 普通, 4: 良好, 5: 非常に良い）
-   **reason**: なぜその評価になったのかの具体的な理由。
-   **suggestion**: 評価を改善するための具体的な提案。
-   **summary**:
    -   **overallRating**: 全体の構成に対する総合評価。
    -   **positiveFeedback**: 全体を通して良かった点。
    -   **improvementPoints**: 総合的に見て、最も改善すべき点。
