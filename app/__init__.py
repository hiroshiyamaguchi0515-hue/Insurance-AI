# This file initializes the app package. It may include application setup code and import statements for other modules in the app.

from fastapi import FastAPI

app = FastAPI()

from . import auth, crud, database, dependencies, models, schemas, utils, vector_store_utils