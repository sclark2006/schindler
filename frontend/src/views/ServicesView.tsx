import React, { useState, useEffect } from 'react';
import { Database, Filter, Search, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

const API_URL = import.meta.env.VITE_API_URL;

// Swagger-style colors for HTTP methods
const methodConfig: Record<string, { label: string; color: string }> = {
    'GET': { label: 'GET', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'POST': { label: 'POST', color: 'bg-green-50 text-green-700 border-green-200' },
    'PUT': { label: 'PUT', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'PATCH': { label: 'PATCH', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'DELETE': { label: 'DELETE', color: 'bg-red-50 text-red-700 border-red-200' },
};

export const ServicesView: React.FC = () => {
    const { currentProject } = useProject();
    const { token } = useAuth();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [methodFilter, setMethodFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (currentProject?.id) {
            fetchServices();
        }
    }, [currentProject?.id]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/discovered-services`, {
                params: { projectId: currentProject?.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            setServices(res.data);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service => {
        const matchesMethod = methodFilter === 'ALL' || service.method === methodFilter;
        const matchesSearch = !searchQuery ||
            service.proposedServiceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.endpoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.originalName?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesMethod && matchesSearch;
    });

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Database size={20} className="text-indigo-500" />
                    Services Catalog ({filteredServices.length})
                </h3>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                {/* Method Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Methods</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or endpoint..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Services Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="py-3 px-4 font-medium text-slate-500">Service</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Method</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Endpoint</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Data Source</th>
                            <th className="py-3 px-4 font-medium text-slate-500">Status</th>
                            <th className="py-3 px-4 font-medium text-slate-500 text-right">Ticket</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500 italic">Loading services...</td>
                            </tr>
                        ) : filteredServices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                                    {methodFilter !== 'ALL' || searchQuery ? 'No services match your filters.' : 'No services registered yet.'}
                                </td>
                            </tr>
                        ) : (
                            filteredServices.map((service, i) => {
                                const cfg = methodConfig[service.method] || methodConfig['GET'];
                                return (
                                    <tr
                                        key={i}
                                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer"
                                    >
                                        <td className="py-3 px-4 font-medium text-slate-800">
                                            {service.proposedServiceName || service.originalName}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                                            {service.endpoint || 'N/A'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{service.sourceType}</span>
                                                <span className="text-xs">{service.originalName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${service.status === 'MIGRATED' ? 'bg-emerald-50 text-emerald-700' :
                                                service.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' :
                                                    service.status === 'PENDING' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-amber-50 text-amber-700'
                                                }`}>
                                                {service.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {service.ticketId ? (
                                                <a
                                                    href={service.ticketUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    #{service.ticketId} <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
