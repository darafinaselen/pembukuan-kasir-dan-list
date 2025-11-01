"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function FleetRevenueChart({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Penghasilan per Armada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Penghasilan per Armada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data penghasilan
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.revenue, 0);

  // Generate colors for each fleet
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
    "#06b6d4", // cyan
  ];

  // Calculate pie slices
  let currentAngle = -90; // Start from top
  const slices = data.map((item, index) => {
    const percentage = (item.revenue / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
      color: colors[index % colors.length],
    };
  });

  const createArcPath = (startAngle, endAngle, radius = 80) => {
    const start = polarToCartesian(100, 100, radius, endAngle);
    const end = polarToCartesian(100, 100, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      100,
      100,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArc,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value || 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Penghasilan per Armada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Pie Chart SVG */}
          <div className="relative flex justify-center">
            <svg width="240" height="240" viewBox="0 0 200 200">
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={createArcPath(slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  title={`${slice.licensePlate}: ${formatCurrency(
                    slice.revenue
                  )} (${slice.percentage.toFixed(1)}%)`}
                />
              ))}
              {/* Center circle for donut effect */}
              <circle cx="100" cy="100" r="50" fill="white" />
              <text
                x="100"
                y="95"
                textAnchor="middle"
                className="text-lg font-bold"
                fill="#1f2937"
              >
                {formatCurrency(total)}
              </text>
              <text
                x="100"
                y="110"
                textAnchor="middle"
                className="text-xs"
                fill="#6b7280"
              >
                Total
              </text>
            </svg>
          </div>

          {/* Legend - show top 5 */}
          <div className="w-full space-y-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Top {Math.min(5, data.length)} Armada
            </p>
            <div className="space-y-2">
              {slices.slice(0, 5).map((item, index) => {
                const percentage = ((item.revenue / total) * 100).toFixed(1);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {item.licensePlate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-sm font-bold">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {data.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{data.length - 5} armada lainnya
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
