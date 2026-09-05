'use client';

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function PodClosure({ onSuccess }: { onSuccess: () => void }) {
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [podNumber, setPodNumber] = useState("");
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalKm, setFinalKm] = useState("");
  const [unloadedWt, setUnloadedWt] = useState("");
  const [haltBata, setHaltBata] = useState("");
  const [claims, setClaims] = useState("");
  const [fuelLitres, setFuelLitres] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchActiveTrips() {
      const { data } = await supabase
        .from('trips')
        .select('*, vehicles(vehicle_number), drivers(full_name)')
        .neq('trip_status', 'COMPLETED')
        .order('trip_id', { ascending: false });
      
      if (data) setActiveTrips(data);
    }
    fetchActiveTrips();
  }, [supabase]);

  const handleSettlePOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || !podNumber) {
      toast.error("Please select an active trip and provide a POD number.");
      return;
    }

    setLoading(true);
    try {
      const targetTrip = activeTrips.find(t => t.trip_id.toString() === selectedTripId);
      
      // 1. Update trip status to COMPLETED
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          pod_number: podNumber.trim().toUpperCase(),
          trip_end_date: closingDate,
          end_km: Number(finalKm) || 0,
          unloaded_weight_mt: Number(unloadedWt) || targetTrip?.loaded_weight_mt || 0,
          halt_bata: Number(haltBata) || 0,
          enroute_repairs_maintenance: Number(claims) || 0,
          fuel_litres: (Number(targetTrip?.fuel_litres) || 0) + (Number(fuelLitres) || 0),
          trip_status: 'COMPLETED',
          trip_closed_at: new Date().toISOString(),
        })
        .eq('trip_id', targetTrip.trip_id);

      if (updateError) throw updateError;

      // 2. Set vehicle back to available
      await supabase
        .from('vehicles')
        .update({ current_status: 'AVAILABLE_FOR_LOAD', status_remarks: 'Available' })
        .eq('vehicle_id', targetTrip.vehicle_id);

      toast.success("POD settled successfully!", { description: `Trip ${targetTrip.trip_number} closed.` });
      setSelectedTripId("");
      setPodNumber("");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to settle POD", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* POD Form */}
      <form onSubmit={handleSettlePOD} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Record POD & Settle Trip</h3>
        
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Active LR / Trip</label>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            required
          >
            <option value="">-- SELECT ACTIVE LR --</option>
            {activeTrips.map((t) => (
              <option key={t.trip_id} value={t.trip_id}>
                LR: {t.trip_number} | Truck: {t.vehicles?.vehicle_number} | Dest: {t.destination}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">POD Number</label>
            <input
              type="text"
              required
              placeholder="Enter POD No"
              value={podNumber}
              onChange={(e) => setPodNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Closing Date</label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Closing KM</label>
            <input
              type="number"
              placeholder="0.0"
              value={finalKm}
              onChange={(e) => setFinalKm(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Unloaded MT</label>
            <input
              type="number"
              placeholder="0.0"
              value={unloadedWt}
              onChange={(e) => setUnloadedWt(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Halt Bata (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              value={haltBata}
              onChange={(e) => setHaltBata(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Claims / Repairs (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              value={claims}
              onChange={(e) => setClaims(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Closing Top-up Diesel (L)</label>
          <input
            type="number"
            placeholder="0.0"
            value={fuelLitres}
            onChange={(e) => setFuelLitres(e.target.value)}
            className="w-full border border-slate-300 rounded-md p-2 text-sm"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          {loading ? "Settling POD..." : "✅ Settle POD & Close Trip"}
        </Button>
      </form>

      {/* Pending List Sidebar */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-red-900 uppercase">Pending POD List ({activeTrips.length})</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activeTrips.map((t) => (
            <div key={t.trip_id} className="bg-white border border-red-200 rounded-lg p-3 text-xs space-y-1 shadow-sm">
              <p className="font-extrabold text-slate-900">LR: {t.trip_number}</p>
              <p className="text-slate-600">Truck: <b>{t.vehicles?.vehicle_number}</b></p>
              <p className="text-slate-600">Destination: <b>{t.destination}</b></p>
            </div>
          ))}
          {activeTrips.length === 0 && <p className="text-xs text-slate-500">All PODs are settled.</p>}
        </div>
      </div>
    </div>
  );
}