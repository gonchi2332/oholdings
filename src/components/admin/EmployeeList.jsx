import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, Search, User, Mail, Briefcase, Plus, X, Loader2 } from 'lucide-react';
import { adminService } from '../../services/admin';
import { authService } from '../../services/auth';
import { supabase } from '../../lib/supabase';

export default function EmployeeList({ onBack, onEmployeeClick, canAddEmployee }) {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [specialties, setSpecialties] = useState([]);
    const [newEmployee, setNewEmployee] = useState({
        email: '',
        password: '',
        full_name: '',
        specialty_id: ''
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEmployees();
        if (canAddEmployee) {
            loadSpecialties();
        }
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllEmployees();
            setEmployees(data || []);
        } catch (err) {
            console.error('Error loading employees:', err);
            setError('Error al cargar empleados');
        } finally {
            setLoading(false);
        }
    };

    const loadSpecialties = async () => {
        try {
            const data = await adminService.getSpecialties();
            setSpecialties(data || []);
        } catch (err) {
            console.error('Error loading specialties:', err);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setError(null);
        setAdding(true);

        try {
            // Note: Creating auth users requires admin privileges
            // For now, we'll create the user via signup and then update their role
            // In production, you should use an edge function with service role key
            
            // First, create the auth user via signup
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: newEmployee.email,
                password: newEmployee.password,
                options: {
                    data: {
                        full_name: newEmployee.full_name
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No se pudo crear el usuario');

            // Wait a moment for the profile to be created by the trigger
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update profile with employee role and specialty
            await adminService.updateUserRole(
                authData.user.id,
                'employee',
                newEmployee.specialty_id || null
            );

            // Close modal and reload
            setShowAddModal(false);
            setNewEmployee({ email: '', password: '', full_name: '', specialty_id: '' });
            await loadEmployees();
            
            alert('Empleado creado exitosamente. El usuario recibirá un email de confirmación.');
        } catch (err) {
            console.error('Error adding employee:', err);
            setError(err.message || 'Error al crear empleado. Nota: Para crear empleados, necesitas permisos de administrador o usar una función edge.');
        } finally {
            setAdding(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Empleados</h1>
                            <p className="text-gray-600 mt-1">Gestiona empleados y especialistas</p>
                        </div>
                    </div>
                    {canAddEmployee && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-mineral-green text-white px-4 py-2 rounded-lg hover:bg-mineral-green-dark transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Agregar Empleado
                        </button>
                    )}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mineral-green"></div>
                    </div>
                ) : (
                    /* Employees Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map((employee) => (
                            <button
                                key={employee.id}
                                onClick={() => onEmployeeClick(employee.id)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-mineral-green/10 rounded-xl group-hover:bg-mineral-green/20 transition-colors">
                                        <User className="w-8 h-8 text-mineral-green" />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                        {employee.role?.name === 'admin' ? 'Admin' : 'Empleado'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{employee.full_name}</h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{employee.email}</span>
                                    </div>
                                    {employee.specialty && (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            <span>{employee.specialty.name}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && filteredEmployees.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay empleados</h3>
                        <p className="text-gray-500 mt-1">
                            {canAddEmployee ? 'Agrega tu primer empleado para comenzar' : 'No se encontraron empleados'}
                        </p>
                    </div>
                )}
            </div>

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Agregar Empleado</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setError(null);
                                    setNewEmployee({ email: '', password: '', full_name: '', specialty_id: '' });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newEmployee.full_name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newEmployee.email}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newEmployee.password}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Especialidad
                                </label>
                                <select
                                    value={newEmployee.specialty_id}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, specialty_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green outline-none"
                                >
                                    <option value="">Sin especialidad</option>
                                    {specialties.map(spec => (
                                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setError(null);
                                        setNewEmployee({ email: '', password: '', full_name: '', specialty_id: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={adding}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 px-4 py-2 bg-mineral-green text-white rounded-lg hover:bg-mineral-green-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {adding ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        'Crear Empleado'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

