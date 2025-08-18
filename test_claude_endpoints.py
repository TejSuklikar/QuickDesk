#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class ClaudeEndpointTester:
    def __init__(self, base_url="https://70eac5bb-5ba5-40af-bb84-986904fe3790.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.client_id = None
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_test_data(self):
        """Create test client and project for Claude endpoint testing"""
        print("🔧 Setting up test data...")
        
        # Create client
        client_data = {
            "name": "Claude Test Client",
            "email": "claude@test.com",
            "company": "Claude Test Corp",
            "phone": "+1-555-CLAUDE"
        }
        
        success, response = self.run_test(
            "Setup - Create Test Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if success and 'id' in response:
            self.client_id = response['id']
            print(f"   ✅ Client created: {self.client_id}")
        else:
            print("   ❌ Failed to create test client")
            return False
        
        # Create project
        project_data = {
            "client_id": self.client_id,
            "title": "Claude AI Integration Test Project",
            "description": "A comprehensive web application with AI-powered features, user authentication, and real-time data processing",
            "budget": 12000.0,
            "timeline": "10 weeks"
        }
        
        success, response = self.run_test(
            "Setup - Create Test Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   ✅ Project created: {self.project_id}")
            return True
        else:
            print("   ❌ Failed to create test project")
            return False

    def test_intake_processing(self):
        """Test POST /api/intake/parse-email - Claude Intake Agent"""
        print("\n🤖 TESTING CLAUDE INTAKE AGENT")
        print("=" * 50)
        
        sample_email = """
        Subject: Urgent - E-commerce Platform Development
        
        Hello,
        
        I'm Michael Chen, CTO at InnovateTech Solutions. We urgently need to develop 
        a comprehensive e-commerce platform for our client.
        
        Project Requirements:
        - Full-stack e-commerce solution
        - Payment gateway integration (Stripe, PayPal)
        - Inventory management system
        - Admin dashboard with analytics
        - Mobile-responsive design
        - SEO optimization
        
        Budget: $25,000 - $30,000
        Timeline: Must be completed within 12 weeks
        
        We need to start immediately. Please confirm your availability.
        
        Best regards,
        Michael Chen
        CTO, InnovateTech Solutions
        michael.chen@innovatetech.com
        Phone: (555) 987-6543
        """
        
        intake_data = {"raw_text": sample_email}
        
        success, response = self.run_test(
            "Claude Intake Agent - Email Processing",
            "POST",
            "intake/parse-email",
            200,
            data=intake_data
        )
        
        if success:
            print("\n🎯 CLAUDE EXTRACTION RESULTS:")
            client = response.get('client', {})
            project = response.get('project', {})
            confidence = response.get('confidence', {})
            
            print(f"   📧 Client Name: {client.get('name', 'N/A')}")
            print(f"   📧 Client Email: {client.get('email', 'N/A')}")
            print(f"   🏢 Company: {client.get('company', 'N/A')}")
            print(f"   📋 Project Title: {project.get('title', 'N/A')}")
            print(f"   💰 Budget: ${project.get('budget', 'N/A')}")
            print(f"   ⏰ Timeline: {project.get('timeline', 'N/A')}")
            print(f"   📊 Status: {response.get('status', 'N/A')}")
            print(f"   🎯 Budget Confidence: {confidence.get('budget', 0):.1%}")
            print(f"   🎯 Timeline Confidence: {confidence.get('timeline', 0):.1%}")
            
            # Validate Claude extracted meaningful data
            if (client.get('name') and client.get('email') and 
                project.get('title') and project.get('budget')):
                print("   ✅ Claude successfully extracted all key information!")
                return True
            else:
                print("   ⚠️ Claude extraction incomplete")
                return False
        
        return False

    def test_contract_generation(self):
        """Test POST /api/contracts/generate - Claude Contract Agent"""
        print("\n🤖 TESTING CLAUDE CONTRACT AGENT")
        print("=" * 50)
        
        if not self.project_id:
            print("⚠️ Skipping contract test - no project available")
            return False
        
        contract_data = {
            "project_id": self.project_id,
            "template_id": "standard_freelance_template"
        }
        
        success, response = self.run_test(
            "Claude Contract Agent - Contract Generation",
            "POST",
            "contracts/generate",
            200,
            data=contract_data
        )
        
        if success:
            print("\n📄 CLAUDE CONTRACT GENERATION RESULTS:")
            variables = response.get('variables', {})
            
            print(f"   👤 Client Name: {variables.get('client_name', 'N/A')}")
            print(f"   🏢 Client Company: {variables.get('client_company', 'N/A')}")
            print(f"   👨‍💼 Freelancer: {variables.get('freelancer_name', 'N/A')}")
            print(f"   🏪 Business: {variables.get('freelancer_business', 'N/A')}")
            print(f"   💰 Project Budget: ${variables.get('project_budget', 0):,.2f}")
            print(f"   💳 Payment Terms: {variables.get('payment_terms', 'N/A')}")
            print(f"   📅 Start Date: {variables.get('start_date', 'N/A')}")
            print(f"   📅 End Date: {variables.get('end_date', 'N/A')}")
            print(f"   🎯 Milestone 1: {variables.get('milestone_1', 'N/A')}")
            print(f"   🎯 Milestone 2: {variables.get('milestone_2', 'N/A')}")
            print(f"   🎯 Milestone 3: {variables.get('milestone_3', 'N/A')}")
            
            # Validate Claude generated comprehensive contract variables
            required_fields = ['client_name', 'freelancer_name', 'project_budget', 'payment_terms']
            if all(variables.get(field) for field in required_fields):
                print("   ✅ Claude successfully generated comprehensive contract variables!")
                return True
            else:
                print("   ⚠️ Claude contract generation incomplete")
                return False
        
        return False

    def test_invoice_creation(self):
        """Test POST /api/invoices/create - Claude Billing Agent"""
        print("\n🤖 TESTING CLAUDE BILLING AGENT")
        print("=" * 50)
        
        if not self.project_id:
            print("⚠️ Skipping invoice test - no project available")
            return False
        
        invoice_data = {
            "project_id": self.project_id,
            "amount": 12000.0,
            "mode": "milestone",
            "line_items": [
                {"description": "Phase 1: Planning and Design", "amount": 4000.0},
                {"description": "Phase 2: Development", "amount": 6000.0},
                {"description": "Phase 3: Testing and Deployment", "amount": 2000.0}
            ]
        }
        
        success, response = self.run_test(
            "Claude Billing Agent - Invoice Creation",
            "POST",
            "invoices/create",
            200,
            data=invoice_data
        )
        
        if success:
            print("\n💰 CLAUDE INVOICE GENERATION RESULTS:")
            details = response.get('details', {})
            
            print(f"   📄 Invoice Number: {details.get('invoice_number', 'N/A')}")
            print(f"   📅 Issue Date: {details.get('issue_date', 'N/A')}")
            print(f"   📅 Due Date: {details.get('due_date', 'N/A')}")
            print(f"   📋 Project: {details.get('project_title', 'N/A')}")
            print(f"   💰 Total Amount: ${details.get('total_due', 0):,.2f}")
            print(f"   💳 Payment Platform: {details.get('payment_platform', 'N/A')}")
            print(f"   📊 Net Terms: {details.get('net_terms', 'N/A')} days")
            
            line_items = details.get('line_items', [])
            if line_items:
                print("   📝 Line Items:")
                for i, item in enumerate(line_items, 1):
                    print(f"      {i}. {item.get('description', 'N/A')} - ${item.get('amount', 0):,.2f}")
            
            # Validate Claude generated proper invoice details
            required_fields = ['invoice_number', 'total_due', 'due_date', 'line_items']
            if all(details.get(field) for field in required_fields):
                print("   ✅ Claude successfully generated comprehensive invoice details!")
                return True
            else:
                print("   ⚠️ Claude invoice generation incomplete")
                return False
        
        return False

def main():
    print("🚀 CLAUDE SONNET 4 INTEGRATION TEST")
    print("Testing FreeFlow AI Endpoints with Claude-4-Sonnet-20250514")
    print("=" * 70)
    
    tester = ClaudeEndpointTester()
    
    # Setup test data
    if not tester.setup_test_data():
        print("❌ Failed to setup test data. Exiting.")
        return 1
    
    # Test the three main Claude AI endpoints
    intake_success = tester.test_intake_processing()
    contract_success = tester.test_contract_generation()
    invoice_success = tester.test_invoice_creation()
    
    # Print final results
    print("\n" + "=" * 70)
    print("📊 CLAUDE INTEGRATION TEST RESULTS")
    print("=" * 70)
    print(f"🤖 Intake Agent (Email Processing): {'✅ PASS' if intake_success else '❌ FAIL'}")
    print(f"📄 Contract Agent (Contract Generation): {'✅ PASS' if contract_success else '❌ FAIL'}")
    print(f"💰 Billing Agent (Invoice Creation): {'✅ PASS' if invoice_success else '❌ FAIL'}")
    print(f"\nTotal Tests Run: {tester.tests_run}")
    print(f"Total Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if intake_success and contract_success and invoice_success:
        print("\n🎉 ALL CLAUDE INTEGRATION TESTS PASSED!")
        print("✅ Claude Sonnet 4 is working correctly with all three AI agents")
        return 0
    else:
        print("\n⚠️ SOME CLAUDE INTEGRATION TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())