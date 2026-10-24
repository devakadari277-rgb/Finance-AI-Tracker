import sys
import os

# Add root directory to sys.path so app and modules can be resolved
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

if __name__ == '__main__':
    app.run(debug=True)
