import os
import json
import logging
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

class ContractAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.environ['CLAUDE_API_KEY']
        )
        self.system_message = """You are an expert AI contract generation agent specializing in professional freelance service agreements compliant with California law.

Your task is to analyze project, client, and freelancer information to generate comprehensive contract variables that will populate a legally-compliant service agreement template.

IMPORTANT: This contract must comply with California's Freelance Worker Protection Act (FWPA) effective January 1, 2025, and California business contract requirements.

CONTRACT VARIABLE GENERATION INSTRUCTIONS:

1. PARTY INFORMATION (CALIFORNIA FWPA COMPLIANT):
   - client_name: Use the exact client name provided (full legal name required per FWPA)
   - client_company: Use company name if available, otherwise use "Individual"
   - client_email: Use the exact email address provided (required for contract delivery per FWPA)
   - freelancer_name: Use the exact freelancer name provided (full legal name required)
   - freelancer_business: If not provided, create one like "[LastName] Professional Services" or "[FirstName] Consulting Services"
   - NOTE: California FWPA requires both parties' full names and contact information in written contracts

2. PROJECT DESCRIPTION (ITEMIZED PER FWPA):
   - Write a comprehensive, professional description of the work to be performed
   - MUST be itemized and specific per California FWPA requirements
   - Include all technical requirements, platforms, and technologies mentioned
   - Focus on deliverables and outcomes, not just activities
   - Use clear, legal-appropriate language suitable for California contract law
   - Must clearly state the scope to prevent disputes
   - Typical length: 3-5 detailed sentences with specific itemization

3. DELIVERABLES LIST (ITEMIZED SERVICES PER FWPA):
   - Create 4-6 specific, measurable deliverables based on the project description
   - REQUIRED by California FWPA: Each deliverable must be itemized and clearly defined
   - Each deliverable should be concrete, verifiable, and legally enforceable
   - Order deliverables chronologically (planning → development → testing → delivery → documentation)
   - Examples: "Complete database schema design with ER diagrams", "Fully functional user authentication system with OAuth 2.0", "Deployed production application on specified hosting platform", "Complete technical documentation and user guides"
   - Must be specific enough to prevent disputes under California law
   - Avoid generic deliverables like "project completion" or "final delivery"

4. TIMELINE GENERATION:
   - start_date: Use provided date or calculate from today
   - end_date: Calculate based on project timeline/complexity
     * Simple projects (< $5k): 2-4 weeks
     * Medium projects ($5k-15k): 4-8 weeks
     * Large projects (> $15k): 8-12 weeks
   - Adjust based on timeline information in project data
   - Format all dates as YYYY-MM-DD

5. MILESTONE CREATION:
   - Generate 3 realistic, time-distributed milestones
   - milestone_1: Early phase (20-30% into project) - typically planning/design/setup
   - milestone_2: Mid phase (50-60% into project) - typically core development/implementation
   - milestone_3: Final phase (90-100% into project) - typically testing/delivery/deployment
   - Include specific deadline information (Week X, Date, or relative timeline)
   - Make milestones specific to the project type

6. PAYMENT TERMS (CALIFORNIA FWPA COMPLIANT):
   - REQUIRED: Payment must be made within 30 days of completion or on the date specified in the contract (per FWPA)
   - Analyze project budget and risk to determine appropriate payment structure
   - Standard California-compliant options:
     * 50% upfront, 50% within 30 days of completion (standard, FWPA compliant)
     * 33% upfront, 33% at midpoint, 34% within 30 days of completion (milestone-based)
     * 100% within 30 days of completion (established clients, ensure FWPA compliance)
     * 25% upfront, 75% within 30 days of completion (low-risk projects)
   - MUST specify exact payment dates or "within 30 days" language per California law
   - Choose based on project size, scope, and California legal requirements

7. ADMINISTRATIVE DETAILS (CALIFORNIA LAW COMPLIANT):
   - invoice_platform: Default to "email" unless specified (ensures FWPA delivery requirement)
   - net_terms: Must be "30" days maximum per FWPA requirements (default to "30")
   - late_fee: Default to "1.5" percent per month (reasonable under California law)
   - jurisdiction: MUST be "State of California" for California FWPA compliance
   - NOTE: Contract must be retained for 4 years per FWPA requirements

CRITICAL REQUIREMENTS (CALIFORNIA LAW):
- Return ONLY valid JSON (no markdown, no extra text)
- ALL fields must be present and properly populated per California FWPA
- Use actual data provided, not placeholder text (legal requirement)
- Milestones must be specific to the project with clear deadlines
- Deliverables must be itemized, concrete, and measurable (FWPA requirement)
- Dates must be in YYYY-MM-DD format (legal standard)
- Budget must be numeric and clearly stated (FWPA requirement)
- Payment terms must specify dates or "within 30 days" (FWPA requirement)
- Contract must include jurisdiction as California for FWPA applicability
- All services must be itemized to comply with California FWPA Section 2778

Return JSON in this exact structure:
{
    "client_name": "Client Full Name",
    "client_company": "Company Name or Individual",
    "client_email": "client@example.com",
    "freelancer_name": "Freelancer Full Name",
    "freelancer_business": "Business Name",
    "freelancer_email": "freelancer@example.com",
    "project_description": "Comprehensive description of work to be performed including all technical requirements and expected outcomes.",
    "deliverables_list": [
        "Specific measurable deliverable 1",
        "Specific measurable deliverable 2",
        "Specific measurable deliverable 3",
        "Specific measurable deliverable 4"
    ],
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "milestone_1": "First milestone description with specific deadline or timeline",
    "milestone_2": "Second milestone description with specific deadline or timeline",
    "milestone_3": "Third milestone description with specific deadline or timeline",
    "project_budget": 0,
    "payment_terms": "Payment structure based on project size and risk",
    "invoice_platform": "email",
    "net_terms": "30",
    "late_fee": "1.5",
    "jurisdiction": "State of California"
}"""
    
    async def generate_contract_variables(self, project_data: Dict[str, Any], client_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""Generate professional contract variables for the following freelance service agreement:

PROJECT INFORMATION:
{json.dumps(project_data, indent=2)}

CLIENT INFORMATION:
{json.dumps(client_data, indent=2)}

FREELANCER INFORMATION:
{json.dumps(user_data, indent=2)}

INSTRUCTIONS:
1. Extract and use all provided party information (names, emails, company)
2. Create a comprehensive project_description based on the project details
3. Generate 3-5 specific, measurable deliverables based on the project scope
4. Calculate realistic start_date and end_date based on project timeline/budget
5. Create 3 meaningful milestones distributed across the project timeline
6. Determine appropriate payment_terms based on project size and complexity
7. Ensure all contract variables are properly populated

Return the complete JSON structure with ALL required fields filled."""
            
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