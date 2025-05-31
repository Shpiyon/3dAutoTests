/**
 * AI Screenshot Analyzer Utility
 * Integrates with AI vision services to analyze screenshots
 */

export interface ScreenshotAnalysisResult {
  isValid: boolean;
  analysis: string;
  issues: string[];
  score: number; // 0-100
}

export class AIScreenshotAnalyzer {
  /**
   * Analyze screenshot using OpenAI Vision API
   * Note: You need to set OPENAI_API_KEY environment variable
   */
  static async analyzeWithOpenAI(
    base64Image: string,
    prompt: string
  ): Promise<ScreenshotAnalysisResult> {
    try {
      // Check if API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("OPENAI_API_KEY not found. Skipping AI analysis.");
        return {
          isValid: true,
          analysis: "AI analysis skipped - no API key provided",
          issues: [],
          score: 75, // Default score when skipping
        };
      }

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
                  {
                    type: "text",
                    text: prompt,
                  },
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

      // Parse the analysis to determine validity and issues
      const isValid =
        !analysis.toLowerCase().includes("error") &&
        !analysis.toLowerCase().includes("missing") &&
        !analysis.toLowerCase().includes("broken");

      const issues = this.extractIssues(analysis);
      const score = this.calculateScore(analysis, issues);

      return {
        isValid,
        analysis,
        issues,
        score,
      };
    } catch (error) {
      console.error("AI analysis failed:", error);
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      return {
        isValid: false,
        analysis: `AI analysis failed: ${errorMessage}`,
        issues: ["AI analysis service unavailable"],
        score: 0,
      };
    }
  }

  /**
   * Analyze screenshot for 3D visualization website specific elements
   */
  static async analyze3DVisualizationPage(
    base64Image: string
  ): Promise<ScreenshotAnalysisResult> {
    const prompt = `
    You are analyzing a screenshot of a 3D real estate visualization website home page. 
    Please examine the image and provide a detailed analysis covering:

    1. Navigation Elements:
       - Is there a visible navigation bar/menu?
       - Are navigation items (Home, Apartments, Amenities) visible and properly positioned?

    2. 3D Visualization:
       - Is there a 3D canvas or viewer visible?
       - Does the 3D scene appear to be loaded properly?
       - Are there any 3D loading indicators or progress bars?

    3. Layout and Design:
       - Is the overall layout professional and appropriate for a real estate website?
       - Are elements properly aligned and positioned?
       - Is the color scheme and typography consistent?

    4. Technical Issues:
       - Are there any obvious visual bugs, overlapping elements, or broken layouts?
       - Are images and icons loading correctly?
       - Is the page fully rendered without missing content?

    5. User Experience:
       - Does the page appear user-friendly and intuitive?
       - Are interactive elements clearly visible?

    Please provide:
    - A PASS/FAIL assessment
    - Specific issues found (if any)
    - Overall quality score (0-100)
    - Detailed explanation of your findings

    Format your response clearly with sections for each area analyzed.
    `;

    return this.analyzeWithOpenAI(base64Image, prompt);
  }

  /**
   * Extract issues from AI analysis text
   */
  private static extractIssues(analysis: string): string[] {
    const issues: string[] = [];
    const lowerAnalysis = analysis.toLowerCase();

    // Common issue patterns
    const issuePatterns = [
      "missing",
      "broken",
      "error",
      "not visible",
      "overlapping",
      "misaligned",
      "not loading",
      "fail",
      "problem",
      "issue",
    ];

    issuePatterns.forEach((pattern) => {
      if (lowerAnalysis.includes(pattern)) {
        // Extract the sentence containing the issue
        const sentences = analysis.split(/[.!?]+/);
        sentences.forEach((sentence) => {
          if (sentence.toLowerCase().includes(pattern)) {
            issues.push(sentence.trim());
          }
        });
      }
    });

    return [...new Set(issues)]; // Remove duplicates
  }

  /**
   * Calculate quality score based on analysis
   */
  private static calculateScore(analysis: string, issues: string[]): number {
    let score = 100;

    // Deduct points for issues
    score -= issues.length * 10;

    // Additional deductions for specific problems
    const lowerAnalysis = analysis.toLowerCase();
    if (lowerAnalysis.includes("major")) score -= 20;
    if (lowerAnalysis.includes("critical")) score -= 30;
    if (lowerAnalysis.includes("broken")) score -= 25;
    if (lowerAnalysis.includes("not loading")) score -= 30;

    // Bonus points for positive indicators
    if (lowerAnalysis.includes("excellent")) score += 10;
    if (lowerAnalysis.includes("good")) score += 5;
    if (lowerAnalysis.includes("professional")) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}
