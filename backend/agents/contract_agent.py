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
        self.system_message = """You are an expert AI contract generation agent specializing in professional freelance service agreements.

Your task is to analyze project, client, and freelancer information to generate comprehensive contract variables that will populate a legal service agreement template.

CONTRACT VARIABLE GENERATION INSTRUCTIONS:

1. PARTY INFORMATION:
   - client_name: Use the exact client name provided (full legal name preferred)
   - client_company: Use company name if available, otherwise use "Individual"
   - client_email: Use the exact email address provided
   - freelancer_name: Use the exact freelancer name provided
   - freelancer_business: If not provided, create one like "[LastName] Digital Services" or "[FirstName] Consulting"

2. PROJECT DESCRIPTION:
   - Write a comprehensive, professional description of the work to be performed
   - Include all technical requirements, platforms, and technologies mentioned
   - Focus on deliverables and outcomes, not just activities
   - Use clear, legal-appropriate language (avoid vague terms like "stuff" or "things")
   - Typical length: 2-4 detailed sentences

3. DELIVERABLES LIST:
   - Create 3-5 specific, measurable deliverables based on the project description
   - Each deliverable should be concrete and verifiable
   - Order deliverables chronologically (planning → development → delivery)
   - Examples: "Completed database schema design", "Fully functional user authentication system", "Deployed production application with documentation"
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

6. PAYMENT TERMS:
   - Analyze project budget and risk to determine appropriate payment structure
   - Standard options:
     * 50% upfront, 50% on completion (standard, balanced)
     * 33% upfront, 33% at midpoint, 34% on completion (milestone-based)
     * 100% upfront (small projects < $2k or established clients)
     * 25% upfront, 75% on completion (low-risk projects)
   - Choose based on project size and scope

7. ADMINISTRATIVE DETAILS:
   - invoice_platform: Default to "email" unless specified
   - net_terms: Default to "30" days
   - late_fee: Default to "1.5" percent per month
   - jurisdiction: Default to "State of California" unless specified

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no extra text)
- ALL fields must be present and properly populated
- Use actual data provided, not placeholder text
- Milestones must be specific to the project, not generic
- Deliverables must be concrete and measurable
- Dates must be in YYYY-MM-DD format
- Budget must be numeric

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
                model="claude-3-5-sonnet-20240620",
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