import httpx

from app.config import settings


async def upload_blob(content: bytes) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{settings.walrus_publisher_url}/v1/blobs",
            content=content,
            params={"epochs": settings.walrus_epochs},
        )
        resp.raise_for_status()
        return resp.json()


async def read_blob(blob_id: str) -> bytes:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.walrus_aggregator_url}/v1/{blob_id}"
        )
        resp.raise_for_status()
        return resp.content
