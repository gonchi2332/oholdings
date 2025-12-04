import Badge from './Badge';
import CTAButtons from './CTAButtons';
import ProductCard from './ProductCard';

export default function Hero() {
    return (
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
                    <div className="lg:col-span-6 text-left mb-16 lg:mb-0">
                        <Badge />
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                            Build faster.<br />
                            Connect better.
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
                            A secure and intelligent intermediary system that connects clients with reliable information and automated intelligent agents.
                        </p>
                        <CTAButtons />
                    </div>
                    <div className="lg:col-span-6">
                        <ProductCard label="Platform Preview" />
                    </div>
                </div>
            </div>
        </section>
    )
}
