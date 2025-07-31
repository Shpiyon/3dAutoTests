import { Page, expect, Locator } from "@playwright/test";
import {
  AIScreenshotAnalyzer,
  ScreenshotAnalysisResult,
} from "./aiScreenshotAnalyzer";
import { getScreenshotDefaults } from "./configUtils";
import * as fs from "fs";
import * as path from "path";

export interface ScreenshotTestOptions {
  testName: string;
  threshold?: number;
  element?: any;
}

export interface ScreenshotTestResult {
  success: boolean;
  isBaseline: boolean;
  analysisResult?: ScreenshotAnalysisResult;
  nativeResult?: { passed: boolean; diffPath?: string };
  screenshotPath?: string;
  baselinePath?: string;
}

export class ScreenshotTester {
  constructor(private page: Page) {}

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 2000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await this.page.waitForTimeout(delayMs);
      }
    }
    throw new Error("Unexpected end of retry loop");
  }

  async runScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    return process.env.ENABLE_AI_ANALYSIS === "true"
      ? this.runAIScreenshotTest(options)
      : this.runNativeScreenshotTest(options);
  }

  private async runNativeScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const defaults = getScreenshotDefaults();
    const { testName, threshold = defaults.nativeThreshold, element } = options;

    try {
      if (element) {
        await expect(element).toHaveScreenshot(`${testName}.png`, {
          threshold,
          timeout: 30000,
        });
      } else {
        await expect(this.page).toHaveScreenshot(`${testName}.png`, {
          fullPage: true,
          threshold,
          timeout: 30000,
        });
      }

      return {
        success: true,
        isBaseline: false,
        nativeResult: { passed: true },
      };
    } catch (error) {
      // Comparison failed
      const testInfo = require("@playwright/test").test.info();
      const failedResult = {
        success: false,
        isBaseline: false,
        nativeResult: {
          passed: false,
          diffPath: `${testInfo.outputDir}/${options.testName}-diff.png`,
        },
        screenshotPath: `${testInfo.outputDir}/${options.testName}-actual.png`,
      };

      if (testInfo && testInfo.attachments) {
        testInfo.attachments.push({
          name: "screenshot-comparison-result",
          body: JSON.stringify(failedResult),
          contentType: "application/json",
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Screenshot comparison failed for ${testName}: ${errorMessage}`
      );
    }
  }

  private async runAIScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const defaults = getScreenshotDefaults();
    const { testName, threshold = defaults.aiThreshold, element } = options;

    const snapshotExists = await this.checkSnapshotExists(testName);

    if (!snapshotExists) {
      console.log(`Creating baseline snapshot for ${testName}`);
      try {
        if (element) {
          let useClipApproach = false;
          let boundingBox = null;

          if (process.env.CI === "true") {
            // CI: Try to use clip approach to avoid stability issues
            boundingBox = await element.boundingBox();
            if (boundingBox) {
              await expect(this.page).toHaveScreenshot(`${testName}.png`, {
                clip: boundingBox,
                timeout: 30000,
              });
              useClipApproach = true;
            }
          }

          // Use standard approach for local mode OR when CI clip approach failed
          if (!useClipApproach) {
            await expect(element).toHaveScreenshot(`${testName}.png`, {
              timeout: 30000,
            });
          }
        } else {
          await expect(this.page).toHaveScreenshot(`${testName}.png`, {
            fullPage: true,
            timeout: 30000,
          });
        }
      } catch (error) {
        throw new Error(
          `Failed to create baseline snapshot for ${testName}: ${error}`
        );
      }

      return {
        success: true,
        isBaseline: true,
      };
    }

    console.log(`Running AI analysis for ${testName}`);

    const currentScreenshot = await this.takeScreenshot({ element });

    const baselineImageBase64 = await this.loadBaselineSnapshot(testName);

    if (!baselineImageBase64) {
      throw new Error(
        `Baseline snapshot not found for ${testName}. AI analysis requires both baseline and current screenshots. ` +
          `Please run the test once to create the baseline snapshot, then run again for AI comparison.`
      );
    }

    const analysisResult =
      await AIScreenshotAnalyzer.analyze3DVisualizationPage(
        currentScreenshot.toString("base64"),
        baselineImageBase64
      );

    const passed =
      analysisResult.score >= threshold &&
      !analysisResult.analysis.toLowerCase().includes("critical");

    // Save current screenshot
    const currentScreenshotPath = await this.saveScreenshot(
      testName + "-current",
      currentScreenshot
    );

    // Attach all images to test report
    await this.attachImagesToReport(testName, {
      currentScreenshot,
      baselineImageBase64,
      diffImageBase64: analysisResult.diffImageBase64,
      analysisResult,
    });

    return {
      success: passed,
      isBaseline: false,
      analysisResult,
      screenshotPath: currentScreenshotPath,
    };
  }

  private async checkSnapshotExists(testName: string): Promise<boolean> {
    const testInfo = require("@playwright/test").test.info();
    const testFilePath = testInfo?.file;

    if (!testFilePath) return false;

    const testFileName = path.basename(testFilePath, ".ts");
    const snapshotDir = path.join(
      path.dirname(testFilePath),
      `${testFileName}.ts-snapshots`
    );
    const platform = process.platform === "win32" ? "win32" : "linux";

    const normalizedTestName = testName.replace(/\s+/g, "-").toLowerCase();

    const snapshotPath = path.join(
      snapshotDir,
      `${normalizedTestName}-chromium-${platform}.png`
    );
    return fs.existsSync(snapshotPath);
  }

  async takeScreenshot(options?: { element?: Locator }): Promise<Buffer> {
    // Wait for page to stabilize before taking screenshot
    await this.page.waitForTimeout(2000);

    return options?.element
      ? await this.takeElementScreenshot(options.element)
      : await this.takeFullPageScreenshot();
  }

  private async takeElementScreenshot(element: Locator): Promise<Buffer> {
    return await this.retryOperation(async () => {
      if (process.env.CI === "true") {
        // CI: Try to get bounding box and use clip to avoid stability issues
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          return await this.page.screenshot({ clip: boundingBox });
        }
      }

      // Use standard approach for local mode OR when CI clip approach failed
      return await element.screenshot();
    });
  }

  private async takeFullPageScreenshot(): Promise<Buffer> {
    return await this.retryOperation(async () => {
      return await this.page.screenshot();
    });
  }

  async saveScreenshot(testName: string, screenshot: Buffer): Promise<string> {
    const resultsDir = path.resolve("test-results");
    if (!fs.existsSync(resultsDir))
      fs.mkdirSync(resultsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const screenshotPath = path.join(
      resultsDir,
      `${testName}_${timestamp}.png`
    );
    fs.writeFileSync(screenshotPath, screenshot);
    return screenshotPath;
  }

  private async loadBaselineSnapshot(
    testName: string
  ): Promise<string | undefined> {
    const testInfo = require("@playwright/test").test.info();
    const testFilePath = testInfo?.file;

    if (!testFilePath) return undefined;

    const testFileName = path.basename(testFilePath, ".ts");
    const snapshotDir = path.join(
      path.dirname(testFilePath),
      `${testFileName}.ts-snapshots`
    );
    const platform = process.platform === "win32" ? "win32" : "linux";
    const normalizedTestName = testName.replace(/\s+/g, "-").toLowerCase();

    const snapshotPath = path.join(
      snapshotDir,
      `${normalizedTestName}-chromium-${platform}.png`
    );

    if (fs.existsSync(snapshotPath)) {
      const imageBuffer = fs.readFileSync(snapshotPath);
      return imageBuffer.toString("base64");
    }

    return undefined;
  }

  private async attachImagesToReport(
    testName: string,
    images: {
      currentScreenshot: Buffer;
      baselineImageBase64?: string;
      diffImageBase64?: string;
      analysisResult: any;
    }
  ): Promise<void> {
    const testInfo = require("@playwright/test").test.info();

    if (!testInfo) return;

    try {
      testInfo.attachments.push({
        name: `${testName}-current`,
        body: images.currentScreenshot,
        contentType: "image/png",
      });

      if (images.baselineImageBase64) {
        testInfo.attachments.push({
          name: `${testName}-baseline`,
          body: Buffer.from(images.baselineImageBase64, "base64"),
          contentType: "image/png",
        });
      }

      if (images.diffImageBase64) {
        testInfo.attachments.push({
          name: `${testName}-ai-diff`,
          body: Buffer.from(images.diffImageBase64, "base64"),
          contentType: "image/png",
        });
      }

      testInfo.attachments.push({
        name: `${testName}-ai-analysis`,
        body: JSON.stringify(images.analysisResult, null, 2),
        contentType: "application/json",
      });

      console.log(
        `📎 Attached ${testInfo.attachments.length} items to test report for ${testName}`
      );
    } catch (error) {
      console.warn(`Failed to attach images to test report: ${error}`);
    }
  }
}
