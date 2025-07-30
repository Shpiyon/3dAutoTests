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
        console.log(`🔄 Screenshot attempt ${attempt}/${maxAttempts}`);
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ Screenshot succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        console.log(`❌ Screenshot attempt ${attempt} failed:`, error);
        if (attempt === maxAttempts) {
          console.log(`💥 All ${maxAttempts} screenshot attempts failed`);
          throw error;
        }
        console.log(`⏳ Retrying in ${delayMs}ms...`);
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
          timeout: 15000,
        });
      } else {
        await expect(this.page).toHaveScreenshot(`${testName}.png`, {
          fullPage: true,
          threshold,
          timeout: 15000,
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
      console.log(`📷 Creating baseline snapshot for ${testName}`);
      console.log(
        `🎯 Screenshot mode: ${
          element ? "Element screenshot" : "Full page screenshot"
        }`
      );

      try {
        if (element) {
          console.log(`🔍 Taking element screenshot with 15s timeout...`);
          console.log(`📍 Element selector: ${element}`);

          // Check element state before screenshot
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          console.log(
            `👁️ Element state - Visible: ${isVisible}, Enabled: ${isEnabled}`
          );

          if (isVisible) {
            const boundingBox = await element.boundingBox();
            console.log(`📏 Element bounding box:`, boundingBox);
          }

          await expect(element).toHaveScreenshot(`${testName}.png`, {
            timeout: 30000, // Increased timeout for CI stability
            animations: "disabled", // Disable animations for stable screenshots
          });
          console.log(`✅ Element screenshot created successfully`);
        } else {
          console.log(`🔍 Taking full page screenshot with 15s timeout...`);
          await expect(this.page).toHaveScreenshot(`${testName}.png`, {
            fullPage: true,
            timeout: 30000, // Increased timeout for CI stability
            animations: "disabled", // Disable animations for stable screenshots
          });
          console.log(`✅ Full page screenshot created successfully`);
        }
      } catch (error) {
        console.error(`❌ Screenshot creation failed:`, error);
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
    console.log(
      `📸 Taking screenshot - Type: ${
        options?.element ? "Element" : "Full page"
      }`
    );

    // Wait for page to stabilize before taking screenshot
    console.log(`⏳ Waiting 2s for page stabilization...`);
    await this.page.waitForTimeout(2000);

    if (options?.element) {
      console.log(`🎯 Taking element screenshot...`);
      const isVisible = await options.element.isVisible();
      console.log(`👁️ Element visibility before screenshot: ${isVisible}`);

      if (isVisible) {
        const boundingBox = await options.element.boundingBox();
        console.log(`📏 Element bounds:`, boundingBox);
      }
    }

    const result = options?.element
      ? await this.takeElementScreenshot(options.element)
      : await this.takeFullPageScreenshot();

    console.log(`✅ Screenshot captured successfully (${result.length} bytes)`);
    return result;
  }

  private async takeElementScreenshot(element: Locator): Promise<Buffer> {
    return await this.retryOperation(async () => {
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
