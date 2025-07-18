import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, Tag, Edit, Trash2 } from 'lucide-react';
import { useCustomers } from '../../context/CRMContext';
import type { Customer, CustomerFilters } from '../../types/crm';

interface CustomerListProps {
  onCustomerSelect?: (customer: Customer) => void;
  onCreateCustomer?: () => void;
  onEditCustomer?: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onCustomerSelect,
  onCreateCustomer,
  onEditCustomer
}) => {
  const { customers, loading, loadCustomers, deleteCustomer } = useCustomers();
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers(filters);
  }, [loadCustomers, filters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query || undefined }));
  };

  const handleSourceFilter = (source: string) => {
    setFilters(prev => ({
      ...prev,
      source: prev.source?.includes(source as any) 
        ? prev.source.filter(s => s !== source)
        : [...(prev.source || []), source as any]
    }));
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await deleteCustomer(customer.id);
      } catch (error) {
        console.error('Failed to delete customer:', error);
      }
    }
  };

  const formatAddress = (customer: Customer) => {
    if (!customer.address) return null;
    const { street, city, state, zipCode } = customer.address;
    return [street, city, state, zipCode].filter(Boolean).join(', ');
  };

  const getSourceColor = (source: string) => {
    const colors = {
      website: 'bg-blue-100 text-blue-800',
      referral: 'bg-green-100 text-green-800',
      advertising: 'bg-purple-100 text-purple-800',
      social_media: 'bg-pink-100 text-pink-800',
      cold_call: 'bg-yellow-100 text-yellow-800',
      trade_show: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[source as keyof typeof colors] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-600">
            Manage your customer database and contact information
          </p>
        </div>
        <button
          onClick={onCreateCustomer}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {['website', 'referral', 'advertising', 'social_media', 'cold_call', 'trade_show', 'other'].map((source) => (
              <button
                key={source}
                onClick={() => handleSourceFilter(source)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filters.source?.includes(source as any)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filters.source?.length 
                ? "Try adjusting your search criteria"
                : "Get started by adding your first customer"
              }
            </p>
            {!searchQuery && !filters.source?.length && (
              <button
                onClick={onCreateCustomer}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {customers.map((customer) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 
                        className="text-lg font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
                        onClick={() => onCustomerSelect?.(customer)}
                      >
                        {customer.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSourceColor(customer.source)}`}>
                        {customer.source.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {customer.company && (
                      <p className="text-sm text-gray-600 mb-2">{customer.company}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${customer.email}`} className="hover:text-blue-600">
                            {customer.email}
                          </a>
                        </div>
                      )}
                      
                      {customer.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${customer.phone}`} className="hover:text-blue-600">
                            {customer.phone}
                          </a>
                        </div>
                      )}
                      
                      {customer.address && formatAddress(customer) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{formatAddress(customer)}</span>
                        </div>
                      )}
                    </div>
                    
                    {customer.tags && customer.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex gap-1 flex-wrap">
                          {customer.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onEditCustomer?.(customer)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Edit customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteCustomer(customer)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {customer.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{customer.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {customers.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};