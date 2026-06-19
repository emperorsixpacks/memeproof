from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.hashing import sha256_hex
from app.services.walrus import read_blob

router = APIRouter(prefix="/api/verify", tags=["verify"])


class VerifyRequest(BaseModel):
    walrus_blob_id: str
    expected_hash: str


class VerifyResponse(BaseModel):
    match: bool
    computed_hash: str


@router.post("")
async def verify_memory(req: VerifyRequest) -> VerifyResponse:
    try:
        content = await read_blob(req.walrus_blob_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch blob from Walrus: {e}")

    computed = sha256_hex(content)
    matched = computed == req.expected_hash

    return VerifyResponse(match=matched, computed_hash=computed)
