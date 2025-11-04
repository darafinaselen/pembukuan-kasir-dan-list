"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Pencil,
  Trash,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Wallet,
  Calendar,
  Building,
} from "lucide-react";

export default function StaffCard({ staff, onEdit, onDelete }) {
  const status = staff.status || "ACTIVE";

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card
      key={staff.id}
      className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden flex flex-col"
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="relative">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                <User className="h-7 w-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 wrap-break-word">
                {staff.staff_name}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={`border-0 ${
                    status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : status === "INACTIVE"
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : status === "ON_LEAVE"
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {status === "ACTIVE"
                    ? "Aktif"
                    : status === "INACTIVE"
                      ? "Tidak Aktif"
                      : status === "ON_LEAVE"
                        ? "Cuti"
                        : "Resign"}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700 bg-blue-50"
                >
                  {staff.position}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4 flex-1">
        {staff.nik && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <CreditCard className="h-4 w-4 text-gray-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">NIK</p>
              <p className="text-gray-900 wrap-break-word">{staff.nik}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
          <Phone className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-600">No. HP</p>
            <p className="text-blue-900 wrap-break-word">
              {staff.phone_number ?? "-"}
            </p>
          </div>
        </div>

        {staff.email && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Mail className="h-4 w-4 text-gray-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-gray-900 wrap-break-word text-sm">
                {staff.email}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-lg border border-green-100">
          <Wallet className="h-4 w-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-green-600">Gaji Pokok</p>
            <p className="text-green-900 font-semibold">
              {formatCurrency(staff.salary_amount)}
            </p>
            {staff.allowances > 0 && (
              <p className="text-xs text-green-600 mt-0.5">
                + Tunjangan: {formatCurrency(staff.allowances)}
              </p>
            )}
          </div>
        </div>

        {staff.bank_name && staff.bank_account && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <Building className="h-4 w-4 text-gray-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Rekening Bank</p>
              <p className="text-gray-900 font-medium">{staff.bank_name}</p>
              <p className="text-gray-700 text-sm wrap-break-word">
                {staff.bank_account}
              </p>
              {staff.account_holder && (
                <p className="text-gray-500 text-xs mt-0.5">
                  a.n. {staff.account_holder}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <Calendar className="h-4 w-4 text-gray-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Tanggal Bergabung</p>
            <p className="text-gray-900">{formatDate(staff.join_date)}</p>
            {staff.resign_date && (
              <p className="text-xs text-red-600 mt-0.5">
                Resign: {formatDate(staff.resign_date)}
              </p>
            )}
          </div>
        </div>

        {staff.address && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 mb-1.5 text-xs">Alamat</p>
                <p className="text-gray-900 wrap-break-word text-sm">
                  {staff.address}
                </p>
              </div>
            </div>
          </div>
        )}

        {staff.notes && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <p className="text-amber-600 text-xs mb-1">Catatan</p>
            <p className="text-amber-900 text-sm wrap-break-word">
              {staff.notes}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0 pb-5 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => onEdit(staff)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => onDelete(staff.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
