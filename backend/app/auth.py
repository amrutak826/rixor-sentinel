"""
app/auth.py

Webhook authentication for Tier-1 ingestion, matching the spec:
    "Webhook authentication (X-Webhook-Secret / Bearer)"

Accepts EITHER:
    - header `X-Webhook-Secret: <settings.webhook_secret>`
    - header `Authorization: Bearer <settings.bearer_token>`

Either credential alone is sufficient (gateways differ in which header
style they support), but at least one must be present and correct.
"""

from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.config import settings


async def verify_webhook_auth(
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> None:
    if x_webhook_secret is not None and x_webhook_secret == settings.webhook_secret:
        return

    if authorization is not None and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token == settings.bearer_token:
            return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing webhook credentials. Provide X-Webhook-Secret or an Authorization: Bearer token.",
    )
