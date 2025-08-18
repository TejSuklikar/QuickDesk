import requests
import sys
import json
from datetime import datetime
import time

class FreeFlowAPITester:
    def __init__(self, base_url="https://automate-freelance.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.client_id = None
        self.project_id = None
        self.contract_id = None
        self.invoice_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if endpoint else self.base_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
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

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'user_id' in response:
            self.user_id = response['user_id']
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        if not self.user_id:
            print("⚠️  Skipping login test - no user registered")
            return False
            
        login_data = {
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!"
        }
        
        return self.run_test("User Login", "POST", "auth/login", 200, data=login_data)

    def test_create_client(self):
        """Test client creation"""
        client_data = {
            "name": "Test Client Corp",
            "email": "client@testcorp.com",
            "company": "Test Corporation",
            "phone": "+1-555-0123"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if success and 'id' in response:
            self.client_id = response['id']
            return True
        return False

    def test_get_clients(self):
        """Test getting all clients"""
        return self.run_test("Get All Clients", "GET", "clients", 200)

    def test_get_client_by_id(self):
        """Test getting specific client"""
        if not self.client_id:
            print("⚠️  Skipping client detail test - no client created")
            return False
            
        return self.run_test(f"Get Client {self.client_id}", "GET", f"clients/{self.client_id}", 200)

    def test_create_project(self):
        """Test project creation"""
        if not self.client_id:
            print("⚠️  Skipping project creation - no client available")
            return False
            
        project_data = {
            "client_id": self.client_id,
            "title": "Test Website Development",
            "description": "Build a modern responsive website with React and Node.js",
            "budget": 5000.0,
            "timeline": "6 weeks"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            return True
        return False

    def test_get_projects(self):
        """Test getting all projects"""
        return self.run_test("Get All Projects", "GET", "projects", 200)

    def test_get_project_by_id(self):
        """Test getting specific project"""
        if not self.project_id:
            print("⚠️  Skipping project detail test - no project created")
            return False
            
        return self.run_test(f"Get Project {self.project_id}", "GET", f"projects/{self.project_id}", 200)

    def test_intake_parse_email(self):
        """Test AI intake email parsing - CORE AI FUNCTIONALITY"""
        sample_email = """
        Subject: Website Development Project Inquiry
        
        Hi there,
        
        I'm Sarah Johnson from TechStart Inc. We're looking to build a new company website 
        that showcases our software products. We need a modern, responsive design with 
        e-commerce capabilities.
        
        Our budget is around $8,000-$10,000 and we'd like to have it completed within 
        8 weeks if possible. We also need SEO optimization and mobile responsiveness.
        
        Please let me know if you're available for this project.
        
        Best regards,
        Sarah Johnson
        sarah.johnson@techstart.com
        TechStart Inc.
        (555) 123-4567
        """
        
        intake_data = {
            "raw_text": sample_email
        }
        
        print("🤖 Testing AI Intake Agent - this may take a few seconds...")
        success, response = self.run_test(
            "AI Intake Email Parsing",
            "POST",
            "intake/parse-email",
            200,
            data=intake_data
        )
        
        if success:
            print("🎯 AI Extraction Results:")
            print(f"   Client Name: {response.get('client', {}).get('name', 'N/A')}")
            print(f"   Client Email: {response.get('client', {}).get('email', 'N/A')}")
            print(f"   Project Title: {response.get('project', {}).get('title', 'N/A')}")
            print(f"   Budget: {response.get('project', {}).get('budget', 'N/A')}")
            print(f"   Timeline: {response.get('project', {}).get('timeline', 'N/A')}")
            print(f"   Status: {response.get('status', 'N/A')}")
            
        return success

    def test_manual_intake_creation(self):
        """Test manual intake creation"""
        intake_result = {
            "client": {
                "name": "Manual Test Client",
                "email": "manual@test.com",
                "company": "Manual Test Corp"
            },
            "project": {
                "title": "Manual Test Project",
                "description": "This is a manually created test project",
                "budget": 3000.0,
                "timeline": "4 weeks"
            },
            "confidence": {
                "budget": 0.9,
                "timeline": 0.8
            },
            "status": "intake_complete"
        }
        
        return self.run_test(
            "Manual Intake Creation",
            "POST",
            "intake/create-manual",
            200,
            data=intake_result
        )

    def test_contract_generation(self):
        """Test AI contract generation"""
        if not self.project_id:
            print("⚠️  Skipping contract generation - no project available")
            return False
            
        contract_data = {
            "project_id": self.project_id,
            "template_id": "standard_template"
        }
        
        print("🤖 Testing AI Contract Agent - this may take a few seconds...")
        success, response = self.run_test(
            "AI Contract Generation",
            "POST",
            "contracts/generate",
            200,
            data=contract_data
        )
        
        if success and 'id' in response:
            self.contract_id = response['id']
            print("📄 Contract Variables Generated:")
            variables = response.get('variables', {})
            print(f"   Client: {variables.get('client_legal_name', 'N/A')}")
            print(f"   Total Amount: ${variables.get('total_amount', 0):,.2f}")
            print(f"   Payment Terms: {variables.get('payment_terms', 'N/A')}")
            return True
        return False

    def test_invoice_creation(self):
        """Test AI invoice creation"""
        if not self.project_id:
            print("⚠️  Skipping invoice creation - no project available")
            return False
            
        invoice_data = {
            "project_id": self.project_id,
            "amount": 5000.0,
            "mode": "fixed",
            "line_items": [
                {"description": "Website Development", "amount": 5000.0}
            ]
        }
        
        print("🤖 Testing AI Billing Agent - this may take a few seconds...")
        success, response = self.run_test(
            "AI Invoice Creation",
            "POST",
            "invoices/create",
            200,
            data=invoice_data
        )
        
        if success and 'id' in response:
            self.invoice_id = response['id']
            return True
        return False

    def test_dashboard_work_queue(self):
        """Test dashboard work queue"""
        return self.run_test("Dashboard Work Queue", "GET", "dashboard/work-queue", 200)

    def test_agent_activity(self):
        """Test agent activity log"""
        return self.run_test("Agent Activity", "GET", "dashboard/agent-activity", 200)

def main():
    print("🚀 Starting FreeFlow API Tests")
    print("=" * 50)
    
    tester = FreeFlowAPITester()
    
    # Core API Tests
    print("\n📡 BASIC API TESTS")
    tester.test_root_endpoint()
    tester.test_dashboard_stats()
    
    # Authentication Tests
    print("\n🔐 AUTHENTICATION TESTS")
    tester.test_user_registration()
    tester.test_user_login()
    
    # Client Management Tests
    print("\n👥 CLIENT MANAGEMENT TESTS")
    tester.test_create_client()
    tester.test_get_clients()
    tester.test_get_client_by_id()
    
    # Project Management Tests
    print("\n📋 PROJECT MANAGEMENT TESTS")
    tester.test_create_project()
    tester.test_get_projects()
    tester.test_get_project_by_id()
    
    # AI Agent Tests - CORE FUNCTIONALITY
    print("\n🤖 AI AGENT TESTS (CORE FUNCTIONALITY)")
    tester.test_intake_parse_email()
    tester.test_manual_intake_creation()
    tester.test_contract_generation()
    tester.test_invoice_creation()
    
    # Dashboard Tests
    print("\n📊 DASHBOARD TESTS")
    tester.test_dashboard_work_queue()
    tester.test_agent_activity()
    
    # Print Results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed} TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())