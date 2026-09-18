import { expect, test, type Page } from "@playwright/test";

const start = async (page: Page) => { await page.goto("/"); await page.getByRole("button", { name: "ابدأ الجولة", exact: true }).click(); };
const moves = async (page: Page, seq: [number, number][]) => { for (const [board, cell] of seq) await page.locator(`[data-board="${board}"][data-cell="${cell}"]`).click(); };

const MINI_ZERO_X_WIN: [number, number][] = [
  [0, 0], [0, 1], [1, 3], [3, 0], [0, 4], [4, 0], [0, 8],
];
const BIG_X_DIAG_WIN: [number, number][] = [
  ...MINI_ZERO_X_WIN,
  [8, 2], [2, 0],
  [7, 4],
  [4, 1], [1, 4], [4, 4], [4, 6], [6, 0],
  [8, 3], [3, 8], [8, 4], [4, 7],
  [7, 2], [2, 5], [5, 6], [6, 4],
  [5, 8], [8, 1], [1, 8], [8, 7], [7, 5], [5, 4],
  [7, 8], [8, 6], [6, 8], [8, 8],
];

test("mini board win, big win, lock, next starter, and persistent lifetime stats", async ({ page }) => {
  await start(page);
  await moves(page, BIG_X_DIAG_WIN);
  const result = page.getByRole("dialog", { name: "انتصار ساحق!" });
  await expect(result).toBeVisible();
  await expect(result.locator(".result-crown")).toBeVisible();
  await result.getByRole("button", { name: "إغلاق", exact: true }).click();
  const locked = page.locator('[data-board="1"][data-cell="1"]');
  await expect(locked).toHaveAttribute("aria-disabled", "true");
  await locked.click({ force: true });
  await expect(locked.locator("svg")).toHaveCount(0);
  await page.getByRole("button", { name: "جولة جديدة", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("دور اللاعب ○");
  await page.reload();
  await page.getByRole("button", { name: "الإحصاءات", exact: true }).click();
  await expect(page.locator(".total-rounds strong")).toHaveText("1");
  await expect(page.locator(".stat-trio .text-x").last()).toHaveText("1");
});

test("winning a mini board caps its big cell and the round stays open", async ({ page }) => {
  await start(page);
  await moves(page, MINI_ZERO_X_WIN);
  await expect(page.locator(".mini-cover.cover-x")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("دور اللاعب ○");
});

test("nested reset confirmation releases scroll and does not erase statistics", async ({ page }) => {
  await start(page);
  await moves(page, BIG_X_DIAG_WIN);
  await page.getByRole("dialog", { name: "انتصار ساحق!" }).getByRole("button", { name: "إعادة المباراة" }).click();
  await page.getByRole("dialog", { name: "نبدأ مباراة جديدة؟" }).getByRole("button", { name: "إعادة المباراة" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await expect(page.locator(".game-cell svg")).toHaveCount(0);
  await page.getByRole("button", { name: "العودة للرئيسية", exact: true }).click();
  await page.getByRole("button", { name: "الإحصاءات", exact: true }).click();
  await expect(page.locator(".total-rounds strong")).toHaveText("1");
  await page.getByRole("button", { name: "تصفير الإحصاءات", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "تصفير سجل الساحة؟" });
  await confirm.getByRole("button", { name: "تراجع" }).click();
  await expect(page.locator(".total-rounds strong")).toHaveText("1");
  await page.getByRole("button", { name: "تصفير الإحصاءات", exact: true }).click();
  await confirm.getByRole("button", { name: "تصفير الإحصاءات", exact: true }).click();
  await expect(page.getByText("الساحة تنتظر أول انتصار")).toBeVisible();
});

test("settings update instantly, persist, and reset only after confirmation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  await page.getByRole("textbox", { name: "اسم اللاعب ×" }).fill("سارة");
  await page.getByLabel("غروب بنفسجي", { exact: true }).check();
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "sunset");
  await page.getByRole("switch", { name: "المؤثرات الصوتية" }).click();
  await page.getByRole("button", { name: "إغلاق", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "اسم اللاعب ×" })).toHaveValue("سارة");
  await expect(page.getByRole("switch", { name: "المؤثرات الصوتية" })).toHaveAttribute("aria-checked", "false");
  await page.getByRole("button", { name: "إعادة الإعدادات الافتراضية" }).click();
  const confirmation = page.getByRole("dialog", { name: "استعادة الإعدادات؟" });
  await confirmation.getByRole("button", { name: "تراجع" }).click();
  await expect(page.getByRole("textbox", { name: "اسم اللاعب ×" })).toHaveValue("سارة");
  await page.getByRole("button", { name: "إعادة الإعدادات الافتراضية" }).click();
  await confirmation.getByRole("button", { name: "استعادة الافتراضي" }).click();
  await expect(page.getByRole("textbox", { name: "اسم اللاعب ×" })).toHaveValue("اللاعب ×");
  await expect(page.locator(".app-shell")).toHaveAttribute("data-theme", "cosmic");
});

test("cancel unfinished round and confirm leaving", async ({ page }) => {
  await start(page);
  await moves(page, [[0, 0], [0, 1]]);
  await page.getByRole("button", { name: "جولة جديدة", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "جولة جديدة", exact: true }).click();
  await expect(page.locator(".game-cell svg")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("دور اللاعب ×");
  await moves(page, [[0, 3]]);
  await page.getByRole("button", { name: "العودة للرئيسية", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "تغادران الساحة؟" });
  await confirmation.getByRole("button", { name: "تراجع" }).click();
  await expect(page.locator(".game-cell svg")).toHaveCount(1);
  await page.getByRole("button", { name: "العودة للرئيسية", exact: true }).click();
  await confirmation.getByRole("button", { name: "العودة للرئيسية", exact: true }).click();
  await page.getByRole("button", { name: "ابدأ الجولة", exact: true }).click();
  await expect(page.locator(".game-cell svg")).toHaveCount(0);
});

test("corrupted storage, RTL, reduced motion and viewport fit", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("nuqta-daira:stats:v1", "bad json");
    localStorage.setItem("nuqta-daira:settings:v1", JSON.stringify({ theme: "unknown", names: null }));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = await page.locator(".game-controls").boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "الإعدادات", exact: true })).toBeFocused();
});