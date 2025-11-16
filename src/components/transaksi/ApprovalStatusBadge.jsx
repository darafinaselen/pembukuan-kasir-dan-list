import { Badge } from "@/components/ui/badge";

/**
 * ApprovalStatusBadge Component
 * Displays transaction approval status with color coding
 *
 * @param {string} status - Approval status (DRAFT, PENDING, APPROVED, REJECTED)
 * @param {string} className - Additional CSS classes
 */
export default function ApprovalStatusBadge({ status, className = "" }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          variant: "secondary",
          className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        };
      case "PENDING":
        return {
          label: "Menunggu Persetujuan",
          variant: "warning",
          className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
        };
      case "APPROVED":
        return {
          label: "Disetujui",
          variant: "success",
          className: "bg-green-100 text-green-700 hover:bg-green-200",
        };
      case "PENDING_EDIT":
        return {
          label: "Menunggu Edit",
          variant: "warning",
          className: "bg-purple-100 text-purple-700 hover:bg-purple-200",
        };
      case "REJECTED":
        return {
          label: "Ditolak",
          variant: "destructive",
          className: "bg-red-100 text-red-700 hover:bg-red-200",
        };
      default:
        return {
          label: status || "Unknown",
          variant: "secondary",
          className: "bg-gray-100 text-gray-700",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
