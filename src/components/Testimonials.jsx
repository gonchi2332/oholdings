import { Star } from 'lucide-react';

const testimonials = [
    {
        id: 1,
        quote: "OHoldings has completely transformed how we handle our data pipeline. The intelligent agents are a game changer.",
        author: "Sarah Chen",
        role: "CTO at TechFlow",
        avatar: "SC"
    },
    {
        id: 2,
        quote: "The speed and reliability of the platform is unmatched. We've seen a 40% increase in operational efficiency.",
        author: "Michael Ross",
        role: "VP of Engineering at ScaleUp",
        avatar: "MR"
    },
    {
        id: 3,
        quote: "Finally, a platform that understands the needs of modern development teams. Beautifully designed and powerful.",
        author: "Elena Rodriguez",
        role: "Product Lead at Innovate",
        avatar: "ER"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Trusted by Industry Leaders
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        See what our customers have to say about their experience with OHoldings.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial) => (
                        <div key={testimonial.id} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                            <div className="flex space-x-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                ))}
                            </div>
                            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                                "{testimonial.quote}"
                            </p>
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-mineral-green text-white flex items-center justify-center font-bold text-lg mr-4">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{testimonial.author}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
