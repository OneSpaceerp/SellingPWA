from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Set a default timeout to avoid long waits
        page.set_default_timeout(15000)

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            # Set up local storage before navigating to the page
            page.goto("http://localhost:5173")
            page.evaluate("""() => {
                localStorage.setItem('erpnext-url', 'http://dummy-url.com');
                localStorage.setItem('erpnext-user', '{"usr":"dummy@user.com", "api_key":"dummy_key", "api_secret":"dummy_secret"}');
                localStorage.setItem('erpnext-pos-profile', 'dummy-profile');
            }""")

            # 1. Navigate to the application again to apply the local storage settings
            page.goto("http://localhost:5173")
            page.wait_for_timeout(2000) # wait for page to potentially load

            # 2. Add an item to the cart.
            page.get_by_role("button", name="Add to Cart").first.click(timeout=5000)

            # 3. Go to the cart.
            page.get_by_role("link", name="Cart").click()
            page.wait_for_timeout(2000) # wait for page to potentially load

            # 4. Select a customer.
            page.get_by_role("button", name="Select Customer").click(timeout=5000)
            page.wait_for_timeout(2000) # wait for page to potentially load

            page.get_by_role("button", name="Select").first.click(timeout=5000)
            page.wait_for_timeout(2000) # wait for page to potentially load

            # 5. Take a screenshot.
            page.screenshot(path="jules-scratch/verification/verification.png")

            print("Verification script ran successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
