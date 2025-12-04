import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FolderOpen, 
  FileText, 
  Receipt, 
  AlertCircle, 
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [workQueue, setWorkQueue] = useState([]);
  const [agentActivity, setAgentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes, activityRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/dashboard/stats`),
        axios.get(`${BACKEND_URL}/api/dashboard/work-queue`),
        axios.get(`${BACKEND_URL}/api/dashboard/agent-activity?limit=10`)
      ]);
      
      setStats(statsRes.data);
      setWorkQueue(queueRes.data);
      setAgentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getEventIcon = (kind) => {
    switch (kind) {
      case 'Intake.Completed': return <Users className="w-4 h-4 text-amber-500" />;
      case 'Contract.Sent': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'Contract.Signed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Invoice.Sent': return <Receipt className="w-4 h-4 text-purple-500" />;
      case 'Invoice.Paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const StatusTile = ({ title, count, progress, color, icon: Icon, description }) => {
    // Use provided progress value, default to percentage based on count
    const displayProgress = progress !== undefined ? progress : (count > 0 ? 100 : 0);

    return (
      <Card className="p-6 hover-lift transition-all duration-200 group">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} text-white`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{count}</div>
            <div className="text-sm text-slate-500">{title}</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600">{description}</span>
            <span className="text-slate-500">{count > 0 ? `${count} active` : 'No activity'}</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${title.toLowerCase()}`}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
          <TrendingUp className="w-3 h-3 mr-1" />
          {count > 0 ? 'Projects in progress' : 'Ready for new projects'}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-2 text-slate-900 mb-2">Command Center</h1>
          <p className="text-slate-600">Monitor your AI agents and workflow progress</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All agents active</span>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Zap className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Status Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusTile
          title="Intake"
          count={stats?.projects?.intake || 0}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          icon={Users}
          description="Processing inquiries"
        />
        <StatusTile
          title="Contract"
          count={stats?.projects?.contract || 0}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          icon={FileText}
          description="Generating contracts"
        />
        <StatusTile
          title="Billing"
          count={stats?.projects?.billing || 0}
          color="bg-gradient-to-br from-purple-500 to-violet-600"
          icon={Receipt}
          description="Managing invoices"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Work Queue */}
        <div className="xl:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-900">Work Queue</h2>
                <Badge variant="secondary">{workQueue.length}</Badge>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {workQueue.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">All caught up!</h3>
                  <p className="text-slate-500">No items require your attention right now.</p>
                </div>
              ) : (
                workQueue.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
                    <div className="flex items-start space-x-3">
                      <Badge variant={getPriorityColor(item.priority)} className="mt-0.5">
                        {item.priority}
                      </Badge>
                      <div>
                        <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <Link to={item.link} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Agent Activity */}
        <div>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-slate-900">Agent Activity</h2>
              </div>
              <Link to="/dashboard/logs">
                <Button variant="outline" size="sm">
                  View Logs
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {agentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No recent activity</p>
                </div>
              ) : (
                agentActivity.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getEventIcon(event.kind)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {event.kind.replace('.', ' ')}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {event.entity_type} • {event.entity_id.substring(0, 8)}...
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-center text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Real-time monitoring active
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {(stats?.contracts?.signed || 0) + (stats?.contracts?.pending || 0)}
          </div>
          <div className="text-sm text-slate-600">Total Contracts</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats?.invoices?.paid || 0}
          </div>
          <div className="text-sm text-slate-600">Paid Invoices</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 mb-1">
            {stats?.invoices?.sent || 0}
          </div>
          <div className="text-sm text-slate-600">Pending Payment</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {stats?.invoices?.overdue || 0}
          </div>
          <div className="text-sm text-slate-600">Overdue</div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
