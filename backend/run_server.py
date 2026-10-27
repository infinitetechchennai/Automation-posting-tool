import os
import sys
from pathlib import Path

# Add .venv site-packages to sys.path and PYTHONPATH
base_dir = Path(__file__).resolve().parent
venv_site = base_dir / ".venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

os.environ["PYTHONPATH"] = f"{str(venv_site)};{str(base_dir)};" + os.environ.get("PYTHONPATH", "")

import uvicorn
from app.main import app

if __name__ == "__main__":
    print("=" * 60)
    print("Starting SocialPilot AI Backend (FastAPI + Async SQLite/Postgres)")
    print("API Documentation: http://localhost:8000/docs")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
