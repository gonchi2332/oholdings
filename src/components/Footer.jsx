import { Twitter, Facebook, Linkedin, Github } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-xl font-bold text-mineral-green mb-4 block">OHoldings</span>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Building the future of web development, one component at a time.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Changelog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-mineral-green transition-colors">About</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Careers</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-mineral-green transition-colors">Status</a></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © 2024 OHoldings Inc. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <a href="#" className="text-gray-400 hover:text-mineral-green transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-mineral-green transition-colors">
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-mineral-green transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-mineral-green transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
