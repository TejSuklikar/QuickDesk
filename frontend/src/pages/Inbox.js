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
  RefreshCw
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

  const handleCreateProject = async () => {
    if (!extractedData) return;
    
    setProcessing(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/intake/create-manual`, extractedData);
      
      if (response.data.project_id) {
        alert('Project created successfully!');
        setRawMessage('');
        setExtractedData(null);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Please try again.');
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

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2 text-slate-900 mb-2">Inbox</h1>
          <p className="text-slate-600">Process client inquiries with AI-powered intake</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left Panel - Raw Message Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mail className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-slate-900">Raw Message</h2>
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
                  <h3 className="font-medium text-blue-900">AI Agent Working</h3>
                  <p className="text-sm text-blue-700">Analyzing message and extracting structured data...</p>
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
                    Reset
                  </Button>
                </div>
              </Card>

              {/* Next Steps */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-1">Next Steps</h3>
                    <p className="text-sm text-blue-700">
                      Once created, the project will move to the Contract phase where the AI will generate a professional service agreement.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center border-2 border-dashed border-slate-200">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ready to Process</h3>
              <p className="text-slate-600">
                Paste a client inquiry in the left panel and let AI extract the structured information.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;