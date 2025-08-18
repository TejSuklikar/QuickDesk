import os
import json
import logging
import uuid
from typing import Dict, Any
from datetime import datetime, timedelta
import anthropic

logger = logging.getLogger(__name__)

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

class BillingAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.environ['CLAUDE_API_KEY']
        )
        self.system_message = """You are an AI billing agent. Create professional invoices.
            
            Return JSON with invoice data including ALL required fields:
            {
                "invoice_number": "INV-001",
                "issue_date": "YYYY-MM-DD",
                "due_date": "YYYY-MM-DD",
                "line_items": [
                    {"description": "Service 1", "amount": 0},
                    {"description": "Service 2", "amount": 0}
                ],
                "subtotal": 0,
                "tax_rate": 0.00,
                "tax_amount": 0.00,
                "total_due": 0,
                "payment_platform": "Stripe",
                "payment_link": "https://pay.stripe.com/invoice_link",
                "payment_instructions": "Please process payment according to agreed terms.",
                "net_terms": "30",
                "late_fee": "1.5"
            }
            
            IMPORTANT: Always include invoice_number, issue_date, and due_date fields.
            Break down project amount into logical service components."""
    
    async def generate_invoice_data(self, project_data: Dict[str, Any], amount: float, mode: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            Generate invoice data for:
            Project: {project_data}
            Amount: ${amount}
            Mode: {mode}
            
            Create appropriate line items based on the project description and amount.
            Include invoice number, issue date (today), and due date (30 days from today).
            MUST include all required fields: invoice_number, issue_date, due_date.
            """
            
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=self.system_message,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Get response content
            content = response.content[0].text
            
            # Clean and parse JSON response
            cleaned_response = clean_claude_response(content)
            result = json.loads(cleaned_response)
            
            # GUARANTEE required fields exist
            today = datetime.utcnow()
            due_date = today + timedelta(days=30)
            
            # Ensure critical fields are present
            if "due_date" not in result:
                result["due_date"] = due_date.strftime("%Y-%m-%d")
            if "issue_date" not in result:
                result["issue_date"] = today.strftime("%Y-%m-%d")
            if "invoice_number" not in result:
                result["invoice_number"] = f"INV-{str(uuid.uuid4())[:8].upper()}"
            
            return result
            
        except Exception as e:
            logger.error(f"Billing agent error: {e}")
            # Enhanced fallback with due_date
            today = datetime.utcnow()
            due_date = today + timedelta(days=30)
            
            return {
                "invoice_number": f"INV-{str(uuid.uuid4())[:8].upper()}",
                "issue_date": today.strftime("%Y-%m-%d"),
                "due_date": due_date.strftime("%Y-%m-%d"),
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
                "payment_instructions": "Please process payment according to agreed terms.",
                "net_terms": "30",
                "late_fee": "1.5"
            }