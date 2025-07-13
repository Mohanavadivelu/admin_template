import subprocess
import sys
import os
import signal
import time

def start_backend():
    """Starts the FastAPI backend server."""
    print("Starting FastAPI backend...")
    # Use sys.executable to ensure the correct python interpreter is used
    # Use --host 0.0.0.0 to make it accessible from outside localhost if needed
    # Use --port 8000 as defined in main.py
    return subprocess.Popen([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])

def start_frontend():
    """Starts the Python HTTP server for the frontend."""
    print("Starting frontend HTTP server...")
    # Use sys.executable to ensure the correct python interpreter is used
    # Serve from the current directory where index.html is located
    return subprocess.Popen([sys.executable, "-m", "http.server", "8095"])

def main():
    backend_process = None
    frontend_process = None

    try:
        backend_process = start_backend()
        time.sleep(5)  # Give the backend a moment to start
        frontend_process = start_frontend()

        print("\nBoth backend (http://localhost:8000) and frontend (http://localhost:8095) servers are running.")
        print("Press Ctrl+C to stop both servers.")

        # Keep the script running until interrupted
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process terminated unexpectedly.")
                break
            if frontend_process.poll() is not None:
                print("Frontend process terminated unexpectedly.")
                break

    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        if backend_process and backend_process.poll() is None:
            print("Terminating backend process...")
            backend_process.terminate()
            backend_process.wait(timeout=10)
            if backend_process.poll() is None:
                backend_process.kill()
        
        if frontend_process and frontend_process.poll() is None:
            print("Terminating frontend process...")
            frontend_process.terminate()
            frontend_process.wait(timeout=10)
            if frontend_process.poll() is None:
                frontend_process.kill()
        
        print("Servers stopped.")

if __name__ == "__main__":
    main()
