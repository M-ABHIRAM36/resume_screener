# from fastapi import FastAPI
# from .routes import router as routes
# import uvicorn

# app = FastAPI(title='Resume ML Service')
# app.include_router(routes)

# if __name__ == '__main__':
#     uvicorn.run('app.main:app', host='0.0.0.0', port=8000, reload=False)

# for testing deployment it worked -2
# from fastapi import FastAPI

# app = FastAPI(title='Resume ML Service')

# @app.get("/")
# def home():
#     return {"status": "ML service running"}
from fastapi import FastAPI

app = FastAPI(title='Resume ML Service')

@app.get("/")
def home():
    return {"status": "ML service running"}

@app.on_event("startup")
def load_routes():
    try:
        from .routes import router as routes
        app.include_router(routes)
        print("✅ Routes loaded successfully")
    except Exception as e:
        print("❌ Routes failed:", str(e))
