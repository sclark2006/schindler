import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface DiscoveredService {
    id: string;
    originalName: string;
    sourceType: string;
    proposedServiceName: string;
    status: string;
    complexity: string;
    createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ServiceRegistry: React.FC = () => {
    const [services, setServices] = useState<DiscoveredService[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/governance/services`);
            setServices(response.data);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800">Available Services Registry</h2>
                <button
                    onClick={fetchServices}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                            <th className="p-4 font-medium">Original Name</th>
                            <th className="p-4 font-medium">Source Type</th>
                            <th className="p-4 font-medium">Proposed Service</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Complexity</th>
                            <th className="p-4 font-medium">Created At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                    No services registered yet. Analyze an XML file and register candidates.
                                </td>
                            </tr>
                        ) : (
                            services.map((service) => (
                                <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{service.originalName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${service.sourceType === 'RECORD_GROUP' ? 'bg-blue-100 text-blue-700' :
                                                service.sourceType === 'PROGRAM_UNIT' ? 'bg-purple-100 text-purple-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {service.sourceType}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{service.proposedServiceName}</td>
                                    <td className="p-4">
                                        <span className="flex items-center gap-1.5 text-sm">
                                            {service.status === 'PENDING' ? (
                                                <><Clock size={16} className="text-amber-500" /> Pending</>
                                            ) : (
                                                <><CheckCircle size={16} className="text-emerald-500" /> Approved</>
                                            )}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{service.complexity || '-'}</td>
                                    <td className="p-4 text-slate-400 text-sm">
                                        {new Date(service.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
