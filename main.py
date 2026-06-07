import os
import json
import math
import random
import time
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import numpy as np
from dotenv import load_dotenv
import pymysql
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = FastAPI(title="Bapun's AI Restaurant & Hotel Hub API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------
# DATABASE SETUP (MySQL with graceful local memory fallback)
# ----------------------------------------------------------------
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "bapun_ai_ops")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))

db_connected = False
db_error_message = ""
SessionLocal = None
Base = declarative_base()

# SQLAlchemy Database Models
class DBMenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    sub = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    spice = Column(Integer, nullable=False)
    cal = Column(Integer, nullable=False)
    protein = Column(Integer, nullable=False)
    positiveSentiment = Column(Integer, nullable=False)
    predictedOrders = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)
    icon = Column(String(50), nullable=False)

class DBGuestReview(Base):
    __tablename__ = "guest_reviews"
    id = Column(Integer, primary_key=True, autoincrement=True)
    review_text = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    sentiment_label = Column(String(50), nullable=False)
    date_created = Column(DateTime, default=time.strftime('%Y-%m-%d %H:%M:%S'))

class DBCVEvent(Base):
    __tablename__ = "cv_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String(50), nullable=False)
    event_label = Column(String(200), nullable=False)
    confidence = Column(String(50), nullable=False)
    is_alert = Column(Boolean, default=False)

# Attempt MySQL connection
try:
    # First, try to connect without database to create it if it doesn't exist
    conn = pymysql.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        port=MYSQL_PORT
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DB}")
    cursor.close()
    conn.close()

    # Create engine for the database
    DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db_connected = True
    print(f"Successfully connected to MySQL database: {MYSQL_DB}")
except Exception as e:
    db_connected = False
    db_error_message = str(e)
    print(f"MySQL connection failed: {e}. Falling back to in-memory store.")

# In-Memory Database Fallbacks
memory_menu_items = [
    {"id": "butter-chicken", "name": "Butter Chicken", "category": "non-veg", "sub": "curry", "price": 14.50, "spice": 2, "cal": 540, "protein": 28, "positiveSentiment": 92, "predictedOrders": 48, "status": "SURGING", "icon": "pot"},
    {"id": "chicken-biryani", "name": "Chicken Biryani", "category": "non-veg", "sub": "rice", "price": 16.00, "spice": 4, "cal": 680, "protein": 32, "positiveSentiment": 96, "predictedOrders": 72, "status": "PEAK", "icon": "pot"},
    {"id": "paneer-tikka", "name": "Paneer Tikka", "category": "veg", "sub": "starter", "price": 11.00, "spice": 3, "cal": 320, "protein": 18, "positiveSentiment": 88, "predictedOrders": 25, "status": "STABLE", "icon": "utensils"},
    {"id": "tandoori-roti", "name": "Tandoori Roti", "category": "veg", "sub": "starter", "price": 3.00, "spice": 1, "cal": 120, "protein": 4, "positiveSentiment": 95, "predictedOrders": 110, "status": "STABLE", "icon": "salad"},
    {"id": "chilli-chicken", "name": "Chilli Chicken", "category": "non-veg", "sub": "starter", "price": 12.50, "spice": 5, "cal": 420, "protein": 22, "positiveSentiment": 84, "predictedOrders": 35, "status": "STABLE", "icon": "flame"},
    {"id": "garlic-naan", "name": "Garlic Naan", "category": "veg", "sub": "starter", "price": 4.00, "spice": 1, "cal": 180, "protein": 5, "positiveSentiment": 91, "predictedOrders": 85, "status": "HIGH", "icon": "salad"},
    {"id": "gulab-jamun", "name": "Gulab Jamun", "category": "veg", "sub": "dessert", "price": 5.00, "spice": 1, "cal": 290, "protein": 3, "positiveSentiment": 98, "predictedOrders": 60, "status": "PEAK", "icon": "ice-cream"},
    {"id": "dal-makhani", "name": "Dal Makhani", "category": "veg", "sub": "curry", "price": 10.50, "spice": 2, "cal": 380, "protein": 12, "positiveSentiment": 89, "predictedOrders": 40, "status": "STABLE", "icon": "pot"},
    {"id": "tomato-soup", "name": "Tomato Soup", "category": "veg", "sub": "starter", "price": 7.00, "spice": 2, "cal": 110, "protein": 2, "positiveSentiment": 85, "predictedOrders": 15, "status": "SUBDUED", "icon": "soup"}
]
memory_reviews = []
memory_cv_events = [
    {"timestamp": time.strftime('%H:%M:%S'), "event_label": "CNN Engine Booted", "confidence": "100.0% Conf", "is_alert": False},
    {"timestamp": time.strftime('%H:%M:%S'), "event_label": "Static room models compiled", "confidence": "99.4% Conf", "is_alert": False}
]

# Prepopulate database if table is empty
if db_connected and SessionLocal:
    db = SessionLocal()
    try:
        if db.query(DBMenuItem).count() == 0:
            for item in memory_menu_items:
                db_item = DBMenuItem(**item)
                db.add(db_item)
            db.commit()
            print("Prepopulated menu_items table.")
            
        if db.query(DBCVEvent).count() == 0:
            for event in memory_cv_events:
                db_event = DBCVEvent(**event)
                db.add(db_event)
            db.commit()
    except Exception as e:
        print(f"Error prepopulating tables: {e}")
    finally:
        db.close()

# Helper to get DB Session
def get_db():
    if db_connected and SessionLocal:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    else:
        yield None

# ----------------------------------------------------------------
# GEMINI AI UTILS
# ----------------------------------------------------------------
def get_gemini_client(client_key: Optional[str] = None):
    # Check key priority: Client-passed header -> .env
    key = client_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return None
    try:
        genai.configure(api_key=key)
        return genai.GenerativeModel("gemini-2.5-flash")
    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return None

# ----------------------------------------------------------------
# API SCHEMAS
# ----------------------------------------------------------------
class RegressionTrainRequest(BaseModel):
    model_type: str
    learning_rate: float
    epochs: int

class SentimentRequest(BaseModel):
    review: str

class BrainstormRequest(BaseModel):
    category: str
    max_budget: float
    spice_factor: int
    user_prompt: Optional[str] = ""

class MenuAddRequest(BaseModel):
    id: str
    name: str
    category: str
    sub: str
    price: float
    spice: int
    cal: int
    protein: int
    positiveSentiment: int
    predictedOrders: int
    status: str
    icon: str

class CVReportRequest(BaseModel):
    compliance_mask: float
    compliance_hygiene: float
    distancing_status: str
    camera_id: str

class PricingRequest(BaseModel):
    base_rate: float
    occupancy: float
    demand_factor: float
    weather_impact: str

class CopilotChatRequest(BaseModel):
    message: str
    state: dict  # Holds active dashboard variables (occupancy, items count, reviews count)
    chat_history: Optional[List[dict]] = []

# ----------------------------------------------------------------
# ENDPOINTS
# ----------------------------------------------------------------

@app.get("/api/db-status")
def get_db_status():
    return {
        "connected": db_connected,
        "database": MYSQL_DB if db_connected else "In-Memory Fallback",
        "error": db_error_message if not db_connected else None
    }

# 1. MENU OPTIMIZER API
@app.get("/api/menu")
def get_menu_items(db=Request):
    # Retrieve items from SQL or Memory
    db_sess = next(get_db())
    if db_sess:
        try:
            items = db_sess.query(DBMenuItem).all()
            return [dict(id=i.id, name=i.name, category=i.category, sub=i.sub, price=i.price, spice=i.spice, cal=i.cal, protein=i.protein, positiveSentiment=i.positiveSentiment, predictedOrders=i.predictedOrders, status=i.status, icon=i.icon) for i in items]
        except Exception as e:
            print(f"Database read failed: {e}")
    
    return memory_menu_items

@app.post("/api/menu")
def add_menu_item(item: MenuAddRequest):
    db_sess = next(get_db())
    if db_sess:
        try:
            existing = db_sess.query(DBMenuItem).filter(DBMenuItem.id == item.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Item ID already exists")
            db_item = DBMenuItem(**item.model_dump())
            db_sess.add(db_item)
            db_sess.commit()
            return {"success": True, "source": "MySQL"}
        except Exception as e:
            db_sess.rollback()
            print(f"DB Insert failed: {e}")

    # Memory update
    if any(i["id"] == item.id for i in memory_menu_items):
        raise HTTPException(status_code=400, detail="Item ID already exists")
    memory_menu_items.append(item.model_dump())
    return {"success": True, "source": "In-Memory"}

@app.post("/api/menu/brainstorm")
def brainstorm_menu(req: BrainstormRequest, x_gemini_key: Optional[str] = Header(None)):
    model = get_gemini_client(x_gemini_key)
    if not model:
        # Fallback brainstorm items
        adjectives = ["Spicy", "Crispy", "Royal", "Baked", "Tandoori", "Grand", "Bapun's Special"]
        nouns = ["Kebabs", "Shashlik", "Korma", "Mousse", "Kulfi", "Tikka Roll", "Chaat Platters"]
        
        name = f"{random.choice(adjectives)} {random.choice(nouns)}"
        price = round(2 + random.random() * (req.max_budget - 2), 2)
        sub = "starter" if req.category != "dessert" else "dessert"
        
        simulated_item = {
            "id": name.lower().replace(" ", "-").replace("'", ""),
            "name": name,
            "category": "veg" if req.category in ["veg", "dessert"] else "non-veg",
            "sub": sub,
            "price": price,
            "spice": req.spice_factor,
            "cal": random.randint(150, 500),
            "protein": random.randint(5, 25),
            "positiveSentiment": random.randint(85, 99),
            "predictedOrders": random.randint(20, 80),
            "status": "STABLE",
            "icon": "pot" if sub != "dessert" else "ice-cream"
        }
        return {"item": simulated_item, "simulated": True, "reasoning": "Gemini API key is not configured. Running local generative simulation."}

    # Use actual Gemini
    prompt = f"""
    You are Bapun's AI Restaurant Menu Brainstormer.
    Generate ONE innovative Indian dish based on these parameters:
    - Category: {req.category}
    - Max Price: ${req.max_budget}
    - Spice level (1-5): {req.spice_factor}
    - Additional constraints: {req.user_prompt}
    
    Respond STRICTLY in JSON format with no Markdown blocks, no raw tags, and no wrapper text. Ensure it is parseable with json.loads() in Python.
    Format should match:
    {{
        "id": "dish-id-slug",
        "name": "Dish Name",
        "category": "veg or non-veg",
        "sub": "curry, rice, starter, or dessert",
        "price": price_float,
        "spice": spice_level_1_to_5,
        "cal": calories_int,
        "protein": protein_grams_int,
        "positiveSentiment": 95,
        "predictedOrders": 45,
        "status": "PEAK or STABLE or HIGH",
        "icon": "pot or utensils or salad or flame or ice-cream",
        "reasoning": "A 1-2 sentence description explaining the culinary profile and why this fits the criteria."
    }}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean potential markdown JSON syntax
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        dish_data = json.loads(text)
        return {"item": dish_data, "simulated": False, "reasoning": dish_data.get("reasoning", "Generated by Gemini API.")}
    except Exception as e:
        print(f"Gemini brainstorm failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini service error: {e}")

# 2. ML DEMAND FORECASTER (REGRESSION IN PYTHON)
# Holds the generated temperature & orders dataset to keep it consistent
regression_dataset = []

def get_regression_dataset():
    global regression_dataset
    if not regression_dataset:
        regression_dataset = []
        for _ in range(60):
            temp = 10 + random.random() * 30  # 10 to 40 C
            # Quadratic curve (peak at ~25C) + noise
            clean_orders = 250 - 0.7 * ((temp - 25) ** 2)
            noise = (random.random() - 0.5) * 40
            orders = max(20, int(clean_orders + noise))
            regression_dataset.append({"x": temp, "y": orders})
    return regression_dataset

@app.post("/api/regression/train")
def train_regression(req: RegressionTrainRequest):
    dataset = get_regression_dataset()
    N = len(dataset)
    
    # Normalize inputs to prevent gradient explosions
    x_min, x_max = 10.0, 40.0
    y_min, y_max = 0.0, 300.0
    
    norm_x = np.array([(d["x"] - x_min) / (x_max - x_min) for d in dataset])
    norm_y = np.array([(d["y"] - y_min) / (y_max - y_min) for d in dataset])
    
    # Weights for y = w0 + w1*x + w2*x^2 + w3*x^3
    w = np.zeros(4)
    # Initialize randomly
    w[0] = random.random() - 0.5
    w[1] = random.random() - 0.5
    
    logs = []
    losses = []
    
    def predict(x_val, model, weights):
        if model == "linear":
            return weights[0] + weights[1] * x_val
        elif model == "quadratic":
            return weights[0] + weights[1] * x_val + weights[2] * (x_val ** 2)
        else: # cubic
            return weights[0] + weights[1] * x_val + weights[2] * (x_val ** 2) + weights[3] * (x_val ** 3)

    # Gradient descent loop
    for epoch in range(1, req.epochs + 1):
        y_hat = np.array([predict(x, req.model_type, w) for x in norm_x])
        errors = y_hat - norm_y
        loss = np.mean(errors ** 2)
        
        dw = np.zeros(4)
        dw[0] = np.mean(errors)
        dw[1] = np.mean(errors * norm_x)
        dw[2] = np.mean(errors * (norm_x ** 2))
        dw[3] = np.mean(errors * (norm_x ** 3))
        
        # Update weights
        w[0] -= 2 * dw[0] * req.learning_rate
        w[1] -= 2 * dw[1] * req.learning_rate
        w[2] -= 2 * dw[2] * req.learning_rate
        w[3] -= 2 * dw[3] * req.learning_rate
        
        if epoch == 1 or epoch % 10 == 0 or epoch == req.epochs:
            # R2 Score calculation
            y_mean = np.mean(norm_y)
            ss_tot = np.sum((norm_y - y_mean) ** 2)
            ss_res = np.sum((norm_y - y_hat) ** 2)
            r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
            
            logs.append(f"Epoch {epoch}/{req.epochs} | Loss (MSE): {loss:.6f} | R²: {r2:.4f}")
            losses.append(float(loss))
            
    # Calculate final R2
    y_hat_final = np.array([predict(x, req.model_type, w) for x in norm_x])
    y_mean = np.mean(norm_y)
    ss_tot = np.sum((norm_y - y_mean) ** 2)
    ss_res = np.sum((norm_y - y_hat_final) ** 2)
    final_r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
    final_loss = np.mean((y_hat_final - norm_y) ** 2)

    return {
        "weights": w.tolist(),
        "logs": "\n".join(logs),
        "loss": float(final_loss),
        "r2": float(final_r2),
        "dataset": dataset
    }

@app.post("/api/regression/reset")
def reset_regression_data():
    global regression_dataset
    regression_dataset = []
    get_regression_dataset()
    return {"success": True, "dataset": regression_dataset}

# 3. NLP SENTIMENT ENGINE API
@app.post("/api/sentiment/analyze")
def analyze_sentiment(req: SentimentRequest, x_gemini_key: Optional[str] = Header(None)):
    review_text = req.review
    db_sess = next(get_db())
    
    model = get_gemini_client(x_gemini_key)
    if not model:
        # Fallback offline lexicon analyzer
        sentiment_lexicon = {
            "amazing": 4, "delicious": 4, "fantastic": 4, "excellent": 4, "outstanding": 4, "great": 3, "good": 2, "nice": 2,
            "friendly": 3, "clean": 3, "comfortable": 3, "love": 3, "perfect": 4, "hot": 1, "crisp": 2, "prompt": 3, "tasty": 3,
            "creamy": 2, "beautiful": 3, "wonderful": 4, "recommended": 3, "super": 3,
            "bad": -3, "dirty": -4, "slow": -3, "loud": -2, "noisy": -3, "cold": -2, "terrible": -4, "horrible": -4, "disappointed": -4,
            "stains": -3, "average": -1, "poor": -3, "leaking": -3, "delay": -3, "rude": -4, "wait": -2, "broken": -3
        }
        
        words = review_text.lower().split()
        score = 0
        matched = []
        for word in words:
            cleaned = "".join([c for c in word if c.isalnum()])
            if cleaned in sentiment_lexicon:
                score += sentiment_lexicon[cleaned]
                matched.append(cleaned)
                
        # Map score to 0..100
        val = 50 + (score / 8) * 50
        val = max(0, min(100, val))
        
        label = "NEUTRAL"
        if val > 58:
            label = "POSITIVE"
        elif val < 42:
            label = "NEGATIVE"
            
        entities = []
        # basic entity catalog checks
        catalog = {
            "dish": ["biryani", "roti", "butter chicken", "tandoori", "paneer", "soup", "dessert", "food", "naan"],
            "service": ["service", "waiter", "staff", "manager", "cleanliness", "behavior", "hospitality"],
            "hotel": ["room", "bed", "bathroom", "ac", "air conditioner", "sheet", "pillow", "reception", "lobby"]
        }
        for type_key, items in catalog.items():
            for it in items:
                if it in review_text.lower():
                    entities.append({"name": it.upper(), "type": type_key.upper(), "conf": random.randint(85, 95)})

        actions = ["Monitor hotel room metrics"]
        if label == "NEGATIVE":
            actions = ["Inspect room immediately", "Instruct manager to check guest complaints"]
        elif label == "POSITIVE":
            actions = ["Commend kitchen prep staff", "Record customer preference tags"]

        reply = f"Dear Guest, thank you for sharing your feedback. We have noted your comments about '{', '.join([e['name'] for e in entities]) if entities else 'your visit'}' and will work on improving."

        res_data = {
            "score": val,
            "label": label,
            "entities": entities,
            "actions": actions,
            "reply": reply,
            "simulated": True
        }
        
        # Save to MySQL if connected
        if db_sess:
            try:
                db_review = DBGuestReview(review_text=review_text, sentiment_score=val, sentiment_label=label)
                db_sess.add(db_review)
                db_sess.commit()
            except Exception as e:
                db_sess.rollback()
                print(f"Failed to save review: {e}")
                
        return res_data

    # Real Gemini API analysis
    prompt = f"""
    Analyze the guest review: "{review_text}"
    Extract:
    1. Sentiment polarity score from 0 (extremely negative) to 100 (extremely positive).
    2. Sentiment label: POSITIVE, NEGATIVE, or NEUTRAL.
    3. Entity recognition list: (dish name, service component, or hotel amenity) with entity type and confidence % (e.g. 85-99%).
    4. Actionable operational recommendations (2-3 items).
    5. A professional, custom customer response reply draft.

    Respond STRICTLY in JSON format with no Markdown styling blocks or wrap-around text.
    {{
        "score": float_0_to_100,
        "label": "POSITIVE or NEGATIVE or NEUTRAL",
        "entities": [
            {{"name": "ENTITY_NAME", "type": "DISH or SERVICE or HOTEL", "conf": int_percentage}}
        ],
        "actions": ["Action 1", "Action 2"],
        "reply": "Reply message text..."
    }}
    """
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        res_data = json.loads(text)
        res_data["simulated"] = False
        
        # Save to MySQL if connected
        if db_sess:
            try:
                db_review = DBGuestReview(
                    review_text=review_text, 
                    sentiment_score=float(res_data["score"]), 
                    sentiment_label=res_data["label"]
                )
                db_sess.add(db_review)
                db_sess.commit()
            except Exception as e:
                db_sess.rollback()
                print(f"Failed to save review: {e}")
                
        return res_data
    except Exception as e:
        print(f"Gemini sentiment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

# 4. CV KITCHEN GUARD SAFETY REPORT API
@app.post("/api/vision/report")
def generate_vision_report(req: CVReportRequest, x_gemini_key: Optional[str] = Header(None)):
    timestamp_str = time.strftime('%Y-%m-%d %H:%M:%S')
    db_sess = next(get_db())
    
    # Save event to DB
    event_label = f"Camera Report generated: {req.camera_id}"
    confidence_val = f"Mask: {req.compliance_mask}%, Hygiene: {req.compliance_hygiene}%"
    
    if db_sess:
        try:
            db_event = DBCVEvent(
                timestamp=time.strftime('%H:%M:%S'),
                event_label=event_label,
                confidence=confidence_val,
                is_alert=req.compliance_mask < 85 or req.compliance_hygiene < 85
            )
            db_sess.add(db_event)
            db_sess.commit()
        except Exception as e:
            db_sess.rollback()
            print(f"Failed to save event log: {e}")

    model = get_gemini_client(x_gemini_key)
    if not model:
        # Fallback simulated report
        status_term = "EXCELLENT" if req.compliance_mask > 90 and req.compliance_hygiene > 90 else "WARNING"
        sim_report = f"""[SHIRT REPORT - {status_term}]
Timestamp: {timestamp_str}
Camera ID: {req.camera_id}
Mask/Hairnet compliance stands at {req.compliance_mask}%.
General sanitization score is {req.compliance_hygiene}%.
Social Distancing Density: {req.distancing_status}.

Recommendation: Keep monitoring kitchen prep streams. Maintain compliance protocols."""
        return {"report": sim_report, "simulated": True}

    prompt = f"""
    Generate a professional compliance shift safety audit report for Bapun's Restaurant Kitchen based on these metrics:
    - Camera ID: {req.camera_id}
    - Mask & Hairnet Compliance rating: {req.compliance_mask}%
    - Sanitization rating: {req.compliance_hygiene}%
    - Social Distancing Density state: {req.distancing_status}
    
    Provide:
    1. A summary of current safety and hygiene compliance levels.
    2. A checklist of actions to be taken (especially if ratings are low, e.g. < 90%).
    3. General warnings or commendations based on compliance values.
    Keep it in a professional corporate memo format. Return text format.
    """
    try:
        response = model.generate_content(prompt)
        return {"report": response.text.strip(), "simulated": False}
    except Exception as e:
        print(f"Gemini CV report failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

# Retrieve CV logs
@app.get("/api/vision/logs")
def get_cv_logs():
    db_sess = next(get_db())
    if db_sess:
        try:
            logs = db_sess.query(DBCVEvent).order_by(DBCVEvent.id.desc()).limit(15).all()
            return [dict(timestamp=l.timestamp, event_label=l.event_label, confidence=l.confidence, is_alert=l.is_alert) for l in logs]
        except Exception as e:
            print(f"DB logs read error: {e}")
            
    return memory_cv_events

# 5. DYNAMIC PRICING ENGINE API
@app.post("/api/pricing/calculate")
def calculate_pricing(req: PricingRequest):
    base = req.base_rate
    occupancy = req.occupancy
    demand = req.demand_factor
    weather = req.weather_impact
    
    # Logic formula
    weather_modifier = 1.0
    weather_text = "standard weather conditions"
    
    if weather == 'monsoon':
        weather_modifier = 1.15
        weather_text = "+15% indoor monsoon demand premium"
    elif weather == 'festival':
        weather_modifier = 1.40
        weather_text = "+40% local seasonal holiday multiplier"
    elif weather == 'storm':
        weather_modifier = 0.80
        weather_text = "-20% weather hazard cancellation offset"
        
    scarcity_multiplier = 1.0 + (occupancy * 0.6)
    optimized_price = base * scarcity_multiplier * demand * weather_modifier
    
    # Booking probability calculation (elastic demand sigmoid curve)
    target_price = base * 1.25
    k = base / 4.0
    booking_prob = 1.0 / (1.0 + math.exp((optimized_price - target_price) / k))
    
    rooms_count = 80
    occupied_count = int(occupancy * rooms_count)
    daily_yield = int((occupied_count * optimized_price) + ((rooms_count - occupied_count) * booking_prob * optimized_price))
    
    reasoning = f"Optimized rate adjusted based on {weather_text}, {(occupancy * 100):.0f}% occupancy capacity, and a {demand:.1f}x competitor volume factor."
    
    return {
        "final_price": round(optimized_price, 2),
        "booking_probability": round(booking_prob * 100),
        "daily_yield": daily_yield,
        "reasoning": reasoning,
        "target_price": target_price,
        "k": k
    }

# 6. SYSTEM-WIDE AI COPILOT CHAT API
@app.post("/api/copilot/chat")
def copilot_chat(req: CopilotChatRequest, x_gemini_key: Optional[str] = Header(None)):
    model = get_gemini_client(x_gemini_key)
    user_msg = req.message
    
    # Build context about current system state
    sys_state_desc = f"""
    System State Context:
    - Active Occupancy: {req.state.get('occupancy', '84')}%
    - Today's Forecasted Orders: {req.state.get('predictedOrders', '184')}
    - Active Compliance Rating: {req.state.get('hygieneRating', '98.5')}%
    - Connected Database: {"MySQL (active)" if db_connected else "In-Memory fallback (MySQL disconnected)"}
    - Total Menu Dishes Registered: {req.state.get('menuItemsCount', 9)}
    - Active Latency: {req.state.get('latency', '12ms')}
    """
    
    if not model:
        # Fallback offline chatbot
        responses = [
            f"I am operating in Offline/Simulation Mode. Connect Gemini API to unlock full cognitive reasoning. Regarding your query: I can verify that hotel occupancy is stable at {req.state.get('occupancy', '84')}%.",
            f"System Alert: Running in offline simulation. Please enter a valid Gemini API Key in the settings drawer. {sys_state_desc}",
            "I'm here to assist with Bapun's AI-OPS operations! Try asking about Room rate policies or menu recipe suggestions. To enable full reasoning, configure the Gemini Key."
        ]
        return {"response": random.choice(responses), "simulated": True}

    # Use Gemini with context and chat history
    system_instruction = f"""
    You are 'Bapun's Operations AI Assistant', a premium cognitive co-pilot dashboard agent.
    You manage the unified operations of Bapun's AI Restaurant & Hotel Hub.
    
    {sys_state_desc}
    
    Provide helpful, professional, and context-aware responses to the manager's inquiries. 
    Be concise, use bullet points where helpful, and write in a premium business-minded tone.
    """
    
    try:
        # Format history for Gemini API
        contents = []
        for chat in req.chat_history:
            role = "user" if chat["role"] == "user" else "model"
            contents.append(f"{role.upper()}: {chat['text']}")
        
        contents.append(f"USER: {user_msg}")
        full_prompt = f"{system_instruction}\n\n" + "\n".join(contents)
        
        response = model.generate_content(full_prompt)
        return {"response": response.text.strip(), "simulated": False}
    except Exception as e:
        print(f"Gemini Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

# Serve UI static files
@app.get("/")
def serve_index():
    return FileResponse("index.html")

app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Read port from env, default 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
