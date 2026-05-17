from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, database, ai_service
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="EcoTrack AI API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bill-tracker-with-ai-1.onrender.com",
        "https://bill-tracker-ai-backend.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/household", response_model=schemas.Household)
def create_household(household: schemas.HouseholdCreate, db: Session = Depends(get_db)):
    db_household = models.Household(**household.dict())
    db.add(db_household)
    db.commit()
    db.refresh(db_household)
    return db_household

@app.post("/api/utilities", response_model=schemas.Utility)
async def create_utility(utility: schemas.UtilityCreate, db: Session = Depends(get_db)):
    # 1. Get household info for the prompt
    household = db.query(models.Household).filter(models.Household.id == utility.household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    
    # 2. Get AI Recommendation
    household_info = {
        "household_size": household.household_size,
        "home_type": household.home_type
    }
    utility_dict = utility.dict()
    ai_recommendation = await ai_service.get_ai_recommendation(utility_dict, household_info)
    
    # 3. Save to DB
    db_utility = models.Utility(**utility_dict, ai_recommendation=ai_recommendation)
    db.add(db_utility)
    db.commit()
    db.refresh(db_utility)
    return db_utility

@app.get("/api/household/{household_id}", response_model=schemas.Household)
def get_household(household_id: int, db: Session = Depends(get_db)):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    return household

@app.get("/api/history/{household_id}", response_model=list[schemas.Utility])
def get_history(household_id: int, db: Session = Depends(get_db)):
    history = db.query(models.Utility).filter(models.Utility.household_id == household_id).all()
    return history

@app.put("/api/utilities/{utility_id}", response_model=schemas.Utility)
def update_utility(utility_id: int, update: schemas.UtilityUpdate, db: Session = Depends(get_db)):
    record = db.query(models.Utility).filter(models.Utility.id == utility_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Utility record not found")
    for field, value in update.dict(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record

@app.delete("/api/utilities/{utility_id}")
def delete_utility(utility_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Utility).filter(models.Utility.id == utility_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Utility record not found")
    db.delete(record)
    db.commit()
    return {"ok": True}

@app.get("/")
def read_root():
    return {"message": "EcoTrack AI API is running"}
