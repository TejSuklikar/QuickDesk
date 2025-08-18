import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  Building2,
  Search,
  MoreHorizontal,
  User
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsRes, projectsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/clients`),
        axios.get(`${BACKEND_URL}/api/projects`)
      ]);
      
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClientProjects = (clientId) => {
    return projects.filter(project => project.client_id === clientId);
  };

  const getActiveProjectsCount = (clientId) => {
    return getClientProjects(clientId).filter(p => p.status !== 'Done').length;
  };

  const getTotalProjectValue = (clientId) => {
    return getClientProjects(clientId)
      .reduce((total, project) => total + (project.budget || 0), 0);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-xl"></div>
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
          <h1 className="heading-2 text-slate-900 mb-2">Clients</h1>
          <p className="text-slate-600">View your clients created through email processing workflow</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Clients List */}
      <div className="space-y-4">
        {filteredClients.map((client) => {
          const clientProjects = getClientProjects(client.id);
          const activeProjects = getActiveProjectsCount(client.id);
          const totalValue = getTotalProjectValue(client.id);
          
          return (
            <Link key={client.id} to={`/clients/${client.id}`}>
              <Card className="p-6 hover-lift transition-all duration-200 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Client Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {client.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                        
                        {client.company && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Building2 className="w-4 h-4" />
                            <span className="text-sm">{client.company}</span>
                          </div>
                        )}
                        
                        {client.phone && (
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Phone className="w-4 h-4" />
                            <span className="text-sm">{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-center">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {clientProjects.length}
                      </div>
                      <div className="text-xs text-slate-500">Total Projects</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-semibold text-amber-600">
                        {activeProjects}
                      </div>
                      <div className="text-xs text-slate-500">Active</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        ${totalValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Total Value</div>
                    </div>
                    
                    <div className="text-slate-400">
                      <MoreHorizontal className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                
                {/* Recent Projects Preview */}
                {clientProjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Recent Projects</span>
                      <span className="text-xs text-slate-500">
                        {new Date(client.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {clientProjects.slice(0, 3).map((project) => (
                        <Badge
                          key={project.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {project.title}
                        </Badge>
                      ))}
                      
                      {clientProjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{clientProjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredClients.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
          <p className="text-slate-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Clients will appear here when you process emails in the Inbox'
            }
          </p>
          {!searchTerm && (
            <Link to="/inbox">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                <Mail className="w-4 h-4 mr-2" />
                Process Client Emails
              </Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
};

export default Clients;
