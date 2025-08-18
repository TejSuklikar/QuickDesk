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
        self.system_message = """You are an AI contract agent. Generate professional freelance contract variables.
            
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
    
    async def generate_contract_variables(self, project_data: Dict[str, Any], client_data: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            prompt = f"""
            Generate contract variables for this project:
            
            Project: {project_data}
            Client: {client_data}  
            Freelancer: {user_data}
            
            Use the actual freelancer name and create a business name if not provided.
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