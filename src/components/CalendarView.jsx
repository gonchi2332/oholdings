import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, X } from 'lucide-react';
import { appointmentService } from '../services/appointments';
import { useAuth } from '../context/AuthContext';

export default function CalendarView({ refreshTrigger, selectedEmployeeId }) {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user) return;
            try {
                setLoading(true);
                // If selectedEmployeeId is provided, fetch appointments for that specialist
                // Otherwise, fetch all appointments (for employees, this will be filtered by backend)
                const data = await appointmentService.getAppointments(selectedEmployeeId);
                        const approved = (data.appointments || []).filter(app => app.status?.name === 'approved');
                setAppointments(approved);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, [user, refreshTrigger, selectedEmployeeId]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

    const isSameDay = (date1, date2) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    };

    const getAppointmentsForDay = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return appointments.filter(app => {
            if (!app.fecha_consulta) return false;
            return isSameDay(new Date(app.fecha_consulta), date);
        });
    };

    const handleDayClick = (day) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    };

    const closeDailyView = () => setSelectedDate(null);

    // Daily View Component
    const DailyView = ({ date, appointments }) => {
        // Show all 24 hours of the day
        const startHour = 0;
        const endHour = 23;
        const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

        const getAppointmentsForHour = (hour) => {
            return appointments.filter(app => {
                if (!app.fecha_consulta) return false;
                const appStart = new Date(app.fecha_consulta);
                const appEnd = app.end_time ? new Date(app.end_time) : new Date(appStart.getTime() + 60 * 60 * 1000); // Default 1 hour if no end_time
                
                const hourStart = new Date(date);
                hourStart.setHours(hour, 0, 0, 0);
                const hourEnd = new Date(date);
                hourEnd.setHours(hour + 1, 0, 0, 0);
                
                // Show appointment if it overlaps with this hour slot
                return appStart < hourEnd && appEnd > hourStart;
            });
        };

        return (
            <div className="absolute inset-0 bg-white z-10 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-mineral-green" />
                        {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onClick={closeDailyView} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        {hours.map(hour => {
                            const hourApps = getAppointmentsForHour(hour);
                            const isPast = new Date().setHours(0, 0, 0, 0) > date.setHours(0, 0, 0, 0) || (isSameDay(new Date(), date) && new Date().getHours() > hour);

                            return (
                                <div key={hour} className="flex gap-4 group">
                                    <div className="w-20 text-right text-sm font-medium text-gray-500 pt-2">
                                        {String(hour).padStart(2, '0')}:00
                                    </div>
                                    <div className={`flex-1 min-h-[80px] rounded-xl border p-1 ${hourApps.length > 0 ? 'bg-white border-gray-200' :
                                            isPast ? 'bg-gray-50 border-gray-100' : 'bg-white border-dashed border-gray-200'
                                        }`}>
                                        {hourApps.length > 0 ? (
                                            hourApps.map(app => (
                                                <div key={app.id} className="bg-mineral-green/10 border border-mineral-green/20 p-3 rounded-lg h-full flex flex-col justify-center">
                                                    <div className="font-bold text-mineral-green-dark text-sm">{app.empresa}</div>
                                                    <div className="text-xs text-mineral-green-dark/80 flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {app.employee?.full_name}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-gray-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                Available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mineral-green"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative flex flex-col" style={{ minHeight: '600px' }}>
            {selectedDate && (
                <DailyView
                    date={selectedDate}
                    appointments={appointments.filter(app => {
                        if (!app.fecha_consulta) return false;
                        return isSameDay(new Date(app.fecha_consulta), selectedDate);
                    })}
                />
            )}

            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-mineral-green" />
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 p-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 flex-1 overflow-y-auto">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
                ))}

                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dayAppointments = getAppointmentsForDay(day);
                    const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), day));

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`bg-white min-h-[100px] p-2 transition-colors hover:bg-gray-50 cursor-pointer relative group ${isToday ? 'bg-blue-50/30' : ''}`}
                        >
                            <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 group-hover:bg-gray-200'}`}>
                                {day}
                            </div>
                            <div className="space-y-1">
                                {dayAppointments.slice(0, 3).map(app => (
                                    <div
                                        key={app.id}
                                        className="text-[10px] px-1.5 py-1 rounded bg-mineral-green/10 text-mineral-green-dark border border-mineral-green/20 truncate font-medium"
                                    >
                                        {new Date(app.fecha_consulta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {app.empresa}
                                    </div>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[10px] text-gray-400 pl-1">
                                        + {dayAppointments.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
