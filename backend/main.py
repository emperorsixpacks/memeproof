from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.memories import router as memories_router
from app.routes.verify import router as verify_router

app = FastAPI(title="MemProof Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memories_router)
app.include_router(verify_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
