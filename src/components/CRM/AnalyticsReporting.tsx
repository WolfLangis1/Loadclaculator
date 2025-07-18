import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  LineChart, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface AnalyticsData {
  salesFunnel: {
    leads: number;
    qualified: number;
    proposals: number;
    contracts: number;
    completed: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRecurring: number;
    averageProjectValue: number;
    projectedRevenue: number;
  };
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    retentionRate: number;
    customerLifetimeValue: number;
  };
  performanceMetrics: {
    conversionRate: number;
    averageSalesTime: number;
    winRate: number;
    activityScore: number;
  };
  timeSeriesData: Array<{
    date: string;
    revenue: number;
    customers: number;
    projects: number;
  }>;
  topPerformers: Array<{
    category: string;
    name: string;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

type DateRange = '7d' | '30d' | '90d' | '1y' | 'custom';
type ReportType = 'overview' | 'sales' | 'customers' | 'performance' | 'financial';

export const AnalyticsReporting: React.FC = () => {
  const { 
    projects, 
    customers, 
    activities,
    loading,
    loadProjects,
    loadCustomers,
    loadActivities
  } = useCRM();

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [reportType, setReportType] = useState<ReportType>('overview');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    loadData();
  }, [dateRange, reportType]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadProjects(),
        loadCustomers(),
        loadActivities()
      ]);
      generateAnalytics();
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateAnalytics = () => {
    const dateFilter = getDateFilter();
    const filteredProjects = projects.filter(p => 
      new Date(p.created_at) >= dateFilter.start && 
      new Date(p.created_at) <= dateFilter.end
    );
    const filteredCustomers = customers.filter(c => 
      new Date(c.created_at) >= dateFilter.start && 
      new Date(c.created_at) <= dateFilter.end
    );

    const analytics: AnalyticsData = {
      salesFunnel: generateSalesFunnelData(filteredProjects),
      revenueMetrics: generateRevenueMetrics(filteredProjects),
      customerMetrics: generateCustomerMetrics(filteredCustomers, filteredProjects),
      performanceMetrics: generatePerformanceMetrics(filteredProjects, activities),
      timeSeriesData: generateTimeSeriesData(filteredProjects, filteredCustomers),
      topPerformers: generateTopPerformers(filteredProjects, filteredCustomers)
    };

    setAnalyticsData(analytics);
  };

  const getDateFilter = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        start = customDateRange.start ? new Date(customDateRange.start) : start;
        if (customDateRange.end) {
          end.setTime(new Date(customDateRange.end).getTime());
        }
        break;
    }

    return { start, end };
  };

  const generateSalesFunnelData = (projects: any[]) => {
    const stageMap = projects.reduce((acc, project) => {
      const stage = project.stage?.name || 'Unknown';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      leads: stageMap['Lead'] || 0,
      qualified: stageMap['Qualified'] || 0,
      proposals: stageMap['Proposal'] || 0,
      contracts: stageMap['Contract'] || 0,
      completed: stageMap['Completed'] || 0
    };
  };

  const generateRevenueMetrics = (projects: any[]) => {
    const totalRevenue = projects
      .filter(p => p.stage?.name === 'Completed')
      .reduce((sum, p) => sum + (p.value || 0), 0);
    
    const projectedRevenue = projects
      .filter(p => p.stage?.name !== 'Completed')
      .reduce((sum, p) => sum + ((p.value || 0) * (p.probability || 50) / 100), 0);

    return {
      totalRevenue,
      monthlyRecurring: 0, // Calculate based on recurring projects
      averageProjectValue: projects.length > 0 ? totalRevenue / projects.length : 0,
      projectedRevenue
    };
  };

  const generateCustomerMetrics = (customers: any[], projects: any[]) => {
    const customerProjectMap = projects.reduce((acc, project) => {
      const customerId = project.customer_id;
      if (customerId) {
        acc[customerId] = (acc[customerId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => 
      new Date(c.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalCustomers,
      newCustomers,
      retentionRate: calculateRetentionRate(customers, projects),
      customerLifetimeValue: calculateCustomerLTV(customers, projects)
    };
  };

  const generatePerformanceMetrics = (projects: any[], activities: any[]) => {
    const completedProjects = projects.filter(p => p.stage?.name === 'Completed');
    const totalProjects = projects.length;

    return {
      conversionRate: totalProjects > 0 ? (completedProjects.length / totalProjects) * 100 : 0,
      averageSalesTime: calculateAverageSalesTime(projects),
      winRate: calculateWinRate(projects),
      activityScore: calculateActivityScore(activities)
    };
  };

  const generateTimeSeriesData = (projects: any[], customers: any[]) => {
    const data = [];
    const dateFilter = getDateFilter();
    const daysDiff = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(dateFilter.start);
      date.setDate(date.getDate() + i);
      
      const dayProjects = projects.filter(p => 
        new Date(p.created_at).toDateString() === date.toDateString()
      );
      const dayCustomers = customers.filter(c => 
        new Date(c.created_at).toDateString() === date.toDateString()
      );

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: dayProjects.reduce((sum, p) => sum + (p.value || 0), 0),
        customers: dayCustomers.length,
        projects: dayProjects.length
      });
    }

    return data;
  };

  const generateTopPerformers = (projects: any[], customers: any[]) => {
    // Top customers by project value
    const customerValues = customers.map(customer => {
      const customerProjects = projects.filter(p => p.customer_id === customer.id);
      const totalValue = customerProjects.reduce((sum, p) => sum + (p.value || 0), 0);
      return {
        category: 'customer',
        name: customer.name,
        value: totalValue,
        trend: 'stable' as const
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5);

    // Top project types
    const projectTypes = projects.reduce((acc, project) => {
      const type = project.custom_fields?.projectType || 'General';
      acc[type] = (acc[type] || 0) + (project.value || 0);
      return acc;
    }, {} as Record<string, number>);

    const topProjectTypes = Object.entries(projectTypes)
      .map(([name, value]) => ({
        category: 'project_type',
        name,
        value,
        trend: 'stable' as const
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return [...customerValues, ...topProjectTypes];
  };

  // Helper calculation functions
  const calculateRetentionRate = (customers: any[], projects: any[]) => {
    const customersWithMultipleProjects = new Set();
    const customerProjectCount = projects.reduce((acc, project) => {
      const customerId = project.customer_id;
      if (customerId) {
        acc[customerId] = (acc[customerId] || 0) + 1;
        if (acc[customerId] > 1) {
          customersWithMultipleProjects.add(customerId);
        }
      }
      return acc;
    }, {} as Record<string, number>);

    return customers.length > 0 ? 
      (customersWithMultipleProjects.size / customers.length) * 100 : 0;
  };

  const calculateCustomerLTV = (customers: any[], projects: any[]) => {
    if (customers.length === 0) return 0;
    
    const totalRevenue = projects.reduce((sum, p) => sum + (p.value || 0), 0);
    return totalRevenue / customers.length;
  };

  const calculateAverageSalesTime = (projects: any[]) => {
    const completedProjects = projects.filter(p => 
      p.stage?.name === 'Completed' && p.created_at && p.updated_at
    );

    if (completedProjects.length === 0) return 0;

    const totalDays = completedProjects.reduce((sum, project) => {
      const created = new Date(project.created_at);
      const completed = new Date(project.updated_at);
      const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return totalDays / completedProjects.length;
  };

  const calculateWinRate = (projects: any[]) => {
    const closedProjects = projects.filter(p => 
      ['Completed', 'Cancelled', 'Lost'].includes(p.stage?.name || '')
    );
    const wonProjects = projects.filter(p => p.stage?.name === 'Completed');

    return closedProjects.length > 0 ? 
      (wonProjects.length / closedProjects.length) * 100 : 0;
  };

  const calculateActivityScore = (activities: any[]) => {
    const recentActivities = activities.filter(a => 
      new Date(a.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return recentActivities.length;
  };

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Implementation would depend on chosen export library
    console.log(`Exporting ${reportType} report as ${format}`);
    // For now, we'll create a simple CSV export
    if (format === 'csv' && analyticsData) {
      const csvData = generateCSVData();
      downloadCSV(csvData, `crm-analytics-${reportType}-${dateRange}.csv`);
    }
  };

  const generateCSVData = () => {
    if (!analyticsData) return '';
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', analyticsData.revenueMetrics.totalRevenue.toString()],
      ['Average Project Value', analyticsData.revenueMetrics.averageProjectValue.toString()],
      ['Total Customers', analyticsData.customerMetrics.totalCustomers.toString()],
      ['Conversion Rate', analyticsData.performanceMetrics.conversionRate.toString()],
      ['Win Rate', analyticsData.performanceMetrics.winRate.toString()]
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading.projects || loading.customers || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h2>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="custom">Custom range</option>
          </select>

          <div className="flex gap-1">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart },
            { id: 'sales', label: 'Sales', icon: TrendingUp },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'performance', label: 'Performance', icon: LineChart },
            { id: 'financial', label: 'Financial', icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id as ReportType)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${analyticsData.revenueMetrics.totalRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Customers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyticsData.customerMetrics.totalCustomers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Conversion Rate
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {analyticsData.performanceMetrics.conversionRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Sales Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Math.round(analyticsData.performanceMetrics.averageSalesTime)} days
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Funnel</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.salesFunnel).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {stage}
                </span>
                <div className="flex items-center gap-2">
                  <div className="bg-blue-200 rounded-full h-2 w-32">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${(count / Math.max(...Object.values(analyticsData.salesFunnel))) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-900 font-medium w-8 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {analyticsData.topPerformers.slice(0, 5).map((performer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {performer.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {performer.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  ${performer.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Charts and Tables would go here based on reportType */}
      {reportType === 'financial' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${analyticsData.revenueMetrics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Completed Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                ${analyticsData.revenueMetrics.projectedRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Projected Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ${analyticsData.revenueMetrics.averageProjectValue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Average Project Value</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};