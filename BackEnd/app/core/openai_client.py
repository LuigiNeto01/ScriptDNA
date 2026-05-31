from openai import AsyncOpenAI

from app.core.config import settings


def get_openai_client() -> AsyncOpenAI:
    """Cria uma nova instância do AsyncOpenAI.

    Usar uma factory em vez de singleton global evita o erro
    'NoneType' object has no attribute 'send', que ocorre quando
    o httpx.AsyncClient interno fica vinculado a um event loop antigo
    (situação comum em workers Celery que criam novos loops por task).
    """
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


# Alias de compatibilidade — NÃO use este singleton em tasks Celery.
# Prefira chamar get_openai_client() dentro de funções assíncronas.
openai_client = get_openai_client()

