# Work in your language

Choose **English**, **Deutsch**, **Español**, **日本語**, **简体中文**, or **繁體中文** from the language selector in the top bar. It is available on desktop and mobile, including before your first investigation.

Casework uses your saved choice first, then a supported browser language, and otherwise English. German and Spanish regional variants share their respective translations. `zh-CN`, `zh-SG`, and `zh-Hans` select Simplified Chinese; `zh-TW`, `zh-HK`, `zh-MO`, and `zh-Hant` select Traditional Chinese. The choice is saved in this browser, separately from workspace appearance. If storage is blocked, switching still works for the current page.

## What changes

Navigation, onboarding scenarios, case controls, policy guidance, command search, dialogs, decision suggestions, known validation errors and accessibility labels are translated. Display dates follow the selected language. The same translations are bundled with the Python app and static browser demo; no translation API, key, CDN or internet access is required by the local app.

Changing language keeps the current case, search filters, expanded evidence and typed decision drafts. An empty decision field gets a suggestion in the selected language. Press **Tab** to accept it, then **Record decision**. Accepted or edited text is never silently replaced by a language change.

## What stays original

Customer and workspace names, alert titles, source categories, evidence labels and contents, IDs, timestamps in source records, and saved decision narratives remain exactly as supplied. Our existing synthetic evidence fixtures are in English, so they remain English inside a translated interface. API field names, status values, policy versions, hashes and JSON exports are unchanged. Display translations of policy checks never rewrite the stored evaluation.

Repository documentation remains in English. Unexpected upstream or browser error details may also remain in their original language. These interface translations have automated workflow coverage, but have not had independent native-speaker review; terminology improvements are welcome.

## Screenshots

Captured from the running browser demo by the language workflow tests.

| Language | Desktop onboarding | Mobile decision |
|---|---|---|
| English | [Preview](assets/language-en-desktop.png) | [Preview](assets/language-en-mobile.png) |
| Deutsch | [Vorschau](assets/language-de-desktop.png) | [Vorschau](assets/language-de-mobile.png) |
| Español | [Vista previa](assets/language-es-desktop.png) | [Vista previa](assets/language-es-mobile.png) |
| 日本語 | [プレビュー](assets/language-ja-desktop.png) | [プレビュー](assets/language-ja-mobile.png) |
| 简体中文 | [预览](assets/language-zh-Hans-desktop.png) | [预览](assets/language-zh-Hans-mobile.png) |
| 繁體中文 | [預覽](assets/language-zh-Hant-desktop.png) | [預覽](assets/language-zh-Hant-mobile.png) |

## Improve a translation

1. Edit the appropriate file in [`locales/`](../locales). English sentences are stable message keys; all six catalogs must contain the same keys. Values contain plain text, never HTML. Preserve every named placeholder such as `{count}` or `{subject}`; their position can change to suit the language.
2. Run `python3 scripts/build_locales.py` from the repository folder. This validates every catalog and refreshes the committed browser bundle. Users downloading Casework do not need this build step.
3. With the optional browser-test dependencies installed, run `node tests/i18n-browser.cjs`. It covers all six languages against both the Python app and the browser demo, including narrow layouts, the Tab-to-decision flow, error states, persistence, localized command search and unchanged evidence exports. CI runs it automatically.
4. Include the affected screen, before/after wording, and why the new wording helps an investigator in your PR. Identify the language or region you reviewed. Small, focused corrections are welcome.

Use `t("English message", {name: value})` for interface text and escape its result when inserting HTML. Use `data-i18n` and `data-i18n-aria-label` for static markup. Never translate user content by scanning the page or replacing words in case records. Add a whole sentence with named placeholders instead of concatenating translated sentence fragments.
