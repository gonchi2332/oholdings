import { motion } from 'framer-motion';
import { Database, Bot, Send, Activity } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Request Intake",
        icon: Database,
        description: "Secure data ingestion from multiple sources."
    },
    {
        id: 2,
        title: "AI Agent Routing",
        icon: Bot,
        description: "Intelligent classification and task assignment."
    },
    {
        id: 3,
        title: "Client Delivery",
        icon: Send,
        description: "Automated response generation and delivery."
    },
    {
        id: 4,
        title: "Monitoring & Insights",
        icon: Activity,
        description: "Real-time tracking and performance analytics."
    }
];

export default function AutomationWorkflow() {
    return (
        <section className="py-24 overflow-hidden bg-white text-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
                        Automated Intelligent Agents Workflow
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Our platform orchestrates complex workflows with autonomous AI agents.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 hidden md:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2, duration: 0.5 }}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 shadow-lg relative group">
                                    <step.icon className="w-10 h-10 text-mineral-green group-hover:text-mineral-green-dark transition-colors duration-300" />
                                    <div className="absolute inset-0 bg-mineral-green/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
