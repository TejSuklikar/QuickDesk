from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import black, blue, grey
from reportlab.lib.units import inch
from reportlab.lib import colors
import io
import json
from reportlab.pdfgen import canvas

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="FreeFlow API", description="AI-powered workflow automation for freelancers")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enums
class ProjectStatus(str, Enum):
    INTAKE = "Intake"
    CONTRACT = "Contract"
    BILLING = "Billing"
    DONE = "Done"

class ContractStatus(str, Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    AWAITING_SIGNATURE = "AwaitingSignature"
    SIGNED = "Signed"
    BLOCKED = "Blocked"

class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    PAID = "Paid"
    OVERDUE = "Overdue"
    FAILED = "Failed"

class SignatureProvider(str, Enum):
    HELLOSIGN = "HelloSign"
    DOCUSIGN = "DocuSign"

class EventKind(str, Enum):
    INTAKE_COMPLETED = "Intake.Completed"
    INTAKE_NEEDS_INFO = "Intake.NeedsInfo"
    CONTRACT_SENT = "Contract.Sent"
    CONTRACT_SIGNED = "Contract.Signed"
    CONTRACT_BLOCKED = "Contract.Blocked"
    INVOICE_SENT = "Invoice.Sent"
    INVOICE_PAID = "Invoice.Paid"
    INVOICE_OVERDUE = "Invoice.Overdue"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    title: str
    description: str
    budget: Optional[float] = None
    timeline: Optional[str] = None
    status: ProjectStatus = ProjectStatus.INTAKE
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    client_id: str
    title: str
    description: str
    budget: Optional[float] = None
    timeline: Optional[str] = None

class Contract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    pdf_url: Optional[str] = None
    variables: Dict[str, Any] = Field(default_factory=dict)
    signature_provider: SignatureProvider = SignatureProvider.HELLOSIGN
    signature_id: Optional[str] = None
    status: ContractStatus = ContractStatus.DRAFT
    signed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ContractCreate(BaseModel):
    project_id: str
    template_id: str

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    amount: float
    due_date: datetime
    status: InvoiceStatus = InvoiceStatus.DRAFT
    stripe_intent_id: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceCreate(BaseModel):
    project_id: str
    amount: float
    mode: str  # "fixed", "hourly", "milestone"
    line_items: Optional[List[Dict[str, Any]]] = None

class AgentEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trace_id: str
    kind: EventKind
    entity_type: str
    entity_id: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IntakeInput(BaseModel):
    raw_text: str
    project_id: Optional[str] = None

class IntakeResult(BaseModel):
    client: Dict[str, Any]
    project: Dict[str, Any]
    confidence: Dict[str, float]
    status: str

# Helper function to clean Claude responses
def clean_claude_response(response: str) -> str:
    """Remove markdown code blocks from Claude responses"""
    response = response.strip()
    if response.startswith('```json'):
        response = response[7:]  # Remove ```json
    elif response.startswith('```'):
        response = response[3:]   # Remove ```
    if response.endswith('```'):
        response = response[:-3]  # Remove trailing ```
    return response.strip()

# AI Agent Classes
class IntakeAgent:
    def __init__(self):
        self.llm = LlmChat(
            api_key=os.environ['CLAUDE_API_KEY'],
            session_id="intake_agent",
            system_message="""You are an AI intake agent for a freelancer workflow system. 
            Your job is to extract structured information from raw client inquiries.
            
            Extract and return JSON with this exact structure:
            {
                "client": {
                    "name": "extracted name",
                    "email": "extracted email", 
                    "company": "extracted company if mentioned"
                },
                "project": {
                    "title": "project title",
                    "description": "project description",
                    "timeline": "extracted timeline",
                    "budget": "extracted budget amount as number or null"
                },
                "confidence": {
                    "budget": 0.0-1.0,
                    "timeline": 0.0-1.0
                },
                "status": "intake_complete" or "needs_more_info"
            }
            
            Be thorough but concise. If information is missing or unclear, set confidence scores lower."""
        ).with_model("anthropic", "claude-4-sonnet-20250514")
    
    async def process_inquiry(self, raw_text: str) -> Dict[str, Any]:
        try:
            user_message = UserMessage(text=f"Extract project information from this inquiry: {raw_text}")
            response = await self.llm.send_message(user_message)
            
            # Clean and parse JSON response
            cleaned_response = clean_claude_response(response)
            result = json.loads(cleaned_response)
            return result
        except Exception as e:
            logger.error(f"Intake agent error: {e}")
            return {
                "client": {"name": "", "email": "", "company": ""},
                "project": {"title": "", "description": raw_text, "timeline": "", "budget": None},
                "confidence": {"budget": 0.0, "timeline": 0.0},
                "status": "needs_more_info"
            }

class ContractAgent:
    def __init__(self):
        self.llm = LlmChat(
            api_key=os.environ['CLAUDE_API_KEY'],
            session_id="contract_agent",
            system_message="""You are an AI contract agent. Generate professional freelance contract variables.
            
            Return JSON with these exact contract variables:
            {
                "client_name": "client full name",
                "client_company": "company name or 'Individual' if none",
                "client_email": "client email address",
                "freelancer_name": "John Smith",
                "freelancer_business": "Smith Digital Services",
                "project_description": "detailed description of work to be performed",
                "deliverables_list": ["specific deliverable 1", "specific deliverable 2", "specific deliverable 3"],
                "start_date": "YYYY-MM-DD format",
                "end_date": "YYYY-MM-DD format",
                "milestone_1": "First milestone with deadline",
                "milestone_2": "Second milestone with deadline", 
                "milestone_3": "Third milestone with deadline",
                "project_budget": 0,
                "payment_terms": "50% upfront, 50% on completion",
                "invoice_platform": "email",
                "net_terms": "30",
                "late_fee": "1.5",
                "jurisdiction": "State of California"
            }
            
            Generate realistic milestones, payment terms, and deadlines based on the project scope and timeline."""
        ).with_model("anthropic", "claude-4-sonnet-20250514")
    
    async def generate_contract_variables(self, project_data: Dict[str, Any], client_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""Generate contract variables for this freelance project:
            
            Client Information:
            - Name: {client_data.get('name', 'Unknown')}
            - Email: {client_data.get('email', 'unknown@email.com')}
            - Company: {client_data.get('company', 'Individual')}
            
            Freelancer Information:
            - Name: {user_data.get('name', 'Freelancer')}
            - Email: {user_data.get('email', 'freelancer@email.com')}
            
            Project Information:
            - Title: {project_data.get('title', 'Untitled Project')}
            - Description: {project_data.get('description', 'No description provided')}
            - Budget: ${project_data.get('budget', 0)}
            - Timeline: {project_data.get('timeline', 'Not specified')}
            
            Generate professional contract variables with realistic milestones and payment terms.
            Use the actual freelancer name and create a business name if not provided.
            """
            user_message = UserMessage(text=prompt)
            response = await self.llm.send_message(user_message)
            
            # Clean and parse JSON response
            cleaned_response = clean_claude_response(response)
            return json.loads(cleaned_response)
        except Exception as e:
            logger.error(f"Contract agent error: {e}")
            # Enhanced fallback with actual user data
            freelancer_business = f"{user_data.get('name', 'Freelancer').split()[0]} Digital Services"
            
            return {
                "client_name": client_data.get("name", "Client Name"),
                "client_company": client_data.get("company", "Individual"),
                "client_email": client_data.get("email", "client@example.com"),
                "freelancer_name": user_data.get("name", "Freelancer"),
                "freelancer_business": freelancer_business,
                "freelancer_email": user_data.get("email", "freelancer@example.com"),
                "project_description": project_data.get("description", "Professional services as described"),
                "deliverables_list": [
                    "Project planning and requirements analysis",
                    "Development and implementation", 
                    "Testing and quality assurance",
                    "Final delivery and documentation"
                ],
                "start_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "end_date": (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "milestone_1": "Project kickoff and requirements - Week 1",
                "milestone_2": "Development phase completion - Week 3",
                "milestone_3": "Final delivery and testing - Week 4",
                "project_budget": project_data.get("budget", 0),
                "payment_terms": "50% upfront, 50% on completion",
                "invoice_platform": "email",
                "net_terms": "30",
                "late_fee": "1.5",
                "jurisdiction": "State of California"
            }

class BillingAgent:
    def __init__(self):
        self.llm = LlmChat(
            api_key=os.environ['CLAUDE_API_KEY'],
            session_id="billing_agent",
            system_message="""You are an AI billing agent. Create professional invoices.
            
            Return JSON for invoice details with this exact structure:
            {
                "invoice_number": "INV-YYYY-XXXX",
                "issue_date": "YYYY-MM-DD",
                "due_date": "YYYY-MM-DD",
                "project_title": "project name",
                "project_description": "brief project description", 
                "line_items": [
                    {"description": "item description", "amount": 0.00},
                    {"description": "item description", "amount": 0.00},
                    {"description": "item description", "amount": 0.00}
                ],
                "subtotal": 0.00,
                "tax_rate": 0.00,
                "tax_amount": 0.00,
                "total_due": 0.00,
                "payment_platform": "Stripe",
                "payment_link": "https://pay.stripe.com/...",
                "net_terms": "30",
                "late_fee": "1.5"
            }
            
            Generate realistic line items that add up to the project total."""
        ).with_model("anthropic", "claude-4-sonnet-20250514")
    
    async def create_invoice_details(self, project_data: Dict[str, Any], amount: float, user_data: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            prompt = f"""Create invoice details for this project:
            Project: {project_data.get('title', 'Untitled Project')}
            Description: {project_data.get('description', 'Professional services')}
            Total Amount: ${amount}
            
            Break down the total amount into 2-3 realistic line items that add up to ${amount}.
            Generate a professional invoice number and set due date 30 days from now.
            """
            user_message = UserMessage(text=prompt)
            response = await self.llm.send_message(user_message)
            
            # Clean and parse JSON response
            cleaned_response = clean_claude_response(response)
            result = json.loads(cleaned_response)
            # Ensure amounts are correct
            result["total_due"] = amount
            result["subtotal"] = amount
            return result
            
        except Exception as e:
            logger.error(f"Billing agent error: {e}")
            # Enhanced fallback
            invoice_number = f"INV-{datetime.utcnow().strftime('%Y')}-{datetime.utcnow().strftime('%m%d')}"
            return {
                "invoice_number": invoice_number,
                "issue_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "due_date": (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "project_title": project_data.get("title", "Professional Services"),
                "project_description": project_data.get("description", "Professional services rendered"),
                "line_items": [
                    {"description": "Project development and implementation", "amount": amount * 0.6},
                    {"description": "Testing and quality assurance", "amount": amount * 0.3},
                    {"description": "Final delivery and support", "amount": amount * 0.1}
                ],
                "subtotal": amount,
                "tax_rate": 0.00,
                "tax_amount": 0.00,
                "total_due": amount,
                "payment_platform": "Stripe",
                "payment_link": "https://pay.stripe.com/invoice_link",
                "net_terms": "30",
                "late_fee": "1.5"
            }

# Initialize agents
intake_agent = IntakeAgent()
contract_agent = ContractAgent()
billing_agent = BillingAgent()

# Helper Functions
async def log_agent_event(trace_id: str, kind: EventKind, entity_type: str, entity_id: str, payload: Dict[str, Any]):
    """Log an agent event for audit trail"""
    event = AgentEvent(
        trace_id=trace_id,
        kind=kind,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload
    )
    await db.agent_events.insert_one(event.dict())
    logger.info(f"Logged event: {kind} for {entity_type}:{entity_id}")

def generate_contract_pdf(variables: Dict[str, Any], output_path: str):
    """Generate contract PDF using your custom template"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], 
                                fontSize=18, spaceAfter=20, alignment=1)
    story.append(Paragraph("FREELANCE SERVICES AGREEMENT", title_style))
    story.append(Spacer(1, 20))
    
    # Contract content using your template
    content_style = ParagraphStyle('Contract', parent=styles['Normal'], 
                                  fontSize=11, spaceAfter=12, leading=16)
    
    # Parties
    parties_text = f"""
    This Freelance Services Agreement ("Agreement") is made between:<br/><br/>
    <b>Client:</b> {variables.get('client_name', 'N/A')}, {variables.get('client_company', 'N/A')}, 
    with primary contact at {variables.get('client_email', 'N/A')} ("Client")<br/>
    and<br/>
    <b>Freelancer:</b> {variables.get('freelancer_name', 'N/A')}, 
    operating as {variables.get('freelancer_business', 'N/A')} ("Freelancer").
    """
    story.append(Paragraph(parties_text, content_style))
    story.append(Spacer(1, 20))
    
    # Section 1: Project Scope
    scope_text = f"""
    <b>1. Project Scope</b><br/>
    Freelancer agrees to perform the following services for Client:<br/>
    {variables.get('project_description', 'N/A')}<br/><br/>
    Deliverables will include:<br/>
    """
    
    deliverables = variables.get('deliverables_list', [])
    for deliverable in deliverables:
        scope_text += f"• {deliverable}<br/>"
    
    story.append(Paragraph(scope_text, content_style))
    story.append(Spacer(1, 15))
    
    # Section 2: Timeline
    timeline_text = f"""
    <b>2. Timeline</b><br/>
    Work will commence on {variables.get('start_date', 'TBD')} and is expected to be completed by {variables.get('end_date', 'TBD')}.<br/><br/>
    Milestones:<br/>
    • {variables.get('milestone_1', 'TBD')}<br/>
    • {variables.get('milestone_2', 'TBD')}<br/>
    • {variables.get('milestone_3', 'TBD')}<br/>
    """
    story.append(Paragraph(timeline_text, content_style))
    story.append(Spacer(1, 15))
    
    # Section 3: Payment Terms
    payment_text = f"""
    <b>3. Payment Terms</b><br/>
    Client agrees to pay Freelancer a total of <b>${variables.get('project_budget', 0):,.2f}</b> for the services described above.<br/><br/>
    Payment schedule:<br/>
    • {variables.get('payment_terms', 'Net 30')}<br/><br/>
    Invoices will be sent via {variables.get('invoice_platform', 'email')} and are payable within {variables.get('net_terms', '30')} days. 
    Late payments may incur a fee of {variables.get('late_fee', '1.5')}%.
    """
    story.append(Paragraph(payment_text, content_style))
    story.append(Spacer(1, 15))
    
    # Sections 4-7: Standard Terms
    standard_terms = """
    <b>4. Ownership and Rights</b><br/>
    Upon receipt of full payment, Client will own the final deliverables. Freelancer retains the right to showcase the work in portfolios or marketing materials.<br/><br/>
    
    <b>5. Confidentiality</b><br/>
    Both parties agree to keep confidential information private, including trade secrets, client data, and sensitive business materials.<br/><br/>
    
    <b>6. Termination</b><br/>
    Either party may terminate this Agreement with written notice. Client must pay for work completed up to the termination date.<br/><br/>
    
    <b>7. Governing Law</b><br/>
    This Agreement will be governed by the laws of """ + variables.get('jurisdiction', 'State of California') + """.<br/><br/>
    """
    story.append(Paragraph(standard_terms, content_style))
    story.append(Spacer(1, 30))
    
    # Signatures
    signature_text = """
    <b>Signatures</b><br/><br/>
    Client: ___________________________   Date: ____________<br/><br/>
    Freelancer: ________________________   Date: ____________
    """
    story.append(Paragraph(signature_text, content_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_invoice_pdf(invoice_data: Dict[str, Any], client_data: Dict[str, Any], freelancer_data: Dict[str, Any], output_path: str):
    """Generate invoice PDF using your custom template"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle('InvoiceTitle', parent=styles['Heading1'], 
                                fontSize=18, spaceAfter=20, alignment=1)
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 20))
    
    # Invoice header info
    header_style = ParagraphStyle('InvoiceHeader', parent=styles['Normal'], 
                                 fontSize=11, spaceAfter=8)
    
    header_text = f"""
    Invoice Number: {invoice_data.get('invoice_number', 'N/A')}<br/>
    Date Issued: {invoice_data.get('issue_date', 'N/A')}<br/>
    Due Date: {invoice_data.get('due_date', 'N/A')}<br/>
    """
    story.append(Paragraph(header_text, header_style))
    story.append(Spacer(1, 20))
    
    # Bill To and From
    parties_style = ParagraphStyle('Parties', parent=styles['Normal'], 
                                  fontSize=11, spaceAfter=12)
    
    parties_text = f"""
    <b>Bill To:</b><br/>
    {client_data.get('name', 'N/A')}<br/>
    {client_data.get('company', '')}<br/>
    {client_data.get('email', 'N/A')}<br/><br/>
    
    <b>From:</b><br/>
    {freelancer_data.get('name', 'N/A')}<br/>
    {freelancer_data.get('business', 'N/A')}<br/>
    {freelancer_data.get('email', 'N/A')}<br/>
    """
    story.append(Paragraph(parties_text, parties_style))
    story.append(Spacer(1, 20))
    
    # Project info
    project_text = f"""
    <b>Project:</b> {invoice_data.get('project_title', 'N/A')}<br/>
    Description: {invoice_data.get('project_description', 'N/A')}<br/>
    """
    story.append(Paragraph(project_text, parties_style))
    story.append(Spacer(1, 20))
    
    # Line Items
    line_items_text = "<b>Line Items:</b><br/>"
    line_items = invoice_data.get('line_items', [])
    for i, item in enumerate(line_items, 1):
        line_items_text += f"{i}. {item.get('description', 'N/A')} — ${item.get('amount', 0):,.2f}<br/>"
    
    story.append(Paragraph(line_items_text, parties_style))
    story.append(Spacer(1, 15))
    
    # Totals
    totals_text = f"""
    <b>Subtotal:</b> ${invoice_data.get('subtotal', 0):,.2f}<br/>
    <b>Tax ({invoice_data.get('tax_rate', 0)}%):</b> ${invoice_data.get('tax_amount', 0):,.2f}<br/>
    <b>Total Due:</b> <b>${invoice_data.get('total_due', 0):,.2f}</b><br/>
    """
    story.append(Paragraph(totals_text, parties_style))
    story.append(Spacer(1, 20))
    
    # Payment instructions
    payment_text = f"""
    <b>Payment Instructions:</b><br/>
    Please pay via {invoice_data.get('payment_platform', 'Stripe')} using the following link:<br/>
    {invoice_data.get('payment_link', 'Payment link will be provided')}<br/><br/>
    
    Payment is due within {invoice_data.get('net_terms', '30')} days of invoice date. 
    Late payments may incur a fee of {invoice_data.get('late_fee', '1.5')}%.<br/><br/>
    
    Thank you for your business!
    """
    story.append(Paragraph(payment_text, parties_style))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

# API Endpoints

# Auth endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user (in production, hash the password)
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=user_data.password  # In production: hash this
    )
    
    result = await db.users.insert_one(user.dict())
    return {"message": "User registered successfully", "user_id": user.id}

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or user["password_hash"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {"message": "Login successful", "user_id": user["id"], "name": user["name"]}

# Client endpoints
@api_router.get("/clients", response_model=List[Client])
async def get_clients():
    clients = await db.clients.find().to_list(1000)
    return [Client(**client) for client in clients]

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate):
    """Create client (internal use - typically called from email processing workflow)"""
    # Note: In production, owner_id should come from JWT token or session
    # For now, we'll use the first user or require proper authentication
    user = await db.users.find_one({})
    if not user:
        raise HTTPException(status_code=400, detail="No user found. Please register first.")
    
    owner_id = user["id"]
    client = Client(**client_data.dict(), owner_id=owner_id)
    await db.clients.insert_one(client.dict())
    return client

@api_router.get("/clients/{client_id}")
async def get_client(client_id: str):
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**client)

# Project endpoints
@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate):
    project = Project(**project_data.dict())
    await db.projects.insert_one(project.dict())
    
    # Log event
    await log_agent_event(
        trace_id=str(uuid.uuid4()),
        kind=EventKind.INTAKE_COMPLETED,
        entity_type="project",
        entity_id=project.id,
        payload=project.dict()
    )
    
    return project

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and all related data"""
    try:
        # Check if project exists
        project = await db.projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete related contracts
        await db.contracts.delete_many({"project_id": project_id})
        
        # Delete related invoices
        await db.invoices.delete_many({"project_id": project_id})
        
        # Delete related agent events
        await db.agent_events.delete_many({"entity_id": project_id})
        
        # Delete the project
        result = await db.projects.delete_one({"id": project_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully", "project_id": project_id}
        
    except Exception as e:
        logger.error(f"Project deletion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete project")

# Intake endpoints
@api_router.post("/intake/parse-email")
async def parse_email_inquiry(intake_data: IntakeInput):
    """Process raw email inquiry using Intake Agent"""
    trace_id = str(uuid.uuid4())
    
    try:
        # Use AI to extract information
        result = await intake_agent.process_inquiry(intake_data.raw_text)
        
        # Log the intake event
        await log_agent_event(
            trace_id=trace_id,
            kind=EventKind.INTAKE_COMPLETED if result["status"] == "intake_complete" else EventKind.INTAKE_NEEDS_INFO,
            entity_type="intake",
            entity_id=trace_id,
            payload=result
        )
        
        return IntakeResult(**result)
        
    except Exception as e:
        logger.error(f"Intake processing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process inquiry")

@api_router.post("/intake/create-manual")
async def create_manual_intake(intake_result: IntakeResult):
    """Create client and project from manual intake"""
    trace_id = str(uuid.uuid4())
    
    try:
        # In production, this would use the authenticated user ID
        user = await db.users.find_one({})
        if not user:
            raise HTTPException(status_code=400, detail="No user found. Please register first.")
        
        user_id = user["id"]
        
        # Create client if not exists
        client_data = intake_result.client
        existing_client = await db.clients.find_one({"email": client_data["email"]})
        
        if not existing_client:
            client = Client(
                name=client_data["name"],
                email=client_data["email"],
                company=client_data.get("company"),
                owner_id=user_id
            )
            await db.clients.insert_one(client.dict())
            client_id = client.id
        else:
            client_id = existing_client["id"]
        
        # Create project
        project_data = intake_result.project
        project = Project(
            client_id=client_id,
            title=project_data["title"],
            description=project_data["description"],
            budget=project_data.get("budget"),
            timeline=project_data.get("timeline"),
            status=ProjectStatus.INTAKE
        )
        await db.projects.insert_one(project.dict())
        
        # Log event
        await log_agent_event(
            trace_id=trace_id,
            kind=EventKind.INTAKE_COMPLETED,
            entity_type="project",
            entity_id=project.id,
            payload={"client_id": client_id, "project": project.dict(), "user_id": user_id}
        )
        
        return {"message": "Project created successfully", "project_id": project.id, "client_id": client_id}
        
    except Exception as e:
        logger.error(f"Manual intake error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")

# Contract endpoints
@api_router.post("/contracts/generate")
async def generate_contract(contract_data: ContractCreate):
    """Generate contract using Contract Agent"""
    trace_id = str(uuid.uuid4())
    
    try:
        # Get project and client data
        project = await db.projects.find_one({"id": contract_data.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        client = await db.clients.find_one({"id": project["client_id"]})
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Get the user who owns this client (for freelancer info)
        user = await db.users.find_one({"id": client["owner_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate contract variables using AI with user info
        variables = await contract_agent.generate_contract_variables(project, client, user)
        
        # Create contract record
        contract = Contract(
            project_id=contract_data.project_id,
            variables=variables,
            status=ContractStatus.DRAFT
        )
        await db.contracts.insert_one(contract.dict())
        
        # Update project status
        await db.projects.update_one(
            {"id": contract_data.project_id},
            {"$set": {"status": ProjectStatus.CONTRACT}}
        )
        
        # Log event
        await log_agent_event(
            trace_id=trace_id,
            kind=EventKind.CONTRACT_SENT,
            entity_type="contract",
            entity_id=contract.id,
            payload=contract.dict()
        )
        
        return contract
        
    except Exception as e:
        logger.error(f"Contract generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate contract")

@api_router.post("/contracts/send")
async def send_contract(contract_id: str):
    """Send contract for signature"""
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Update contract status
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {"status": ContractStatus.AWAITING_SIGNATURE}}
    )
    
    return {"message": "Contract sent for signature", "contract_id": contract_id}

@api_router.get("/contracts/{contract_id}/pdf")
async def download_contract_pdf(contract_id: str):
    """Generate and download contract as PDF"""
    try:
        contract = await db.contracts.find_one({"id": contract_id})
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Get client and project info
        client = await db.clients.find_one({"id": contract["client_id"]})
        project = await db.projects.find_one({"id": contract["project_id"]})
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.darkblue
        )
        
        # Create content
        content = []
        content.append(Paragraph("SERVICE CONTRACT", title_style))
        content.append(Spacer(1, 0.2*inch))
        
        # Contract details
        vars = contract.get("variables", {})
        contract_text = f"""
        <b>Project:</b> {project.get('title', 'N/A')}<br/>
        <b>Client:</b> {client.get('name', 'N/A')} - {client.get('company', 'N/A')}<br/>
        <b>Freelancer:</b> {vars.get('freelancer_name', 'N/A')}<br/>
        <b>Total Amount:</b> ${vars.get('project_budget', 'N/A')}<br/>
        <b>Timeline:</b> {vars.get('start_date', 'N/A')} to {vars.get('end_date', 'N/A')}<br/>
        <b>Payment Terms:</b> {vars.get('payment_terms', 'N/A')}<br/><br/>
        
        <b>Scope of Work:</b><br/>
        {vars.get('scope_description', 'N/A')}<br/><br/>
        
        <b>Terms and Conditions:</b><br/>
        {vars.get('terms_conditions', 'Standard terms and conditions apply.')}<br/><br/>
        
        <b>Signatures:</b><br/>
        Client: _________________________ Date: _________<br/>
        Freelancer: _________________________ Date: _________
        """
        
        content.append(Paragraph(contract_text, styles['Normal']))
        
        # Build PDF
        doc.build(content)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=contract_{contract_id[:8]}.pdf"}
        )
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        raise HTTPException(status_code=500, detail="PDF generation failed")

@api_router.get("/invoices/{invoice_id}/pdf")
async def download_invoice_pdf(invoice_id: str):
    """Generate and download invoice as PDF"""
    try:
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get client and project info
        client = await db.clients.find_one({"id": invoice["client_id"]})
        project = await db.projects.find_one({"id": invoice["project_id"]})
        
        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Title style
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.darkblue
        )
        
        # Create content
        content = []
        content.append(Paragraph("INVOICE", title_style))
        content.append(Spacer(1, 0.2*inch))
        
        # Invoice details
        details = invoice.get("details", {})
        invoice_text = f"""
        <b>Invoice Number:</b> {details.get('invoice_number', invoice['id'][:8])}<br/>
        <b>Project:</b> {project.get('title', 'N/A')}<br/>
        <b>Client:</b> {client.get('name', 'N/A')} - {client.get('company', 'N/A')}<br/>
        <b>Issue Date:</b> {details.get('issue_date', 'N/A')}<br/>
        <b>Due Date:</b> {details.get('due_date', 'N/A')}<br/><br/>
        
        <b>Line Items:</b><br/>
        """
        
        # Add line items
        line_items = details.get("line_items", [])
        total = 0
        for item in line_items:
            amount = float(item.get("amount", 0))
            total += amount
            invoice_text += f"• {item.get('description', 'N/A')}: ${amount:.2f}<br/>"
        
        invoice_text += f"""<br/>
        <b>Subtotal:</b> ${total:.2f}<br/>
        <b>Tax:</b> ${details.get('tax_amount', 0)}<br/>
        <b>Total Amount Due:</b> ${invoice.get('amount', total)}<br/><br/>
        
        <b>Payment Instructions:</b><br/>
        {details.get('payment_instructions', 'Please process payment according to agreed terms.')}<br/><br/>
        
        Thank you for your business!
        """
        
        content.append(Paragraph(invoice_text, styles['Normal']))
        
        # Build PDF
        doc.build(content)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice_id[:8]}.pdf"}
        )
        
    except Exception as e:
        logger.error(f"Invoice PDF generation error: {e}")
        raise HTTPException(status_code=500, detail="Invoice PDF generation failed")

@api_router.get("/contracts/status/{contract_id}")
async def get_contract_status(contract_id: str):
    contract = await db.contracts.find_one({"id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return Contract(**contract)

# Invoice endpoints
@api_router.post("/invoices/create")
async def create_invoice(invoice_data: InvoiceCreate):
    """Create invoice using Billing Agent"""
    trace_id = str(uuid.uuid4())
    
    try:
        # Get project and related data
        project = await db.projects.find_one({"id": invoice_data.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        client = await db.clients.find_one({"id": project["client_id"]})
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
            
        user = await db.users.find_one({"id": client["owner_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate invoice details using AI
        invoice_details = await billing_agent.create_invoice_details(project, invoice_data.amount, user)
        
        # Create invoice with enhanced structure
        invoice = Invoice(
            project_id=invoice_data.project_id,
            amount=invoice_data.amount,
            due_date=datetime.strptime(invoice_details["due_date"], "%Y-%m-%d"),
            status=InvoiceStatus.SENT
        )
        
        # Store the full invoice details in the invoice record
        invoice_dict = invoice.dict()
        invoice_dict["details"] = invoice_details
        
        await db.invoices.insert_one(invoice_dict)
        
        # Update project status
        await db.projects.update_one(
            {"id": invoice_data.project_id},
            {"$set": {"status": ProjectStatus.BILLING}}
        )
        
        # Log event
        await log_agent_event(
            trace_id=trace_id,
            kind=EventKind.INVOICE_SENT,
            entity_type="invoice",
            entity_id=invoice.id,
            payload={"invoice": invoice.dict(), "details": invoice_details}
        )
        
        # Return invoice with details
        result = invoice.dict()
        result["details"] = invoice_details
        return result
        
    except Exception as e:
        logger.error(f"Invoice creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create invoice")

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return Invoice(**invoice)

@api_router.post("/invoices/remind/{invoice_id}")
async def remind_invoice(invoice_id: str):
    """Send invoice reminder"""
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return {"message": "Reminder sent", "invoice_id": invoice_id}

# Dashboard endpoints
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    # Count projects by status
    intake_count = await db.projects.count_documents({"status": ProjectStatus.INTAKE})
    contract_count = await db.projects.count_documents({"status": ProjectStatus.CONTRACT})
    billing_count = await db.projects.count_documents({"status": ProjectStatus.BILLING})
    
    # Count contracts by status
    pending_contracts = await db.contracts.count_documents({"status": ContractStatus.AWAITING_SIGNATURE})
    signed_contracts = await db.contracts.count_documents({"status": ContractStatus.SIGNED})
    
    # Count invoices by status
    sent_invoices = await db.invoices.count_documents({"status": InvoiceStatus.SENT})
    paid_invoices = await db.invoices.count_documents({"status": InvoiceStatus.PAID})
    overdue_invoices = await db.invoices.count_documents({"status": InvoiceStatus.OVERDUE})
    
    return {
        "projects": {
            "intake": intake_count,
            "contract": contract_count,
            "billing": billing_count
        },
        "contracts": {
            "pending": pending_contracts,
            "signed": signed_contracts
        },
        "invoices": {
            "sent": sent_invoices,
            "paid": paid_invoices,
            "overdue": overdue_invoices
        }
    }

@api_router.get("/dashboard/work-queue")
async def get_work_queue():
    """Get items that need attention"""
    work_items = []
    
    # Projects missing budget
    projects_missing_budget = await db.projects.find({"budget": None}).to_list(100)
    for project in projects_missing_budget:
        work_items.append({
            "id": project["id"],
            "type": "project",
            "priority": "medium",
            "title": f"Missing budget for {project['title']}",
            "description": "Project needs budget information",
            "link": f"/projects/{project['id']}"
        })
    
    # Overdue invoices
    overdue_invoices = await db.invoices.find({
        "status": InvoiceStatus.SENT,
        "due_date": {"$lt": datetime.utcnow()}
    }).to_list(100)
    
    for invoice in overdue_invoices:
        work_items.append({
            "id": invoice["id"],
            "type": "invoice",
            "priority": "high",
            "title": f"Invoice ${invoice['amount']:,.2f} overdue",
            "description": f"Due {invoice['due_date'].strftime('%Y-%m-%d')}",
            "link": f"/invoices/{invoice['id']}"
        })
    
    return work_items

@api_router.get("/dashboard/agent-activity")
async def get_agent_activity(limit: int = 50):
    """Get recent agent activity"""
    events = await db.agent_events.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [AgentEvent(**event) for event in events]

# Webhook endpoints
@api_router.post("/webhooks/stripe")
async def stripe_webhook():
    """Handle Stripe webhooks"""
    return {"message": "Stripe webhook processed"}

@api_router.post("/webhooks/signature")
async def signature_webhook():
    """Handle signature provider webhooks"""
    return {"message": "Signature webhook processed"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "FreeFlow API is running", "status": "healthy"}

# Development endpoints
@api_router.delete("/dev/cleanup")
async def cleanup_demo_data():
    """Clean up any demo/test data"""
    try:
        # Remove demo users
        await db.users.delete_many({"email": {"$regex": "demo|test"}})
        
        # Remove projects/clients/contracts/invoices associated with demo users
        demo_clients = await db.clients.find({"owner_id": {"$regex": "demo"}}).to_list(length=None)
        demo_client_ids = [client["id"] for client in demo_clients]
        
        if demo_client_ids:
            await db.projects.delete_many({"client_id": {"$in": demo_client_ids}})
            await db.contracts.delete_many({"client_id": {"$in": demo_client_ids}})
            await db.invoices.delete_many({"client_id": {"$in": demo_client_ids}})
            await db.clients.delete_many({"id": {"$in": demo_client_ids}})
        
        # Clean up any orphaned data
        await db.agent_events.delete_many({"entity_id": {"$regex": "demo"}})
        
        return {"message": "Demo data cleaned up successfully"}
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        return {"message": "Cleanup completed with some errors", "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)