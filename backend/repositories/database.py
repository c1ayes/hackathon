from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine('sqlite:///city.db')

Base = declarative_base()

Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)