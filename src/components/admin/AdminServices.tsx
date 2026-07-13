import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { 
  Compass, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Layers, 
  Tag
} from 'lucide-react';

interface Service {
  id: number;
  name: string;
  description: string | null;
  category: string;
}

interface Package {
  id: number;
  name: string;
}

interface PackageService {
  package_id: number;
  service_id: number;
}

export const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageServices, setPackageServices] = useState<PackageService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [servicesRes, packagesRes, psRes] = await Promise.all([
        apiFetch<Service[]>('/api/services'),
        apiFetch<Package[]>('/api/packages'),
        apiFetch<PackageService[]>('/api/package_services')
      ]);

      setServices(servicesRes.data || []);
      setPackages(packagesRes.data || []);
      setPackageServices(psRes.data || []);
    } catch (err) {
      console.error('Failed to load services data:', err);
      setError('Could not fetch services or package associations.');
    } finally {
      setLoading(false);
    }
  };

  const getServicePackages = (serviceId: number) => {
    const matchingAssociations = packageServices.filter(ps => ps.service_id === serviceId);
    return matchingAssociations.map(assoc => {
      const pkg = packages.find(p => p.id === assoc.package_id);
      return pkg ? pkg.name : null;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h3 className="text-xl font-bold text-black/80">Services Catalogus</h3>
        <p className="text-xs text-black/40 font-medium mt-1">
          Bekijk alle beschikbare diensten en zie aan welke abonnementsvormen (packages) deze zijn gekoppeld.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const servicePackages = getServicePackages(service.id);
          return (
            <div key={service.id} className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-0.5 bg-black/5 text-black/50 border border-black/5 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Tag size={10} />
                    {service.category || 'Algemeen'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-black/80 mb-2">{service.name}</h4>
                <p className="text-black/40 text-xs font-semibold leading-relaxed mb-6">
                  {service.description || 'Geen uitgebreide omschrijving beschikbaar.'}
                </p>
              </div>

              {/* Package Connections */}
              <div className="border-t border-black/5 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Inbegrepen in Packages</p>
                <div className="flex flex-wrap gap-1.5">
                  {servicePackages.map((pkgName, i) => (
                    <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md text-[9px] font-bold uppercase tracking-wider">
                      {pkgName}
                    </span>
                  ))}
                  {servicePackages.length === 0 && (
                    <span className="text-[10px] text-black/30 font-medium italic">Niet gekoppeld aan een actieve package</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {services.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-black/5 text-center text-black/40 font-medium">
            Er zijn nog geen services geconfigureerd in de database.
          </div>
        )}
      </div>
    </div>
  );
};
