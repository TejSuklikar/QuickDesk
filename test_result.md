#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Switch from Emergent LLM to Claude Sonnet 4 API, ensure full responsiveness, and prepare for Vercel deployment"

backend:
  - task: "Claude Sonnet 4 Integration"
    implemented: true
    working: true  
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Replaced Emergent LLM with Claude API key in .env file and updated all three agents (IntakeAgent, ContractAgent, BillingAgent) to use claude-4-sonnet-20250514 model. Need to test if AI processing endpoints work correctly with Claude."
        - working: true
          agent: "testing"
          comment: "CLAUDE INTEGRATION FULLY WORKING! Fixed critical JSON parsing issue where Claude responses were wrapped in markdown code blocks. Added clean_claude_response() helper function to strip ```json formatting. Fixed user lookup issue in contract/invoice generation. All three AI endpoints now working perfectly: 1) POST /api/intake/parse-email - Successfully extracts client info, project details, budget, timeline with high confidence scores. 2) POST /api/contracts/generate - Generates comprehensive contract variables including payment terms, milestones, legal details. 3) POST /api/invoices/create - Creates detailed invoices with line items, payment info, due dates. Claude-4-sonnet-20250514 model responding excellently with structured data. All basic CRUD operations also working (auth, clients, projects, dashboard). 100% test success rate achieved."

frontend:
  - task: "Responsive Design Audit"
    implemented: false
    working: "NA"
    file: "frontend/src/**"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Not yet implemented - pending backend testing completion"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Responsive Design Audit"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Updated backend to use Claude Sonnet 4 instead of Emergent LLM. All three AI agents (Intake, Contract, Billing) now use claude-4-sonnet-20250514 model with user's Claude API key. Backend server restarted successfully. Ready for testing AI endpoints."
    - agent: "testing"
      message: "CLAUDE INTEGRATION TESTING COMPLETE - ALL SYSTEMS WORKING! Successfully tested and fixed Claude Sonnet 4 integration. Key findings: 1) ISSUE IDENTIFIED: Claude responses were wrapped in markdown code blocks (```json...```) causing JSON parsing failures. 2) SOLUTION IMPLEMENTED: Added clean_claude_response() helper function to strip markdown formatting from all three agents. 3) SECONDARY ISSUE: User lookup failures in contract/invoice generation due to hardcoded owner_id. Fixed by using actual user IDs. 4) COMPREHENSIVE TESTING: All three main AI endpoints working perfectly with realistic data extraction and generation. 5) PERFORMANCE: Claude-4-sonnet-20250514 model responding quickly with high-quality structured outputs. 6) VALIDATION: 100% test success rate across 16 backend tests including all CRUD operations. The Claude integration is production-ready and significantly more capable than the previous Emergent LLM."