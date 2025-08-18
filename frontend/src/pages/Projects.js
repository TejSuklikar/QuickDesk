import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  DollarSign, 
  User,
  Clock,
  CheckCircle,
  FileText,
  Receipt,
  Search,
  Filter,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, clientsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/projects`),
        axios.get(`${BACKEND_URL}/api/clients`)
      ]);
      
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientById = (clientId) => {
    return clients.find(client => client.id === clientId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Intake': return 'bg-amber-100 text-amber-800';
      case 'Contract': return 'bg-blue-100 text-blue-800';
      case 'Billing': return 'bg-purple-100 text-purple-800';
      case 'Done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/projects/${projectId}`);
        // Remove from local state
        setProjects(projects.filter(p => p.id !== projectId));
        alert('Project deleted successfully!');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project. Please try again.');
      }
    }
  };

  const filteredProjects = projects.filter(project => {
    const client = getClientById(project.client_id);
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2 text-slate-900 mb-2">Projects</h1>
          <p className="text-slate-600">Manage your client projects and track progress</p>
        </div>
        <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600">
          <Link to="/inbox" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search projects, clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Intake">Intake</option>
              <option value="Contract">Contract</option>
              <option value="Billing">Billing</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const client = getClientById(project.client_id);
          
          return (
            <Card key={project.id} className="p-6 hover-lift transition-all duration-200 group relative overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <Link to={`/projects/${project.id}`} className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-slate-600 truncate">
                      {client?.name || 'Unknown Client'}
                    </p>
                  </div>
                </Link>
                
                <div className="flex items-start space-x-2 flex-shrink-0 ml-2">
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={`${getStatusColor(project.status)} flex items-center space-x-1 whitespace-nowrap`}>
                      {getStatusIcon(project.status)}
                      <span>{project.status}</span>
                    </Badge>
                    {project.status === 'Intake' && (
                      <span className="text-xs text-amber-600 font-medium whitespace-nowrap">Ready for Contract</span>
                    )}
                    {project.status === 'Contract' && (
                      <span className="text-xs text-blue-600 font-medium">Ready for Billing</span>
                    )}
                    {project.status === 'Billing' && (
                      <span className="text-xs text-purple-600 font-medium">Awaiting Payment</span>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Link to={`/projects/${project.id}`}>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-2 text-sm">
                  {project.budget && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <DollarSign className="w-4 h-4" />
                      <span>${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {project.timeline && (
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{project.timeline}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Progress indicator with Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-600">Progress</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        {project.status === 'Done' ? '100%' : 
                         project.status === 'Billing' ? '75%' : 
                         project.status === 'Contract' ? '50%' : '25%'}
                      </span>
                      {project.status === 'Intake' && (
                        <Link to={`/projects/${project.id}`}>
                          <Button size="xs" className="text-xs px-2 py-1 h-6 bg-amber-500 hover:bg-amber-600">
                            Generate Contract
                          </Button>
                        </Link>
                      )}
                      {project.status === 'Contract' && (
                        <Link to={`/projects/${project.id}`}>
                          <Button size="xs" className="text-xs px-2 py-1 h-6 bg-blue-500 hover:bg-blue-600">
                            Create Invoice
                          </Button>
                        </Link>
                      )}
                      {project.status === 'Billing' && (
                        <Link to={`/projects/${project.id}`}>
                          <Button size="xs" className="text-xs px-2 py-1 h-6 bg-purple-500 hover:bg-purple-600">
                            Send Reminder
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${project.status.toLowerCase()}`}
                      style={{ 
                        width: project.status === 'Done' ? '100%' : 
                               project.status === 'Billing' ? '75%' : 
                               project.status === 'Contract' ? '50%' : '25%'
                      }}
                    />
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No projects found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first project'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <Link to="/inbox">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
};

export default Projects;