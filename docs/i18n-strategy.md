# i18n Strategy

## Structure

Shared i18n code lives in `packages/shared/src/index.js`.

It exports:

- `SUPPORTED_LOCALES`
- `FALLBACK_LOCALE`
- `RTL_LOCALES`
- `detectLocale`
- `normalizeLocale`
- `t`
- `formatBytes`
- `formatDateTime`
- `transferStateLabel`

## Locales

Initial locale list:

```text
ko
en
ja
zh-Hans
zh-Hant
es
fr
de
pt-BR
ar
```

Korean is the fallback language. English is also complete. Other languages currently use English fallback for most keys with localized language name and product title placeholders. This keeps the key structure ready while avoiding partial broken UI.

Do not describe this as full global language support. The accurate current state is:

- multilingual-ready key structure
- Korean default UX copy
- English complete enough for operator/developer testing
- other locales partially translated through English fallback

New localhost/LAN/Expo QR guidance is also in the shared i18n table so web and mobile stay consistent.

New product-facing copy for the web app and mobile app is also stored in `packages/shared/src/index.js`. Keep launch-site drafts in `docs/launch` separate from runtime UI strings until the official site is implemented.

Public messaging should say `multilingual-ready` and `partially translated`, not full global language support.

## Detection

- Web: `navigator.languages`
- Mobile: `Intl.DateTimeFormat().resolvedOptions().locale`

Both web and mobile include manual language switching.

## RTL

Arabic is registered as RTL. Web updates `<html dir>`. Mobile enables RTL through `I18nManager.allowRTL`.

## Adding a language

1. Add the locale to `SUPPORTED_LOCALES`.
2. Add translation keys under `translations`.
3. Add it to `RTL_LOCALES` if it is right-to-left.
4. Run:

```powershell
npm.cmd run smoke
npm.cmd exec -w apps/mobile -- expo export --platform android --output-dir ../../.tmp/expo-export
```

5. Add product copy review before release.
