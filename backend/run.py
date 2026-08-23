from app.core.logging import setup_logging
from app.core.config import settings
import uvicorn

if __name__ == "__main__":
    setup_logging()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)