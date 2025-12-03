import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Briefcase, Calendar, Clock } from 'lucide-react';
import { adminService } from '../../services/admin';
import { appointmentService } from '../../services/appointments';
import CalendarView from '../CalendarView';
import AppointmentList from '../AppointmentList';

export default function EmployeeProfile({ employeeId, onBack }) {
    const [employee, setEmployee] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'appointments'

    useEffect(() => {
        loadEmployeeData();
    }, [employeeId]);

    const loadEmployeeData = async () => {
        try {
            setLoading(true);
            
            // Load employee info
            const employees = await adminService.getAllEmployees();
            const foundEmployee = employees.find(emp => emp.id === employeeId);
            setEmployee(foundEmployee);

            // Load employee appointments
            const apps = await adminService.getEmployeeAppointments(employeeId);
            setAppointments(apps || []);
        } catch (err) {
            console.error('Error loading employee data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mineral-green"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Empleado no encontrado</h2>
                        <button
                            onClick={onBack}
                            className="text-mineral-green hover:text-mineral-green-dark"
                        >
                            Volver a la lista
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const pendingAppointments = appointments.filter(app => app.status?.name === 'pending');
    const approvedAppointments = appointments.filter(app => app.status?.name === 'approved');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver a Empleados
                    </button>

                    {/* Employee Info Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-mineral-green/10 rounded-xl">
                                <User className="w-12 h-12 text-mineral-green" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{employee.full_name}</h1>
                                <div className="space-y-2 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        <span>{employee.email}</span>
                                    </div>
                                    {employee.specialty && (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-5 h-5" />
                                            <span>{employee.specialty.name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                            {employee.role?.name === 'admin' ? 'Administrador' : 'Empleado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500 mb-1">Total de Citas</div>
                                <div className="text-3xl font-bold text-mineral-green">{appointments.length}</div>
                                {pendingAppointments.length > 0 && (
                                    <div className="text-sm text-yellow-600 mt-2">
                                        {pendingAppointments.length} pendientes
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'calendar'
                                    ? 'text-mineral-green border-b-2 border-mineral-green'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Calendario
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'appointments'
                                    ? 'text-mineral-green border-b-2 border-mineral-green'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Citas ({appointments.length})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'calendar' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <CalendarView 
                            refreshTrigger={refreshTrigger} 
                            selectedEmployeeId={employeeId}
                        />
                    </div>
                ) : (
                    <div>
                        {/* Pending Appointments Section */}
                        {pendingAppointments.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Citas Pendientes ({pendingAppointments.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pendingAppointments.map((appointment) => (
                                        <AppointmentCard
                                            key={appointment.id}
                                            appointment={appointment}
                                            employeeView={true}
                                            onUpdate={() => {
                                                setRefreshTrigger(prev => prev + 1);
                                                loadEmployeeData();
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All Appointments Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Todas las Citas
                            </h2>
                            <AppointmentList 
                                refreshTrigger={refreshTrigger}
                                onRefresh={() => {
                                    setRefreshTrigger(prev => prev + 1);
                                    loadEmployeeData();
                                }}
                                employeeId={employeeId}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mini Appointment Card Component
function AppointmentCard({ appointment, employeeView, onUpdate }) {
    const handleStatusUpdate = async (status_name) => {
        try {
            await appointmentService.updateStatus(appointment.id, status_name);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.message || 'Error al actualizar estado');
        }
    };

    return (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
            appointment.status?.name === 'approved' ? 'border-green-200' :
            appointment.status?.name === 'rejected' ? 'border-red-200' : 'border-gray-100'
        }`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-900">{appointment.empresa || 'Sin empresa'}</h3>
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
                {!employeeView && appointment.user && (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {appointment.user.full_name}
                    </div>
                )}
            </div>

            {appointment.status?.name === 'pending' && (
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => handleStatusUpdate('approved')}
                        className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs font-bold"
                    >
                        Aprobar
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('rejected')}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                    >
                        Rechazar
                    </button>
                </div>
            )}
        </div>
    );
}

