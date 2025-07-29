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
          timeout: 30000, // 30 seconds timeout
        });
      } else {
        await expect(this.page).toHaveScreenshot(`${testName}.png`, {
          fullPage: true,
          threshold,
          timeout: 30000, // 30 seconds timeout
        });
      }
      return {
        success: true,
        isBaseline: false,
        nativeResult: { passed: true },
      };
    } catch {
      const testInfo = require("@playwright/test").test.info();
      return {
        success: false,
        isBaseline: false,
        nativeResult: {
          passed: false,
          diffPath: `${testInfo.outputDir}/${options.testName}-diff.png`,
        },
        screenshotPath: `${testInfo.outputDir}/${options.testName}-actual.png`,
      };
    }
  }

  private async runAIScreenshotTest(
    options: ScreenshotTestOptions
  ): Promise<ScreenshotTestResult> {
    const defaults = getScreenshotDefaults();
    const { testName, threshold = defaults.aiThreshold, element } = options;

    const snapshotExists = await this.checkSnapshotExists(testName);

    if (!snapshotExists) {
      console.log(
        `[${new Date().toISOString()}] Creating baseline snapshot for ${testName}`
      );
      try {
        if (element) {
          console.log(
            `[${new Date().toISOString()}] Taking element screenshot with 30s timeout...`
          );
          // Log element state before screenshot
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          console.log(
            `[${new Date().toISOString()}] Element state - visible: ${isVisible}, enabled: ${isEnabled}`
          );

          await expect(element).toHaveScreenshot(`${testName}.png`, {
            timeout: 30000, // 30 seconds timeout
          });
        } else {
          console.log(
            `[${new Date().toISOString()}] Taking full page screenshot with 30s timeout...`
          );
          await expect(this.page).toHaveScreenshot(`${testName}.png`, {
            fullPage: true,
            timeout: 30000, // 30 seconds timeout
          });
        }

        const screenshot = await this.takeScreenshot({ element });
        return {
          success: true,
          isBaseline: true,
          screenshotPath: await this.saveScreenshot(testName, screenshot),
        };
      } catch (error) {
        throw new Error(
          `Failed to create baseline snapshot for ${testName}: ${error}`
        );
      }
    }

    console.log(`Running AI analysis for ${testName}`);

    const screenshot = await this.takeScreenshot({ element });

    const analysisResult =
      await AIScreenshotAnalyzer.analyze3DVisualizationPage(
        screenshot.toString("base64")
      );

    const passed =
      analysisResult.score >= threshold &&
      !analysisResult.analysis.toLowerCase().includes("critical");

    return {
      success: passed,
      isBaseline: false,
      analysisResult,
      screenshotPath: await this.saveScreenshot(testName, screenshot),
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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await element.screenshot();
      } catch (error) {
        if (attempt === 3) throw error;
        await this.page.waitForTimeout(2000);
      }
    }
    throw new Error("Element screenshot failed");
  }

  private async takeFullPageScreenshot(): Promise<Buffer> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.page.screenshot();
      } catch (error) {
        if (attempt === 3) throw error;
        await this.page.waitForTimeout(2000);
      }
    }
    throw new Error("Full page screenshot failed");
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
}
