from fastapi import FastAPI
from .routes import router as routes
import uvicorn

app = FastAPI(title='Resume ML Service')
app.include_router(routes)

if __name__ == '__main__':
    uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=False)
