"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Context untuk AlertDialog
const AlertDialogContext = createContext();

// Global reference untuk backward compatibility
let globalAlertContext = null;

export function AlertDialogProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (options) => {
    return new Promise((resolve) => {
      const id = Date.now().toString();
      const alert = {
        id,
        title: options.title || "Perhatian",
        description: options.description || options.message || "",
        type: options.type || "info", // info, success, warning, error
        confirmText: options.confirmText || "OK",
        onConfirm: () => {
          removeAlert(id);
          resolve(true);
        },
      };
      setAlerts((prev) => [...prev, alert]);
    });
  };

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      const id = Date.now().toString();
      const alert = {
        id,
        title: options.title || "Konfirmasi",
        description: options.description || options.message || "",
        type: "confirm",
        confirmText: options.confirmText || "Ya",
        cancelText: options.cancelText || "Batal",
        onConfirm: () => {
          removeAlert(id);
          resolve(true);
        },
        onCancel: () => {
          removeAlert(id);
          resolve(false);
        },
      };
      setAlerts((prev) => [...prev, alert]);
    });
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getVariantClass = (type) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "confirm":
        return "text-blue-600";
      default:
        return "text-gray-700";
    }
  };

  const contextValue = { showAlert, showConfirm };

  // Update global context reference
  React.useEffect(() => {
    globalAlertContext = contextValue;
    return () => {
      globalAlertContext = null;
    };
  }, []);

  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
      {alerts.map((alert) => (
        <AlertDialog key={alert.id} open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={getVariantClass(alert.type)}>
                {alert.title}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {alert.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {alert.type === "confirm" && (
                <AlertDialogCancel onClick={alert.onCancel}>
                  {alert.cancelText}
                </AlertDialogCancel>
              )}
              <AlertDialogAction onClick={alert.onConfirm}>
                {alert.confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </AlertDialogContext.Provider>
  );
}

// Hook untuk menggunakan AlertDialog
export function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error("useAlertDialog must be used within AlertDialogProvider");
  }
  return context;
}

// Helper functions untuk backward compatibility
export function showAlert(message, type = "info") {
  if (globalAlertContext) {
    return globalAlertContext.showAlert({ message, type });
  }
  // Fallback ke browser alert jika context tidak tersedia
  alert(message);
  return Promise.resolve(true);
}

export function showConfirm(message) {
  if (globalAlertContext) {
    return globalAlertContext.showConfirm({ message });
  }
  // Fallback ke browser confirm jika context tidak tersedia
  return Promise.resolve(confirm(message));
}
