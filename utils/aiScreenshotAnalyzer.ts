// AI Models and Types
export const AI_PROVIDERS = { CLAUDE: "claude", OPENAI: "openai" } as const;

export const CLAUDE_MODELS = {
  OPUS_4: "claude-opus-4-20250514",
  SONNET_4: "claude-sonnet-4-20250514",
  SONNET_3_5: "claude-3-5-sonnet-latest",
  HAIKU_3_5: "claude-3-5-haiku-latest",
} as const;

export const OPENAI_MODELS = {
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
} as const;

export type AIProvider = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];
export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];
export type OpenAIModel = (typeof OPENAI_MODELS)[keyof typeof OPENAI_MODELS];
export type AIModel = ClaudeModel | OpenAIModel;

export interface ScreenshotAnalysisResult {
  isValid: boolean;
  analysis: string;
  issues: string[];
  score: number;
  severity?: "low" | "medium" | "high" | "critical";
  model?: string;
  diffImageBase64?: string;
}

interface AIConfig {
  provider?: AIProvider;
  model?: AIModel;
  maxTokens?: number;
}

export class AIScreenshotAnalyzer {
  static async analyze3DVisualizationPage(
    currentImageBase64: string,
    baselineImageBase64: string,
    config?: AIConfig
  ): Promise<ScreenshotAnalysisResult> {
    const { provider, model, maxTokens } = { ...this.getDefaults(), ...config };

    if (!baselineImageBase64) {
      throw new Error(
        "Baseline image is required for AI comparison. Cannot proceed without both images."
      );
    }

    const prompt = `Compare these two 3D real estate website screenshots (baseline vs current) and:

1. Analyze visual differences between the baseline (first image) and current (second image)
2. Identify any regressions, improvements, or changes
3. Generate a visual diff highlighting the differences
4. Assess the impact of changes on user experience

${
  process.env.CI === "true"
    ? `NOTE: These are ELEMENT screenshots from CI environment - focus on visible elements only.`
    : `Focus on: Navigation, 3D canvas, layout quality, and overall UX.`
}

CRITICAL: You MUST respond EXACTLY in this format:
RESULT: [PASS or FAIL]
SCORE: [0-100]
ISSUES: [issues list or "none"]
SEVERITY: [low, medium, high, or critical]
ANALYSIS: [detailed comparison explanation]
DIFF_IMAGE: [base64 encoded image highlighting differences, or "none" if no significant differences]

The DIFF_IMAGE field is optional - only include it if there are meaningful visual differences to highlight. If the images are identical, you may omit this field`;

    console.log(
      `🤖 AI Analysis: ${provider} (${model}) - Comparison Mode (Baseline vs Current)`
    );

    try {
      const analysis = await this.callAPI(
        provider,
        model,
        currentImageBase64,
        baselineImageBase64,
        prompt,
        maxTokens
      );
      return this.createResult(analysis, model);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return message.includes("No API key")
        ? {
            isValid: true,
            analysis: "AI analysis skipped - no API key",
            issues: [],
            score: 75,
            model,
          }
        : this.createResult(message, model, true);
    }
  }

  // Configuration from environment
  private static getDefaults(): Required<AIConfig> {
    const provider =
      (process.env.AI_PROVIDER as AIProvider) || AI_PROVIDERS.CLAUDE;
    const modelString = process.env.AI_MODEL || CLAUDE_MODELS.OPUS_4;
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS || "1000");

    const model =
      provider === AI_PROVIDERS.CLAUDE
        ? Object.values(CLAUDE_MODELS).includes(modelString as ClaudeModel)
          ? (modelString as ClaudeModel)
          : CLAUDE_MODELS.OPUS_4
        : Object.values(OPENAI_MODELS).includes(modelString as OpenAIModel)
        ? (modelString as OpenAIModel)
        : OPENAI_MODELS.GPT_4O;

    return { provider, model, maxTokens };
  }

  private static async callAPI(
    provider: AIProvider,
    model: AIModel,
    currentImageBase64: string,
    baselineImageBase64: string,
    prompt: string,
    maxTokens: number
  ): Promise<string> {
    const apiKey =
      provider === AI_PROVIDERS.CLAUDE
        ? process.env.CLAUDE_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("No API key provided");

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: baselineImageBase64,
            },
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: currentImageBase64,
            },
          },
        ],
      },
    ];

    if (provider === AI_PROVIDERS.CLAUDE) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Claude API Error (${response.status}):`, errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } else {
      const openAIMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${baselineImageBase64}`,
                detail: "high",
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${currentImageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ];

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            messages: openAIMessages,
          }),
        }
      );

      if (!response.ok)
        throw new Error(`OpenAI API error: ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  private static createResult(
    analysis: string,
    model: string,
    isError = false
  ): ScreenshotAnalysisResult {
    if (isError) {
      return {
        isValid: false,
        analysis: `Analysis failed: ${analysis}`,
        issues: ["Service unavailable"],
        score: 0,
        model,
      };
    }

    const resultMatch = analysis.match(/RESULT:\s*(PASS|FAIL)/i);
    const scoreMatch = analysis.match(/SCORE:\s*(\d+)/i);
    const issuesMatch = analysis.match(/ISSUES:\s*([^\n]+)/i);
    const severityMatch = analysis.match(
      /SEVERITY:\s*(low|medium|high|critical)/i
    );
    const diffImageMatch = analysis.match(
      /DIFF_IMAGE:\s*([A-Za-z0-9+/=]+|none)/i
    );

    if (!resultMatch || !scoreMatch || !severityMatch) {
      return {
        isValid: false,
        analysis: `AI response format error: Expected RESULT, SCORE, and SEVERITY fields. Got: ${analysis.substring(
          0,
          200
        )}...`,
        issues: ["Invalid AI response format"],
        score: 0,
        model,
      };
    }

    const isValid = resultMatch[1].toUpperCase() === "PASS";
    const score = parseInt(scoreMatch[1]);
    const severity = severityMatch[1].toLowerCase() as
      | "low"
      | "medium"
      | "high"
      | "critical";
    const issuesText = issuesMatch?.[1] || "";
    const issues = issuesText.toLowerCase().includes("none")
      ? []
      : issuesText
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i.length > 0);

    const diffImageBase64 =
      diffImageMatch && diffImageMatch[1].toLowerCase() !== "none"
        ? diffImageMatch[1]
        : undefined;

    return {
      isValid,
      analysis,
      issues,
      score,
      model,
      severity,
      ...(diffImageBase64 && { diffImageBase64 }),
    };
  }
}
