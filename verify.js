const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const appUrl = `file:///${__dirname.replace(/\\/g, '/')}/index.html`;
const ssDir  = path.join(__dirname, 'screenshots');
fs.mkdirSync(ssDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  // Start fresh — no leftover chats from prior runs
  await page.addInitScript(() => localStorage.clear());

  async function ss(name) {
    await page.screenshot({ path: path.join(ssDir, `${name}.png`) });
    console.log(`  📸 ${name}.png`);
  }
  const piiVisible   = () => page.locator('#pii-warning.visible').isVisible();
  const warningText  = () => page.locator('#pii-warning-detail').innerText();
  async function dismissBtn() {
    try {
      await page.locator('#pii-warning-close').click();
      await page.waitForTimeout(200);
    } catch {}
  }

  async function typeAndSend(text) {
    await page.locator('#user-input').fill(text);
    await page.locator('#send-btn').click();
  }

  // ─────────────────────────────────────────────────────────────
  await page.goto(appUrl);
  await page.waitForLoadState('domcontentloaded');

  // Step 1 — Initial state
  console.log('\n[1] Initial load');
  await ss('01_initial_load');
  console.log(`  "No chat history yet" visible : ${await page.locator('#empty-sidebar').isVisible()}`);
  console.log(`  placeholder visible            : ${await page.locator('#placeholder').isVisible()}`);

  // Step 2 — Normal message (no PII), should send
  console.log('\n[2] Normal message — no PII');
  await typeAndSend('Hello, how does this chat app work?');
  await page.waitForTimeout(900);
  await ss('02_normal_message_sent');
  console.log(`  PII warning visible  : ${await piiVisible()}`);           // expect false
  console.log(`  Chat items in sidebar: ${await page.locator('.chat-item').count()}`); // expect 1
  console.log(`  Auto-title           : "${await page.locator('.chat-item').innerText()}"`);

  // Step 3 — Password blocked
  console.log('\n[3] PII — password');
  await typeAndSend('My password is: SuperSecret99!');
  await ss('03_pii_password');
  console.log(`  blocked  : ${await piiVisible()}`);    // expect true
  console.log(`  warning  : "${await warningText()}"`);

  // Step 4 — Credit card blocked
  console.log('\n[4] PII — credit card');
  await dismissBtn();
  await typeAndSend('Please charge card 4111 1111 1111 1111');
  await ss('04_pii_credit_card');
  console.log(`  blocked  : ${await piiVisible()}`);    // expect true
  console.log(`  warning  : "${await warningText()}"`);

  // Step 5 — SSN blocked
  console.log('\n[5] PII — SSN');
  await dismissBtn();
  await typeAndSend('My SSN is 123-45-6789');
  await ss('05_pii_ssn');
  console.log(`  blocked  : ${await piiVisible()}`);    // expect true
  console.log(`  warning  : "${await warningText()}"`);

  // Step 6 — Multiple PII in one message
  console.log('\n[6] Multiple PII types together');
  await dismissBtn();
  await typeAndSend('SSN 123-45-6789 and card 4111111111111111');
  await ss('06_pii_multiple');
  console.log(`  blocked  : ${await piiVisible()}`);    // expect true
  console.log(`  warning  : "${await warningText()}"`); // should list both

  // Step 7 — Warning auto-dismisses on edit
  console.log('\n[7] Warning dismisses on edit');
  await page.locator('#user-input').fill('completely safe text now');
  const gone = !(await piiVisible());
  console.log(`  warning gone after editing: ${gone}`); // expect true
  await ss('07_warning_dismissed_on_edit');

  // Step 8 — Second chat, sidebar grows
  console.log('\n[8] New chat — sidebar count grows');
  await page.click('#new-chat-btn');
  await typeAndSend('Second conversation, all good');
  await page.waitForTimeout(900);
  await ss('08_two_chats');
  console.log(`  chat items: ${await page.locator('.chat-item').count()}`); // expect 2

  // Step 9 — Switch back to first chat
  console.log('\n[9] Click first chat — restores messages');
  const items = page.locator('.chat-item');
  await items.nth(await items.count() - 1).click(); // oldest = bottom of reversed list
  await ss('09_switch_chat');
  console.log(`  messages shown: ${await page.locator('.msg').count()}`); // expect 2 (user+assistant)

  // Step 10 — Long first message → title truncated
  console.log('\n[10] Long first message → title truncated');
  await page.click('#new-chat-btn');
  await typeAndSend('This is an extremely long first message that goes well beyond the forty-character title limit that we defined in the app');
  await page.waitForTimeout(900);
  await ss('10_long_title');
  const titles = await page.locator('.chat-item').allInnerTexts();
  const newest = titles[0];
  console.log(`  title: "${newest}"`);
  console.log(`  ends with ellipsis: ${newest.endsWith('…')}`); // expect true

  console.log('\n✅ All steps done — screenshots in ./screenshots/');
  await browser.close();
})();
