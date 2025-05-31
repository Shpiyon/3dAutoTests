import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { NavigationComponentHelper } from "components/navigation-component/navigationComponentHelper";

export class HomePage extends BasePage {
  readonly navigationComponent: NavigationComponentHelper;

  constructor(page: Page) {
    super(page);

    this.navigationComponent = new NavigationComponentHelper(page);
  }
}
