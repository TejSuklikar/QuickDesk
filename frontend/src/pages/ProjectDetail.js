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
  RefreshCw,
  Edit3
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProjectDetail = ({ user }) => {
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
  // Added for demo - Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInvoiceSuccessModal, setShowInvoiceSuccessModal] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Load project
      const projectRes = await axios.get(`${BACKEND_URL}/api/projects/${id}`, {headers: { 'X-User-ID': user.id }});
      setProject(projectRes.data);
      
      // Load client
      const clientRes = await axios.get(`${BACKEND_URL}/api/clients/${projectRes.data.client_id}`, {headers: { 'X-User-ID': user.id }});
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

      // Added for demo - Show success modal instead of alert
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

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

      // Show success modal
      setShowInvoiceSuccessModal(true);
      setTimeout(() => {
        setShowInvoiceSuccessModal(false);
      }, 2500);
      
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

  const handleEditContract = () => {
    setEditingContract(true);
    setContractEdits(contract.variables);
  };

  const handleSaveContract = async () => {
    try {
      // Update contract variables (in production, this would be an API call)
      const updatedContract = { ...contract, variables: contractEdits };
      setContract(updatedContract);
      setEditingContract(false);
      alert('Contract updated successfully!');
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Error updating contract. Please try again.');
    }
  };

  const handleCancelEditContract = () => {
    setEditingContract(false);
    setContractEdits({});
  };

  const handleContractFieldChange = (field, value) => {
    setContractEdits(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice.id);
    setInvoiceEdits(invoice.details || {});
  };

  const handleSaveInvoice = async (invoiceId) => {
    try {
      // Update invoice details (in production, this would be an API call)
      const updatedInvoices = invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, details: invoiceEdits } : inv
      );
      setInvoices(updatedInvoices);
      setEditingInvoice(null);
      setInvoiceEdits({});
      alert('Invoice updated successfully!');
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Error updating invoice. Please try again.');
    }
  };

  const handleCancelEditInvoice = () => {
    setEditingInvoice(null);
    setInvoiceEdits({});
  };

  const handleSendInvoice = (invoice) => {
    if (!invoice || !client || !user) return;
    
    const subject = encodeURIComponent(`Invoice ${invoice.details?.invoice_number || invoice.id.substring(0, 8)} - Payment Required`);
    const body = encodeURIComponent(`Hi ${client.name},

Please find your invoice for "${project.title}".

Invoice Details:
- Invoice Number: ${invoice.details?.invoice_number || invoice.id.substring(0, 8)}
- Amount Due: $${invoice.amount}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Please process payment at your earliest convenience. If you have any questions about this invoice, please don't hesitate to reach out.

Thank you for your business!

Best regards,
${user.name}
${user.email}`);
    
    const mailtoLink = `mailto:${client.email}?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
  };

  const handleDownloadContract = () => {
    if (!contract) return;
    const downloadUrl = `${BACKEND_URL}/api/contracts/${contract.id}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  const handleDownloadInvoice = (invoiceId) => {
    if (!invoiceId) return;
    const downloadUrl = `${BACKEND_URL}/api/invoices/${invoiceId}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  const handleSendContract = () => {
    if (!contract || !client || !user) return;
    
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
${user.name}
${user.email}`);
    
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
      {/* Added for demo - Contract Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="p-8 max-w-md mx-4 text-center animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Contract Generated!</h2>
            <p className="text-slate-600">Professional service agreement ready for review</p>
          </Card>
        </div>
      )}

      {/* Invoice Success Modal */}
      {showInvoiceSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <Card className="p-8 max-w-md mx-4 text-center animate-scale-in">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center animate-bounce">
                <Receipt className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invoice Created!</h2>
            <p className="text-slate-600">Professional invoice ready to send to client</p>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <Link to="/projects">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{project.title}</h1>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    {editingContract ? (
                      <div className="space-y-2">
                        <Input
                          value={contractEdits.client_name || ''}
                          onChange={(e) => handleContractFieldChange('client_name', e.target.value)}
                          placeholder="Client name"
                        />
                        <Input
                          value={contractEdits.client_company || ''}
                          onChange={(e) => handleContractFieldChange('client_company', e.target.value)}
                          placeholder="Company"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-900">{contract.variables.client_name}</p>
                        <p className="text-sm text-slate-600">{contract.variables.client_company}</p>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Freelancer</label>
                    {editingContract ? (
                      <div className="space-y-2">
                        <Input
                          value={contractEdits.freelancer_name || ''}
                          onChange={(e) => handleContractFieldChange('freelancer_name', e.target.value)}
                          placeholder="Freelancer name"
                        />
                        <Input
                          value={contractEdits.freelancer_business || ''}
                          onChange={(e) => handleContractFieldChange('freelancer_business', e.target.value)}
                          placeholder="Business name"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-900">{contract.variables.freelancer_name}</p>
                        <p className="text-sm text-slate-600">{contract.variables.freelancer_business}</p>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Total Amount</label>
                    {editingContract ? (
                      <Input
                        type="number"
                        value={contractEdits.project_budget || ''}
                        onChange={(e) => handleContractFieldChange('project_budget', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">${contract.variables.project_budget}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Payment Terms</label>
                    {editingContract ? (
                      <Input
                        value={contractEdits.payment_terms || ''}
                        onChange={(e) => handleContractFieldChange('payment_terms', e.target.value)}
                        placeholder="Payment terms"
                      />
                    ) : (
                      <p className="text-slate-900">{contract.variables.payment_terms}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Project Timeline</label>
                    {editingContract ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={contractEdits.start_date || ''}
                          onChange={(e) => handleContractFieldChange('start_date', e.target.value)}
                        />
                        <Input
                          type="date"
                          value={contractEdits.end_date || ''}
                          onChange={(e) => handleContractFieldChange('end_date', e.target.value)}
                        />
                      </div>
                    ) : (
                      <p className="text-slate-900">{contract.variables.start_date} to {contract.variables.end_date}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Net Terms</label>
                    {editingContract ? (
                      <Input
                        value={contractEdits.net_terms || ''}
                        onChange={(e) => handleContractFieldChange('net_terms', e.target.value)}
                        placeholder="30"
                      />
                    ) : (
                      <p className="text-slate-900">{contract.variables.net_terms} days</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Project Description</label>
                  {editingContract ? (
                    <textarea
                      className="w-full mt-1 p-2 border border-slate-300 rounded-md"
                      value={contractEdits.project_description || ''}
                      onChange={(e) => handleContractFieldChange('project_description', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 text-slate-900">{contract.variables.project_description}</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Deliverables</label>
                  {editingContract ? (
                    <div className="mt-1 space-y-2">
                      {(contractEdits.deliverables_list || []).map((deliverable, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-slate-500">•</span>
                          <Input
                            value={deliverable}
                            onChange={(e) => {
                              const newDeliverables = [...(contractEdits.deliverables_list || [])];
                              newDeliverables[index] = e.target.value;
                              handleContractFieldChange('deliverables_list', newDeliverables);
                            }}
                            className="flex-1"
                          />
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const newDeliverables = [...(contractEdits.deliverables_list || []), ''];
                          handleContractFieldChange('deliverables_list', newDeliverables);
                        }}
                      >
                        Add Deliverable
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-1 text-slate-900">
                      {contract.variables.deliverables_list?.map((deliverable, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-slate-500">•</span>
                          <span>{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Milestones</label>
                  {editingContract ? (
                    <div className="mt-1 space-y-2">
                      <Input
                        value={contractEdits.milestone_1 || ''}
                        onChange={(e) => handleContractFieldChange('milestone_1', e.target.value)}
                        placeholder="Milestone 1"
                      />
                      <Input
                        value={contractEdits.milestone_2 || ''}
                        onChange={(e) => handleContractFieldChange('milestone_2', e.target.value)}
                        placeholder="Milestone 2"
                      />
                      <Input
                        value={contractEdits.milestone_3 || ''}
                        onChange={(e) => handleContractFieldChange('milestone_3', e.target.value)}
                        placeholder="Milestone 3"
                      />
                    </div>
                  ) : (
                    <div className="mt-1 space-y-1 text-slate-900">
                      <p>• {contract.variables.milestone_1}</p>
                      <p>• {contract.variables.milestone_2}</p>
                      <p>• {contract.variables.milestone_3}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Jurisdiction</label>
                    {editingContract ? (
                      <Input
                        value={contractEdits.jurisdiction || ''}
                        onChange={(e) => handleContractFieldChange('jurisdiction', e.target.value)}
                        placeholder="State of California"
                      />
                    ) : (
                      <p className="text-slate-900">{contract.variables.jurisdiction}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Late Fee (%)</label>
                    {editingContract ? (
                      <Input
                        value={contractEdits.late_fee || ''}
                        onChange={(e) => handleContractFieldChange('late_fee', e.target.value)}
                        placeholder="1.5"
                      />
                    ) : (
                      <p className="text-slate-900">{contract.variables.late_fee}%</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
                  {editingContract ? (
                    <>
                      <Button 
                        onClick={handleSaveContract}
                        className="bg-gradient-to-r from-green-500 to-emerald-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancelEditContract}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSendContract}
                        className="bg-gradient-to-r from-green-500 to-emerald-600"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send to Client
                      </Button>
                      <Button variant="outline" onClick={handleEditContract}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Contract
                      </Button>
                      <Button variant="outline" onClick={handleDownloadContract}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </>
                  )}
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
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Amount</label>
                        <p className="text-slate-900 font-medium">${invoice.amount}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Due Date</label>
                        <p className="text-slate-900">{new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-700">Issued</label>
                        <p className="text-slate-900">{new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    
                    {invoice.details && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-slate-700">Invoice Details</label>
                        
                        {editingInvoice === invoice.id ? (
                          <div className="mt-2 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-600">Invoice Number</label>
                                <Input
                                  value={invoiceEdits.invoice_number || ''}
                                  onChange={(e) => setInvoiceEdits(prev => ({ ...prev, invoice_number: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-600">Issue Date</label>
                                <Input
                                  type="date"
                                  value={invoiceEdits.issue_date || ''}
                                  onChange={(e) => setInvoiceEdits(prev => ({ ...prev, issue_date: e.target.value }))}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-600">Project Description</label>
                              <textarea
                                className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm"
                                value={invoiceEdits.project_description || ''}
                                onChange={(e) => setInvoiceEdits(prev => ({ ...prev, project_description: e.target.value }))}
                                rows={2}
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-600">Line Items</label>
                              <div className="space-y-2">
                                {(invoiceEdits.line_items || []).map((item, index) => (
                                  <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <Input
                                      placeholder="Description"
                                      value={item.description || ''}
                                      onChange={(e) => {
                                        const newItems = [...(invoiceEdits.line_items || [])];
                                        newItems[index] = { ...newItems[index], description: e.target.value };
                                        setInvoiceEdits(prev => ({ ...prev, line_items: newItems }));
                                      }}
                                      className="sm:col-span-2"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Amount"
                                      value={item.amount || ''}
                                      onChange={(e) => {
                                        const newItems = [...(invoiceEdits.line_items || [])];
                                        newItems[index] = { ...newItems[index], amount: parseFloat(e.target.value) || 0 };
                                        setInvoiceEdits(prev => ({ ...prev, line_items: newItems }));
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-slate-600">Tax Rate (%)</label>
                                <Input
                                  type="number"
                                  value={invoiceEdits.tax_rate || ''}
                                  onChange={(e) => setInvoiceEdits(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-600">Net Terms (days)</label>
                                <Input
                                  value={invoiceEdits.net_terms || ''}
                                  onChange={(e) => setInvoiceEdits(prev => ({ ...prev, net_terms: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-600">Late Fee (%)</label>
                                <Input
                                  value={invoiceEdits.late_fee || ''}
                                  onChange={(e) => setInvoiceEdits(prev => ({ ...prev, late_fee: e.target.value }))}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-1 text-sm">
                              <p><strong>Invoice:</strong> {invoice.details.invoice_number}</p>
                              <p><strong>Issue Date:</strong> {invoice.details.issue_date}</p>
                              <p><strong>Description:</strong> {invoice.details.project_description}</p>
                            </div>
                            
                            <div className="mt-2">
                              <label className="text-sm font-medium text-slate-700">Line Items</label>
                              <div className="mt-1 space-y-1">
                                {invoice.details.line_items?.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-slate-600">{item.description}</span>
                                    <span className="text-slate-900 font-medium">${item.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex justify-between font-medium">
                            <span>Total Due:</span>
                            <span className="text-lg">${editingInvoice === invoice.id ? (invoiceEdits.total_due || invoice.amount) : (invoice.details.total_due || invoice.amount)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
                      {editingInvoice === invoice.id ? (
                        <>
                          <Button 
                            onClick={() => handleSaveInvoice(invoice.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={handleCancelEditInvoice}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            onClick={() => handleSendInvoice(invoice)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send to Client
                          </Button>
                          <Button variant="outline" onClick={() => handleEditInvoice(invoice)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Invoice
                          </Button>
                          <Button variant="outline" onClick={() => handleDownloadInvoice(invoice.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                        </>
                      )}
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
