# Mobile page objects (Phase 2)

Phase 2 — Mobile tests against the [Sauce Labs Sample App](https://github.com/saucelabs/my-demo-app-rn) on Android via Appium + WebdriverIO.

Not yet implemented. See the Phase 2 design spec at `docs/superpowers/specs/<future>-mobile-phase-2-design.md` when it exists.

Conventions when this folder fills in:

- Extend `BaseMobilePage` (not `BasePage`)
- Use `this.mobile.*` (not `this.driver.*`)
- Locators typed as `PlatformLocator = { android: string; ios: string }` — keep `ios: ''` placeholders for the future iOS pass
