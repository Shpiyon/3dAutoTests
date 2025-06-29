import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { NavigationComponentHelper } from "components/navigation-component/navigationComponentHelper";
import { NavigationComponent } from "components/navigation-component/NavigationComponent";

export class HomePage extends BasePage {
  readonly navigationComponentHelper: NavigationComponentHelper;
  readonly navigationComponent: NavigationComponent;

  constructor(page: Page) {
    super(page);

    this.navigationComponentHelper = new NavigationComponentHelper(page);
    this.navigationComponent = new NavigationComponent(page);
  }
}
