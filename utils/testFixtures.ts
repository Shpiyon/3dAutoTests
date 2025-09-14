import { test as base } from "@playwright/test";
import {
  AppiumDriver,
  androidCapabilities,
  iOSCapabilities,
} from "./appiumConfig";

class PageFactory {
  static async createPage<T>(
    pageClass: new (pageOrDriver: any, projectName?: string) => T,
    pageOrDriver: any,
    projectName: string
  ): Promise<T | null> {
    const isWeb = projectName.toLowerCase().includes("web");
    const isMobile =
      projectName.toLowerCase().includes("mobile") &&
      !projectName.toLowerCase().includes("native");
    const isNative = projectName.toLowerCase().includes("native");

    if (isWeb || isMobile) {
      return new pageClass(pageOrDriver, projectName);
    }

    if (isNative) {
      try {
        let appiumDriver;
        if (projectName.toLowerCase().includes("android")) {
          appiumDriver = new AppiumDriver(androidCapabilities);
          const driver = await appiumDriver.startSession();
          return new pageClass(driver, projectName);
        } else if (projectName.toLowerCase().includes("ios")) {
          appiumDriver = new AppiumDriver(iOSCapabilities);
          const driver = await appiumDriver.startSession();
          return new pageClass(driver, projectName);
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }
}

type TestFixtures = {
  createPage: <T>(
    pageClass: new (pageOrDriver: any, projectName?: string) => T
  ) => Promise<T | null>;
};

export const test = base.extend<TestFixtures>({
  createPage: async ({ page }, use, testInfo) => {
    const pageCreator = async <T>(
      pageClass: new (pageOrDriver: any, projectName?: string) => T
    ): Promise<T | null> => {
      const pageInstance = await PageFactory.createPage(
        pageClass,
        page,
        testInfo.project.name
      );
      if (
        pageInstance &&
        typeof (pageInstance as any).startPage === "function"
      ) {
        await (pageInstance as any).startPage();
      }
      return pageInstance;
    };

    await use(pageCreator);
  },
});
