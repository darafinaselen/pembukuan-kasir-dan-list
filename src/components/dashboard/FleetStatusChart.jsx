"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";

export function FleetStatusChart({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Status Armada
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
            <PieChart className="h-5 w-5" />
            Status Armada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data armada
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    READY: {
      label: "Siap",
      color: "bg-green-500",
      textColor: "text-green-700",
    },
    BOOKED: {
      label: "Dipesan",
      color: "bg-yellow-500",
      textColor: "text-yellow-700",
    },
    ON_TRIP: {
      label: "Sedang Jalan",
      color: "bg-blue-500",
      textColor: "text-blue-700",
    },
    MAINTENANCE: {
      label: "Perawatan",
      color: "bg-red-500",
      textColor: "text-red-700",
    },
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Calculate pie slices
  let currentAngle = -90; // Start from top
  const slices = data.map((item) => {
    const percentage = (item.count / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-purple-600" />
          Status Armada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Pie Chart SVG */}
          <div className="relative flex justify-center">
            <svg width="240" height="240" viewBox="0 0 200 200">
              {slices.map((slice, index) => {
                const config = statusConfig[slice.status] || statusConfig.READY;
                const colors = {
                  READY: "#22c55e",
                  BOOKED: "#eab308",
                  ON_TRIP: "#3b82f6",
                  MAINTENANCE: "#ef4444",
                };

                return (
                  <path
                    key={index}
                    d={createArcPath(slice.startAngle, slice.endAngle)}
                    fill={colors[slice.status] || "#6b7280"}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    title={`${config.label}: ${
                      slice.count
                    } (${slice.percentage.toFixed(1)}%)`}
                  />
                );
              })}
              {/* Center circle for donut effect */}
              <circle cx="100" cy="100" r="50" fill="white" />
              <text
                x="100"
                y="95"
                textAnchor="middle"
                className="text-2xl font-bold"
                fill="#1f2937"
              >
                {total}
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

          {/* Legend */}
          <div className="w-full grid grid-cols-2 gap-3">
            {data.map((item) => {
              const config = statusConfig[item.status] || statusConfig.READY;
              const percentage = ((item.count / total) * 100).toFixed(1);

              return (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold">{item.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
