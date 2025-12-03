import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, Search, Clock, Building } from 'lucide-react';
import { adminService } from '../../services/admin';

export default function UsersView({ selectedUserId, onBack, onUserClick }) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userAppointments, setUserAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            loadUserAppointments(selectedUserId);
        }
    }, [selectedUserId]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data || []);
            
            // If selectedUserId is provided, find and set that user
            if (selectedUserId) {
                const user = data.find(u => u.id === selectedUserId);
                setSelectedUser(user);
            }
        } catch (err) {
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUserAppointments = async (userId) => {
        try {
            const apps = await adminService.getUserAppointments(userId);
            setUserAppointments(apps || []);
        } catch (err) {
            console.error('Error loading user appointments:', err);
        }
    };

    const handleUserClick = (userId) => {
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        loadUserAppointments(userId);
        if (onUserClick) {
            onUserClick(userId);
        }
    };

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If viewing a specific user's details
    if (selectedUser) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => {
                                setSelectedUser(null);
                                setUserAppointments([]);
                                if (onBack) onBack();
                            }}
                            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver a Usuarios
                        </button>

                        {/* User Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-blue-500/10 rounded-xl">
                                    <User className="w-12 h-12 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedUser.full_name}</h1>
                                    <div className="space-y-2 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-5 h-5" />
                                            <span>{selectedUser.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>Miembro desde {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500 mb-1">Total de Citas</div>
                                    <div className="text-3xl font-bold text-blue-500">{userAppointments.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appointments List */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Citas del Usuario</h2>
                        
                        {userAppointments.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No hay citas</h3>
                                <p className="text-gray-500 mt-1">Este usuario no tiene citas registradas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {userAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                                            appointment.status?.name === 'approved' ? 'border-green-200' :
                                            appointment.status?.name === 'rejected' ? 'border-red-200' : 'border-gray-100'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2 text-mineral-green font-bold text-lg">
                                                <Building className="w-5 h-5" />
                                                <span className="truncate">{appointment.empresa}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                                appointment.status?.name === 'approved' ? 'bg-green-100 text-green-800' :
                                                appointment.status?.name === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {appointment.status?.name || 'pending'}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {new Date(appointment.fecha_consulta).toLocaleString()}
                                            </div>
                                            {appointment.employee && (
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {appointment.employee.full_name}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {appointment.tipo_consulta?.name || 'N/A'}
                                                </span>
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {appointment.modalidad?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        {appointment.descripcion && (
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic line-clamp-3">
                                                "{appointment.descripcion}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Users List View
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios</h1>
                    <p className="text-gray-600">Ver y gestionar usuarios y sus citas</p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                        />
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mineral-green"></div>
                    </div>
                ) : (
                    /* Users Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleUserClick(user.id)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                                        <User className="w-8 h-8 text-blue-500" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{user.full_name}</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Miembro desde {new Date(user.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && filteredUsers.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay usuarios</h3>
                        <p className="text-gray-500 mt-1">No se encontraron usuarios</p>
                    </div>
                )}
            </div>
        </div>
    );
}

