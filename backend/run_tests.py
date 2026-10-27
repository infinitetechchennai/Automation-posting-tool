import sys
import os

# Add local venv site-packages and backend app to sys.path
base_dir = os.path.dirname(os.path.abspath(__file__))
venv_site = os.path.join(base_dir, ".venv", "Lib", "site-packages")
if os.path.exists(venv_site) and venv_site not in sys.path:
    sys.path.insert(0, venv_site)
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

import pytest

if __name__ == "__main__":
    os.chdir(base_dir)
    exit_code = pytest.main(["-v"] + sys.argv[1:])
    sys.exit(exit_code)
