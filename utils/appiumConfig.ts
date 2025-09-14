import { remote } from "webdriverio";

export interface AppiumCapabilities {
  platformName: "iOS" | "Android";
  platformVersion: string;
  deviceName: string;
  app?: string;
  bundleId?: string; // For iOS apps
  appPackage?: string; // For Android apps
  appActivity?: string; // For Android apps
  automationName: "XCUITest" | "UiAutomator2";
  newCommandTimeout: number;
  noReset: boolean;
}

export class AppiumDriver {
  private driver: any = null;
  private capabilities: AppiumCapabilities;

  constructor(capabilities: AppiumCapabilities) {
    this.capabilities = capabilities;
  }

  async startSession(): Promise<any> {
    const options = {
      protocol: "http" as const,
      hostname: "localhost",
      port: 4723,
      path: "/wd/hub",
      capabilities: this.capabilities as any,
      logLevel: "info" as const,
    };

    this.driver = await remote(options);
    return this.driver;
  }

  async endSession(): Promise<void> {
    if (this.driver) {
      await this.driver.deleteSession();
      this.driver = null;
    }
  }

  getDriver(): any {
    return this.driver;
  }

  // Helper method to check if Appium server is running
  static async isAppiumServerRunning(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:4723/wd/hub/status");
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Predefined iOS capabilities
export const iOSCapabilities: AppiumCapabilities = {
  platformName: "iOS",
  platformVersion: "15.0",
  deviceName: "iPhone 12",
  automationName: "XCUITest",
  newCommandTimeout: 60,
  noReset: false,
  // Add your iOS app details here:
  // bundleId: 'com.yourapp.identifier',
  // app: '/path/to/your/app.ipa',
};

// Predefined Android capabilities
export const androidCapabilities: AppiumCapabilities = {
  platformName: "Android",
  platformVersion: "11.0",
  deviceName: "Android Emulator",
  automationName: "UiAutomator2",
  newCommandTimeout: 60,
  noReset: false,
  // Add your Android app details here:
  // appPackage: 'com.yourapp.package',
  // appActivity: 'com.yourapp.MainActivity',
  // app: '/path/to/your/app.apk',
};
