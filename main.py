from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # New import
from server.legacy_apps.routes import router as legacy_apps_router
from server.usage_data.routes import router as usage_data_router
from server.database.database import init_db

app = FastAPI(
    title="Application Statistics API",
    description="API for managing legacy applications and tracking usage data.",
    version="1.0.0",
)

# Include the routers
# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:8090", # Frontend origin
    "http://localhost:8095", # Another possible frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(legacy_apps_router)
app.include_router(usage_data_router)

@app.on_event("startup")
async def startup_event():
    """Initialize the database on application startup."""
    init_db()

# Serve static files (frontend)
# This should be mounted after API routes to ensure API routes are matched first
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
