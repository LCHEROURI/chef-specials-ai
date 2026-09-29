import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

_default_dir = Path(__file__).resolve().parent
_env_dir = os.environ.get("REPO_DIR")
REPO_DIR = Path(_env_dir).resolve() if _env_dir else _default_dir

_base_url = os.environ.get("BASE_URL") or os.environ.get("APP_URL")
if not _base_url and not (REPO_DIR / "index.html").exists():
    raise FileNotFoundError(f"index.html not found in repository root: {REPO_DIR}")

INDEX_HTML = _base_url or (REPO_DIR / "index.html").as_uri()

async def run_tests():
    print("=== STARTING PLAYWRIGHT E2E VERIFICATION ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(permissions=["clipboard-read", "clipboard-write"])
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        # 1. Load index.html
        print(f"Loading {INDEX_HTML}...")
        await page.goto(INDEX_HTML)
        await page.wait_for_selector(".app-shell")
        title = await page.title()
        assert title == "Chef Specials AI", f"Unexpected title: {title}"
        print("✓ Page loaded successfully with title 'Chef Specials AI'.")

        # 2. Check initial state - 3 specials initially generated
        initial_cards = await page.query_selector_all("#specialsList .special-card")
        assert len(initial_cards) == 3, f"Expected 3 initial cards, got {len(initial_cards)}"
        print(f"✓ Initial state contains {len(initial_cards)} generated specials.")

        # 3. Test Pasta Category Filter (Bug #4)
        print("Testing 'Pasta' category filter...")
        await page.click(".filter[data-filter='Pasta']")
        await page.click("#generateBtn")
        await page.wait_for_timeout(300)
        pasta_cards = await page.query_selector_all("#specialsList .special-card")
        assert len(pasta_cards) > 0, "No cards generated for Pasta filter"
        
        card_titles = []
        for card in pasta_cards:
            h4 = await card.query_selector("h4")
            card_titles.append(await h4.inner_text())
        print(f"  Generated Pasta special titles: {card_titles}")
        
        has_pasta = any(k in " ".join(card_titles).lower() for k in ["tagliolini", "ravioles", "noodles", "orzo", "pappardelle", "mac and cheese", "pasta", "gnocchi", "hilopites"])
        assert has_pasta, f"Pasta dishes should contain pasta keywords: {card_titles}"
        print("✓ Pasta category filter successfully produces authentic pasta/noodle specials.")

        # 4. Test Seasonal Category Filter (Bug #4)
        print("Testing 'Seasonal' filter...")
        await page.click(".filter[data-filter='Pasta']")  # Deselect Pasta
        await page.click(".filter[data-filter='Seasonal']") # Select Seasonal
        await page.click("#generateBtn")
        await page.wait_for_timeout(300)
        seasonal_cards = await page.query_selector_all("#specialsList .special-card")
        seasonal_texts = []
        for card in seasonal_cards:
            seasonal_texts.append(await card.inner_text())
        has_seasonal = any(k in " ".join(seasonal_texts).lower() for k in ["seasonal", "spring", "summer", "autumn", "winter", "harvest", "market"])
        assert has_seasonal, f"Seasonal specials should feature seasonal touches or tags"
        print("✓ Seasonal filter successfully produces seasonal offerings.")

        # 5. Test Smart Count Parsing (Bug #10): Request 4 specials
        print("Testing requested count: 4 specials...")
        await page.fill("#chefRequest", "Give me 4 upscale dinner specials for tonight.")
        await page.click("#generateBtn")
        await page.wait_for_timeout(300)
        cards_4 = await page.query_selector_all("#specialsList .special-card")
        assert len(cards_4) == 4, f"Expected exactly 4 specials, got {len(cards_4)}"
        meta_text_4 = await page.inner_text("#generationMeta")
        assert "4 specials" in meta_text_4
        print(f"✓ Parsed '4 specials' correctly -> {len(cards_4)} cards rendered ({meta_text_4}).")

        # 6. Test Smart Count Parsing: Request 1 special
        print("Testing requested count: 1 special...")
        await page.fill("#chefRequest", "Just need 1 special plate.")
        await page.click("#generateBtn")
        await page.wait_for_timeout(300)
        cards_1 = await page.query_selector_all("#specialsList .special-card")
        assert len(cards_1) == 1, f"Expected exactly 1 special, got {len(cards_1)}"
        meta_text_1 = await page.inner_text("#generationMeta")
        assert "1 special" in meta_text_1
        print(f"✓ Parsed '1 special' correctly -> {len(cards_1)} card rendered ({meta_text_1}).")

        # 7. Test Recipe View & Ingredient Measurements (Bug #6)
        print("Testing recipe view and realistic ingredient measurements...")
        view_recipe_btn = await cards_1[0].query_selector("button[data-recipe]")
        assert view_recipe_btn is not None
        await view_recipe_btn.click()
        await page.wait_for_timeout(300)

        recipe_panel = await page.query_selector("#recipePanel")
        assert recipe_panel is not None
        recipe_title = await (await recipe_panel.query_selector("h3")).inner_text()
        print(f"  Selected Recipe: '{recipe_title}'")

        ingredients_elements = await recipe_panel.query_selector_all(".recipe-block ul li")
        ingredient_texts = [await li.inner_text() for li in ingredients_elements]
        print(f"  Sample recipe ingredients: {ingredient_texts}")
        assert len(ingredient_texts) > 0, "No ingredients listed in recipe"
        has_realistic_units = any(any(u in ing.lower() for u in ["tbsp", "tsp", "cup", "portion", "pinch", "oz", "ml", "clove"]) for ing in ingredient_texts)
        assert has_realistic_units, f"Expected realistic culinary units in: {ingredient_texts}"
        print("✓ Ingredient measurements display realistic culinary measures (portions, tbsp, tsp, etc.).")

        # 8. Test Save Functionality and State Sync (Bug #5 & Bug #11)
        print("Testing Save Special button and LocalStorage hygiene...")
        save_btn = await recipe_panel.query_selector("button[data-save]")
        assert save_btn is not None
        initial_btn_text = await save_btn.inner_text()
        assert initial_btn_text == "Save Special", f"Expected 'Save Special', got '{initial_btn_text}'"

        # Click save
        await save_btn.click()
        await page.wait_for_timeout(200)
        saved_btn_text = await save_btn.inner_text()
        assert saved_btn_text == "Saved ✓", f"Expected 'Saved ✓', got '{saved_btn_text}'"
        print("✓ Save button text correctly toggled to 'Saved ✓'.")

        # Check saved list in sidebar
        saved_items = await page.query_selector_all("#savedList .saved-item")
        assert len(saved_items) >= 1, "Saved item not added to sidebar #savedList"
        print(f"✓ Sidebar #savedList updated with {len(saved_items)} item(s).")

        # Verify LocalStorage doesn't store base64 strings
        saved_storage_json = await page.evaluate("() => localStorage.getItem('chef-specials-ai-saved')")
        assert saved_storage_json is not None
        assert "data:image" not in saved_storage_json, "LocalStorage contains raw base64 data, violating Bug #5 fix!"
        print("✓ LocalStorage hygiene verified: no base64 payloads stored in browser quota.")

        # Test selecting another cuisine and coming back to check if saved special retains 'Saved ✓'
        await page.click("#savedList .saved-item")
        await page.wait_for_timeout(200)
        reloaded_save_btn = await page.query_selector("#recipePanel button[data-save]")
        assert await reloaded_save_btn.inner_text() == "Saved ✓"
        print("✓ Saved special loaded from sidebar retains 'Saved ✓' state.")

        # 9. Test View Prompt toggle (Bug #7)
        print("Testing 'Show image prompt' detail disclosure...")
        details_summary = await recipe_panel.query_selector(".prompt-fallback summary")
        assert details_summary is not None
        await details_summary.click()
        await page.wait_for_timeout(100)
        image_prompt_p = await recipe_panel.query_selector(".prompt-fallback .image-prompt")
        is_visible = await image_prompt_p.is_visible()
        assert is_visible, "Image prompt details should be visible when expanded"
        prompt_text = await image_prompt_p.inner_text()
        assert len(prompt_text) > 10, "Image prompt text is empty"
        print(f"✓ Image prompt revealed: '{prompt_text[:60]}...'")

        # 10. Test Social Caption Copy Feedback (Bug #9)
        print("Testing Copy Caption button feedback...")
        copy_caption_btn = await recipe_panel.query_selector("button[data-copy-caption]")
        assert copy_caption_btn is not None
        await copy_caption_btn.click()
        await page.wait_for_timeout(300)
        btn_feedback = await copy_caption_btn.inner_text()
        print(f"  Copy button text after click: '{btn_feedback}'")
        assert "Copied ✓" in btn_feedback, f"Expected 'Copied ✓', got '{btn_feedback}'"
        print("✓ Clipboard feedback confirmed: text dynamically shows 'Copied ✓'.")

        # 11. Test Print Stylesheet Rules (Bug #8)
        print("Testing print stylesheet media emulation...")
        await page.emulate_media(media="print")
        marketing_kit_display = await page.evaluate("() => window.getComputedStyle(document.querySelector('.marketing-kit')).display")
        prompt_fallback_display = await page.evaluate("() => window.getComputedStyle(document.querySelector('.prompt-fallback')).display")
        print(f"  Under print media: .marketing-kit display is '{marketing_kit_display}', .prompt-fallback display is '{prompt_fallback_display}'")
        assert marketing_kit_display == "none", f"Expected 'none', got {marketing_kit_display}"
        assert prompt_fallback_display == "none", f"Expected 'none', got {prompt_fallback_display}"
        print("✓ Print stylesheet verified: marketing kit and prompt fallback are hidden in print media.")
        await page.emulate_media(media=None)

        # Check console errors
        print(f"Console errors recorded: {console_errors}")
        assert len(console_errors) == 0, f"Unexpected console errors: {console_errors}"
        print("✓ ZERO console errors during the entire E2E flow.")

        await browser.close()
        print("=== ALL PLAYWRIGHT E2E CHECKS PASSED SUCCESSFULLY (100%) ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
