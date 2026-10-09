# Dennis Digital

Static portfolio site for Dennis Digital, serving independent tradespeople in London.

## Run locally

```sh
npm install
npx playwright install chromium
npm start
```

Open <http://127.0.0.1:4173>.

## Tests

```sh
npm test
npm run test:lighthouse
npm run test:all
```

Playwright runs the site in Chromium, checks the page content and interactions, and tests responsive layouts from 320px to 1920px. Lighthouse runs desktop and mobile audits for performance, accessibility, best practices, and SEO. Lighthouse JSON reports are written to `lighthouse-reports/`.

Set `contactEmail` in `js/script.js` before publishing to enable the enquiry form.
