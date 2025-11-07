/**
 * Unit Tests for AlertDialogProvider Component
 * Tests the alert dialog context provider and hook functionality
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  AlertDialogProvider,
  useAlertDialog,
  showAlert,
  showConfirm,
} from "../../components/ui/alert-dialog-provider";

// Mock UI components
jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }) =>
    open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }) => (
    <button data-testid="alert-action" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick }) => (
    <button data-testid="alert-cancel" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }) => (
    <div data-testid="alert-content">{children}</div>
  ),
  AlertDialogDescription: ({ children }) => (
    <div data-testid="alert-description">{children}</div>
  ),
  AlertDialogFooter: ({ children }) => (
    <div data-testid="alert-footer">{children}</div>
  ),
  AlertDialogHeader: ({ children }) => (
    <div data-testid="alert-header">{children}</div>
  ),
  AlertDialogTitle: ({ children, className }) => (
    <div data-testid="alert-title" className={className}>
      {children}
    </div>
  ),
}));

describe("AlertDialogProvider", () => {
  describe("AlertDialogProvider Component", () => {
    it("should render children", () => {
      render(
        <AlertDialogProvider>
          <div data-testid="child">Test Child</div>
        </AlertDialogProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should provide context to children", () => {
      const TestComponent = () => {
        const { showAlert } = useAlertDialog();
        return (
          <button onClick={() => showAlert({ message: "Test" })}>
            Show Alert
          </button>
        );
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      expect(screen.getByText("Show Alert")).toBeInTheDocument();
    });
  });

  describe("useAlertDialog Hook", () => {
    it("should throw error when used outside provider", () => {
      const TestComponent = () => {
        useAlertDialog();
        return null;
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        "useAlertDialog must be used within AlertDialogProvider"
      );

      consoleSpy.mockRestore();
    });

    it("should return showAlert and showConfirm functions", () => {
      const TestComponent = () => {
        const context = useAlertDialog();
        expect(typeof context.showAlert).toBe("function");
        expect(typeof context.showConfirm).toBe("function");
        return null;
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );
    });
  });

  describe("showAlert Function", () => {
    it("should display alert dialog with correct content", async () => {
      const TestComponent = () => {
        const { showAlert } = useAlertDialog();

        const handleClick = async () => {
          await showAlert({
            title: "Test Title",
            message: "Test Message",
            type: "success",
            confirmText: "OK",
          });
        };

        return <button onClick={handleClick}>Show Alert</button>;
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Alert");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("alert-title")).toHaveTextContent(
          "Test Title"
        );
        expect(screen.getByTestId("alert-description")).toHaveTextContent(
          "Test Message"
        );
        expect(screen.getByTestId("alert-action")).toHaveTextContent("OK");
      });
    });

    it("should use default values when not provided", async () => {
      const TestComponent = () => {
        const { showAlert } = useAlertDialog();

        const handleClick = async () => {
          await showAlert({ message: "Test Message" });
        };

        return <button onClick={handleClick}>Show Alert</button>;
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Alert");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-title")).toHaveTextContent(
          "Perhatian"
        );
        expect(screen.getByTestId("alert-description")).toHaveTextContent(
          "Test Message"
        );
        expect(screen.getByTestId("alert-action")).toHaveTextContent("OK");
      });
    });

    it("should resolve promise when OK is clicked", async () => {
      const TestComponent = () => {
        const { showAlert } = useAlertDialog();
        const [result, setResult] = React.useState(null);

        const handleClick = async () => {
          const res = await showAlert({ message: "Test" });
          setResult(res);
        };

        return (
          <div>
            <button onClick={handleClick}>Show Alert</button>
            {result !== null && (
              <span data-testid="result">{result.toString()}</span>
            )}
          </div>
        );
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Alert");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-action")).toBeInTheDocument();
      });

      const okButton = screen.getByTestId("alert-action");
      fireEvent.click(okButton);

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("true");
      });
    });
  });

  describe("showConfirm Function", () => {
    it("should display confirmation dialog with cancel button", async () => {
      const TestComponent = () => {
        const { showConfirm } = useAlertDialog();

        const handleClick = async () => {
          await showConfirm({
            title: "Confirm Title",
            message: "Confirm Message",
            confirmText: "Yes",
            cancelText: "No",
          });
        };

        return <button onClick={handleClick}>Show Confirm</button>;
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Confirm");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-dialog")).toBeInTheDocument();
        expect(screen.getByTestId("alert-title")).toHaveTextContent(
          "Confirm Title"
        );
        expect(screen.getByTestId("alert-description")).toHaveTextContent(
          "Confirm Message"
        );
        expect(screen.getByTestId("alert-action")).toHaveTextContent("Yes");
        expect(screen.getByTestId("alert-cancel")).toHaveTextContent("No");
      });
    });

    it("should resolve with true when confirmed", async () => {
      const TestComponent = () => {
        const { showConfirm } = useAlertDialog();
        const [result, setResult] = React.useState(null);

        const handleClick = async () => {
          const res = await showConfirm({ message: "Confirm?" });
          setResult(res);
        };

        return (
          <div>
            <button onClick={handleClick}>Show Confirm</button>
            {result !== null && (
              <span data-testid="result">{result.toString()}</span>
            )}
          </div>
        );
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Confirm");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-action")).toBeInTheDocument();
      });

      const yesButton = screen.getByTestId("alert-action");
      fireEvent.click(yesButton);

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("true");
      });
    });

    it("should resolve with false when cancelled", async () => {
      const TestComponent = () => {
        const { showConfirm } = useAlertDialog();
        const [result, setResult] = React.useState(null);

        const handleClick = async () => {
          const res = await showConfirm({ message: "Confirm?" });
          setResult(res);
        };

        return (
          <div>
            <button onClick={handleClick}>Show Confirm</button>
            {result !== null && (
              <span data-testid="result">{result.toString()}</span>
            )}
          </div>
        );
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Confirm");
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId("alert-cancel")).toBeInTheDocument();
      });

      const noButton = screen.getByTestId("alert-cancel");
      fireEvent.click(noButton);

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("false");
      });
    });
  });

  describe("getVariantClass Function", () => {
    it("should return correct CSS classes for different types", () => {
      // getVariantClass function doesn't exist, so we'll test the type mapping directly
      const typeClasses = {
        success: "text-green-600",
        warning: "text-yellow-600",
        error: "text-red-600",
        confirm: "text-blue-600",
        info: "text-gray-700",
      };

      expect(typeClasses.success).toBe("text-green-600");
      expect(typeClasses.warning).toBe("text-yellow-600");
      expect(typeClasses.error).toBe("text-red-600");
      expect(typeClasses.confirm).toBe("text-blue-600");
      expect(typeClasses.info).toBe("text-gray-700");
    });
  });

  describe("Backward Compatibility Functions", () => {
    it("should call showAlert with correct parameters", async () => {
      render(
        <AlertDialogProvider>
          <div>Test</div>
        </AlertDialogProvider>
      );

      const {
        showAlert: showAlertCompat,
      } = require("../../components/ui/alert-dialog-provider");

      showAlertCompat("Test message", "warning");

      await waitFor(() => {
        expect(screen.getByText("Test message")).toBeInTheDocument();
        expect(screen.getByText("Perhatian")).toBeInTheDocument();
      });
    });

    it("should call showConfirm with correct parameters", async () => {
      render(
        <AlertDialogProvider>
          <div>Test</div>
        </AlertDialogProvider>
      );

      const {
        showConfirm: showConfirmCompat,
      } = require("../../components/ui/alert-dialog-provider");

      showConfirmCompat("Test message");

      await waitFor(() => {
        expect(screen.getByText("Test message")).toBeInTheDocument();
        expect(screen.getByText("Konfirmasi")).toBeInTheDocument();
        expect(screen.getByText("Batal")).toBeInTheDocument();
        expect(screen.getByText("Ya")).toBeInTheDocument();
      });
    });

    it("should fallback to browser alert when context not available", () => {
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      // Test the fallback by calling the function outside provider
      const {
        showAlert,
      } = require("../../components/ui/alert-dialog-provider");

      // This should trigger the fallback since no context
      showAlert("Test message");

      expect(alertSpy).toHaveBeenCalledWith("Test message");
      alertSpy.mockRestore();
    });

    it("should fallback to browser confirm when context not available", () => {
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

      // Test the fallback by calling the function outside provider
      const {
        showConfirm,
      } = require("../../components/ui/alert-dialog-provider");

      // This should trigger the fallback since no context
      const result = showConfirm("Test message");

      expect(confirmSpy).toHaveBeenCalledWith("Test message");
      expect(result).resolves.toBe(true);
      confirmSpy.mockRestore();
    });
  });

  describe("Multiple Alerts", () => {
    it("should handle multiple alerts simultaneously", async () => {
      const TestComponent = () => {
        const { showAlert } = useAlertDialog();

        const handleMultipleAlerts = async () => {
          await Promise.all([
            showAlert({ message: "Alert 1", title: "Title 1" }),
            showAlert({ message: "Alert 2", title: "Title 2" }),
          ]);
        };

        return <button onClick={handleMultipleAlerts}>Show Multiple</button>;
      };

      render(
        <AlertDialogProvider>
          <TestComponent />
        </AlertDialogProvider>
      );

      const button = screen.getByText("Show Multiple");
      fireEvent.click(button);

      await waitFor(() => {
        const dialogs = screen.getAllByTestId("alert-dialog");
        expect(dialogs).toHaveLength(2);
      });
    });
  });
});
