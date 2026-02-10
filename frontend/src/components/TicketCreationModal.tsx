import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface TicketCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTitle: string;
    initialDescription: string;
    projectId?: string;
}

export const TicketCreationModal: React.FC<TicketCreationModalProps> = ({ isOpen, onClose, initialTitle, initialDescription, projectId }) => {
    if (!isOpen) return null;

    const { token } = useAuth();
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [type, setType] = useState('User Story');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    React.useEffect(() => {
        setTitle(initialTitle);
        setDescription(initialDescription);
    }, [initialTitle, initialDescription, isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await axios.post(
                `${API_URL}/ado/work-items`,
                { title, description, type, projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`Ticket creado exitosamente: #${response.data.id}`);
            setTimeout(() => {
                onClose();
                setSuccess(null);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Error al crear el ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Send size={18} className="text-blue-400" />
                        Crear Ticket en Azure DevOps
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                            <Send size={16} /> {success}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Work Item</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option>User Story</option>
                                <option>Task</option>
                                <option>Bug</option>
                                <option>Feature</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono h-40 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Enviando...' : success ? 'Enviado' : 'Crear Ticket'}
                            {!loading && !success && <Send size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
