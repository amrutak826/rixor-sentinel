# Security

Please do not commit secrets, API credentials, Firebase service-account JSON, production webhook tokens, or `.env` files.

If a secret is accidentally committed:
1. Rotate/revoke it immediately.
2. Remove it from the repository history if necessary.
3. Replace it using environment/deployment secrets.
