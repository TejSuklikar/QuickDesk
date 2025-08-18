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
        self.system_message = """You are an AI intake agent for a freelancer workflow system. 
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
    
    async def process_inquiry(self, raw_text: str) -> Dict[str, Any]:
        try:
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=self.system_message,
                messages=[{
                    "role": "user", 
                    "content": f"Extract project information from this inquiry: {raw_text}"
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