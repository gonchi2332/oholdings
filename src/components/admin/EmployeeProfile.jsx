import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Briefcase } from 'lucide-react';
import { adminService } from '../../services/admin';
import CalendlyView from '../CalendlyView';

export default function EmployeeProfile({ employeeId, onBack }) {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);

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
                        </div>
                    </div>
                </div>

                {/* Calendly View */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Calendario</h2>
                    <CalendlyView 
                        selectedEmployeeId={employeeId}
                    />
                </div>
            </div>
        </div>
    );
}
