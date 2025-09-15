import { NovelaidToolsPluginSettings } from "../novelaidToolsSettings";
import { AiFunction, ChatMessage, IGenericAiProvider } from './providers/IGenericAiProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { LMStudioProvider } from './providers/LMStudioProvider';
import { Notice } from 'obsidian';

export interface ProofreadResult {
    before: string;
    after: string;
    reason: string;
}

export class AiOrchestratorService {
    private provider: IGenericAiProvider | null;
    private settings: NovelaidToolsPluginSettings;

    constructor(settings: NovelaidToolsPluginSettings) {
        this.settings = settings;
        this.provider = this.createProvider();
    }

    private createProvider(): IGenericAiProvider | null {
        console.log("createProvider ", this.settings.aiProvider)
        try {
            if (this.settings.aiProvider === 'gemini') {
                return new GeminiProvider(this.settings.gemini);
            } else if (this.settings.aiProvider === 'lmstudio') {
                return new LMStudioProvider(this.settings.lmstudio);
            } else {
                return null;
            }
        } catch (error) {
            console.error("AIプロバイダーの初期化に失敗しました。設定を確認してください。");
            console.error(error);
            return null;
        }
    }

    public onSettingsChanged(): void {
        try {
            this.provider = this.createProvider();
        } catch (error) {
            new Notice("AIプロバイダーの初期化に失敗しました。設定を確認してください。");
            console.error(error);
        }
    }

    public getActiveProvider(): IGenericAiProvider | null {
        return this.provider;
    }




    public generateChatResponse = async (userInput: string, context: string): Promise<string> => {
        if (!this.provider) {
            throw new Error("AIプロバイダーが初期化されていません。");
        }
        const prompt = `あなたは優秀な文章アシスタントです。
ユーザーは以下の文章を編集中です

---
${context}
---

この文脈を踏まえて、ユーザーの次の質問に日本語で回答してください。

質問: "${userInput}"
`;

        try {
            const result = await this.provider.generateChatResponse([{ role: "user", parts: [{ text: prompt }] }]);
            return result.parts.map(part => part.text).join('\n') || "AIからの応答が得られませんでした。";
        } catch (error) {
            console.error("Error generating chat response from Gemini:", error);
            throw new Error("AIからの応答の生成に失敗しました。");
        }
    };



    // --- Agent Definitions ---
    private agents = [
        {
            name: "熱血編集者・轟",
            prompt: `
あなたは、熱血編集者の「轟（とどろき）」だ。
男気あふれる親友のように、作家の可能性を信じ、熱く、力強く励ますことを信条としている。
以下の原稿を読み、作家の魂を揺さぶるようなレビューを書いてくれ。

- 口調は「～だぜ！」「～だろう！」「最高だ！」のような、情熱的で少し荒っぽい感じ。
- 良い点は心の底から褒めちぎり、改善点は「もっとこうすれば、あんたの作品は化ける！」という期待を込めて指摘する。
- 形式ばったレビューではなく、作家への熱いメッセージとして語りかけること。
`
        },
        {
            name: "理論派アナリスト・氷室",
            prompt: `
あなたは、理論派アナリストの「氷室（ひむろ）」です。
あらゆる文学作品の構造を分析し、データと論理に基づいて的確なアドバイスを行うことを得意としています。
以下の原稿を冷静に分析し、論理的なレビューを記述してください。

- 口調は「～です。」「～と分析します。」「～という改善の余地があります。」のように、冷静で丁寧なもの。
- 評価は客観的な視点で行い、プロットの整合性、キャラクターアーク、伏線の配置などを中心に分析する。
- 感想よりも、具体的な改善案とその論理的根拠を提示することに重点を置く。
`
        },
        {
            name: "新人編集者・春風",
            prompt: `
あなたは、新人編集者の「春風（はるかぜ）」です。
作家のファン第一号として、その作品の魅力を読者目線で語り、一緒に作品を育てていくことを喜びとしています。
以下の原稿を読み、読者としての素直な感想と応援の気持ちを伝えてください。

- 口調は「～ですね！」「～がすごく好きです！」「もしよければ、～してみるのはどうでしょうか？」のように、親しみやすく、腰が低い感じ。
- 難しい批評ではなく、「このキャラクターのこのセリフにきゅんとしました！」「次の展開が気になります！」といった、読者としての興奮や感想を伝える。
- 改善点の指摘も、あくまで「一読者としては、こうだったらもっと嬉しいかも…」という提案の形で優しく伝えること。
`
        },
        {
            name: "ベテラン校正者・静",
            prompt: `
あなたは、ベテラン校正者の「静（しずか）」です。
一字一句にこだわり、文章の正確さと美しさを追求する職人です。
以下の原稿を読み、文章表現に特化した、厳しくも愛のあるレビューをお願いします。

- 口調は「～です。」「～の部分、表現が冗長です。」「推敲の余地があります。」のように、無駄がなく、的確なもの。
- 誤字脱字、てにおはの誤用、比喩表現の妥当性、リズムなど、文章の細部に焦点を当てる。
- 物語の内容には深入りせず、あくまで「文章の完成度」という観点から評価と指摘を行う。
`
        }
    ];

    public generateReview = async (context: string): Promise<string> => {
        if (!this.provider) {
            throw new Error("AIプロバイダーが初期化されていません。");
        }

        // Select a random agent
        const agent = this.agents[Math.floor(Math.random() * this.agents.length)];

        const history: ChatMessage[] = [{ role: 'system', parts: [{ text: agent.prompt }] }];


        const prompt = `
# 原稿
---
${context}
---

# 指示
上記の原稿について、あなたのキャラクターとしてレビューを執筆してください。
レビューの**最初の行**は必ず「**評価：★☆☆☆☆**」のように、1～5段階の星評価を記述してください（星の数はあなたの評価に従って変更すること）。
その後の形式は自由です。あなたの個性を存分に発揮した、心のこもったレビューを期待しています。
`;
        history.push({ role: 'user', parts: [{ text: prompt }] });

        try {
            const result = await this.provider.generateChatResponse(history);

            const reviewText = result.parts.map(part => part.text).join('\n') || "AIからの応答が得られませんでした。";

            // Prepend the agent's name to the review
            return `**${agent.name}からのレビュー**\n${reviewText}`;
        } catch (error) {
            console.error("Error generating review from Gemini:", error);
            throw new Error("AIレビューの生成に失敗しました。");
        }
    };

public generateProofread = async (context: string): Promise<ProofreadResult[]> => {
            if (!this.provider) {
            throw new Error("AIプロバイダーが初期化されていません。");
        }

    const prompt = `あなたは優秀な校正者です。
以下の文章を校正し、誤字脱字や不自然な表現を修正してください。
修正箇所のみを、以下のJSON形式の配列で返却してください。修正がない場合は空の配列を返却してください。

- 修正前の文章は before キーに、修正後の文章は after キーに、修正理由は reason キーに格納してください。
- 修正理由には「誤字」「てにおはの誤り」「より自然な表現へ変更」のように、具体的な理由を簡潔に記述してください。
- 文脈を維持するため、修正箇所は単語や文節ではなく、ある程度の長さの文章を含めてください。
- JSON以外の説明や前置きは一切不要です。

[
  {
    "before": "修正前の文章の一部",
    "after": "修正後の文章の一部",
    "reason": "修正理由（例：誤字）"
  }
]

# 原稿
---
${context}
---
`;

    try {
        const result = await this.provider.generateStructuredResponse(prompt, {
            type: "array",
            items: {
                type: "object",
                properties: {
                    before: { type: "string" },
                    after: { type: "string" },
                    reason: { type: "string" },
                },
                required: ["before", "after", "reason"],
            },
        });
        return result as ProofreadResult[];
    } catch (error) {
        console.error("Error generating proofread from Gemini:", error);
        throw new Error("AI校正の生成に失敗しました。");
    }
};

public async analyze5W1H(text: string): Promise<any> {
    if (!this.provider) {
        throw new Error("AIプロバイダーが初期化されていません。");
    }

    const prompt = `あなたはプロの小説編集者です。以下の文章を分析し、物語の構成要素「5W1H」がどの程度満たされているかを評価してください。

各項目について、1から5の5段階で評価し、その評価の理由と具体的な改善案を日本語で記述してください。
最後に、総合評価と良かった点、改善点を記述してください。
レスポンスは必ず指定されたJSON形式で返してください。

---
${text}
---
`;

    const schema = {
        type: "object",
        properties: {
            fiveW1H: {
                type: "object",
                properties: {
                    who: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    when: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    where: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    what: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    why: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    how: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                },
            },
            summary: {
                type: "object",
                properties: {
                    overallRating: { type: "number" },
                    positiveFeedback: { type: "string" },
                    improvementPoints: { type: "string" },
                },
                required: ["overallRating", "positiveFeedback", "improvementPoints"],
            },
        },
    };

    try {
        return await this.provider.generateStructuredResponse(prompt, schema);
    } catch (error) {
        console.error("Error generating 5W1H analysis:", error);
        throw new Error("5W1H分析に失敗しました。");
    }
}

public async analyzeKishotenketsu(text: string): Promise<any> {
    if (!this.provider) {
        throw new Error("AIプロバイダーが初期化されていません。");
    }

    const prompt = `あなたはプロの小説編集者です。以下の文章を分析し、物語の構成要素「起承転結」がどの程度満たされているかを評価してください。

各項目について、1から5の5段階で評価し、その評価の理由と具体的な改善案を日本語で記述してください。
最後に、総合評価と良かった点、改善点を記述してください。
レスポンスは必ず指定されたJSON形式で返してください。

---
${text}
---
`;

    const schema = {
        type: "object",
        properties: {
            kishotenketsu: {
                type: "object",
                properties: {
                    ki: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    sho: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    ten: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                    ketsu: { type: "object", properties: { rating: { type: "number" }, reason: { type: "string" }, suggestion: { type: "string" } }, required: ["rating", "reason", "suggestion"] },
                },
            },
            summary: {
                type: "object",
                properties: {
                    overallRating: { type: "number" },
                    positiveFeedback: { type: "string" },
                    improvementPoints: { type: "string" },
                },
                required: ["overallRating", "positiveFeedback", "improvementPoints"],
            },
        },
    };

    try {
        return await this.provider.generateStructuredResponse(prompt, schema);
    } catch (error) {
        console.error("Error generating Kishotenketsu analysis:", error);
        throw new Error("起承転結分析に失敗しました。");
    }
}

}
