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

def main():
    backend_process = None

    try:
        backend_process = start_backend()

        print("\nBackend (http://localhost:8000) and frontend (http://localhost:8000) are running.")
        print("Press Ctrl+C to stop the server.")

        # Keep the script running until interrupted
        while True:
            time.sleep(1)
            if backend_process.poll() is not None:
                print("Backend process terminated unexpectedly.")
                break

    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        if backend_process and backend_process.poll() is None:
            print("Terminating backend process...")
            backend_process.terminate()
            backend_process.wait(timeout=10)
            if backend_process.poll() is None:
                backend_process.kill()
        
        print("Server stopped.")

if __name__ == "__main__":
    main()
