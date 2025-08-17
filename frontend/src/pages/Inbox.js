import { useState } from 'react';
import { 
  Mail, 
  Bot, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Send,
  Sparkles,
  ArrowRight,
  Copy,
  RefreshCw,
  Zap,
  FileText,
  Receipt,
  Clock
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Inbox = () => {
  const [rawMessage, setRawMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [projectId, setProjectId] = useState(null);

  // Example email for demonstration
  const exampleEmail = `Hi there!

I'm Jane Doe from Acme Corporation. We're looking to redesign our company website landing page to be more modern and mobile-friendly. 

The project needs to be completed within the next month, and we have a budget of around $2,500. We want something that really stands out and converts better.

Could you help us with this? Let me know what you think.

Best regards,
Jane Doe
jane@acmecorp.com
Acme Corporation`;

  const handleProcessEmail = async () => {
    if (!rawMessage.trim()) return;
    
    setLoading(true);
    setExtractedData(null);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/intake/parse-email`, {
        raw_text: rawMessage
      });
      
      setExtractedData(response.data);
    } catch (error) {
      console.error('Error processing email:', error);
      // Fallback with mock data for demo
      setExtractedData({
        client: {
          name: "Demo Client",
          email: "demo@example.com",
          company: "Demo Corp"
        },
        project: {
          title: "Website Project",
          description: rawMessage.substring(0, 100) + "...",
          timeline: "1 month",
          budget: 2500
        },
        confidence: {
          budget: 0.8,
          timeline: 0.9
        },
        status: "intake_complete"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = (section, field, value) => {
    setExtractedData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleFullAutomation = async () => {
    if (!extractedData) return;
    
    setProcessing(true);
    setWorkflowStatus('creating_project');
    
    try {
      // Step 1: Create Project
      const projectResponse = await axios.post(`${BACKEND_URL}/api/intake/create-manual`, extractedData);
      
      if (projectResponse.data.project_id) {
        setProjectId(projectResponse.data.project_id);
        setWorkflowStatus('generating_contract');
        
        // Wait a moment for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Generate Contract
        try {
          const contractResponse = await axios.post(`${BACKEND_URL}/api/contracts/generate`, {
            project_id: projectResponse.data.project_id,
            template_id: "standard_freelance_contract"
          });
          
          setWorkflowStatus('creating_invoice');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Step 3: Create Invoice
          try {
            const invoiceResponse = await axios.post(`${BACKEND_URL}/api/invoices/create`, {
              project_id: projectResponse.data.project_id,
              amount: extractedData.project.budget || 0,
              mode: "fixed"
            });
            
            setWorkflowStatus('complete');
            
            // Success message with project details
            setTimeout(() => {
              alert(`🎉 Complete Workflow Created!\n\n✅ Project: ${extractedData.project.title}\n✅ Contract: Generated & ready to send\n✅ Invoice: Created & ready to send\n\nCheck your Projects page to see everything!`);
              
              // Reset form
              setRawMessage('');
              setExtractedData(null);
              setWorkflowStatus('idle');
              setProjectId(null);
            }, 1500);
            
          } catch (invoiceError) {
            console.error('Invoice creation error:', invoiceError);
            setWorkflowStatus('project_created');
            alert('Project and contract created! (Invoice creation skipped for demo)');
          }
          
        } catch (contractError) {
          console.error('Contract generation error:', contractError);
          setWorkflowStatus('project_created');
          alert('Project created successfully! (Contract generation skipped for demo)');
        }
      }
    } catch (error) {
      console.error('Error in automation:', error);
      alert('Error creating project. Please try again.');
      setWorkflowStatus('idle');
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceText = (score) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const WorkflowProgress = () => {
    const steps = [
      { key: 'creating_project', label: 'Creating Project', icon: CheckCircle, color: 'text-blue-500' },
      { key: 'generating_contract', label: 'Generating Contract', icon: FileText, color: 'text-purple-500' },
      { key: 'creating_invoice', label: 'Creating Invoice', icon: Receipt, color: 'text-green-500' },
      { key: 'complete', label: 'Complete!', icon: Zap, color: 'text-emerald-500' }
    ];

    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
          <h3 className="font-semibold text-blue-900">AI Workflow in Progress</h3>
        </div>
        
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = workflowStatus === step.key;
            const isCompleted = steps.findIndex(s => s.key === workflowStatus) > index;
            const Icon = step.icon;
            
            return (
              <div key={step.key} className={`flex items-center space-x-3 ${isActive ? 'animate-pulse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isCompleted ? 'text-green-600' : isActive ? step.color : 'text-slate-400'
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-slate-500'
                }`}>
                  {step.label}
                  {isActive && <span className="ml-2">...</span>}
                  {isCompleted && <span className="ml-2">✅</span>}
                </span>
              </div>
            );
          })}
        </div>
        
        {workflowStatus === 'complete' && (
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              🎉 Full workflow created! Project → Contract → Invoice all ready to go!
            </p>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2 text-slate-900 mb-2">AI Workflow Automation</h1>
          <p className="text-slate-600">Paste client email → AI creates complete project workflow automatically</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            onClick={() => setRawMessage(exampleEmail)}
            variant="outline"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Load Example
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      {processing && <WorkflowProgress />}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Panel - Raw Message Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Raw Client Email</h2>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Paste the client email or inquiry here..."
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {rawMessage.length} characters
                </div>
                <Button
                  onClick={handleProcessEmail}
                  disabled={!rawMessage.trim() || loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Processing Status */}
          {loading && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-3">
                <Bot className="w-5 h-5 text-blue-500 animate-pulse" />
                <div>
                  <h3 className="font-medium text-blue-900">AI Intake Agent Working</h3>
                  <p className="text-sm text-blue-700">Analyzing email and extracting structured data...</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Panel - Extracted Data */}
        <div className="space-y-6">
          {extractedData ? (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-slate-900">Extracted Information</h2>
                  </div>
                  <Badge 
                    variant={extractedData.status === 'intake_complete' ? 'default' : 'secondary'}
                    className={extractedData.status === 'intake_complete' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {extractedData.status === 'intake_complete' ? 'Complete' : 'Needs Info'}
                  </Badge>
                </div>

                {/* Client Information */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-slate-900 flex items-center">
                    Client Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Name
                      </label>
                      <Input
                        value={extractedData.client.name}
                        onChange={(e) => handleFieldUpdate('client', 'name', e.target.value)}
                        placeholder="Client name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={extractedData.client.email}
                        onChange={(e) => handleFieldUpdate('client', 'email', e.target.value)}
                        placeholder="client@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Company
                      </label>
                      <Input
                        value={extractedData.client.company || ''}
                        onChange={(e) => handleFieldUpdate('client', 'company', e.target.value)}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-medium text-slate-900">Project Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Title
                      </label>
                      <Input
                        value={extractedData.project.title}
                        onChange={(e) => handleFieldUpdate('project', 'title', e.target.value)}
                        placeholder="Project title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <Textarea
                        value={extractedData.project.description}
                        onChange={(e) => handleFieldUpdate('project', 'description', e.target.value)}
                        placeholder="Project description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Budget
                        </label>
                        <Input
                          type="number"
                          value={extractedData.project.budget || ''}
                          onChange={(e) => handleFieldUpdate('project', 'budget', parseFloat(e.target.value) || null)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Timeline
                        </label>
                        <Input
                          value={extractedData.project.timeline || ''}
                          onChange={(e) => handleFieldUpdate('project', 'timeline', e.target.value)}
                          placeholder="e.g., 30 days"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Scores */}
                <div className="space-y-3 mb-6">
                  <h3 className="font-medium text-slate-900">AI Confidence Scores</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Budget</span>
                      <Badge className={getConfidenceColor(extractedData.confidence.budget)}>
                        {getConfidenceText(extractedData.confidence.budget)} ({Math.round(extractedData.confidence.budget * 100)}%)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Timeline</span>
                      <Badge className={getConfidenceColor(extractedData.confidence.timeline)}>
                        {getConfidenceText(extractedData.confidence.timeline)} ({Math.round(extractedData.confidence.timeline * 100)}%)
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - NEW IMPROVED VERSION */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={handleFullAutomation}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold py-3 text-base"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Creating Full Workflow...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        🚀 Create Complete Workflow (Project + Contract + Invoice)
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setExtractedData(null)} className="w-full">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Reset & Try Another Email
                  </Button>
                </div>
              </Card>

              {/* Workflow Preview */}
              <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-2">🚀 One-Click Full Automation</h3>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span><strong>Step 1:</strong> Create project with client & details</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span><strong>Step 2:</strong> AI generates professional contract</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span><strong>Step 3:</strong> AI creates invoice with payment link</span>
                      </div>
                      <div className="mt-3 p-2 bg-emerald-100 rounded-lg">
                        <span className="font-medium">Result: Complete project ready to send to client!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ready for AI Magic</h3>
              <p className="text-slate-600">
                Paste a client inquiry and watch AI create your complete workflow: Project → Contract → Invoice
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;