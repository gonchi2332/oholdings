import { useState, useEffect } from 'react';
import { Calendar, MapPin, Building, FileText, Activity, Clock, Loader2, User } from 'lucide-react';
import { appointmentService } from '../services/appointments';
import { useAuth } from '../context/AuthContext';

export default function AppointmentForm({ onSuccess, onSpecialistChange }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [listItems, setListItems] = useState([]); // Customers
    const [companies, setCompanies] = useState([]); // Companies
    const [isEmployee, setIsEmployee] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [formData, setFormData] = useState({
        empresa: '',
        tipo_consulta: 'General',
        descripcion: '',
        fecha_consulta: '',
        modalidad: 'Virtual',
        direccion: '',
        duracion_consulta: '60', // Default 1 hour in minutes
        selected_id: '' // user_id for employees
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoadingData(true);
            try {
                // Use getAppointments to get isEmployee flag
                const appointmentsData = await appointmentService.getAppointments();
                const amIEmployee = appointmentsData.isEmployee || false;
                setIsEmployee(amIEmployee);

                if (amIEmployee) {
                    // Load companies and customers
                    const companiesData = await appointmentService.getCompanies();
                    setCompanies(companiesData || []);
                    
                    if (companiesData && companiesData.length > 0) {
                        const firstCompany = typeof companiesData[0] === 'string' ? companiesData[0] : (companiesData[0].empresa || companiesData[0]);
                        setSelectedCompany(firstCompany);
                        setFormData(prev => ({ ...prev, empresa: firstCompany }));
                        
                        setLoadingCustomers(true);
                        const clients = await appointmentService.getClientsByCompany(firstCompany);
                        setListItems(clients || []);
                        setLoadingCustomers(false);
                        if (clients && clients.length > 0) {
                            setFormData(prev => ({ ...prev, selected_id: clients[0].id }));
                        }
                    } else {
                        // If no companies, try to get all clients as fallback
                        setLoadingCustomers(true);
                        const clients = await appointmentService.getClients();
                        setListItems(clients || []);
                        setLoadingCustomers(false);
                        if (clients && clients.length > 0) {
                            setFormData(prev => ({ ...prev, selected_id: clients[0].id }));
                        }
                    }
                } else {
                    // For regular users, get employees
                    const employees = await appointmentService.getEmployees();
                    setListItems(employees || []);
                    if (employees && employees.length > 0) {
                        const firstEmployeeId = employees[0].id;
                        setFormData(prev => ({ ...prev, selected_id: firstEmployeeId }));
                        // Notify parent about the selected specialist
                        if (onSpecialistChange) {
                            onSpecialistChange(firstEmployeeId);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load data', err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, [user, onSpecialistChange]);

    // When company changes, filter customers
    useEffect(() => {
        const loadCustomersForCompany = async () => {
            if (!isEmployee || !selectedCompany) return;
            try {
                const clients = await appointmentService.getClientsByCompany(selectedCompany);
                setListItems(clients || []);
                if (clients && clients.length > 0) {
                    setFormData(prev => ({ ...prev, selected_id: clients[0].id }));
                } else {
                    setFormData(prev => ({ ...prev, selected_id: '' }));
                }
            } catch (err) {
                console.error('Failed to load customers', err);
            }
        };
        loadCustomersForCompany();
    }, [selectedCompany, isEmployee]);

    if (!user) return null;

    // Generate time slots in 15-minute intervals
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                slots.push(timeStr);
            }
        }
        return slots;
    };

    // Extract date and time from formData
    const dateValue = formData.fecha_consulta ? formData.fecha_consulta.split('T')[0] : '';
    const timeValue = formData.fecha_consulta ? formData.fecha_consulta.split('T')[1]?.substring(0, 5) : '';

    const handleDateChange = (e) => {
        const newDateValue = e.target.value;
        const currentTime = timeValue || '00:00';
        setFormData({ ...formData, fecha_consulta: newDateValue ? `${newDateValue}T${currentTime}` : '' });
    };

    const handleTimeChange = (e) => {
        if (!dateValue) {
            alert('Please select a date first before choosing a time.');
            return;
        }
        const newTimeValue = e.target.value;
        const datePart = formData.fecha_consulta.split('T')[0] || new Date().toISOString().split('T')[0];
        setFormData({ ...formData, fecha_consulta: `${datePart}T${newTimeValue}` });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                fecha_consulta: new Date(formData.fecha_consulta).toISOString()
            };

            if (isEmployee) {
                payload.user_id = formData.selected_id;
            } else {
                payload.employee_id = formData.selected_id;
            }
            delete payload.selected_id;

            await appointmentService.createAppointment(payload);
            setFormData(prev => ({
                ...prev,
                empresa: selectedCompany || '',
                tipo_consulta: 'General',
                descripcion: '',
                fecha_consulta: '',
                modalidad: 'Virtual',
                direccion: '',
                duracion_consulta: '60'
            }));
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to schedule appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-mineral-green" />
                Schedule Appointment
            </h2>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isEmployee && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Building className="w-5 h-5" />
                                        </div>
                                        {loadingData ? (
                                            <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                        ) : (
                                            <select
                                                required
                                                value={selectedCompany}
                                                onChange={(e) => {
                                                    setSelectedCompany(e.target.value);
                                                    setFormData({ ...formData, empresa: e.target.value });
                                                }}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                            >
                                                {companies.map((company, idx) => {
                                                    const companyName = typeof company === 'string' ? company : (company.empresa || company);
                                                    return (
                                                        <option key={idx} value={companyName}>
                                                            {companyName}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Customer
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        {loadingData || loadingCustomers ? (
                                            <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                        ) : (
                                            <select
                                                required
                                                value={formData.selected_id}
                                                onChange={(e) => setFormData({ ...formData, selected_id: e.target.value })}
                                                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                                disabled={!selectedCompany || listItems.length === 0}
                                            >
                                                {listItems.length === 0 ? (
                                                    <option value="">No customers available</option>
                                                ) : (
                                                    listItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.full_name} {item.email ? `(${item.email})` : ''}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {!isEmployee && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.empresa}
                                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none"
                                        placeholder="Acme Corp"
                                    />
                                </div>
                            </div>
                        )}

                        {!isEmployee && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Specialist
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    {loadingData ? (
                                        <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                    ) : (
                                        <select
                                            required
                                            value={formData.selected_id}
                                            onChange={(e) => {
                                                setFormData({ ...formData, selected_id: e.target.value });
                                                // Notify parent component about specialist change
                                                if (onSpecialistChange) {
                                                    onSpecialistChange(e.target.value);
                                                }
                                            }}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                        >
                                            {listItems.length === 0 ? (
                                                <option value="">No specialists available</option>
                                            ) : (
                                                listItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.full_name} - {item.specialty}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.tipo_consulta}
                                    onChange={(e) => setFormData({ ...formData, tipo_consulta: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                >
                                    <option>General</option>
                                    <option>Technical</option>
                                    <option>Sales</option>
                                    <option>Support</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Modality
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.modalidad}
                                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                >
                                    <option>Virtual</option>
                                    <option>In-Person</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <input
                                    type="date"
                                    required
                                    value={dateValue}
                                    onChange={handleDateChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <select
                                    required
                                    value={timeValue}
                                    onChange={handleTimeChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                    disabled={!dateValue}
                                >
                                    <option value="">Select time</option>
                                    {generateTimeSlots().map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Consultation Duration
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <select
                                    value={formData.duracion_consulta}
                                    onChange={(e) => setFormData({ ...formData, duracion_consulta: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                >
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="45">45 minutes</option>
                                    <option value="60">1 hour</option>
                                    <option value="120">2 hours</option>
                                    <option value="180">3 hours</option>
                                    <option value="240">4 hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                required
                                rows={3}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none resize-none"
                                placeholder="Briefly describe what you'd like to discuss..."
                            />
                        </div>
                    </div>

                    {formData.modalidad === 'In-Person' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.direccion}
                                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none"
                                    placeholder="123 Business St, City, Country"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-mineral-green text-white py-3.5 rounded-xl font-bold hover:bg-mineral-green-dark transition-all shadow-lg shadow-mineral-green/20 hover:shadow-xl hover:shadow-mineral-green/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Scheduling...
                            </>
                        ) : (
                            'Confirm Appointment'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
