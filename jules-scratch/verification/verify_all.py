from playwright.sync_api import sync_playwright
import re

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock API calls
        page.route(
            re.compile(".*/api/resource/POS Profile?.*"),
            lambda route: route.fulfill(
                status=200,
                json={"data": [{"name": "Test Profile", "company": "Test Company", "currency": "USD"}]}
            )
        )
        page.route(
            re.compile(".*/api/resource/Sales Order.*"),
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"data":[{"name":"SO-00001","creation":"2023-10-27T10:00:00.000Z","customer_name":"Test Customer 1","grand_total":100},{"name":"SO-00002","creation":"2023-10-26T10:00:00.000Z","customer_name":"Test Customer 2","grand_total":200}]}'
            )
        )
        page.route(
            re.compile(".*/api/resource/Customer.*"),
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"data":[{"name":"CUST-00001","customer_name":"Test Customer 1","customer_group":"All Customer Groups"},{"name":"CUST-00002","customer_name":"Test Customer 2","customer_group":"All Customer Groups"}]}'
            )
        )
        page.route(
            re.compile(".*/api/resource/POS Profile/.*"),
            lambda route: route.fulfill(
                status=200,
                json={"data": {"name": "Test Profile", "company": "Test Company", "currency": "USD", "item_groups": [], "customer_groups": [], "warehouse": "Test Warehouse"}}
            )
        )
        page.route(
            re.compile(".*/api/resource/Item.*"),
            lambda route: route.fulfill(status=200, json={"data": [{"name": "ITEM-00001", "item_name": "Test Item 1", "item_group": "All Item Groups", "standard_rate": 100, "stock_uom": "Nos"}]})
        )
        page.route(
            re.compile(".*/api/resource/Sales Order"),
            lambda route: route.fulfill(
                status=200,
                content_type="application/json",
                body='{"data":{"name":"SO-00001"}}'
            )
        )

        page.goto("http://localhost:5173")

        # Set erpnext-url in localStorage to avoid setup page
        page.evaluate("localStorage.setItem('erpnext-url', 'https://lcs.nsd-eg.com')")
        page.reload()

        # Login
        page.wait_for_selector('input[placeholder="Enter your email"]')
        page.locator('input[placeholder="Enter your email"]').fill("pos@pos.com")
        page.locator('input[placeholder="Enter your password"]').fill("pos@123")
        page.locator('button[type="submit"]').click()

        # Wait for POS profile selection
        page.wait_for_selector('h2:has-text("Select POS Profile")')
        page.get_by_text("Test Profile").click()

        # Wait for dashboard
        page.wait_for_selector('h1:has-text("Dashboard")')
        page.screenshot(path="jules-scratch/verification/dashboard.png")

        # Go to catalog, which should redirect to customer selection
        page.get_by_text("Catalog").click()
        page.wait_for_selector('h2:has-text("Select a Customer")')
        page.screenshot(path="jules-scratch/verification/select-customer.png")

        # Select a customer
        page.get_by_text("Test Customer 1").click()

        # Now we should be in the catalog
        page.wait_for_selector('h1:has-text("Product Catalog")')

        # Add an item to the cart
        page.get_by_text("Add to Cart").first.click()

        # Go to checkout
        page.goto("http://localhost:5173/checkout")
        page.wait_for_selector('h1:has-text("Checkout")')

        # Create sales order draft
        page.get_by_text("Create Sales Order Draft").click()

        # Wait for success notification
        page.wait_for_selector('div:has-text("Sales Order Draft Created")')
        page.screenshot(path="jules-scratch/verification/sales-order-success.png")

        browser.close()

run()
