import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import LoginModal from './LoginModal';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const { user, signOut } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white/50 backdrop-blur-sm'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-mineral-green tracking-tight">OHoldings</span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#about" className="text-gray-600 hover:text-mineral-green transition-colors font-medium">About</a>
                            <a href="#" className="text-gray-600 hover:text-mineral-green transition-colors font-medium">Pricing</a>
                            <div className="flex items-center space-x-4 ml-4">
                                {user ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                                            <User className="w-5 h-5" />
                                            <span>{user.user_metadata?.full_name || user.email}</span>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="text-gray-500 hover:text-red-600 transition-colors"
                                            title="Sign Out"
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsLoginOpen(true)}
                                            className="text-gray-900 hover:text-mineral-green font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                        >
                                            Sign In
                                        </button>
                                        <button className="bg-mineral-green text-white px-5 py-2.5 rounded-full font-medium hover:bg-mineral-green-dark transition-colors shadow-sm hover:shadow-md">
                                            Get Started
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="md:hidden flex items-center gap-2">
                            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-50 transition-colors">
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-5 duration-200">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-mineral-green hover:bg-gray-50 rounded-md">About</a>
                            <a href="#" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-mineral-green hover:bg-gray-50 rounded-md">Pricing</a>
                            <div className="pt-4 space-y-3">
                                {user ? (
                                    <>
                                        <div className="px-3 py-2 text-base font-medium text-gray-900 flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            {user.user_metadata?.full_name || user.email}
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setIsLoginOpen(true); setIsOpen(false); }}
                                            className="w-full text-center text-gray-900 font-medium px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
                                        >
                                            Sign In
                                        </button>
                                        <button className="w-full text-center bg-mineral-green text-white px-4 py-2 rounded-full font-medium hover:bg-mineral-green-dark">
                                            Get Started
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    )
}
