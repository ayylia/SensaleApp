from database import engine, Base
import models

# Create the tables in sqlite
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")
