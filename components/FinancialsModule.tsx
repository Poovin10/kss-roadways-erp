'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function FinancialsModule() {
  const [finSubTab, setFinSubTab] = useState("Trip Settlements");
  const [completedTrips, setCompletedTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [tripDetails, setTripDetails] = useState<any>(null);

  const supabase = createClient();

  const fetchCompletedTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*, vehicles(vehicle_number), drivers(full_name)')
      .eq('trip_status', 'COMPLETED')
      .order('trip_id', { ascending: false });
    
    if (data) setCompletedTrips(data);
  };

  useEffect(() => {
    fetchCompletedTrips();
  }, [supabase]);

  useEffect(() => {
    if (selectedTripId) {
      const found = completedTrips.find(t => t.trip_id.toString() === selectedTripId);
      setTripDetails(found || null);
    } else {
      setTripDetails(null);
    }
  }, [selectedTripId, completedTrips]);

  const handleMarkSettled = async () => {
    if (!selectedTripId) return;

    const { error } = await supabase
      .from('trips')
      .update({ settlement_status: 'SETTLED' })
      .eq('trip_id', Number(selectedTripId));

    if (error) {
      toast.error("Failed to update settlement", { description: error.message });
    } else {
      toast.success("Trip marked as settled successfully!");
      fetchCompletedTrips();
      setSelectedTripId("");
      setTripDetails(null);
    }
  };

  // Calculations for P&L
  const revenue = Number(tripDetails?.freight_revenue) || 0;
  const dieselCost = Number(tripDetails?.fuel_expense) || 0;
  const driverBata = Number(tripDetails?.driver_bata) || 0;
  const haltBata = Number(tripDetails?.halt_bata) || 0;
  const repairs = Number(tripDetails?.enroute_repairs_maintenance) || 0;
  const cashAdvance = Number(tripDetails?.cash_advance_issued) || 0;
  
  const totalExpenses = dieselCost + driverBata + haltBata + repairs;
  const netProfit = revenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {["Trip Settlements", "P&L Statement", "Ledger Audit"].map((sub) => (
          <button
            key={sub}
            onClick={() => setFinSubTab(sub)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              finSubTab === sub ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* TRIP SETTLEMENTS TAB */}
      {finSubTab === "Trip Settlements" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Select Completed LR</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Completed Trips*</label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full border rounded-md p-2 text-sm bg-white"
              >
                <option value="">-- SELECT TRIP LR --</option>
                {completedTrips.map(t => (
                  <option key={t.trip_id} value={t.trip_id}>
                    LR: {t.trip_number} | {t.vehicles?.vehicle_number} | POD: {t.pod_number || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {tripDetails && (
              <div className="space-y-2 pt-2 border-t text-xs text-slate-700">
                <p><b>Driver:</b> {tripDetails.drivers?.full_name}</p>
                <p><b>Route:</b> {tripDetails.origin} ➔ {tripDetails.destination}</p>
                <p><b>Tonnage:</b> {tripDetails.loaded_weight_mt} MT</p>
                <p><b>Status:</b> <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-bold">{tripDetails.settlement_status || 'PENDING'}</span></p>
              </div>
            )}

            {tripDetails && tripDetails.settlement_status !== 'SETTLED' && (
              <Button onClick={handleMarkSettled} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                ✅ Settle Trip & Clear Ledger
              </Button>
            )}
          </div>

          {/* Detailed P&L breakdown for selected trip */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Trip Financial Breakdown (P&L)</h3>
            
            {tripDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Revenues</h4>
                  <div className="flex justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm">
                    <span className="font-semibold text-emerald-900">Freight Revenue</span>
                    <span className="font-extrabold text-emerald-700">₹{revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Expenses</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 bg-slate-50 rounded"><span>Diesel Cost:</span> <span className="font-bold">₹{dieselCost}</span></div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded"><span>Driver Bata:</span> <span className="font-bold">₹{driverBata}</span></div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded"><span>Halt Bata:</span> <span className="font-bold">₹{haltBata}</span></div>
                    <div className="flex justify-between p-2 bg-slate-50 rounded"><span>Enroute Repairs:</span> <span className="font-bold">₹{repairs}</span></div>
                    <div className="flex justify-between p-2 bg-red-50 text-red-700 rounded font-bold"><span>Total Expenses:</span> <span>₹{totalExpenses}</span></div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t flex items-center justify-between bg-indigo-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-indigo-700 uppercase">Net Trip Profit / Loss</p>
                    <p className="text-xl font-extrabold text-indigo-900">₹{netProfit.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-600">Advance Issued: ₹{cashAdvance}</p>
                    <p className="text-xs font-bold text-slate-900">Balance Payable: ₹{Math.max(0, totalExpenses - cashAdvance)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-12 text-center">Select an active/completed trip LR from the left menu to view detailed calculations.</p>
            )}
          </div>
        </div>
      )}

      {/* P&L STATEMENT TAB */}
      {finSubTab === "P&L Statement" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Fleet Macro Profit & Loss Statement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-emerald-100 bg-emerald-50 rounded-lg p-4">
              <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Total Freight Revenue</p>
              <p className="text-2xl font-extrabold text-emerald-900">₹{completedTrips.reduce((acc, t) => acc + (Number(t.freight_revenue) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="border border-red-100 bg-red-50 rounded-lg p-4">
              <p className="text-xs font-bold text-red-700 uppercase mb-1">Total Operating Expenses</p>
              <p className="text-2xl font-extrabold text-red-900">₹{completedTrips.reduce((acc, t) => acc + (Number(t.fuel_expense) || 0) + (Number(t.driver_bata) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-4">
              <p className="text-xs font-bold text-indigo-700 uppercase mb-1">Total Net Earnings</p>
              <p className="text-2xl font-extrabold text-indigo-900">₹{completedTrips.reduce((acc, t) => acc + ((Number(t.freight_revenue) || 0) - ((Number(t.fuel_expense) || 0) + (Number(t.driver_bata) || 0))), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* LEDGER AUDIT TAB */}
      {finSubTab === "Ledger Audit" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Completed Trips Settlement Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr>
                  <th className="p-3">LR No</th>
                  <th className="p-3">POD No</th>
                  <th className="p-3">Truck</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTrips.map(t => (
                  <tr key={t.trip_id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{t.trip_number}</td>
                    <td className="p-3">{t.pod_number || '-'}</td>
                    <td className="p-3 font-bold">{t.vehicles?.vehicle_number}</td>
                    <td className="p-3">{t.drivers?.full_name}</td>
                    <td className="p-3 text-emerald-600 font-bold">₹{t.freight_revenue}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.settlement_status === 'SETTLED' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {t.settlement_status || 'PENDING'}
                      </span>
                    </td>
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