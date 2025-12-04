import { useState, useEffect } from 'react';
import { Users, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin';
import EmployeeList from './admin/EmployeeList';
import EmployeeProfile from './admin/EmployeeProfile';
import UsersView from './admin/UsersView';
import CalendlyView from './CalendlyView';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'employees', 'employee-detail', 'users', 'user-detail'
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            if (!user) return;
            try {
                const role = await adminService.getUserRole();
                setUserRole(role);
                
                // Only admins can access
                if (role !== 'admin') {
                    setCurrentView(null);
                }
            } catch (error) {
                console.error('Error checking role:', error);
            } finally {
                setLoading(false);
            }
        };
        checkRole();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
            </div>
        );
    }

    // Only admins can access the admin dashboard
    if (!user || userRole !== 'admin') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Acceso Denegado</h2>
                    <p className="text-gray-600 dark:text-gray-400">Solo los administradores pueden acceder a esta área.</p>
                </div>
            </div>
        );
    }

    // Handle view navigation
    const handleViewChange = (view, id = null) => {
        setCurrentView(view);
        if (view === 'employee-detail') {
            setSelectedEmployeeId(id);
        } else if (view === 'user-detail') {
            setSelectedUserId(id);
        } else {
            setSelectedEmployeeId(null);
            setSelectedUserId(null);
        }
    };

    // Render based on current view
    if (currentView === 'employees') {
        return (
            <EmployeeList 
                onBack={() => handleViewChange('dashboard')}
                onEmployeeClick={(employeeId) => handleViewChange('employee-detail', employeeId)}
                canAddEmployee={userRole === 'admin'}
            />
        );
    }

    if (currentView === 'employee-detail' && selectedEmployeeId) {
        return (
            <EmployeeProfile 
                employeeId={selectedEmployeeId}
                onBack={() => handleViewChange('employees')}
            />
        );
    }

    if (currentView === 'users') {
        return (
            <UsersView 
                onBack={() => handleViewChange('dashboard')}
                onUserClick={(userId) => handleViewChange('user-detail', userId)}
            />
        );
    }

    if (currentView === 'user-detail' && selectedUserId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => handleViewChange('users')}
                        className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a Usuarios
                    </button>
                    <UsersView 
                        selectedUserId={selectedUserId}
                        onBack={() => handleViewChange('users')}
                    />
                </div>
            </div>
        );
    }

    // Dashboard view (default) - Show calendar
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Panel de Administración</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona empleados y usuarios</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    {/* Employees Card */}
                    <button
                        onClick={() => handleViewChange('employees')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-mineral-green/10 dark:bg-mineral-green/20 rounded-xl group-hover:bg-mineral-green/20 dark:group-hover:bg-mineral-green/30 transition-colors">
                                <Users className="w-8 h-8 text-mineral-green" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Empleados</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Ver y gestionar empleados y especialistas
                        </p>
                    </button>

                    {/* Users Card */}
                    <button
                        onClick={() => handleViewChange('users')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors">
                                <UserPlus className="w-8 h-8 text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Usuarios</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Ver y gestionar usuarios
                        </p>
                    </button>
                </div>

                {/* Calendar */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Calendario</h2>
                    <CalendlyView selectedEmployeeId={null} />
                </div>
            </div>
        </div>
    );
}

