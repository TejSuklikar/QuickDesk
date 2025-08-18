import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Mail,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Send,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [client, setClient] = useState(null);
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingContract, setEditingContract] = useState(false);
  const [contractEdits, setContractEdits] = useState({});
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceEdits, setInvoiceEdits] = useState({});

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Load project
      const projectRes = await axios.get(`${BACKEND_URL}/api/projects/${id}`);
      setProject(projectRes.data);
      
      // Load client
      const clientRes = await axios.get(`${BACKEND_URL}/api/clients/${projectRes.data.client_id}`);
      setClient(clientRes.data);
      
      // Try to load contract and invoices (they might not exist yet)
      try {
        const contractRes = await axios.get(`${BACKEND_URL}/api/contracts/status/${id}`);
        setContract(contractRes.data);
      } catch (e) {
        // No contract yet
      }
      
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    setGenerating(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/contracts/generate`, {
        project_id: id,
        template_id: "standard_freelance_contract"
      });
      
      setContract(response.data);
      
      // Update project status
      setProject(prev => ({ ...prev, status: 'Contract' }));
      
      alert(`✅ Contract Generated!\n\nContract ID: ${response.data.id}\nClient: ${response.data.variables.client_legal_name}\nAmount: $${response.data.variables.total_amount}\n\n🎯 Next: Send contract for signature`);
      
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('Error generating contract. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateInvoice = async () => {
    setCreating(true);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/invoices/create`, {
        project_id: id,
        amount: project.budget || 0,
        mode: "fixed"
      });
      
      setInvoices([response.data]);
      
      // Update project status
      setProject(prev => ({ ...prev, status: 'Billing' }));
      
      alert(`💰 Invoice Created!\n\nInvoice ID: ${response.data.id}\nAmount: $${response.data.amount}\nDue: ${format(new Date(response.data.due_date), 'MMM d, yyyy')}\n\n🎯 Invoice is ready to send to client!`);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Intake': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Contract': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Billing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Done': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Intake': return <User className="w-4 h-4" />;
      case 'Contract': return <FileText className="w-4 h-4" />;
      case 'Billing': return <Receipt className="w-4 h-4" />;
      case 'Done': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const WorkflowStep = ({ step, current, completed, title, description, icon: Icon, action, loading: actionLoading, disabled }) => (
    <div className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${
      completed ? 'bg-green-50 border-green-200' : 
      current ? 'bg-blue-50 border-blue-200' : 
      'bg-slate-50 border-slate-200'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-100 text-green-600' :
        current ? 'bg-blue-100 text-blue-600' :
        'bg-slate-100 text-slate-400'
      }`}>
        {completed ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-slate-900">{step}. {title}</h3>
          {completed && <Badge className="bg-green-100 text-green-800">Complete</Badge>}
          {current && <Badge className="bg-blue-100 text-blue-800">Current Step</Badge>}
        </div>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      
      {action && current && !completed && (
        <Button 
          onClick={action}
          disabled={actionLoading || disabled}
          className="bg-gradient-to-r from-blue-500 to-purple-600"
        >
          {actionLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Working...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {title}
            </>
          )}
        </Button>
      )}
    </div>
  );

  const handleSendInvoice = (invoice) => {
    if (!invoice || !client) return;
    
    const subject = encodeURIComponent(`Invoice ${invoice.details?.invoice_number || invoice.id.substring(0, 8)} - Payment Required`);
    const body = encodeURIComponent(`Hi ${client.name},

Please find your invoice for "${project.title}".

Invoice Details:
- Invoice Number: ${invoice.details?.invoice_number || invoice.id.substring(0, 8)}
- Amount Due: $${invoice.amount}
- Due Date: ${format(new Date(invoice.due_date), 'MMMM d, yyyy')}

Please process payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to reach out.

Thank you for your business!

Best regards,
${contract?.variables?.freelancer_name || 'Freelancer'}
${contract?.variables?.freelancer_email || 'freelancer@example.com'}`);
    
    const mailtoLink = `mailto:${client.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  const handleSendContract = () => {
    if (!contract || !client) return;
    
    const subject = encodeURIComponent(`Contract for ${project.title} - Ready for Signature`);
    const body = encodeURIComponent(`Hi ${client.name},

Please find attached the service contract for "${project.title}".

Contract Details:
- Total Amount: $${contract.variables.project_budget}
- Timeline: ${contract.variables.start_date} to ${contract.variables.end_date}
- Payment Terms: ${contract.variables.payment_terms}

Please review the contract and let me know if you have any questions. Once you're ready, please sign and return the contract so we can get started on your project.

Looking forward to working with you!

Best regards,
${contract.variables.freelancer_name}
${contract.variables.freelancer_business}
${contract.variables.freelancer_email}`);
    
    const mailtoLink = `mailto:${client.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Project Not Found</h2>
        <Link to="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            <p className="text-slate-600">{client?.name} • {client?.company}</p>
          </div>
        </div>
        
        <Badge className={`${getStatusColor(project.status)} flex items-center space-x-1 px-3 py-1`}>
          {getStatusIcon(project.status)}
          <span>{project.status}</span>
        </Badge>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Project Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <p className="text-slate-900 mt-1">{project.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Budget</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-900 font-medium">
                      {project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Timeline</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-900">{project.timeline || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Created</label>
                <p className="text-slate-600 mt-1">
                  {format(new Date(project.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Client Info */}
        <div>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-900">{client?.name}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <a href={`mailto:${client?.email}`} className="text-blue-600 hover:text-blue-700">
                  {client?.email}
                </a>
              </div>
              
              {client?.company && (
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-900">{client.company}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Workflow Steps */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">AI Workflow Progress</h2>
        
        <div className="space-y-4">
          <WorkflowStep
            step={1}
            title="Project Created"
            description="Client information and project details captured"
            icon={CheckCircle}
            completed={true}
          />
          
          <WorkflowStep
            step={2}
            title="Generate Contract"
            description="AI creates professional service agreement"
            icon={FileText}
            current={project.status === 'Intake'}
            completed={project.status !== 'Intake'}
            action={handleGenerateContract}
            loading={generating}
          />
          
          <WorkflowStep
            step={3}
            title="Create Invoice"
            description="Generate invoice with payment terms"
            icon={Receipt}
            current={project.status === 'Contract'}
            completed={project.status === 'Billing' || project.status === 'Done'}
            action={handleCreateInvoice}
            loading={creating}
            disabled={project.status === 'Intake'}
          />
          
          <WorkflowStep
            step={4}
            title="Project Complete"
            description="Contract signed and invoice paid"
            icon={CheckCircle}
            completed={project.status === 'Done'}
          />
        </div>
      </Card>

      {/* Contract & Invoice Details */}
      <Tabs defaultValue="contract" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contract" className="space-y-4">
          <Card className="p-6">
            {contract ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Contract Details</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    {contract.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    <p className="text-slate-900">{contract.variables.client_name}</p>
                    <p className="text-sm text-slate-600">{contract.variables.client_company}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Freelancer</label>
                    <p className="text-slate-900">{contract.variables.freelancer_name}</p>
                    <p className="text-sm text-slate-600">{contract.variables.freelancer_business}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Total Amount</label>
                    <p className="text-slate-900 font-medium">${contract.variables.project_budget}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Payment Terms</label>
                    <p className="text-slate-900">{contract.variables.payment_terms}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Project Timeline</label>
                    <p className="text-slate-900">{contract.variables.start_date} to {contract.variables.end_date}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Net Terms</label>
                    <p className="text-slate-900">{contract.variables.net_terms} days</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Deliverables</label>
                  <ul className="mt-1 text-slate-900">
                    {contract.variables.deliverables_list?.map((deliverable, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-slate-500">•</span>
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Milestones</label>
                  <div className="mt-1 space-y-1 text-slate-900">
                    <p>• {contract.variables.milestone_1}</p>
                    <p>• {contract.variables.milestone_2}</p>
                    <p>• {contract.variables.milestone_3}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={handleSendContract}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Client
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Contract Yet</h3>
                <p className="text-slate-600">Generate a contract to continue the workflow.</p>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="invoice" className="space-y-4">
          <Card className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Invoice Details</h3>
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Invoice {invoice.details?.invoice_number || invoice.id.substring(0, 8)}</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {invoice.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Amount</label>
                        <p className="text-slate-900 font-medium">${invoice.amount}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Due Date</label>
                        <p className="text-slate-900">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Issued</label>
                        <p className="text-slate-900">{format(new Date(invoice.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    
                    {invoice.details && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-slate-700">Line Items</label>
                        <div className="mt-1 space-y-1">
                          {invoice.details.line_items?.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-slate-600">{item.description}</span>
                              <span className="text-slate-900 font-medium">${item.amount}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex justify-between font-medium">
                            <span>Total Due:</span>
                            <span className="text-lg">${invoice.details.total_due}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center space-x-3">
                      <Button 
                        onClick={() => handleSendInvoice(invoice)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to Client
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Invoice Yet</h3>
                <p className="text-slate-600">Create an invoice after the contract is ready.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;