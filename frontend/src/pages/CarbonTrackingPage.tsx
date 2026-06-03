import { useState, useEffect } from 'react';
import { Leaf, TrendingDown, Fuel, Route } from 'lucide-react';
import api from '@/lib/api';

export default function CarbonTrackingPage() {
  const [stats, setStats] = useState({ trips: 0, fuelL: 0, co2_kg: 0, trees: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/tenant/trips/').then(r => Array.isArray(r.data) ? r.data : []),
      api.get('/api/tenant/fuel-logs/').then(r => Array.isArray(r.data) ? r.data : []),
    ]).then(([trips, fuelLogs]) => {
      const tripCount = trips.length;
      const fuelLitres = fuelLogs.reduce((sum: number, f: any) => sum + (f.miktar_litre || 0), 0);
      const co2 = fuelLitres * 2.68; // 1 L diesel = 2.68 kg CO2
      const trees = Math.round(co2 / 21); // 1 tree absorbs ~21 kg CO2/year

      setStats({ trips: tripCount, fuelL: Math.round(fuelLitres), co2_kg: Math.round(co2), trees });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-lg font-semibold">Karbon Ayak İzi</h2>
      {loading ? (
        <div className="text-center py-12 text-[#8a8f98]">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl p-5 text-center">
            <Route size={32} className="text-[#3b82f6] mx-auto mb-2" />
            <p className="text-3xl font-bold text-[#f7f8f8]">{stats.trips}</p>
            <p className="text-sm text-[#8a8f98]">Toplam Sefer</p>
          </div>
          <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl p-5 text-center">
            <Fuel size={32} className="text-[#FF5F03] mx-auto mb-2" />
            <p className="text-3xl font-bold text-[#f7f8f8]">{stats.fuelL.toLocaleString('tr')}</p>
            <p className="text-sm text-[#8a8f98]">Litre Yakıt</p>
          </div>
          <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl p-5 text-center">
            <Leaf size={32} className="text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-600">{stats.co2_kg.toLocaleString('tr')} kg</p>
            <p className="text-sm text-[#8a8f98]">Toplam CO₂ Emisyonu</p>
          </div>
          <div className="bg-white border border-[rgba(255,255,255,0.08)] rounded-xl p-5 text-center">
            <TrendingDown size={32} className="text-green-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-600">{stats.trees}</p>
            <p className="text-sm text-[#8a8f98]">Dengelenmesi Gereken Ağaç</p>
          </div>
        </div>
      )}
    </div>
  );
}
