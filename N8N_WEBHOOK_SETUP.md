# Website enquiry webhook

The project enquiry form sends a POST request to the n8n production webhook configured in `index.html`:

`https://n2x.app.n8n.cloud/webhook/ponegram`

The submitted fields are `name`, `email`, `company`, `service`, `message`, and the hidden anti-spam `website` field. The browser submits these as standard form data (`application/x-www-form-urlencoded`) using `fetch`, so the visitor stays on the page and sees an inline success or error message.

## n8n workflow requirements

1. Add a **Webhook** trigger node with HTTP method **POST** and path `ponegram`.
2. Build the downstream nodes using the incoming form fields. If the workflow writes to Google Sheets, map the fields to the desired spreadsheet and tab in those nodes.
3. Save and activate the workflow so the production URL (`/webhook/ponegram`) is listening.
4. Submit a test from the published website and verify that an execution appears in n8n and the downstream Google Sheets node appends a row.
5. Allow cross-origin requests from the website's published origin in the webhook response. The browser needs an `Access-Control-Allow-Origin` response header for the site to read the success/error status; use the exact website origin rather than `*` where possible.

The `/webhook-test/` address is only for temporary manual tests; the live website is configured to use the production `/webhook/` address. Do not put Google OAuth client secrets in this static site. Configure any Google credentials inside n8n's credential manager.
