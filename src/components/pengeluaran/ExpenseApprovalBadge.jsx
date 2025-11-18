"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function ExpenseApprovalBadge({ status }) {
  if (!status || status === "APPROVED") {
    // Don't show badge for normal approved expenses
    return null;
  }

  const badgeConfig = {
    PENDING_EDIT: {
      variant: "warning",
      icon: Edit,
      label: "Pending Edit",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    PENDING_DELETE: {
      variant: "destructive",
      icon: Trash2,
      label: "Pending Delete",
      className: "bg-orange-100 text-orange-800 border-orange-300",
    },
    REJECTED: {
      variant: "destructive",
      icon: XCircle,
      label: "Rejected",
      className: "bg-red-100 text-red-800 border-red-300",
    },
  };

  const config = badgeConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
