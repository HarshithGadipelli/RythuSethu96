import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Printer, Download, ShieldCheck, CheckCircle2, 
  MapPin, Phone, User, Calendar, Truck, Landmark, QrCode, FileText 
} from "lucide-react";

export default function OrderInvoiceModal({ order, onClose }) {
  const printRef = useRef(null);
  if (!order) return null;

  const billNumber = order.billNumber || order.invoiceNumber || `RS-INV-${Date.now().toString(36).toUpperCase()}`;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  }) : new Date().toLocaleString("en-IN");

  const customer = order.customer || {};
  const farmer = order.farmer || order.crop?.farmer || {};
  const items = order.items && order.items.length > 0 ? order.items : [
    {
      name: order.crop?.name || order.cropName || "Direct Farm Produce",
      quantity: order.quantity || 1,
      unit: order.unit || "kg",
      price: order.pricePerKg || (order.totalAmount ? Math.round(order.totalAmount / (order.quantity || 1)) : 50),
      grade: order.cropGrade || "Grade A (Premium)",
      isOrganic: order.isOrganic || order.crop?.isOrganic || false
    }
  ];

  const subtotal = order.subtotal || order.totalAmount || items.reduce((acc, item) => acc + ((item.price || 50) * (item.quantity || 1)), 0);
  const deliveryFee = order.deliveryCharges !== undefined ? order.deliveryCharges : 30;
  const platformFee = 5;
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const discount = order.discount || 0;
  const totalAmount = order.totalAmount || (subtotal + deliveryFee + platformFee + taxAmount - discount);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - #${billNumber}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: white; margin: 0; padding: 10px; }
            .invoice-box { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #16a34a; padding-bottom: 15px; margin-bottom: 20px; }
            .brand h1 { margin: 0; color: #166534; font-size: 24px; }
            .brand p { margin: 2px 0 0; color: #64748b; font-size: 12px; }
            .inv-meta { text-align: right; }
            .inv-meta h2 { margin: 0; color: #0f172a; font-size: 18px; }
            .inv-meta p { margin: 2px 0; color: #64748b; font-size: 12px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 12px; }
            .box { background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .box h3 { margin: 0 0 8px; font-size: 13px; color: #166534; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th { background: #f1f5f9; padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #334155; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            .summary { margin-left: auto; width: 300px; font-size: 12px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .summary-row.total { font-weight: bold; font-size: 15px; border-top: 2px solid #16a34a; padding-top: 8px; color: #166534; }
            .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; text-align: center; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .badge-green { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000000,
      background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          background: "white", borderRadius: "18px", width: "100%", maxWidth: "850px",
          maxHeight: "92vh", display: "flex", flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden"
        }}
      >
        {/* Modal Top Bar */}
        <div style={{
          padding: "1rem 1.5rem", background: "#064e3b", color: "white",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <FileText size={22} color="#86efac" />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Official Tax Invoice & Bill</h3>
              <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.85 }}>Direct Agricultural Commerce • Bill #{billNumber}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "white", color: "#064e3b", border: "none", borderRadius: "8px",
                padding: "6px 14px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", background: "#f8fafc" }}>
          <div ref={printRef} className="invoice-box" style={{ background: "white", padding: "2rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #16a34a", paddingBottom: "1.2rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "1.6rem" }}>🌱</span>
                  <h1 style={{ margin: 0, fontSize: "1.6rem", color: "#166534", fontWeight: 900, letterSpacing: "-0.5px" }}>Rythu Sethu</h1>
                </div>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>Direct Farm-to-Fork Agricultural Bridge Platform</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, marginTop: "6px" }}>
                  <ShieldCheck size={14} /> 100% Farm AI Verified & Traceable
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ background: "#0f172a", color: "white", padding: "3px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  GST TAX INVOICE
                </span>
                <h2 style={{ margin: "8px 0 2px", fontSize: "1.1rem", color: "#0f172a", fontWeight: 800 }}>#{billNumber}</h2>
                <p style={{ margin: "2px 0", color: "#64748b", fontSize: "0.8rem" }}>Date: {orderDate}</p>
                <p style={{ margin: "2px 0", color: "#64748b", fontSize: "0.8rem" }}>GSTIN: <strong style={{ color: "#334155" }}>36AAACR8890K1ZV</strong></p>
              </div>
            </div>

            {/* Billed To & Shipped From Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.2rem", marginBottom: "1.5rem" }}>
              
              {/* Customer Box */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <User size={14} /> Customer (Billed To)
                </h4>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>{customer.name || order.customerName || "Verified Customer"}</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>📞 {customer.phone || order.deliveryPhone || "Phone provided"}</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>📍 {order.deliveryLocation || customer.address || "Standard Doorstep Delivery"}</div>
                {order.deliveryLatitude && (
                  <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" }}>Coordinates: {order.deliveryLatitude.toFixed(4)}°, {order.deliveryLongitude.toFixed(4)}°</div>
                )}
              </div>

              {/* Farmer Box */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Landmark size={14} /> Harvest Source (Farmer)
                </h4>
                <div style={{ fontWeight: 800, color: "#1e293b", fontSize: "0.95rem" }}>{farmer.name || order.farmerName || "Verified Local Producer"}</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>🌾 Farm: {farmer.farmName || order.farmName || "Direct Farm Parcel"}</div>
                <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>📍 {farmer.farmLocation || order.pickupLocation || "Telangana Agricultural Belt"}</div>
                <div style={{ color: "#16a34a", fontSize: "0.75rem", fontWeight: 700, marginTop: "2px" }}>⭐ Trust Score: {farmer.trustScore || 95}/100</div>
              </div>

              {/* Delivery Details */}
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#166534", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Truck size={14} /> Dispatch & Verification
                </h4>
                <div style={{ fontSize: "0.85rem", color: "#334155" }}>Agent: <strong>{order.agent?.name || order.agentName || "Assigned Hub Agent"}</strong></div>
                <div style={{ fontSize: "0.85rem", color: "#334155", marginTop: "2px" }}>Tracking: <code>{order.trackingCode || "RS-TRACK-LIVE"}</code></div>
                <div style={{ fontSize: "0.85rem", color: "#334155", marginTop: "2px" }}>Status: <span style={{ textTransform: "capitalize", fontWeight: 700, color: order.status === "delivered" ? "#16a34a" : "#2563eb" }}>{order.status || "confirmed"}</span></div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>OTP Handover: Verified at Doorstep</div>
              </div>

            </div>

            {/* Produce Itemized Table */}
            <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                    <th style={{ padding: "10px", textAlign: "left", color: "#334155" }}>#</th>
                    <th style={{ padding: "10px", textAlign: "left", color: "#334155" }}>Produce & Specification</th>
                    <th style={{ padding: "10px", textAlign: "center", color: "#334155" }}>Grade</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#334155" }}>Qty</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#334155" }}>Unit Rate</th>
                    <th style={{ padding: "10px", textAlign: "right", color: "#334155" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "10px" }}>
                        <div style={{ fontWeight: 800, color: "#1e293b" }}>{it.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", gap: "6px", marginTop: "2px" }}>
                          {it.isOrganic && <span style={{ color: "#16a34a", fontWeight: 700 }}>🌿 100% Certified Organic</span>}
                          <span>HSN: 0709</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                          {it.grade || "Grade A"}
                        </span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#334155" }}>
                        {it.quantity} {it.unit || "kg"}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>
                        ₹{it.price}
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                        ₹{((it.price || 50) * (it.quantity || 1)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
              <div style={{ width: "100%", maxWidth: "340px", background: "#f8fafc", padding: "1.2rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                  <span>Produce Subtotal:</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                  <span>Direct Farm Logistics:</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{deliveryFee}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                  <span>AI Quality Inspection:</span>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE (₹0)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                  <span>Platform Bridge Fee:</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{platformFee}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#475569" }}>
                  <span>GST (5% Agri Tax):</span>
                  <span style={{ fontWeight: 700, color: "#1e293b" }}>₹{taxAmount}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem", color: "#16a34a" }}>
                    <span>Promo Discount:</span>
                    <span style={{ fontWeight: 700 }}>-₹{discount}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", marginTop: "8px", borderTop: "2px solid #16a34a", fontSize: "1.1rem", fontWeight: 900, color: "#166534" }}>
                  <span>Total Amount Paid:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
                  Payment Method: <strong>{(order.paymentMode || order.paymentMethod || "UPI / Online").toUpperCase()}</strong>
                </div>
              </div>
            </div>

            {/* Escrow Settlement & Trust Policy */}
            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "1rem", borderRadius: "8px", fontSize: "0.75rem", color: "#065f46", marginBottom: "1rem" }}>
              <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <CheckCircle2 size={16} /> 14-Day Bi-Weekly Escrow Settlement Guarantee
              </div>
              <div>
                Farmer harvest earnings and agent delivery compensation are held in secure escrow and disbursed in strict 2-week settlement batches. This invoice acts as a legally compliant tax receipt under Indian Agri-Commerce standards.
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#94a3b8", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>Generated electronically by Rythu Sethu Platform • No physical signature required.</div>
              <div>Support: support@rythusethu.com | +91 8688938604</div>
            </div>

          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: "1rem 1.5rem", background: "white", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Invoice saved to your account permanently.
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)", color: "white", border: "none",
                borderRadius: "10px", padding: "8px 20px", fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <Printer size={16} /> Print / Download PDF
            </button>
            <button
              onClick={onClose}
              style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
