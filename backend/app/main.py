from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.ws_manager import manager
from app.db.session import init_db
from app.api import telemetry, ussd, sms, vehicles, drivers, predict, payments

app = FastAPI(title="Ma3 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router)
app.include_router(ussd.router)
app.include_router(sms.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(predict.router)
app.include_router(payments.router)

@app.on_event("startup")
async def startup():
    await init_db()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/")
async def root():
    return {"status": "Ma3 iko sawa ✓", "docs": "/docs"}
