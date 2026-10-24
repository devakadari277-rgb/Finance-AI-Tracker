import sys
import os

# Add root directory to sys.path so app and modules can be resolved
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

class VercelPathMiddleware:
    """
    Middleware to ensure Vercel Serverless properly preserves request paths
    even when rewritten through /api/index.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        matched_path = environ.get('HTTP_X_MATCHED_PATH') or environ.get('HTTP_X_FORWARDED_URI')
        if matched_path:
            environ['PATH_INFO'] = matched_path
        else:
            path = environ.get('PATH_INFO', '')
            if path in ['/api/index', '/api/index/', '/api', '/api/']:
                environ['PATH_INFO'] = '/'
            elif path.startswith('/api/index/'):
                environ['PATH_INFO'] = path[len('/api/index'):]

        environ['SCRIPT_NAME'] = ''
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathMiddleware(app.wsgi_app)

if __name__ == '__main__':
    app.run(debug=True)
