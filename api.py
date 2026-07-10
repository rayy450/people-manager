from fastapi import FastAPI, HTTPException,Depends,UploadFile, File, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from sqlmodel import SQLModel, create_engine,Field,Session,select
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext          
from jose import JWTError, jwt                    
from datetime import datetime, timedelta           
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import os

load_dotenv()

email=os.getenv("EMAIL")
password=os.getenv("APP_PASSWORD")
smtp_server=os.getenv("SMTP_SERVER")
smtp_port=int(os.getenv("SMTP_PORT"))

def send_email(to_email: str, subject: str, body: str):
    msg=EmailMessage()
    msg["Subject"]=subject
    msg["From"]=email
    msg["To"]=to_email
    msg.set_content(body)
    
    with smtplib.SMTP(smtp_server,smtp_port) as server:
        server.starttls()
        print("Logging in")
        server.login(email,password)
        print("Sending email")
        print("Sending to:", to_email)
        server.send_message(msg)
    print("Email sent successfully")

s_key=os.getenv("SECRET_KEY")
algo="HS256"
time_delta=timedelta(minutes=30)

def create_token(data: dict):
    payload=data.copy()
    payload["exp"]=datetime.utcnow()+time_delta
    token=jwt.encode(payload,s_key,algorithm=algo)
    return token
    

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
context = CryptContext(schemes=["bcrypt"])

def current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload= jwt.decode(token,s_key,algorithms=[algo])
        user_email: str = payload.get("sub")
        if user_email is None:
             raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    with Session(engine) as session:
        user=session.exec(select(User).where(User.email==user_email)).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
class User(SQLModel,table=True):
    id:int | None = Field(default=None,primary_key=True)
    name:str=Field(index=True)
    age:int|None=Field(default=None,index=True,ge=0,le=120)
    email: str = Field(index=True, unique=True)
    password: str
    role: str = Field(default="user", index=True)
    
sql_name="database.db"
sql_url=f"sqlite:///{sql_name}"
connect={"check_same_thread":False}
engine=create_engine(sql_url,connect_args=connect)

def create():
    SQLModel.metadata.create_all(engine)

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def start():
    create()
    
maxsize=10*1024*1024

allowed={"application/pdf","image/jpeg","image/png","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

@app.post("/upload")
def uploadfile(file:UploadFile=File(...)):
    if file.content_type not in allowed:
        raise HTTPException(status_code=400,detail="Invalid file type")
    con=file.file.read(maxsize+1)
    if len(con)>maxsize:
        raise HTTPException(status_code=400,detail="File too large")
    with open(f"files/{file.filename}","wb") as f:
        f.write(con)
    return {"filename":"File uploaded successfully"}

@app.post("/login")
def login(form:OAuth2PasswordRequestForm=Depends()):
    with Session(engine) as session:
        user=session.exec(select(User).where(User.email==form.username)).first()
        if not user:
            raise HTTPException(status_code=401,detail="Invalid")
        if not context.verify(form.password,user.password):
            raise HTTPException(status_code=401,detail="Invalid")
        token=create_token({"sub":user.email,"role":user.role})
        return {"access_token":token,"token_type":"bearer"}
    
@app.post("/users")
def create_user(user: User,Background_Tasks: BackgroundTasks):
    user.password = context.hash(user.password)
    with Session(engine) as session:
        session.add(user)
        session.commit()
        session.refresh(user)
        Background_Tasks.add_task(send_email, user.email, "Welcome to our website", "Thank you for registering!")
        return user
    
@app.get("/users")
def get_users(offset: int = 0,limit: int = 2,current: User = Depends(current_user)):
    with Session(engine) as session:
        users = session.exec(select(User).offset(offset).limit(limit)).all()
        return users
    
@app.get("/users/{user_id}")
def get_user(user_id: int, current: User = Depends(current_user)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        return user

@app.put("/users/{user_id}")
def update_user(user_id:int, updated_user:User, current: User = Depends(current_user)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.name = updated_user.name
        user.age = updated_user.age
        
        session.add(user)
        session.commit()
        return user

@app.delete("/users/{user_id}")
def delete_user(user_id:int, current: User = Depends(current_user)):
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        session.delete(user)
        session.commit()
        return {"message": "User deleted successfully"}
    

