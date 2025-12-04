import { ExternalLink } from 'lucide-react';

const projects = [
    {
        id: 1,
        name: 'Minka Campaign',
        description: 'Plataforma de campañas digitales con gestión avanzada de eventos y marketing.',
        url: 'https://minka-gamma.vercel.app/campaign'
    },
    {
        id: 2,
        name: 'ATLE Bolivia',
        description: 'Sitio web corporativo para ATLE Bolivia, mostrando servicios y soluciones empresariales.',
        url: 'https://atlebolivia.net/'
    },
    {
        id: 3,
        name: 'Eventos ATLE',
        description: 'Plataforma especializada en gestión y organización de eventos de la Federacion Atletica de Bolivia.',
        url: 'https://www.eventos.atlebolivia.net'
    }
];

export default function Projects() {
    if (projects.length === 0) {
        return null; // Don't render if no projects
    }

    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Nuestros Proyectos
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Descubre algunos de los proyectos en los que hemos trabajado.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((project) => (
                        <a
                            key={project.id}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-gray-100 group"
                        >
                            {project.image && (
                                <div className="mb-6 rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-mineral-green/10 to-mineral-green/5">
                                    <img 
                                        src={project.image} 
                                        alt={project.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-mineral-green transition-colors">
                                    {project.name}
                                </h3>
                                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-mineral-green transition-colors flex-shrink-0 ml-2" />
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                {project.description}
                            </p>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

