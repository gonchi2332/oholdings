import { useState } from 'react';
import Layout from './components/Layout';
import Hero from './components/Hero';
import ChartSlideshow from './components/ChartSlideshow';
import Testimonials from './components/Testimonials';
import AutomationWorkflow from './components/AutomationWorkflow';
import About from './components/About';
import AppointmentForm from './components/AppointmentForm';
import AppointmentList from './components/AppointmentList';
import CalendarView from './components/CalendarView';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  return (
    <Layout>
      <Hero />

      {user && (
        <section className="py-20 bg-gray-50" id="appointments">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Manage Appointments</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Schedule, view, and manage your consultations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
              {/* Form Section */}
              <div className="lg:col-span-4">
                <AppointmentForm 
                  onSuccess={() => setRefreshTrigger(prev => prev + 1)} 
                  onSpecialistChange={(employeeId) => setSelectedEmployeeId(employeeId)}
                />
              </div>

              {/* Calendar Section */}
              <div className="lg:col-span-8">
                <CalendarView refreshTrigger={refreshTrigger} selectedEmployeeId={selectedEmployeeId} />
              </div>
            </div>

            {/* Appointments List Section */}
            <div className="border-t border-gray-200 pt-16">
              <AppointmentList refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
            </div>
          </div>
        </section>
      )}

      <ChartSlideshow />
      <AutomationWorkflow />
      <Testimonials />
      <About />
    </Layout>
  )
}

export default App;
