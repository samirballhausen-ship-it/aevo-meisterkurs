"""ART Final Verification - Complete test of every feature."""
from playwright.sync_api import sync_playwright
import os

BASE = "https://meister-lernapp-teil-iv.vercel.app"
OUT = "/tmp/art-final"
os.makedirs(OUT, exist_ok=True)

RESULTS = []

def log(test, status, detail=""):
    RESULTS.append((test, status, detail))
    icon = "PASS" if status else "FAIL"
    d = f": {detail}" if detail else ""
    print(f"  [{icon}] {test}{d}")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)

    # === 1. LOGIN PAGE ===
    print("\n=== 1. LOGIN PAGE ===")
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark")
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/01-login.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Login page loads", "AEVO Meisterkurs" in body)
    log("Google button", "Mit Google anmelden" in body)
    log("Guest button", "Ohne Anmeldung fortfahren" in body)
    log("Email input", page.locator("#login-email").count() > 0)
    log("Password input", page.locator("#login-password").count() > 0)
    log("Register tab", "Registrieren" in body)
    log("Clawbuis badge", "Clawbuis" in body)

    # Register tab
    page.locator("text=Registrieren").click()
    page.wait_for_timeout(500)
    log("Register form name field", page.locator("#reg-name").count() > 0)
    page.screenshot(path=f"{OUT}/01b-register.png", full_page=True)

    # === 2. GUEST LOGIN ===
    print("\n=== 2. GUEST LOGIN ===")
    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.locator("text=Ohne Anmeldung fortfahren").click()
    page.wait_for_timeout(3000)

    log("Guest redirects to /", "/login" not in page.url)
    guest_flag = page.evaluate('localStorage.getItem("lernapp-guest")')
    log("Guest flag stored", guest_flag == "true")

    # === 3. DASHBOARD ===
    print("\n=== 3. DASHBOARD ===")
    page.goto(f"{BASE}/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/02-dashboard.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Greeting shown", "Hallo" in body)
    log("Jetzt lernen button", "Jetzt lernen" in body)
    log("Handlungsfelder section", "Handlungsfelder" in body)
    log("HF1 card", "Ausbildungsvoraussetzungen" in body)
    log("HF2 card", "vorbereiten" in body)
    log("HF3 card", "durchf" in body)
    log("HF4 card", "abschlie" in body)
    log("Question count shown", "gemeistert" in body)
    log("XP badge in nav", "XP" in body)
    log("Level shown", "Praktikant" in body or "Lehrling" in body)

    # === 4. LERNMODUS SELECTION ===
    print("\n=== 4. LERNMODUS SELECTION ===")
    page.goto(f"{BASE}/lernen")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path=f"{OUT}/03-lernen.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Spaced Repetition mode", "Spaced Repetition" in body)
    log("Schwaechen mode", "trainieren" in body)
    log("Pruefungs-Simulation mode", "Simulation" in body)
    log("HF filter cards", "HF1" in body and "HF2" in body and "HF3" in body and "HF4" in body)

    # === 5. QUESTION + HINT + EXPLANATION ===
    print("\n=== 5. QUESTION + HINT + EXPLANATION ===")
    page.locator("text=Spaced Repetition").click()
    page.wait_for_timeout(3000)
    page.screenshot(path=f"{OUT}/04-question.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Question with ? displayed", "?" in body)
    has_options = page.locator("button.w-full.text-left").count()
    log("Answer options shown", has_options >= 2, f"{has_options} options")

    # TIPP
    hint_btn = page.locator("text=Tipp anzeigen")
    log("Tipp button visible", hint_btn.count() > 0)
    if hint_btn.count() > 0:
        hint_btn.click()
        page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}/05-hint.png", full_page=True)
        log("Hint box appears", page.locator("text=Tipp angezeigt").count() > 0)

    # ANSWER
    opts = page.locator("button.w-full.text-left").all()
    if len(opts) >= 2:
        opts[0].click()
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{OUT}/06-answered.png", full_page=True)

        body_ans = page.locator("body").inner_text()
        has_expl = "Richtig" in body_ans or "Richtige Antwort" in body_ans
        log("Explanation shown after answer", has_expl)
        log("Weiter button shown", "Weiter" in body_ans)
        log("Green/red highlight", page.locator("[class*=success]").count() > 0 or page.locator("[class*=destructive]").count() > 0)

        # NEXT QUESTION
        weiter = page.locator("text=Weiter").first
        if weiter.count() > 0:
            weiter.click()
            page.wait_for_timeout(2000)
            page.screenshot(path=f"{OUT}/07-question2.png", full_page=True)
            body_q2 = page.locator("body").inner_text()
            log("Next question loads", "?" in body_q2)
            log("Counter increments to 2/", "2/" in body_q2)

            # Answer question 2 and go to 3
            opts2 = page.locator("button.w-full.text-left").all()
            if len(opts2) >= 2:
                opts2[1].click()
                page.wait_for_timeout(1500)
                body_a2 = page.locator("body").inner_text()
                log("Q2 explanation shown", "Richtig" in body_a2 or "Richtige Antwort" in body_a2)

    # === 6. STATISTIK ===
    print("\n=== 6. STATISTIK ===")
    page.goto(f"{BASE}/statistik")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path=f"{OUT}/08-statistik.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Statistik title", "Statistik" in body)
    log("Shows metrics", "%" in body)
    log("HF progress sections", "HF1" in body or "Ausbildungsvoraussetzungen" in body)
    log("Pruefungsbereitschaft ring", "bereitschaft" in body.lower())

    # === 7. PRUEFUNG ===
    print("\n=== 7. PRUEFUNG ===")
    page.goto(f"{BASE}/pruefung")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path=f"{OUT}/09-pruefung.png", full_page=True)

    body = page.locator("body").inner_text()
    log("Pruefung page", "Simulation" in body)
    log("30 Fragen info", "30 Fragen" in body)
    log("60 Minuten", "60 Minuten" in body)
    log("Start button", "starten" in body.lower())

    # === 8. PROFIL ===
    print("\n=== 8. PROFIL ===")
    page.goto(f"{BASE}/profil")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)
    page.screenshot(path=f"{OUT}/10-profil.png", full_page=True)

    body = page.locator("body").inner_text()
    log("User name Gast", "Gast" in body)
    log("Level shown", "Praktikant" in body or "Lehrling" in body)
    log("XP counter", "XP" in body)
    log("Achievements section", "Achievements" in body)
    log("Design toggle", "Hell" in body)
    log("Abmelden button", "Abmelden" in body)

    # === 9. LOGOUT ===
    print("\n=== 9. LOGOUT ===")
    page.locator("text=Abmelden").first.click()
    page.wait_for_timeout(3000)
    guest_after = page.evaluate('localStorage.getItem("lernapp-guest")')
    log("Guest cleared on logout", guest_after is None)

    # === 10. ERRORS ===
    print("\n=== 10. CONSOLE ERRORS ===")
    critical = [e for e in errors if "TypeError" in e or "ReferenceError" in e or "Cannot read" in e or "Illegal" in e]
    log("No critical JS errors", len(critical) == 0, f"{len(critical)} critical / {len(errors)} total")
    for e in critical[:3]:
        print(f"    CRITICAL: {e[:150]}")

    ctx.close()

    # === 11. MOBILE ===
    print("\n=== 11. MOBILE ===")
    ctx = b.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark", device_scale_factor=2)
    page = ctx.new_page()

    page.goto(f"{BASE}/login")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/11-mobile-login.png", full_page=True)
    log("Mobile login", "AEVO Meisterkurs" in page.locator("body").inner_text())

    page.locator("text=Ohne Anmeldung fortfahren").click()
    page.wait_for_timeout(2000)

    page.goto(f"{BASE}/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/12-mobile-dashboard.png", full_page=True)
    log("Mobile dashboard", "Handlungsfelder" in page.locator("body").inner_text())
    log("Mobile bottom nav", page.locator("nav").count() > 0)

    page.goto(f"{BASE}/lernen")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)
    page.locator("text=Spaced Repetition").click()
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{OUT}/13-mobile-question.png", full_page=True)
    log("Mobile question card", "?" in page.locator("body").inner_text())

    ctx.close()
    b.close()

# === FINAL REPORT ===
print("\n" + "=" * 60)
print("        ART FINAL VERIFICATION REPORT")
print("=" * 60)
passed = sum(1 for _, s, _ in RESULTS if s)
failed = sum(1 for _, s, _ in RESULTS if not s)
total = len(RESULTS)
pct = round(passed / total * 100)
print(f"\n  PASSED: {passed}/{total}")
print(f"  FAILED: {failed}/{total}")
print(f"  Score:  {pct}%")

if failed > 0:
    print(f"\n  FAILURES:")
    for name, status, detail in RESULTS:
        if not status:
            print(f"    - {name}: {detail}")

print("\n" + "=" * 60)
