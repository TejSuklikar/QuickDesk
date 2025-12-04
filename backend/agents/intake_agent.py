import os
import json
import logging
from typing import Dict, Any
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

class IntakeAgent:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.environ['CLAUDE_API_KEY']
        )
        self.system_message = """You are an expert AI intake agent for a freelancer workflow system.
Your job is to carefully extract structured information from raw client inquiries and emails.

EXTRACTION INSTRUCTIONS:

1. CLIENT INFORMATION:
   - Name: Look for signatures, "from" lines, email signatures, or introductions (e.g., "Hi, I'm...", "Thanks, [Name]")
   - Email: Extract email addresses from the message body or signature (look for @domain patterns)
   - Company: Look for company names in email domains, signatures, or mentions (e.g., "at [Company]", company.com)

2. PROJECT INFORMATION:
   - Title: Create a concise, descriptive title based on the main project request (e.g., "Web Application with MongoDB Integration")
   - Description: Extract ALL technical details, requirements, deliverables, and features mentioned. Include:
     * Technologies requested (databases, frameworks, platforms)
     * Specific features or functionality needed
     * Technical requirements (integrations, deployments, etc.)
     * Any constraints or preferences mentioned
   - Budget: Look for dollar amounts, price mentions, or budget figures. Extract ONLY the numeric value (no $, commas, or text)
     * Examples: "$9,500" -> 9500, "Budget: $5k" -> 5000, "5000 fixed" -> 5000
   - Timeline: Extract any dates, deadlines, time periods, or milestone information
     * Look for: "by [date]", "in [X] weeks", "[date] to [date]", specific dates

3. CONFIDENCE SCORING:
   - Set confidence to 1.0 if information is explicitly stated
   - Set confidence to 0.5-0.8 if information is implied or partially mentioned
   - Set confidence to 0.0 if information is completely missing

4. STATUS:
   - "intake_complete" if you have at least name, email, and basic project description
   - "needs_more_info" if critical information (name or email or project details) is missing

IMPORTANT PARSING RULES:
- Email addresses often appear at the end of messages or in signatures
- Client name usually appears before the email address or in the signature
- The main project content is usually in the body of the message, not in greetings/signatures
- Budget numbers should be extracted as pure numbers (remove $, commas, "fixed", etc.)
- Timelines can be relative ("4 weeks") or absolute ("by Dec 18")
- If text is concatenated without spaces, try to parse it intelligently

Return ONLY valid JSON in this exact structure (no extra text):
{
    "client": {
        "name": "extracted full name",
        "email": "extracted email address",
        "company": "extracted company name or empty string if not found"
    },
    "project": {
        "title": "concise descriptive project title",
        "description": "comprehensive description with all technical details and requirements",
        "timeline": "extracted timeline/deadline information",
        "budget": numeric_value_or_null
    },
    "confidence": {
        "budget": 0.0,
        "timeline": 0.0
    },
    "status": "intake_complete"
}"""
    
    async def process_inquiry(self, raw_text: str) -> Dict[str, Any]:
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20240620",
                max_tokens=1500,
                system=self.system_message,
                messages=[{
                    "role": "user",
                    "content": f"""Carefully analyze and extract information from this client inquiry/email.

CLIENT MESSAGE:
{raw_text}

Please extract:
1. Client name (look in signature, greeting, or email content)
2. Client email address (look for @ pattern)
3. Company name (if mentioned in email domain, signature, or content)
4. Project title (create a concise title summarizing the request)
5. Full project description (include ALL technical details, requirements, and features)
6. Budget (extract the numeric amount only, no formatting)
7. Timeline/deadlines (any dates or time periods mentioned)

Return the JSON structure as specified."""
                }]
            )
            
            # Get response content
            content = response.content[0].text
            
            # Clean and parse JSON response
            cleaned_response = clean_claude_response(content)
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