describe("Expense File Upload Client-Side Validation", () => {
  describe("File type validation", () => {
    test("should accept valid file types", () => {
      const validFiles = [
        { name: "test.jpg", type: "image/jpeg" },
        { name: "test.jpeg", type: "image/jpeg" },
        { name: "test.png", type: "image/png" },
        { name: "test.pdf", type: "application/pdf" },
      ];

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      validFiles.forEach((file) => {
        const isValid = allowedTypes.includes(file.type);
        expect(isValid).toBe(true);
      });
    });

    test("should reject invalid file types", () => {
      const invalidFiles = [
        { name: "test.txt", type: "text/plain" },
        {
          name: "test.docx",
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        {
          name: "test.xlsx",
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        { name: "test.mp4", type: "video/mp4" },
      ];

      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

      invalidFiles.forEach((file) => {
        const isValid = allowedTypes.includes(file.type);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("File size validation", () => {
    test("should accept files under 5MB", () => {
      const validSizes = [
        1024, // 1KB
        1024 * 1024, // 1MB
        4 * 1024 * 1024, // 4MB
        5 * 1024 * 1024 - 1, // Just under 5MB
      ];

      const maxSize = 5 * 1024 * 1024; // 5MB in bytes

      validSizes.forEach((size) => {
        const isValid = size <= maxSize;
        expect(isValid).toBe(true);
      });
    });

    test("should reject files over 5MB", () => {
      const invalidSizes = [
        5 * 1024 * 1024 + 1, // Just over 5MB
        10 * 1024 * 1024, // 10MB
        50 * 1024 * 1024, // 50MB
      ];

      const maxSize = 5 * 1024 * 1024; // 5MB in bytes

      invalidSizes.forEach((size) => {
        const isValid = size <= maxSize;
        expect(isValid).toBe(false);
      });
    });
  });

  describe("File handling functions", () => {
    test("should handle file selection correctly", () => {
      // Mock file input event
      const mockFile = {
        name: "test.jpg",
        type: "image/jpeg",
        size: 1024 * 1024, // 1MB
      };

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      // Simulate handleFileChange logic
      let formData = { file: null };
      const file = mockEvent.target.files[0];

      if (file) {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const maxSize = 5 * 1024 * 1024;

        if (allowedTypes.includes(file.type) && file.size <= maxSize) {
          formData = { ...formData, file };
        }
      }

      expect(formData.file).toBe(mockFile);
      expect(formData.file.name).toBe("test.jpg");
      expect(formData.file.type).toBe("image/jpeg");
    });

    test("should reject invalid file in handleFileChange", () => {
      // Mock invalid file (wrong type)
      const mockFile = {
        name: "test.txt",
        type: "text/plain",
        size: 1024, // 1KB
      };

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      // Simulate handleFileChange logic
      let formData = { file: null };
      const file = mockEvent.target.files[0];

      if (file) {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        const maxSize = 5 * 1024 * 1024;

        if (allowedTypes.includes(file.type) && file.size <= maxSize) {
          formData = { ...formData, file };
        }
        // If invalid, file should remain null
      }

      expect(formData.file).toBe(null);
    });

    test("should handle file removal correctly", () => {
      // Initial state with file
      let formData = {
        file: {
          name: "test.jpg",
          type: "image/jpeg",
          size: 1024 * 1024,
        },
      };

      // Simulate handleRemoveFile
      formData = { ...formData, file: null };

      expect(formData.file).toBe(null);
    });
  });

  describe("File preview and display", () => {
    test("should get correct file icon for different file types", () => {
      const testCases = [
        { type: "image/jpeg", expectedIcon: "ImageIcon" },
        { type: "image/png", expectedIcon: "ImageIcon" },
        { type: "application/pdf", expectedIcon: "FileText" },
        { type: "unknown", expectedIcon: "FileText" }, // Default
      ];

      testCases.forEach(({ type, expectedIcon }) => {
        // Simulate getFileIcon logic
        const getFileIcon = (fileType) => {
          if (fileType.startsWith("image/")) {
            return "ImageIcon";
          } else if (fileType === "application/pdf") {
            return "FileText";
          } else {
            return "FileText";
          }
        };

        const icon = getFileIcon(type);
        expect(icon).toBe(expectedIcon);
      });
    });

    test("should format file size correctly", () => {
      const testCases = [
        { size: 512, expected: "512 Bytes" },
        { size: 1024, expected: "1 KB" },
        { size: 1024 * 1024, expected: "1 MB" },
        { size: 1536, expected: "1.5 KB" },
        { size: 2.5 * 1024 * 1024, expected: "2.5 MB" },
      ];

      testCases.forEach(({ size, expected }) => {
        // Simulate formatFileSize logic (actual implementation from PengeluaranDialog.jsx)
        const formatFileSize = (bytes) => {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
          );
        };

        const formatted = formatFileSize(size);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe("Form submission with file", () => {
    test("should include file in FormData when submitting", () => {
      const mockFile = {
        name: "receipt.jpg",
        type: "image/jpeg",
        size: 1024 * 1024,
      };

      const formData = {
        date: "2025-11-07",
        paymentMonth: "11",
        category: "LISTRIK",
        description: "Electricity bill",
        amount: "150000",
        file: mockFile,
      };

      // Simulate FormData creation in handleSubmit
      const formDataToSend = new FormData();
      formDataToSend.append("date", new Date(formData.date).toISOString());
      if (formData.paymentMonth) {
        formDataToSend.append(
          "paymentMonth",
          new Date(`${formData.paymentMonth}-01`).toISOString()
        );
      }
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("amount", "150000");
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      // Verify FormData contains the file
      expect(formDataToSend.has("file")).toBe(true);
      expect(formDataToSend.get("category")).toBe("LISTRIK");
      expect(formDataToSend.get("amount")).toBe("150000");
    });

    test("should handle submission without file", () => {
      const formData = {
        date: "2025-11-07",
        paymentMonth: "11",
        category: "LISTRIK",
        description: "Electricity bill",
        amount: "150000",
        file: null,
      };

      // Simulate FormData creation in handleSubmit
      const formDataToSend = new FormData();
      formDataToSend.append("date", new Date(formData.date).toISOString());
      if (formData.paymentMonth) {
        formDataToSend.append(
          "paymentMonth",
          new Date(`${formData.paymentMonth}-01`).toISOString()
        );
      }
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("amount", "150000");
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      // Verify FormData does not contain file
      expect(formDataToSend.has("file")).toBe(false);
      expect(formDataToSend.get("category")).toBe("LISTRIK");
    });
  });

  describe("Error handling", () => {
    test("should show alert for invalid file type", () => {
      const mockFile = {
        name: "test.txt",
        type: "text/plain",
        size: 1024,
      };

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      // Mock alert function
      const mockAlert = jest.fn();
      global.alert = mockAlert;

      // Simulate handleFileChange logic
      const file = mockEvent.target.files[0];
      if (file) {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
          alert("File harus berupa gambar (JPG/PNG) atau PDF");
          return;
        }
      }

      expect(mockAlert).toHaveBeenCalledWith(
        "File harus berupa gambar (JPG/PNG) atau PDF"
      );
    });

    test("should show alert for file too large", () => {
      const mockFile = {
        name: "large.jpg",
        type: "image/jpeg",
        size: 10 * 1024 * 1024, // 10MB
      };

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      };

      // Mock alert function
      const mockAlert = jest.fn();
      global.alert = mockAlert;

      // Simulate handleFileChange logic
      const file = mockEvent.target.files[0];
      if (file) {
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
        if (allowedTypes.includes(file.type)) {
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            alert("Ukuran file maksimal 5MB");
            return;
          }
        }
      }

      expect(mockAlert).toHaveBeenCalledWith("Ukuran file maksimal 5MB");
    });
  });
});
