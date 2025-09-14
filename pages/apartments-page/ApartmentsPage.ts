import { BasePage } from "../BasePage";
import { NavigationComponent } from "../../components/navigation-component/NavigationComponent";

export class ApartmentsPage extends BasePage {
  readonly navigationComponent: NavigationComponent;

  readonly apartmentCard: any; // Can be Playwright Locator or Appium element
  readonly apartment1: any;
  readonly apartment2: any;
  readonly apartment3: any;
  readonly villas: any;

  constructor(pageOrDriver: any, projectName?: string) {
    super(pageOrDriver);

    this.navigationComponent = new NavigationComponent(pageOrDriver);

    // Platform detection - decides which locators to use
    if (this.isNative(projectName)) {
      // Native locators (Appium WebDriver)
      this.apartmentCard = pageOrDriver.$("~apartmentsCard");
      this.apartment1 = pageOrDriver.$("~apartment1Button");
      this.apartment2 = pageOrDriver.$("~apartment2Button");
      this.apartment3 = pageOrDriver.$("~apartment3Button");
      this.villas = pageOrDriver.$("~villasButton");
    } else {
      // Web/Mobile web locators (Playwright Page)
      this.apartmentCard = pageOrDriver.locator("#apartmentsCard");
      this.apartment1 = pageOrDriver.locator('[data-apt-id="apt-101"]');
      this.apartment2 = pageOrDriver.locator('[data-apt-id="apt-102"]');
      this.apartment3 = pageOrDriver.locator('[data-apt-id="apt-103"]');
      this.villas = pageOrDriver.locator('[data-apt-id="villas"]');
    }
  }

  private isNative(projectName?: string): boolean {
    return projectName?.toLowerCase().includes("native") || false;
  }
}
