import { motion } from 'framer-motion';
import { useState } from 'react';
import { Code, TrendingUp, Zap, Globe, BarChart3, Rocket, Sparkles } from 'lucide-react';

export default function ProductCard({ label = "Platform Preview" }) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    // Code lines that animate
    const codeLines = [
        { id: 1, keyword: "const", name: "intelligentAgent", operator: "=", value: "new AI()", delay: 0 },
        { id: 2, keyword: "", name: "agent", method: ".connect(", value: "clients)", delay: 0.2 },
        { id: 3, keyword: "await", name: "agent", method: ".optimize()", delay: 0.4 },
        { id: 4, keyword: "return", name: "successMetrics", delay: 0.6 },
    ];

    // Animated particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
    }));

    // Business metrics data
    const metrics = [
        { id: 1, value: "+245%", label: "Growth", delay: 0.8 },
        { id: 2, value: "99.9%", label: "Uptime", delay: 1.0 },
        { id: 3, value: "10x", label: "Faster", delay: 1.2 },
    ];

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    return (
        <motion.div
            className="relative w-full aspect-square max-w-lg mx-auto"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Main Container with gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-[2rem] shadow-2xl overflow-hidden border border-mineral-green/20">
                
                {/* Animated background particles */}
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        className="absolute w-1 h-1 bg-mineral-green/30 rounded-full"
                        style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0, 1, 0],
                            scale: [0, 1.5, 0],
                        }}
                        transition={{
                            duration: particle.duration,
                            delay: particle.delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Animated gradient overlay that follows mouse */}
                <motion.div
                    className="absolute inset-0 opacity-30"
                    style={{
                        background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(0, 168, 107, 0.15), transparent 40%)`,
                    }}
                    animate={{
                        opacity: isHovered ? 0.4 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                />

                {/* Code Editor Section */}
                <div className="absolute top-4 left-4 right-4 h-[35%] bg-gray-900/80 dark:bg-black/60 rounded-xl p-4 border border-mineral-green/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <Code className="w-4 h-4 text-gray-400 ml-2" />
                        <span className="text-xs text-gray-400 ml-1">agent.js</span>
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                        {codeLines.map((line, index) => (
                            <motion.div
                                key={line.id}
                                className="text-gray-300"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    delay: line.delay + index * 0.3,
                                    duration: 0.5,
                                }}
                            >
                                <span className="text-mineral-green">→</span>{" "}
                                {line.keyword && <span className="text-blue-400">{line.keyword} </span>}
                                <span className="text-yellow-400">{line.name}</span>
                                {line.method && <span className="text-purple-400">{line.method}</span>}
                                {line.operator && <span className="text-gray-500"> {line.operator} </span>}
                                {line.value && <span className="text-purple-400">{line.value}</span>}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Business Metrics Section */}
                <div className="absolute bottom-16 left-4 right-4 h-[25%] bg-gray-900/60 dark:bg-black/40 rounded-xl p-4 border border-mineral-green/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between h-full">
                        {metrics.map((metric) => (
                            <motion.div
                                key={metric.id}
                                className="flex-1 text-center"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: metric.delay,
                                    duration: 0.5,
                                    type: "spring",
                                }}
                            >
                                <motion.div
                                    className="text-2xl font-bold text-mineral-green mb-1"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                    }}
                                    transition={{
                                        duration: 2,
                                        delay: metric.delay + 1,
                                        repeat: Infinity,
                                        repeatDelay: 3,
                                    }}
                                >
                                    {metric.value}
                                </motion.div>
                                <div className="text-xs text-gray-400">{metric.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Floating Icons */}
                <motion.div
                    className="absolute top-1/2 left-1/4"
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div className="w-12 h-12 bg-mineral-green/20 rounded-xl flex items-center justify-center border border-mineral-green/30 backdrop-blur-sm">
                        <Zap className="w-6 h-6 text-mineral-green" />
                    </div>
                </motion.div>

                <motion.div
                    className="absolute top-1/3 right-1/4"
                    animate={{
                        y: [0, 20, 0],
                        rotate: [0, -10, 10, 0],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                >
                    <div className="w-12 h-12 bg-mineral-green/20 rounded-xl flex items-center justify-center border border-mineral-green/30 backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-mineral-green" />
                    </div>
                </motion.div>

                <motion.div
                    className="absolute bottom-1/3 right-1/3"
                    animate={{
                        y: [0, -15, 0],
                        rotate: [0, 15, -15, 0],
                    }}
                    transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                >
                    <div className="w-12 h-12 bg-mineral-green/20 rounded-xl flex items-center justify-center border border-mineral-green/30 backdrop-blur-sm">
                        <Rocket className="w-6 h-6 text-mineral-green" />
                    </div>
                </motion.div>

                {/* Sparkles Effect */}
                <motion.div
                    className="absolute top-1/4 left-1/2"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0, 1, 0],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <Sparkles className="w-8 h-8 text-mineral-green/50" />
                </motion.div>

                {/* Chart Visualization */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-20">
                    <BarChart3 className="w-full h-full text-mineral-green" />
                    <motion.div
                        className="absolute inset-0 bg-mineral-green/10 rounded-full"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.3, 0.1, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>

                {/* Glowing effect on hover */}
                <motion.div
                    className="absolute inset-0 rounded-[2rem] border-2 border-mineral-green/0"
                    animate={{
                        borderColor: isHovered
                            ? "rgba(0, 168, 107, 0.5)"
                            : "rgba(0, 168, 107, 0)",
                    }}
                    transition={{ duration: 0.3 }}
                />

                {/* Call to Action Overlay */}
                <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    animate={{
                        opacity: isHovered ? 1 : 0.7,
                        y: isHovered ? -5 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="bg-mineral-green/20 backdrop-blur-md px-6 py-3 rounded-full border border-mineral-green/30">
                        <p className="text-sm font-semibold text-mineral-green flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            {label}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Outer glow effect */}
            <motion.div
                className="absolute -inset-4 bg-mineral-green/10 rounded-[2.5rem] blur-2xl -z-10"
                animate={{
                    opacity: isHovered ? 0.8 : 0.4,
                    scale: isHovered ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
}
