'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function WorkshopModule() {
  const [workSubTab, setWorkSubTab] = useState("Tyre Management");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [tyres, setTyres] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  // Tyre Form State
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [brandModel, setBrandModel] = useState("");
  const [position, setPosition] = useState("FRONT_LEFT");
  const [condition, setCondition] = useState("NEW");
  const [nsd, setNsd] = useState("");

  // Spares Bill Form State
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorName, setVendorName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [spareDetails, setSpareDetails] = useState("");
  const [billAmount, setBillAmount] = useState("");

  const supabase = createClient();

  const fetchData = async () => {
    const { data: v } = await supabase.from('vehicles').select('*').order('vehicle_number');
    const { data: t } = await supabase.from('fleet_tyres').select('*, vehicles(vehicle_number)').order('recorded_date', { ascending: false });
    const { data: b } = await supabase.from('workshop_spares_bills').select('*, vehicles(vehicle_number)').order('bill_date', { ascending: false });

    if (v) setVehicles(v);
    if (t) setTyres(t);
    if (b) setBills(b);
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const handleAddTyre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !serialNo) {
      toast.error("Please select a vehicle and enter the tyre serial number.");
      return;
    }

    const { error } = await supabase.from('fleet_tyres').insert([
      {
        vehicle_id: Number(selectedVehicle),
        serial_number: serialNo.trim().toUpperCase(),
        brand_model: brandModel.trim(),
        placement_position: position,
        condition_status: condition,
        nsd_measurement: Number(nsd) || 15.0,
      }
    ]);

    if (error) {
      toast.error("Failed to add tyre", { description: error.message });
    } else {
      toast.success("Tyre registered successfully!");
      setSerialNo("");
      setBrandModel("");
      setNsd("");
      fetchData();
    }
  };

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !billAmount) {
      toast.error("Please select a vehicle and enter the bill amount.");
      return;
    }

    const { error } = await supabase.from('workshop_spares_bills').insert([
      {
        vehicle_id: Number(selectedVehicle),
        bill_date: billDate,
        vendor_name: vendorName.trim(),
        invoice_number: invoiceNo.trim().toUpperCase(),
        spare_parts_details: spareDetails.trim(),
        total_bill_amount: Number(billAmount) || 0,
      }
    ]);

    if (error) {
      toast.error("Failed to save spares bill", { description: error.message });
    } else {
      toast.success("Workshop bill logged successfully!");
      setVendorName("");
      setInvoiceNo("");
      setSpareDetails("");
      setBillAmount("");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-menu Navigation */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
        {["Tyre Management", "Spares & Service Bills"].map((sub) => (
          <button
            key={sub}
            onClick={() => setWorkSubTab(sub)}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              workSubTab === sub ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* TYRE MANAGEMENT TAB */}
      {workSubTab === "Tyre Management" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTyre} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Register / Mount Tyre</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Truck*</label>
              <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white" required>
                <option value="">-- SELECT TRUCK --</option>
                {vehicles.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} [{v.truck_type}]</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Serial Number*</label>
                <input type="text" placeholder="Tyre Serial No" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Brand / Model</label>
                <input type="text" placeholder="e.g. MRF / Apollo" value={brandModel} onChange={(e) => setBrandModel(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Placement Position</label>
                <select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                  <option value="FRONT_LEFT">FRONT_LEFT</option>
                  <option value="FRONT_RIGHT">FRONT_RIGHT</option>
                  <option value="REAR_AXLE_1_LEFT">REAR_AXLE_1_LEFT</option>
                  <option value="REAR_AXLE_1_RIGHT">REAR_AXLE_1_RIGHT</option>
                  <option value="STEPNEY">STEPNEY</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full border rounded-md p-2 text-sm bg-white">
                  <option value="NEW">NEW</option>
                  <option value="GOOD">GOOD</option>
                  <option value="WORN_OUT">WORN_OUT</option>
                  <option value="FOR_RETREAD">FOR_RETREAD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">NSD (Non-Skid Depth mm)</label>
              <input type="number" step="0.1" placeholder="15.0" value={nsd} onChange={(e) => setNsd(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Mount & Register Tyre</Button>
          </form>

          {/* Tyre Inventory Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Active Fleet Tyres ({tyres.length})</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Serial No</th><th className="p-2">Truck</th><th className="p-2">Position</th><th className="p-2">Condition</th><th className="p-2">NSD</th></tr>
              </thead>
              <tbody>
                {tyres.map(t => (
                  <tr key={t.tyre_id} className="border-b">
                    <td className="p-2 font-bold text-slate-900">{t.serial_number}</td>
                    <td className="p-2">{t.vehicles?.vehicle_number}</td>
                    <td className="p-2 text-xs">{t.placement_position}</td>
                    <td className="p-2"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-semibold">{t.condition_status}</span></td>
                    <td className="p-2 font-bold">{t.nsd_measurement} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SPARES & SERVICE BILLS TAB */}
      {workSubTab === "Spares & Service Bills" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddBill} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Log Workshop Spares Bill</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Bill Date*</label>
                <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
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
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vendor Name</label>
                <input type="text" placeholder="Spare Parts Shop" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Invoice Number</label>
                <input type="text" placeholder="INV-001" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Spare Parts Details</label>
              <input type="text" placeholder="e.g. Brake linings, Oil filters, Leaf springs" value={spareDetails} onChange={(e) => setSpareDetails(e.target.value)} className="w-full border rounded-md p-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Total Bill Amount (₹)*</label>
              <input type="number" placeholder="0.00" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-full border rounded-md p-2 text-sm" required />
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Save Workshop Bill</Button>
          </form>

          {/* Bills Audit Sidebar */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2 mb-4">Workshop Bills Audit</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase text-slate-700 font-bold">
                <tr><th className="p-2">Date</th><th className="p-2">Truck</th><th className="p-2">Details</th><th className="p-2">Amount</th></tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.bill_id} className="border-b">
                    <td className="p-2">{b.bill_date}</td>
                    <td className="p-2 font-bold text-slate-900">{b.vehicles?.vehicle_number}</td>
                    <td className="p-2 text-xs truncate max-w-[150px]">{b.spare_parts_details || '-'}</td>
                    <td className="p-2 text-red-600 font-bold">₹{b.total_bill_amount}</td>
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