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
    const [tiposConsulta, setTiposConsulta] = useState([]); // Tipos de consulta
    const [modalidades, setModalidades] = useState([]); // Modalidades
    const [isEmployee, setIsEmployee] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [loadingData, setLoadingData] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [formData, setFormData] = useState({
        empresa: '',
        tipo_consulta_id: '',
        descripcion: '',
        fecha_consulta: '',
        modalidad_id: '',
        direccion: '',
        duracion_consulta: '60', // Default 1 hour in minutes
        selected_id: '' // user_id for employees
    });

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoadingData(true);
            try {
                // Load tipos consulta and modalidades
                const [tiposData, modalidadesData] = await Promise.all([
                    appointmentService.getTiposConsulta(),
                    appointmentService.getModalidades()
                ]);
                
                setTiposConsulta(tiposData || []);
                setModalidades(modalidadesData || []);

                // Set default values
                if (tiposData && tiposData.length > 0) {
                    const generalTipo = tiposData.find(t => t.name === 'General') || tiposData[0];
                    setFormData(prev => ({ ...prev, tipo_consulta_id: generalTipo.id }));
                }
                
                if (modalidadesData && modalidadesData.length > 0) {
                    const virtualModalidad = modalidadesData.find(m => m.name === 'Virtual') || modalidadesData[0];
                    setFormData(prev => ({ ...prev, modalidad_id: virtualModalidad.id }));
                }

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
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedDate = dateValue ? new Date(dateValue) : null;
        const isToday = selectedDate && selectedDate.getTime() === today.getTime();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const timeMinutes = hour * 60 + minute;
                
                // If it's today, only show future time slots (with 15 min buffer)
                if (isToday && timeMinutes <= currentTimeMinutes + 15) {
                    continue;
                }
                
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
        if (!newDateValue) {
            setFormData({ ...formData, fecha_consulta: '' });
            return;
        }
        
        // Validate that the selected date is not in the past
        const selectedDate = new Date(newDateValue);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            setError('No se pueden seleccionar fechas pasadas. Por favor selecciona una fecha futura.');
            return;
        }
        
        // If selecting today, clear the time so user must select a future time
        if (selectedDate.getTime() === today.getTime()) {
            setFormData({ ...formData, fecha_consulta: newDateValue + 'T' });
        } else {
            const currentTime = timeValue || '00:00';
            setFormData({ ...formData, fecha_consulta: `${newDateValue}T${currentTime}` });
        }
    };

    const handleTimeChange = (e) => {
        if (!dateValue) {
            setError('Por favor selecciona una fecha antes de elegir una hora.');
            return;
        }
        
        const newTimeValue = e.target.value;
        const datePart = formData.fecha_consulta.split('T')[0] || new Date().toISOString().split('T')[0];
        const fullDateTime = `${datePart}T${newTimeValue}`;
        
        // Validate that the selected time is in the future
        const selectedDateTime = new Date(fullDateTime);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedDate = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate());
        
        // If selecting today, validate that time is in the future with 15 min buffer
        if (selectedDate.getTime() === today.getTime()) {
            const selectedTimeMinutes = selectedDateTime.getHours() * 60 + selectedDateTime.getMinutes();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
            
            if (selectedTimeMinutes <= currentTimeMinutes + 15) {
                setError('La hora debe ser al menos 15 minutos en el futuro. Por favor selecciona una hora más tarde.');
                return;
            }
        }
        
        // If date is in the past, show error
        if (selectedDate < today) {
            setError('No se pueden seleccionar fechas pasadas. Por favor selecciona una fecha futura.');
            return;
        }
        
        setFormData({ ...formData, fecha_consulta: fullDateTime });
        setError(null); // Clear any previous errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate that the appointment date/time is in the future
            const appointmentDateTime = new Date(formData.fecha_consulta);
            const now = new Date();
            
            // Check if date/time is in the past
            if (appointmentDateTime <= now) {
                setError('No se pueden agendar citas en el pasado. Por favor selecciona una fecha y hora futura.');
                setLoading(false);
                return;
            }
            
            // If it's today, check if time is at least 15 minutes in the future
            const appointmentDate = new Date(appointmentDateTime.getFullYear(), appointmentDateTime.getMonth(), appointmentDateTime.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (appointmentDate.getTime() === today.getTime()) {
                const appointmentTimeMinutes = appointmentDateTime.getHours() * 60 + appointmentDateTime.getMinutes();
                const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                
                if (appointmentTimeMinutes <= currentTimeMinutes + 15) {
                    setError('La cita debe ser al menos 15 minutos en el futuro. Por favor selecciona una hora más tarde.');
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                ...formData,
                fecha_consulta: appointmentDateTime.toISOString()
            };

            if (isEmployee) {
                payload.user_id = formData.selected_id;
            } else {
                payload.employee_id = formData.selected_id;
            }
            delete payload.selected_id;

            await appointmentService.createAppointment(payload);
            // Reset form but keep default tipo_consulta_id and modalidad_id
            const generalTipo = tiposConsulta.find(t => t.name === 'General') || tiposConsulta[0];
            const virtualModalidad = modalidades.find(m => m.name === 'Virtual') || modalidades[0];
            
            setFormData(prev => ({
                ...prev,
                empresa: selectedCompany || '',
                tipo_consulta_id: generalTipo?.id || '',
                descripcion: '',
                fecha_consulta: '',
                modalidad_id: virtualModalidad?.id || '',
                direccion: '',
                duracion_consulta: '60'
            }));
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Appointment creation error:', err);
            // Extract user-friendly error message from various possible formats
            let errorMessage = 'Failed to schedule appointment. Please try again.';
            
            if (err) {
                // Check different error formats
                if (err.message) {
                    errorMessage = err.message;
                } else if (err.error) {
                    if (typeof err.error === 'string') {
                        errorMessage = err.error;
                    } else if (err.error.error) {
                        errorMessage = err.error.error;
                    } else if (err.error.message) {
                        errorMessage = err.error.message;
                    }
                }
            }
            
            // Translate common error messages to Spanish if needed
            if (errorMessage.includes('already booked') || errorMessage.includes('time slot')) {
                errorMessage = 'Este horario ya está ocupado. Por favor selecciona otro horario.';
            } else if (errorMessage.includes('past')) {
                errorMessage = 'No se pueden agendar citas en el pasado. Por favor selecciona una fecha y hora futura.';
            }
            
            setError(errorMessage);
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
                                                        {item.full_name} - {item.specialty?.name || 'No specialty'}
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
                                {loadingData ? (
                                    <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                ) : (
                                    <select
                                        required
                                        value={formData.tipo_consulta_id}
                                        onChange={(e) => setFormData({ ...formData, tipo_consulta_id: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                    >
                                        <option value="">Select type</option>
                                        {tiposConsulta.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                                        ))}
                                    </select>
                                )}
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
                                {loadingData ? (
                                    <div className="w-full h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                                ) : (
                                    <select
                                        required
                                        value={formData.modalidad_id}
                                        onChange={(e) => setFormData({ ...formData, modalidad_id: e.target.value })}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mineral-green/20 focus:border-mineral-green transition-colors outline-none bg-white appearance-none"
                                    >
                                        <option value="">Select modality</option>
                                        {modalidades.map(modalidad => (
                                            <option key={modalidad.id} value={modalidad.id}>{modalidad.name}</option>
                                        ))}
                                    </select>
                                )}
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
                                    min={new Date().toISOString().split('T')[0]}
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

                    {modalidades.find(m => m.id === formData.modalidad_id)?.name === 'In-Person' && (
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
