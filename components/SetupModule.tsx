'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SetupModule() {
  const [setupSubTab, setSetupSubTab] = useState("Trucks");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  // Form States
  const [truckNo, setTruckNo] = useState("");
  const [truckVariant, setTruckVariant] = useState("Bulker (16-Wheel)");
  const [capacity, setCapacity] = useState("35");
  const [odoWorking, setOdoWorking] = useState(true);

  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");

  const [originSource, setOriginSource] = useState("COCHIN");
  const [destName, setDestName] = useState("");
  const [cargoType, setCargoType] = useState("BULK");
  const [freightRate, setFreightRate] = useState("");
  const [stdKm, setStdKm] = useState("");

  const supabase = createClient();

  const fetchMasterData = async () => {
    const { data: v } = await supabase.from('vehicles').select('*').order('vehicle_number');
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    const { data: r } = await supabase.from('destinations_freight_master').select('*').order('destination_name');
    if (v) setVehicles(v);
    if (d) setDrivers(d);
    if (r) setRoutes(r);
  };

  useEffect(() => {
    fetchMasterData();
  }, [supabase]);

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckNo) { toast.error("Truck number is required."); return; }

    const { error } = await supabase.from('vehicles').insert([
      {
        vehicle_number: truckNo.trim().toUpperCase(),
        truck_type: truckVariant,
        carrying_capacity_tons: Number(capacity),
        current_status: 'AVAILABLE_FOR_LOAD',
        odometer_working: odoWorking,
        is_active: true
      }
    ]);

    if (error) { toast.error("Error adding truck", { description: error.message }); } 
    else {
      toast.success("Truck registered successfully!");
      setTruckNo("");
      fetchMasterData();
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone) { toast.error("Name and phone are required."); return; }

    const driverCode = `DRV-${drivers.length + 101}`;
    const { error } = await supabase.from('drivers').insert([
      {
        driver_code: driverCode,
        full_name: driverName.trim(),
        phone_number: driverPhone.trim(),
        license_number: driverLicense.trim().toUpperCase(),
        branch_id: 1,
        is_active: true
      }
    ]);

    if (error) { toast.error("Error adding driver", { description: error.message }); } 
    else {
      toast.success("Driver registered successfully!");
      setDriverName("");
      setDriverPhone("");
      setDriverLicense("");
      fetchMasterData();
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destName || !freightRate) { toast.error("Destination and rate are required."); return; }

    const { error } = await supabase.from('destinations_freight_master').insert([
      {
        cargo_type: cargoType,
        origin: originSource,
        destination_name: destName.trim().toUpperCase(),
        capacity_tons: Number(capacity),
        freight_rate_per_ton: Number(freightRate),
        standard_km: Number(stdKm) || 0,
        is_active: true
      }
    ]);

    if (error) { toast.error("Error adding rate slab", { description: error.message }); } 
    else {
      toast.success("Rate slab saved successfully!");
      setDestName("");
      setFreightRate("");
      setStdKm("");
      fetchMasterData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-menu tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {["Trucks", "Drivers", "Rate Slabs"].map((sub) => (
          <button
            key={sub}
            onClick={() => setSetupSubTab(sub)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              setupSubTab === sub ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* TRUCKS SETUP */}
      {setupSubTab === "Trucks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTruck} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Register New Truck</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Truck Number*</label>
              <input type="text" placeholder="e.g. KL43E3617" value={truckNo} onChange={(e) => setTruckNo(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Variant</label>
              <select value={truckVariant} onChange={(e) => setTruckVariant(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                <option value="Bulker (16-Wheel)">Bulker (16-Wheel)</option>
                <option value="Bulker (14-Wheel)">Bulker (14-Wheel)</option>
                <option value="Body Truck">Body Truck</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Capacity (MT)</label>
              <select value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                <option value="25">25 MT</option>
                <option value="30">30 MT</option>
                <option value="35">35 MT</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={odoWorking} onChange={(e) => setOdoWorking(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-semibold text-slate-700">Odometer Working</span>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Truck</Button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Existing Fleet ({vehicles.length})</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">No</th><th className="p-2">Variant</th><th className="p-2">Capacity</th><th className="p-2">Status</th></tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.vehicle_id} className="border-b">
                    <td className="p-2 font-bold text-slate-900">{v.vehicle_number}</td>
                    <td className="p-2">{v.truck_type}</td>
                    <td className="p-2">{v.carrying_capacity_tons} MT</td>
                    <td className="p-2"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-semibold">{v.current_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRIVERS SETUP */}
      {setupSubTab === "Drivers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddDriver} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Register Driver</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name*</label>
              <input type="text" placeholder="Enter driver name" value={driverName} onChange={(e) => setDriverName(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number*</label>
              <input type="text" placeholder="10-digit mobile" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">License No</label>
              <input type="text" placeholder="License ID" value={driverLicense} onChange={(e) => setDriverLicense(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Driver</Button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Active Drivers ({drivers.length})</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Phone</th><th className="p-2">License</th></tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.driver_id} className="border-b">
                    <td className="p-2 font-bold text-slate-900">{d.driver_code}</td>
                    <td className="p-2">{d.full_name}</td>
                    <td className="p-2">{d.phone_number}</td>
                    <td className="p-2">{d.license_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RATE SLABS SETUP */}
      {setupSubTab === "Rate Slabs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddRoute} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Add Freight Rate Slab</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cargo Type</label>
              <select value={cargoType} onChange={(e) => setCargoType(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                <option value="BULK">BULK</option>
                <option value="BAG">BAG</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Origin Source</label>
              <select value={originSource} onChange={(e) => setOriginSource(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                <option value="COCHIN">COCHIN</option>
                <option value="POTTANERI">POTTANERI</option>
                <option value="METTUR">METTUR</option>
                <option value="UDUPPI">UDUPPI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Destination Name*</label>
              <input type="text" placeholder="e.g. PARAMATHI VELUR" value={destName} onChange={(e) => setDestName(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Rate/MT (₹)*</label>
                <input type="number" placeholder="0.00" value={freightRate} onChange={(e) => setFreightRate(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Std KM</label>
                <input type="number" placeholder="0" value={stdKm} onChange={(e) => setStdKm(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Rate Slab</Button>
          </form>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Destination Slabs ({routes.length})</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Route</th><th className="p-2">Cargo</th><th className="p-2">Rate/MT</th><th className="p-2">Std KM</th></tr>
              </thead>
              <tbody>
                {routes.map(r => (
                  <tr key={r.route_id || r.destination_id} className="border-b">
                    <td className="p-2 font-bold text-slate-900">{r.origin} ➔ {r.destination_name}</td>
                    <td className="p-2">{r.cargo_type}</td>
                    <td className="p-2 text-indigo-600 font-bold">₹{r.freight_rate_per_ton}</td>
                    <td className="p-2">{r.standard_km} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}