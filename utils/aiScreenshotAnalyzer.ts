export interface ScreenshotAnalysisResult {
  isValid: boolean;
  analysis: string;
  issues: string[];
  score: number;
}

export interface ComparisonAnalysisResult extends ScreenshotAnalysisResult {
  comparisonType: "baseline" | "regression";
  visualDifferences: string[];
  regressionSeverity: "low" | "medium" | "high" | "critical";
  baselineMetadata?: {
    createdAt: string;
    browserName: string;
    url: string;
  };
}

export class AIScreenshotAnalyzer {
  private static createErrorResult(
    errorMessage: string
  ): ScreenshotAnalysisResult {
    return {
      isValid: false,
      analysis: `Analysis failed: ${errorMessage}`,
      issues: ["Service unavailable"],
      score: 0,
    };
  }

  private static createSkippedResult(): ScreenshotAnalysisResult {
    return {
      isValid: true,
      analysis: "AI analysis skipped - no API key provided",
      issues: [],
      score: 75,
    };
  }

  static async analyzeWithOpenAI(
    base64Image: string,
    prompt: string
  ): Promise<ScreenshotAnalysisResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return this.createSkippedResult();
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
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
            max_tokens: 1000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      return this.parseAnalysisResult(analysis);
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  static async analyze3DVisualizationPage(
    base64Image: string
  ): Promise<ScreenshotAnalysisResult> {
    const prompt = `
Analyze this 3D real estate website screenshot. Check:
1. Navigation menu visibility and alignment
2. 3D canvas/viewer loading and display
3. Layout quality and professional appearance
4. Any visual bugs or broken elements
5. Overall user experience

Provide: PASS/FAIL, specific issues, and score (0-100).
    `;

    return this.analyzeWithOpenAI(base64Image, prompt);
  }

  static async compareWithBaseline(
    currentBase64: string,
    baselineBase64: string,
    testContext: {
      testName: string;
      url: string;
      browserName: string;
    }
  ): Promise<ComparisonAnalysisResult> {
    const prompt = `
Compare these two 3D website screenshots (baseline vs current):
- Identify visual differences (layout, colors, elements, 3D rendering)
- Assess severity: CRITICAL (broken functionality), HIGH (major layout issues), 
  MEDIUM (noticeable changes), LOW (minor differences)
- Provide PASS/FAIL and score (0-100)

If images are substantially identical, confirm no significant differences.
    `;

    try {
      const result = await this.analyzeWithOpenAI(
        `${baselineBase64},${currentBase64}`,
        prompt
      );

      const visualDifferences = this.extractDifferences(result.analysis);
      const regressionSeverity = this.getSeverity(result.analysis);

      return {
        ...result,
        comparisonType: "regression",
        visualDifferences,
        regressionSeverity,
        baselineMetadata: {
          createdAt: new Date().toISOString(),
          browserName: testContext.browserName,
          url: testContext.url,
        },
      };
    } catch (error) {
      return {
        ...this.createErrorResult(
          error instanceof Error ? error.message : "Unknown error"
        ),
        comparisonType: "baseline",
        visualDifferences: [],
        regressionSeverity: "critical" as const,
      };
    }
  }

  private static parseAnalysisResult(
    analysis: string
  ): ScreenshotAnalysisResult {
    const lowerAnalysis = analysis.toLowerCase();
    const isValid = !["error", "missing", "broken", "fail"].some((word) =>
      lowerAnalysis.includes(word)
    );

    const issues = this.extractIssues(analysis);
    const score = this.calculateScore(analysis, issues);

    return { isValid, analysis, issues, score };
  }

  private static extractDifferences(analysis: string): string[] {
    const patterns = [
      "different",
      "changed",
      "missing",
      "added",
      "moved",
      "shifted",
    ];
    const sentences = analysis.split(/[.!?]+/);

    return [
      ...new Set(
        sentences
          .filter((sentence) =>
            patterns.some((pattern) => sentence.toLowerCase().includes(pattern))
          )
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 0)
      ),
    ];
  }

  private static getSeverity(
    analysis: string
  ): "low" | "medium" | "high" | "critical" {
    const lower = analysis.toLowerCase();

    if (lower.includes("critical") || lower.includes("broken"))
      return "critical";
    if (lower.includes("high") || lower.includes("significant")) return "high";
    if (lower.includes("medium") || lower.includes("noticeable"))
      return "medium";
    return "low";
  }

  private static extractIssues(analysis: string): string[] {
    const patterns = ["missing", "broken", "error", "fail", "problem", "issue"];
    const sentences = analysis.split(/[.!?]+/);

    return [
      ...new Set(
        sentences
          .filter((sentence) =>
            patterns.some((pattern) => sentence.toLowerCase().includes(pattern))
          )
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 0)
      ),
    ];
  }
  private static calculateScore(analysis: string, issues: string[]): number {
    let score = 100 - issues.length * 10;
    const lower = analysis.toLowerCase();

    // Deductions
    if (lower.includes("critical")) score -= 30;
    if (lower.includes("major")) score -= 20;
    if (lower.includes("broken")) score -= 25;

    // Bonuses
    if (lower.includes("excellent")) score += 10;
    if (lower.includes("good")) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}
