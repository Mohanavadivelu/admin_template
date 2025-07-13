from fastapi import FastAPI
from server.legacy_apps.routes import router as legacy_apps_router
from server.usage_data.routes import router as usage_data_router
from server.database.database import init_db

app = FastAPI(
    title="Application Statistics API",
    description="API for managing legacy applications and tracking usage data.",
    version="1.0.0",
)

# Include the routers
app.include_router(legacy_apps_router)
app.include_router(usage_data_router)

@app.on_event("startup")
async def startup_event():
    """Initialize the database on application startup."""
    init_db()

@app.get("/")
async def root():
    return {"message": "Welcome to the Application Statistics API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
