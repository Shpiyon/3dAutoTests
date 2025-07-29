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
}

interface AIConfig {
  provider?: AIProvider;
  model?: AIModel;
  maxTokens?: number;
}

export class AIScreenshotAnalyzer {
  // Main entry point for screenshot analysis
  static async analyze3DVisualizationPage(
    base64Image: string,
    config?: AIConfig
  ): Promise<ScreenshotAnalysisResult> {
    const { provider, model, maxTokens } = { ...this.getDefaults(), ...config };

    const prompt = `Analyze this 3D real estate website screenshot for:
${
  process.env.CI === "true"
    ? `NOTE: This is an ELEMENT screenshot from CI environment - some UI elements may be cropped or missing from view.
Focus on what IS visible in the screenshot:
1. Element-specific functionality and rendering
2. Visual quality of the captured element
3. Any visible layout or styling issues
4. Content loading and display within the element bounds`
    : `1. Navigation menu visibility and alignment
2. 3D canvas/viewer loading and display
3. Layout quality and visual bugs
4. Overall user experience`
}

CRITICAL: You MUST respond EXACTLY in this format (no deviation allowed):
RESULT: [PASS or FAIL]
SCORE: [0-100]
ISSUES: [issues list or "none"]
SEVERITY: [low, medium, high, or critical]
ANALYSIS: [explanation]

Example:
RESULT: PASS
SCORE: 85
ISSUES: Navigation slightly misaligned
SEVERITY: low
ANALYSIS: Website loads correctly with good 3D visualization but has minor navigation issues.

Any response not in this exact format will be rejected.`;

    console.log(`🤖 AI Analysis: ${provider} (${model})`);

    try {
      const analysis = await this.callAPI(
        provider,
        model,
        base64Image,
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

  // API calls to Claude or OpenAI
  private static async callAPI(
    provider: AIProvider,
    model: AIModel,
    base64Image: string,
    prompt: string,
    maxTokens: number
  ): Promise<string> {
    const apiKey =
      provider === AI_PROVIDERS.CLAUDE
        ? process.env.CLAUDE_API_KEY
        : process.env.OPENAI_API_KEY;

    if (!apiKey) throw new Error("No API key provided");

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
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
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
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/png;base64,${base64Image}`,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok)
        throw new Error(`OpenAI API error: ${response.statusText}`);
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }

  // Create result object from AI response
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

    // Parse structured response (REQUIRED format)
    const resultMatch = analysis.match(/RESULT:\s*(PASS|FAIL)/i);
    const scoreMatch = analysis.match(/SCORE:\s*(\d+)/i);
    const issuesMatch = analysis.match(/ISSUES:\s*([^\n]+)/i);
    const severityMatch = analysis.match(
      /SEVERITY:\s*(low|medium|high|critical)/i
    );

    // If AI didn't follow the required format, treat as error
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

    return { isValid, analysis, issues, score, model, severity };
  }
}
