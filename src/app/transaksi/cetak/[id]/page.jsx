"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { calculateFinancials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function CetakInvoicePage() {
  const params = useParams();
  const { id } = params;

  const [tx, setTx] = useState(null);
  const [calcs, setCalcs] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      async function fetchTx() {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/transaksi/${id}`);
          if (!res.ok) throw new Error("Gagal ambil data transaksi");
          const data = await res.json();
          setTx(data);
          setCalcs(calculateFinancials(data));
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
      fetchTx();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!tx) {
    return <div className="p-10">Data transaksi tidak ditemukan.</div>;
  }

  return (
    <>
      <div
        id="print-controls"
        className="sticky top-0 z-10 bg-gray-100 p-4 text-center print:hidden"
      >
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Cetak Invoice Ini
        </Button>
      </div>

      <div className="invoice-box w-full max-w-3xl mx-auto p-8 bg-white border rounded-lg shadow-lg my-8">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold">INVOICE</h1>
            <p className="text-gray-500">Invoice #: {tx.invoice_code}</p>
            <p className="text-gray-500">
              Tanggal Booking: {formatDate(tx.booking_date)}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">REBORN LOMBOK MANDIRI</h2>
            <p className="text-gray-600">
              Jl. Dukuh salah no 17, pejeruk, ampenan, mataram, lombok
            </p>
            <p className="text-gray-600">087741861681/085353818685</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="font-semibold text-gray-700">Ditagih Kepada:</h3>
            <p>{tx.customer_name}</p>
            <p>{tx.customer_phone}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold text-gray-700">Detail Perjalanan:</h3>
            <p>
              <strong>Armada:</strong> {tx.armada?.license_plate} (
              {tx.armada?.model})
            </p>
            <p>
              <strong>Sopir:</strong> {tx.driver?.driver_name}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p>
              <strong>Mobil Out:</strong> {formatDate(tx.checkout_datetime)}
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Mobil In:</strong> {formatDate(tx.checkin_datetime)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 font-semibold">Deskripsi</th>
                <th className="p-2 text-right font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">
                  Tarif Sewa ({tx.package?.name || "Kustom"})
                </td>
                <td className="p-2 text-right">
                  {formatCurrency(tx.all_in_rate)}
                </td>
              </tr>
              {calcs.lamaOvertimeJam > 0 && (
                <tr className="border-b">
                  <td className="p-2">
                    Overtime ({calcs.lamaOvertimeJam} Jam @{" "}
                    {formatCurrency(tx.overtime_rate_per_hour)})
                  </td>
                  <td className="p-2 text-right">
                    {formatCurrency(
                      calcs.lamaOvertimeJam * tx.overtime_rate_per_hour
                    )}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="p-2 text-right">Total Tagihan:</td>
                <td className="p-2 text-right text-xl">
                  {formatCurrency(calcs.totalPendapatan)}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-right">Status Pembayaran:</td>
                <td className="p-2 text-right">
                  <Badge
                    variant={
                      tx.payment_status === "PAID"
                        ? "success"
                        : tx.payment_status === "DOWN_PAYMENT"
                        ? "warning"
                        : "destructive"
                    }
                    className="text-lg"
                  >
                    {tx.payment_status}
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-gray-500 text-sm">
          <p>Terima kasih telah menggunakan jasa kami.</p>
          <p>
            Info Rekening: Bank Mandiri - 123456789 a.n. Reborn Lombok Mandiri
          </p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-controls,
          #print-controls * {
            display: none !important;
          }
          .invoice-box,
          .invoice-box * {
            visibility: visible;
          }
          .invoice-box {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}
