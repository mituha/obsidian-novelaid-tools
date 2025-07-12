import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import { NovelaidToolsPluginSettings } from "../novelaidToolsSettings";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;
let pluginSettings: NovelaidToolsPluginSettings | null = null;

// --- Agent Definitions ---
const agents = [
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

export const initializeGeminiAI = (apiKey: string, settings: NovelaidToolsPluginSettings): boolean => {
    if (!apiKey || apiKey.trim() === "") {
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
    pluginSettings = settings;
    return true;
};

const checkApiKey = (): boolean => {
    if (!ai) {
        console.error(API_KEY_ERROR_MESSAGE);
        alert(API_KEY_ERROR_MESSAGE);
        return false;
    }
    return true;
};

export const generateChatResponse = async (userInput: string, context: string): Promise<string> => {
    if (!checkApiKey() || !ai) {
        throw new Error(API_KEY_ERROR_MESSAGE);
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
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        return result.text || "AIからの応答が得られませんでした。";
    } catch (error) {
        console.error("Error generating chat response from Gemini:", error);
        throw new Error("AIからの応答の生成に失敗しました。");
    }
};

export const generateReview = async (context: string): Promise<string> => {
    if (!checkApiKey() || !ai) {
        throw new Error(API_KEY_ERROR_MESSAGE);
    }

    // Select a random agent
    const agent = agents[Math.floor(Math.random() * agents.length)];

    const prompt = `${agent.prompt}

# 原稿
---
${context}
---

# 指示
上記の原稿について、あなたのキャラクターとしてレビューを執筆してください。
レビューの**最初の行**は必ず「**評価：★☆☆☆☆**」のように、1～5段階の星評価を記述してください（星の数はあなたの評価に従って変更すること）。
その後の形式は自由です。あなたの個性を存分に発揮した、心のこもったレビューを期待しています。
`;

    try {
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const reviewText = result.text || "AIからの応答が得られませんでした。";
        
        // Prepend the agent's name to the review
        return `**${agent.name}からのレビュー**\n\n${reviewText}`;

    } catch (error) {
        console.error("Error generating review from Gemini:", error);
        throw new Error("AIレビューの生成に失敗しました。");
    }
};