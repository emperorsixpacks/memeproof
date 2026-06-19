from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.hashing import sha256_hex
from app.services.walrus import upload_blob, read_blob

router = APIRouter(prefix="/api/memories", tags=["memories"])


@router.post("/upload")
async def upload_memory(file: UploadFile = File(...)):
    content = await file.read()
    content_hash = sha256_hex(content)

    try:
        walrus_result = await upload_blob(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Walrus upload failed: {e}")

    if "newlyCreated" in walrus_result:
        blob_id = walrus_result["newlyCreated"]["blobObject"]["blobId"]
    elif "alreadyCertified" in walrus_result:
        blob_id = walrus_result["alreadyCertified"]["blobId"]
    else:
        raise HTTPException(status_code=502, detail="Unexpected Walrus response")

    return {
        "walrus_blob_id": blob_id,
        "content_hash": content_hash,
        "size": len(content),
    }


@router.get("/{blob_id}")
async def get_memory_content(blob_id: str):
    try:
        content = await read_blob(blob_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Walrus read failed: {e}")

    return content
