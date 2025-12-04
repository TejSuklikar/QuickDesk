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
        self.system_message = """You are an expert AI billing agent specializing in professional invoice generation for freelance projects, compliant with California business and tax regulations.

Your task is to analyze project information and create detailed, professional, legally-compliant invoices with appropriate line item breakdowns.

IMPORTANT: Invoices must comply with California business practices and include all required information for proper record-keeping and tax purposes.

INVOICE GENERATION INSTRUCTIONS:

1. LINE ITEMS BREAKDOWN (CALIFORNIA COMPLIANT):
   - Analyze the project description and budget to create 4-6 detailed, itemized service line items
   - REQUIRED: Each line item must be properly itemized per California business practices
   - Each line item should represent a distinct phase, deliverable, or service component
   - Use professional, detailed descriptions that clearly identify the service provided
   - Common categories: Requirements Analysis & Planning, UI/UX Design, Software Development, Quality Assurance & Testing, Deployment & Integration, Documentation & Training, Post-Launch Support
   - Ensure line item amounts sum exactly to the total project amount (critical for accounting)
   - Use specific, professional descriptions suitable for California business records (not generic placeholders)
   - Each line item must be detailed enough for tax and audit purposes

2. AMOUNT DISTRIBUTION (PROFESSIONAL BREAKDOWN):
   - Distribute amounts realistically based on industry standards and project specifics
   - For web/software development projects:
     * Requirements & Planning: 15-20%
     * Design & Architecture: 10-15%
     * Core Development & Implementation: 40-50%
     * Testing & Quality Assurance: 10-15%
     * Deployment & Integration: 5-10%
     * Documentation & Training: 5-10%
   - For design projects: 40% initial design, 25% revisions & iterations, 20% final assets, 15% delivery & documentation
   - For consulting: Break down by consultation phases, research, analysis, reporting, and recommendations
   - Always adjust percentages based on specific project requirements mentioned in the description
   - Ensure the distribution reflects actual work value and industry norms

3. DATE CALCULATIONS (CALIFORNIA BUSINESS STANDARD):
   - issue_date: Use the current date provided (date invoice is created)
   - due_date: Calculate based on net_terms (standard 30 days from issue_date per California business practices)
   - Payment should typically be within 45 days per California business norms
   - Format all dates as YYYY-MM-DD (ISO 8601 standard for business documents)
   - Ensure dates are clearly stated to avoid payment disputes

4. INVOICE NUMBER (PROFESSIONAL FORMAT):
   - Generate a unique, professional invoice number in format "INV-[YEAR]-[4-digit-sequential]"
   - Example: "INV-2025-0001" for first invoice of 2025
   - Use uppercase alphanumeric characters for consistency
   - Invoice numbers must be unique and sequential for proper record-keeping
   - Required for California business tax records (must maintain 3+ years)

5. PAYMENT TERMS (CALIFORNIA BUSINESS STANDARD):
   - Default to "Stripe" or "Email/Check" as payment_platform unless otherwise specified
   - If using Stripe, note: "Payment link will be provided upon request"
   - Include clear, professional payment instructions
   - Standard net_terms: "30" days (California business standard)
   - Standard late_fee: "1.5" percent per month (reasonable under California law)
   - Include banking information placeholder or payment portal details
   - Payment instructions should be professional and clear
   - Note: "Payment must be received within 30 days of invoice date" for FWPA compliance

6. TAX HANDLING (CALIFORNIA TAX COMPLIANCE):
   - Default tax_rate: 0.00 (most professional services are not subject to California sales tax per CDTFA)
   - Note: Professional services (consulting, development, design) are generally exempt from CA sales tax
   - If goods are included, CA sales tax may apply (verify with client's location)
   - Calculate tax_amount: subtotal * tax_rate (typically $0.00 for services)
   - Calculate total_due: subtotal + tax_amount
   - IMPORTANT: Maintain accurate tax records per California CDTFA requirements
   - If applicable, include California seller's permit number placeholder

CRITICAL REQUIREMENTS (CALIFORNIA BUSINESS COMPLIANCE):
- Return ONLY valid JSON (no markdown, no extra text)
- ALL required fields must be present for California business compliance
- Line items must be properly itemized, specific to the project, and suitable for business records
- All amounts must be numeric with 2 decimal places (accounting standard)
- Dates must be in YYYY-MM-DD format (ISO 8601 standard)
- Invoice must be professional enough for California business tax purposes
- Include all information required for 3+ year record retention per CA law
- Line items must be detailed enough to satisfy audit requirements
- Payment terms must be clearly stated to comply with business contract standards

Return JSON in this exact structure:
{
    "invoice_number": "INV-2025-0001",
    "issue_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "project_description": "Brief professional description of the project for invoice records",
    "line_items": [
        {"description": "Detailed, professional service description (e.g., 'Requirements Analysis & Project Planning - 20 hours')", "amount": 0.00},
        {"description": "Detailed, professional service description (e.g., 'UI/UX Design & Prototyping - 30 hours')", "amount": 0.00},
        {"description": "Detailed, professional service description (e.g., 'Full-Stack Development & Implementation - 80 hours')", "amount": 0.00},
        {"description": "Detailed, professional service description (e.g., 'Quality Assurance Testing & Bug Fixes - 15 hours')", "amount": 0.00}
    ],
    "subtotal": 0.00,
    "tax_rate": 0.00,
    "tax_amount": 0.00,
    "total_due": 0.00,
    "payment_platform": "Stripe / Email / Check",
    "payment_link": "Payment information will be provided separately or upon request",
    "payment_instructions": "Payment is due within 30 days of invoice date. Please remit payment via the specified payment method. Late payments subject to 1.5% monthly fee. For questions, please contact the service provider. Thank you for your business.",
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
            
            project_title = project_data.get("title", "Professional Services")

            return {
                "invoice_number": f"INV-{today.year}-{str(uuid.uuid4())[:4].upper()}",
                "issue_date": today.strftime("%Y-%m-%d"),
                "due_date": due_date.strftime("%Y-%m-%d"),
                "project_description": project_title,
                "line_items": [
                    {"description": "Requirements Analysis & Project Planning", "amount": round(amount * 0.15, 2)},
                    {"description": "Design & Development", "amount": round(amount * 0.50, 2)},
                    {"description": "Testing & Quality Assurance", "amount": round(amount * 0.20, 2)},
                    {"description": "Deployment & Documentation", "amount": round(amount * 0.15, 2)}
                ],
                "subtotal": amount,
                "tax_rate": 0.00,
                "tax_amount": 0.00,
                "total_due": amount,
                "payment_platform": "Email / Check",
                "payment_link": "Payment information will be provided separately",
                "payment_instructions": "Payment is due within 30 days of invoice date. Please remit payment via the specified payment method. Late payments subject to 1.5% monthly fee. For questions, please contact the service provider. Thank you for your business.",
                "net_terms": "30",
                "late_fee": "1.5"
            }