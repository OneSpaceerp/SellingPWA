from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Set a default timeout to avoid long waits
        page.set_default_timeout(30000)

        # Listen for console events and print them
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        try:
            # 1. Navigate to the application.
            page.goto("http://localhost:5173")

            # Wait for the catalog to load
            page.wait_for_selector('text="Product Catalog"', timeout=30000)
            expect(page.get_by_text("Product Catalog")).to_be_visible()

            # 2. Add an item to the cart.
            # Click the first "Add to Cart" button
            page.get_by_role("button", name="Add to Cart").first.click()

            # 3. Go to the cart.
            page.get_by_role("link", name="Cart").click()
            expect(page.get_by_text("Shopping Cart")).to_be_visible()

            # 4. Select a customer.
            page.get_by_role("button", name="Select Customer").click()
            expect(page.get_by_text("Select a Customer")).to_be_visible()
            # Select the first customer in the list
            page.get_by_role("button", name_A="Select").first.click()

            # 5. Proceed to checkout.
            page.get_by_role("button", name="Proceed to Checkout").click()
            expect(page.get_by_text("Checkout")).to_be_visible()

            # 6. Verify that the checkout page shows the "Create Sales Order Draft" button
            #    and no payment options.
            expect(page.get_by_role("button", name="Create Sales Order Draft")).to_be_visible()
            expect(page.get_by_text("Add a Payment")).not_to_be_visible()

            # 7. Take a screenshot.
            page.screenshot(path="jules-scratch/verification/verification.png")

            print("Verification script ran successfully.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
