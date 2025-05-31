import { Page } from "@playwright/test";
import { Locator } from "playwright";

export class BasePage {
  protected page: Page;
  readonly canvas: Locator;
  readonly progressBarContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.canvas = this.page.locator("canvas");
    this.progressBarContainer = this.page.locator(".progressBarOuterContainer");
  }

  async waitFor3DSceneLoad() {
    try {
      const ksplatPromise = this.page.waitForResponse(
        (response) =>
          response.url().includes("Breig_future_initial.ksplat") &&
          response.status() === 200,
        { timeout: 60000 }
      );

      const progressBarPromise = this.page.waitForFunction(
        () => {
          const element = document.querySelector(".progressPercentage");
          return element && element.textContent === "100%";
        },
        { timeout: 60000 }
      );

      const gotoPromise = this.page.goto(
        "https://interpres.live/src/test_breig/index.html"
      );

      await Promise.all([gotoPromise, ksplatPromise, progressBarPromise]);

      await this.progressBarContainer.waitFor({
        state: "hidden",
        timeout: 40000,
      });

      await this.canvas.waitFor({ state: "visible", timeout: 30000 });

      await this.page.waitForTimeout(1000);
    } catch (error: any) {
      if (error.name === "TimeoutError") {
        throw new Error(
          `Timeout while loading 3D scene. Details: ${error.message}`
        );
      }
      throw new Error(
        `Failed to load 3D scene: ${error.message || error.toString()}`
      );
    }
  }

  async startPage() {
    await this.waitFor3DSceneLoad();
    await this.page.waitForLoadState("domcontentloaded");
  }
}
