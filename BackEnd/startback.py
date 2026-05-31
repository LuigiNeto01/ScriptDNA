import subprocess
import sys
import time
from pathlib import Path


def _find_python() -> str:
    """Retorna o python do .venv se existir, senão usa o atual."""
    venv = Path(__file__).parent / ".venv"
    if sys.platform == "win32":
        candidate = venv / "Scripts" / "python.exe"
    else:
        candidate = venv / "bin" / "python"
    if candidate.exists():
        return str(candidate)
    return sys.executable


def main():
    python = _find_python()
    print(f"[startback] Usando Python: {python}")

    procs = []
    try:
        # Inicia o worker do Celery
        procs.append(
            subprocess.Popen(
                [
                    python, "-m", "celery",
                    "-A", "app.core.celery_app", "worker",
                    "--loglevel=info",
                    *(["--pool=solo"] if sys.platform == "win32" else []),
                ],
            )
        )
        print("[startback] Worker Celery iniciado")

        # Inicia o servidor FastAPI (uvicorn)
        procs.append(
            subprocess.Popen(
                [
                    python, "-m", "uvicorn",
                    "app.main:app",
                    "--host", "0.0.0.0",
                    "--port", "8000",
                    "--reload",
                ],
            )
        )
        print("[startback] Uvicorn iniciado em http://0.0.0.0:8000")

        # Aguarda ambos os processos
        while True:
            for p in procs:
                ret = p.poll()
                if ret is not None:
                    print(f"[startback] Processo {p.args} encerrou com codigo {ret}")
                    raise SystemExit(ret)
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[startback] Encerrando...")
    finally:
        for p in procs:
            p.terminate()
        for p in procs:
            p.wait(timeout=5)


if __name__ == "__main__":
    main()
