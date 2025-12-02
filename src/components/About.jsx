export default function About() {
    return (
        <section id="about" className="py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                            Empowering the Next Generation of Builders
                        </h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            At OHoldings, we believe that the future of software development lies in intelligent automation. We are building the infrastructure that allows teams to focus on creativity while our agents handle the complexity.
                        </p>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Founded by industry veterans, we are backed by top-tier investors who share our vision of a faster, more reliable web.
                        </p>
                    </div>
                    <div className="mt-12 lg:mt-0 relative">
                        <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                            {/* Placeholder for team image or office shot */}
                            <div className="w-full h-full bg-gradient-to-br from-mineral-green/10 to-mineral-green/5 flex items-center justify-center">
                                <span className="text-mineral-green font-medium">Team & Culture</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
