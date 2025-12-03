import { useState, useEffect } from 'react';
import { Calendar, MapPin, Building, Trash2, Clock, Video, AlertCircle, CheckCircle, XCircle, User } from 'lucide-react';
import { appointmentService } from '../services/appointments';
import { useAuth } from '../context/AuthContext';

export default function AppointmentList({ refreshTrigger, onRefresh, employeeId = null }) {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [isEmployee, setIsEmployee] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAppointments = async () => {
        if (!user && !employeeId) return;
        try {
            setLoading(true);
            // If employeeId is provided, fetch appointments for that employee
            if (employeeId) {
                const { adminService } = await import('../services/admin');
                const apps = await adminService.getEmployeeAppointments(employeeId);
                setAppointments(apps || []);
                setIsEmployee(true);
            } else {
                const data = await appointmentService.getAppointments();
                setAppointments(data.appointments || []);
                setIsEmployee(data.isEmployee);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user, refreshTrigger, employeeId]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;
        try {
            await appointmentService.deleteAppointment(id);
            // Refresh the list
            await fetchAppointments();
            // Trigger parent refresh to update calendar
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Delete error:', err);
            // Extract user-friendly error message
            const errorMessage = err?.error?.error || err?.message || 'Failed to delete appointment. Please try again.';
            alert(errorMessage);
        }
    };

    const handleStatusUpdate = async (id, status_name) => {
        try {
            await appointmentService.updateStatus(id, status_name);
            // Refresh the list
            await fetchAppointments();
            // Trigger parent refresh to update calendar
            if (onRefresh) onRefresh();
        } catch (err) {
            console.error('Update status error:', err);
            // Extract user-friendly error message
            const errorMessage = err?.error?.error || err?.message || 'Failed to update status. Please try again.';
            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mineral-green"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        );
    }

    if (appointments.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No appointments yet</h3>
                <p className="text-gray-500 mt-1">
                    {isEmployee ? 'No pending appointments.' : 'Schedule your first consultation above.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    {isEmployee ? 'All Appointments' : 'Your Appointments'}
                </h2>
                {isEmployee && (
                    <span className="text-xs font-medium bg-mineral-green/10 text-mineral-green px-3 py-1 rounded-full border border-mineral-green/20">
                        Employee View
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className={`bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col justify-between h-full ${appointment.status?.name === 'approved' ? 'border-green-200' :
                            appointment.status?.name === 'rejected' ? 'border-red-200' : 'border-gray-100'
                            }`}
                    >
                        <div className="space-y-4 mb-4">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2 text-mineral-green font-bold text-lg truncate">
                                    <Building className="w-5 h-5 flex-shrink-0" />
                                    <span className="truncate">{appointment.empresa}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex-shrink-0 ${appointment.status?.name === 'approved' ? 'bg-green-100 text-green-800' :
                                    appointment.status?.name === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {appointment.status?.name || 'pending'}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    {new Date(appointment.fecha_consulta).toLocaleString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>

                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                        {appointment.employee?.full_name || 'Unknown Specialist'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {appointment.modalidad?.name === 'Virtual' ? (
                                        <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className="truncate">
                                        {appointment.modalidad?.name || 'Unknown'}
                                        {appointment.modalidad?.name !== 'Virtual' && appointment.direccion && ` - ${appointment.direccion}`}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 italic line-clamp-3">
                                "{appointment.descripcion}"
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                            {/* Employees can approve/reject pending appointments */}
                            {isEmployee && appointment.status?.name === 'pending' && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(appointment.id, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-bold uppercase tracking-wide"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-bold uppercase tracking-wide"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </>
                            )}

                            {/* Customers can only accept/reject appointments created by employees */}
                            {!isEmployee && appointment.status?.name === 'pending' && appointment.created_by_employee && (
                                <>
                                    <button
                                        onClick={() => handleStatusUpdate(appointment.id, 'approved')}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-bold uppercase tracking-wide"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(appointment.id, 'rejected')}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-bold uppercase tracking-wide"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </>
                            )}

                            {/* Only employees can delete appointments (customers cannot delete) */}
                            {isEmployee && (
                                <button
                                    onClick={() => handleDelete(appointment.id)}
                                    className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-wide ml-auto"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
