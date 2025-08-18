#!/usr/bin/env python3

import os
import asyncio
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def test_claude_direct():
    """Test Claude API directly"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        print("🔍 Testing Claude API directly...")
        print(f"API Key: {os.environ.get('CLAUDE_API_KEY', 'NOT FOUND')[:20]}...")
        
        # Initialize LLM chat
        llm = LlmChat(
            api_key=os.environ['CLAUDE_API_KEY'],
            session_id="test_session",
            system_message="You are a helpful assistant. Always respond with valid JSON."
        ).with_model("anthropic", "claude-4-sonnet-20250514")
        
        # Test simple message
        user_message = UserMessage(text="Return this JSON: {\"test\": \"success\", \"status\": \"working\"}")
        print("📤 Sending test message to Claude...")
        
        response = await llm.send_message(user_message)
        print(f"📥 Raw response: {response}")
        
        # Try to parse as JSON
        try:
            parsed = json.loads(response)
            print(f"✅ JSON parsing successful: {parsed}")
            return True
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing failed: {e}")
            print(f"Response was: {repr(response)}")
            return False
            
    except Exception as e:
        print(f"❌ Claude API test failed: {e}")
        return False

async def test_intake_agent():
    """Test the actual intake agent"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        print("\n🔍 Testing Intake Agent...")
        
        llm = LlmChat(
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
        
        sample_text = """Hi, I'm John Smith from ABC Corp. We need a website built for $5000 in 4 weeks. Contact me at john@abc.com"""
        
        user_message = UserMessage(text=f"Extract project information from this inquiry: {sample_text}")
        print("📤 Sending intake message to Claude...")
        
        response = await llm.send_message(user_message)
        print(f"📥 Raw response: {response}")
        
        # Try to parse as JSON
        try:
            parsed = json.loads(response)
            print(f"✅ Intake parsing successful: {json.dumps(parsed, indent=2)}")
            return True
        except json.JSONDecodeError as e:
            print(f"❌ Intake JSON parsing failed: {e}")
            print(f"Response was: {repr(response)}")
            return False
            
    except Exception as e:
        print(f"❌ Intake agent test failed: {e}")
        return False

async def main():
    print("🚀 Testing Claude Integration Directly")
    print("=" * 50)
    
    # Test basic Claude API
    basic_success = await test_claude_direct()
    
    # Test intake agent specifically
    intake_success = await test_intake_agent()
    
    print("\n" + "=" * 50)
    print("📊 RESULTS:")
    print(f"Basic Claude API: {'✅ PASS' if basic_success else '❌ FAIL'}")
    print(f"Intake Agent: {'✅ PASS' if intake_success else '❌ FAIL'}")
    
    if basic_success and intake_success:
        print("🎉 Claude integration is working!")
    else:
        print("⚠️ Claude integration has issues")

if __name__ == "__main__":
    asyncio.run(main())