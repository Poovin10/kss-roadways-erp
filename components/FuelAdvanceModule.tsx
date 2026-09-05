'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function FuelAdvanceModule() {
  const [faSubTab, setFaSubTab] = useState("Issue Diesel");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);

  // Diesel Form State
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [dieselCategory, setDieselCategory] = useState("TRIP_DIESEL");
  const [lrNumber, setLrNumber] = useState("");
  const [fillingOdo, setFillingOdo] = useState("");
  const [litresFilled, setLitresFilled] = useState("");
  const [isTankFull, setIsTankFull] = useState(false);

  // Advance Form State
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advType, setAdvType] = useState("BATA_ADVANCE");
  const [advRemarks, setAdvRemarks] = useState("");

  const supabase = createClient();

  const fetchData = async () => {
    const { data: v } = await supabase.from('vehicles').select('*').order('vehicle_number');
    const { data: d } = await supabase.from('drivers').select('*').order('full_name');
    const { data: f } = await supabase.from('diesel_fuel_logs').select('*, vehicles(vehicle_number)').order('fuel_date', { ascending: false }).limit(50);
    const { data: a } = await supabase.from('driver_direct_advances').select('*, drivers(driver_code, full_name)').order('advance_date', { ascending: false }).limit(50);

    if (v) setVehicles(v);
    if (d) setDrivers(d);
    if (f) setFuelLogs(f);
    if (a) setAdvances(a);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleIssueDiesel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !litresFilled) {
      toast.error("Please select a vehicle and enter litres filled.");
      return;
    }

    const litres = Number(litresFilled) || 0;
    const rate = 95.0; // Standard diesel rate per litre
    const totalCost = litres * rate;

    const { error } = await supabase.from('diesel_fuel_logs').insert([
      {
        fuel_date: fuelDate,
        vehicle_id: Number(selectedVehicle),
        diesel_category: dieselCategory,
        lr_number: lrNumber.trim().toUpperCase() || "SUNDRY",
        filling_odometer_km: Number(fillingOdo) || 0,
        litres_filled: litres,
        diesel_rate_per_litre: rate,
        total_fuel_cost: totalCost,
        is_tank_full: isTankFull,
      }
    ]);

    if (error) {
      toast.error("Failed to record diesel entry", { description: error.message });
    } else {
      toast.success("Diesel entry recorded successfully!");
      setLitresFilled("");
      setFillingOdo("");
      setLrNumber("");
      setIsTankFull(false);
      fetchData();
    }
  };

  const handleIssueAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !advAmount) {
      toast.error("Please select a driver and enter an amount.");
      return;
    }

    const amount = Number(advAmount) || 0;
    const { error } = await supabase.from('driver_direct_advances').insert([
      {
        advance_date: advDate,
        driver_id: Number(selectedDriver),
        amount_inr: amount,
        advance_type: advType,
        reference_remarks: advRemarks.trim(),
        is_settled: false,
      }
    ]);

    if (error) {
      toast.error("Failed to record advance", { description: error.message });
    } else {
      toast.success("Direct cash advance issued successfully!");
      setAdvAmount("");
      setAdvRemarks("");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {["Issue Diesel", "Driver Advances", "Fuel Audit"].map((sub) => (
          <button
            key={sub}
            onClick={() => setFaSubTab(sub)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              faSubTab === sub ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* ISSUE DIESEL TAB */}
      {faSubTab === "Issue Diesel" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleIssueDiesel} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Record Fuel Bill</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Fuel Date*</label>
                <input type="date" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Truck*</label>
                <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white" required>
                  <option value="">-- SELECT TRUCK --</option>
                  {vehicles.map(v => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} [{v.truck_type}]</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category*</label>
                <select value={dieselCategory} onChange={(e) => setDieselCategory(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                  <option value="TRIP_DIESEL">TRIP_DIESEL</option>
                  <option value="SUNDRY_DIESEL">SUNDRY_DIESEL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Trip LR No (Optional)</label>
                <input type="text" placeholder="e.g. LR-9841" value={lrNumber} onChange={(e) => setLrNumber(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Filling KM</label>
                <input type="number" placeholder="0" value={fillingOdo} onChange={(e) => setFillingOdo(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Litres Filled*</label>
                <input type="number" step="0.1" placeholder="0.0" value={litresFilled} onChange={(e) => setLitresFilled(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="tankFull" checked={isTankFull} onChange={(e) => setIsTankFull(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <label htmlFor="tankFull" className="text-sm font-semibold text-slate-700">Mark Tank Full</label>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Record Diesel Entry</Button>
          </form>

          {/* Recent Entries Sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Recent Fuel Entries</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Date</th><th className="p-2">Truck</th><th className="p-2">Litres</th><th className="p-2">Cost (₹)</th></tr>
              </thead>
              <tbody>
                {fuelLogs.map(f => (
                  <tr key={f.fuel_log_id} className="border-b">
                    <td className="p-2">{f.fuel_date ? f.fuel_date.split('T')[0] : ''}</td>
                    <td className="p-2 font-bold text-slate-900">{f.vehicles?.vehicle_number}</td>
                    <td className="p-2">{f.litres_filled} L</td>
                    <td className="p-2 text-indigo-600 font-bold">₹{f.total_fuel_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DRIVER ADVANCES TAB */}
      {faSubTab === "Driver Advances" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleIssueAdvance} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Direct Cash Advance</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Advance Date*</label>
                <input type="date" value={advDate} onChange={(e) => setAdvDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Driver Account*</label>
                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white" required>
                  <option value="">-- SELECT DRIVER --</option>
                  {drivers.map(d => (
                    <option key={d.driver_id} value={d.driver_id}>{d.driver_code} - {d.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Amount (₹)*</label>
                <input type="number" placeholder="0.00" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
                <select value={advType} onChange={(e) => setAdvType(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                  <option value="BATA_ADVANCE">BATA_ADVANCE</option>
                  <option value="GENERAL_ADVANCE">GENERAL_ADVANCE</option>
                  <option value="EMERGENCY_MEDICAL">EMERGENCY_MEDICAL</option>
                  <option value="SALARY_ADVANCE">SALARY_ADVANCE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reference Remarks</label>
              <input type="text" placeholder="Optional notes" value={advRemarks} onChange={(e) => setAdvRemarks(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Issue Cash Advance</Button>
          </form>

          {/* Advance History Sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Advance History</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Date</th><th className="p-2">Driver</th><th className="p-2">Amount</th><th className="p-2">Type</th></tr>
              </thead>
              <tbody>
                {advances.map(a => (
                  <tr key={a.advance_id} className="border-b">
                    <td className="p-2">{a.advance_date ? a.advance_date.split('T')[0] : ''}</td>
                    <td className="p-2 font-bold text-slate-900">{a.drivers?.full_name}</td>
                    <td className="p-2 text-indigo-600 font-bold">₹{a.amount_inr}</td>
                    <td className="p-2 text-xs">{a.advance_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FUEL AUDIT TAB */}
      {faSubTab === "Fuel Audit" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Comprehensive Fuel Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr>
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Truck</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">LR No</th>
                  <th className="p-3">Litres</th>
                  <th className="p-3">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map(f => (
                  <tr key={f.fuel_log_id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">#{f.fuel_log_id}</td>
                    <td className="p-3">{f.fuel_date ? f.fuel_date.split('T')[0] : ''}</td>
                    <td className="p-3 font-bold">{f.vehicles?.vehicle_number}</td>
                    <td className="p-3">{f.diesel_category}</td>
                    <td className="p-3">{f.lr_number}</td>
                    <td className="p-3">{f.litres_filled} L</td>
                    <td className="p-3 text-indigo-600 font-bold">₹{f.total_fuel_cost}</td>
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