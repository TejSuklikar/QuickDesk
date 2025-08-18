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
  Clock,
  Eye,
  Play
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
  const [projectCreated, setProjectCreated] = useState(false);
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
      alert('Error processing email. Please check your connection and try again.');
      setExtractedData(null);
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

  const handleCreateProject = async () => {
    if (!extractedData) return;
    
    setProcessing(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/intake/create-manual`, extractedData);
      
      if (response.data.project_id) {
        setProjectId(response.data.project_id);
        setProjectCreated(true);
        
        // Show success message
        setTimeout(() => {
          alert(`✅ Project Created!\n\nName: ${extractedData.project.title}\nClient: ${extractedData.client.name}\nBudget: $${extractedData.project.budget}\n\n🎯 Next: Go to Projects page to generate contract`);
        }, 500);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleStartOver = () => {
    setRawMessage('');
    setExtractedData(null);
    setProjectCreated(false);
    setProjectId(null);
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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2 text-slate-900 mb-2">Step-by-Step AI Workflow</h1>
          <p className="text-slate-600">Process client emails with AI assistance, review each step before proceeding</p>
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

      {/* Workflow Steps Indicator */}
      <Card className="p-4 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex flex-col sm:flex-row gap-4 overflow-x-auto">
          <div className="flex items-center space-x-4 min-w-max">
            {/* Step 1 */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                extractedData ? 'bg-green-100 text-green-600' : rawMessage ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <Mail className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-900">1. AI Extract</div>
                <div className="text-xs text-slate-500">
                  {extractedData ? 'Complete' : rawMessage ? 'Ready' : 'Waiting'}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-300" />

            {/* Step 2 */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                projectCreated ? 'bg-green-100 text-green-600' : extractedData ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-900">2. Create Project</div>
                <div className="text-xs text-slate-500">
                  {projectCreated ? 'Complete' : extractedData ? 'Ready' : 'Waiting'}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-300" />

            {/* Step 3 */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                projectCreated ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-900">3. Generate Contract</div>
                <div className="text-xs text-slate-500">
                  {projectCreated ? 'Next Step' : 'Waiting'}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-300" />

            {/* Step 4 */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-slate-900">4. Create Invoice</div>
                <div className="text-xs text-slate-500">Waiting</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Raw Message Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Step 1: Paste Client Email</h2>
            </div>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Paste the client email or inquiry here..."
                value={rawMessage}
                onChange={(e) => setRawMessage(e.target.value)}
                rows={12}
                className="resize-none font-mono text-sm"
                disabled={projectCreated}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  {rawMessage.length} characters
                </div>
                <Button
                  onClick={handleProcessEmail}
                  disabled={!rawMessage.trim() || loading || projectCreated}
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

        {/* Right Panel - Extracted Data / Success */}
        <div className="space-y-6">
          {projectCreated ? (
            /* Project Created Success */
            <Card className="p-8 text-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-900 mb-2">✅ Project Created Successfully!</h2>
              <p className="text-green-700 mb-6">
                <strong>{extractedData?.project.title}</strong> for {extractedData?.client.name}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/projects'}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Go to Projects → Generate Contract
                </Button>
                
                <Button variant="outline" onClick={handleStartOver} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Process Another Email
                </Button>
              </div>
            </Card>
          ) : extractedData ? (
            /* Step 2: Review & Create Project */
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-semibold text-slate-900">Step 2: Review & Edit</h2>
                  </div>
                  <Badge 
                    variant={extractedData.status === 'intake_complete' ? 'default' : 'secondary'}
                    className={extractedData.status === 'intake_complete' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {extractedData.status === 'intake_complete' ? 'Ready to Create' : 'Needs Review'}
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  <Button
                    onClick={handleCreateProject}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Project
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={() => setExtractedData(null)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Re-extract
                  </Button>
                </div>
              </Card>

              {/* Next Steps Preview */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">After Creating Project</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      You'll be able to review the project details and then generate a contract with AI assistance.
                    </p>
                    <div className="space-y-1 text-sm text-blue-600">
                      <div>📋 <strong>Step 3:</strong> AI generates contract based on project details</div>
                      <div>📧 <strong>Step 4:</strong> Review contract and send for signature</div>
                      <div>💰 <strong>Step 5:</strong> Create invoice when contract is signed</div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ready for Step 1</h3>
              <p className="text-slate-600">
                Paste a client inquiry and let AI extract the structured information for you to review.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;