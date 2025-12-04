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
        self.system_message = """You are an expert AI billing agent specializing in professional invoice generation for freelance projects.

Your task is to analyze project information and create detailed, professional invoices with appropriate line item breakdowns.

INVOICE GENERATION INSTRUCTIONS:

1. LINE ITEMS BREAKDOWN:
   - Analyze the project description and budget to create 3-5 logical service line items
   - Each line item should represent a distinct phase or deliverable of the project
   - Common categories: Planning & Design, Development, Testing & QA, Deployment, Support
   - Ensure line item amounts sum to the total project amount
   - Use specific, professional descriptions (not generic placeholders)

2. AMOUNT DISTRIBUTION:
   - For development projects: 60% development, 20% planning, 15% testing, 5% deployment
   - For design projects: 50% design work, 25% revisions, 15% assets, 10% delivery
   - For consulting: Break down by consultation phases or deliverables
   - Adjust percentages based on project specifics mentioned in the description

3. DATE CALCULATIONS:
   - issue_date: Use the current date provided
   - due_date: Calculate based on net_terms (typically 30 days from issue_date)
   - Format all dates as YYYY-MM-DD

4. INVOICE NUMBER:
   - Generate a unique invoice number in format "INV-[8-char-code]"
   - Use uppercase alphanumeric characters

5. PAYMENT TERMS:
   - Default to "Stripe" as payment_platform unless otherwise specified
   - Generate realistic payment links in format: https://pay.stripe.com/invoice/[unique-id]
   - Include clear payment instructions
   - Standard net_terms: "30" days
   - Standard late_fee: "1.5" percent per month

6. TAX HANDLING:
   - Default tax_rate: 0.00 (freelance services often tax-exempt)
   - Calculate tax_amount: subtotal * tax_rate
   - Calculate total_due: subtotal + tax_amount

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no extra text)
- ALL fields must be present in the response
- Line items must be specific to the project, not generic
- All amounts must be numeric (not strings)
- Dates must be in YYYY-MM-DD format

Return JSON in this exact structure:
{
    "invoice_number": "INV-ABC12345",
    "issue_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "line_items": [
        {"description": "Specific service description", "amount": 0.00},
        {"description": "Specific service description", "amount": 0.00}
    ],
    "subtotal": 0.00,
    "tax_rate": 0.00,
    "tax_amount": 0.00,
    "total_due": 0.00,
    "payment_platform": "Stripe",
    "payment_link": "https://pay.stripe.com/invoice/unique-id",
    "payment_instructions": "Payment due within 30 days. Please use the payment link above or contact for alternative payment methods.",
    "net_terms": "30",
    "late_fee": "1.5"
}"""
    
    async def generate_invoice_data(self, project_data: Dict[str, Any], amount: float, mode: str) -> Dict[str, Any]:
        try:
            prompt = f"""Generate a professional invoice for the following project:

PROJECT DETAILS:
{json.dumps(project_data, indent=2)}

BILLING INFORMATION:
- Total Amount: ${amount}
- Billing Mode: {mode}

INSTRUCTIONS:
1. Create 3-5 specific line items that break down the project work logically
2. Base line item descriptions on the actual project requirements mentioned above
3. Distribute the ${amount} total across line items appropriately
4. Generate a unique invoice number
5. Set issue_date to today's date
6. Calculate due_date as 30 days from today
7. Include all payment terms and platform information

Ensure ALL required fields are present in your JSON response."""
            
            response = self.client.messages.create(
                model="claude-3-opus-20240229",
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