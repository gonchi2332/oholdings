import { useState, useEffect } from 'react';
import { Users, Calendar, Settings, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin';
import { employeeService } from '../services/employee';
import CalendlyView from './CalendlyView';

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState('customers'); // 'customers', 'schedule', 'settings'
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const [calendlyUrl, setCalendlyUrl] = useState('');

    useEffect(() => {
        const checkRole = async () => {
            if (!user) return;
            try {
                const role = await adminService.getUserRole();
                setUserRole(role);
                
                // Only employees can access
                if (role !== 'employee') {
                    setCurrentView(null);
                } else {
                    // Load employee profile
                    const profile = await employeeService.getMyProfile();
                    setMyProfile(profile);
                    setCalendlyUrl(profile?.calendly_url || '');
                }
            } catch (error) {
                console.error('Error checking role:', error);
            } finally {
                setLoading(false);
            }
        };
        checkRole();
    }, [user]);

    useEffect(() => {
        const loadCustomers = async () => {
            if (userRole === 'employee' && currentView === 'customers') {
                try {
                    setCustomersLoading(true);
                    const customersList = await employeeService.getAllCustomers();
                    setCustomers(customersList);
                } catch (error) {
                    console.error('Error loading customers:', error);
                } finally {
                    setCustomersLoading(false);
                }
            }
        };
        loadCustomers();
    }, [userRole, currentView]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
            </div>
        );
    }

    // Only employees can access
    if (!user || userRole !== 'employee') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Acceso Denegado</h2>
                    <p className="text-gray-600 dark:text-gray-400">Solo los empleados pueden acceder a esta área.</p>
                </div>
            </div>
        );
    }

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomerId(customerId);
        // Ir directamente a Calendly sin vista de configuración
        setCurrentView('schedule');
    };

    const handleBack = () => {
        setSelectedCustomerId(null);
        setCurrentView('customers');
    };

    // Settings view
    if (currentView === 'settings') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => setCurrentView('customers')}
                        className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver
                    </button>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Configuración</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    URL de Calendly
                                </label>
                                <input
                                    type="url"
                                    value={calendlyUrl}
                                    onChange={(e) => setCalendlyUrl(e.target.value)}
                                    placeholder="https://calendly.com/tu-usuario/evento"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-mineral-green focus:border-transparent"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Ingresa tu URL de Calendly para que los clientes puedan agendar citas contigo.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    try {
                                        await employeeService.updateCalendlyUrl(calendlyUrl);
                                        const profile = await employeeService.getMyProfile();
                                        setMyProfile(profile);
                                        alert('URL de Calendly actualizada correctamente');
                                    } catch (error) {
                                        console.error('Error updating Calendly URL:', error);
                                        alert('Error al actualizar la URL de Calendly');
                                    }
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-mineral-green text-white rounded-lg font-medium hover:bg-mineral-green-dark transition-colors shadow-sm hover:shadow-md"
                            >
                                Guardar URL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Schedule view (Calendly) - Direct access when customer is selected
    if (currentView === 'schedule' && selectedCustomerId) {
        const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
        
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver a clientes
                    </button>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Agendar cita con {selectedCustomer?.full_name || selectedCustomer?.email}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Selecciona el tipo de evento, fecha y hora. La reunión será enviada a {selectedCustomer?.email}
                        </p>
                    </div>

                    {myProfile?.calendly_url ? (
                        <CalendlyView 
                            calendlyUrl={myProfile.calendly_url}
                            selectedEmployeeId={user.id}
                            selectedCustomerId={selectedCustomerId}
                        />
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                            <p className="text-yellow-800 dark:text-yellow-200">
                                Por favor, configura tu URL de Calendly en la sección de Configuración antes de agendar citas.
                            </p>
                            <button
                                onClick={() => setCurrentView('settings')}
                                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                Ir a Configuración
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Customers list view (default)
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Panel de Empleado
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Selecciona un cliente para agendar una cita
                        </p>
                    </div>
                    <button
                        onClick={() => setCurrentView('settings')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5" />
                        Configuración
                    </button>
                </div>

                {customersLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No hay clientes disponibles
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Aún no hay clientes registrados en el sistema.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customers.map((customer) => (
                            <div
                                key={customer.id}
                                onClick={() => handleCustomerSelect(customer.id)}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-mineral-green dark:hover:border-mineral-green"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-mineral-green/10 dark:bg-mineral-green/20 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-mineral-green" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {customer.full_name || 'Sin nombre'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {customer.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-4 px-4 py-2 bg-mineral-green text-white rounded-lg font-medium hover:bg-mineral-green-dark transition-colors flex items-center justify-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Agendar Cita
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

