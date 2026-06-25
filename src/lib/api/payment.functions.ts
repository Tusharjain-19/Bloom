import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as fs from "fs";
import * as path from "path";

// Function to load .env variables manually if not loaded in process.env
const loadEnvFromFileSync = () => {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.substring(1, value.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = value.trim();
          }
        }
      });
    }
  } catch (err) {
    console.error("Failed to load .env manually:", err);
  }
};

loadEnvFromFileSync();

const getKeys = () => {
  return {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
  };
};

const getAuthHeader = () => {
  const { keyId, keySecret } = getKeys();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured in environment variables.");
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
};

// Create a server function to create a Razorpay Order
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().positive(), // in INR
      receipt: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const auth = getAuthHeader();
      const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({
          amount: Math.round(data.amount * 100), // convert to paise
          currency: "INR",
          receipt: data.receipt,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay Order Error: ${response.statusText} - ${errText}`);
      }

      const order = await response.json();
      return { success: true, orderId: order.id, amount: order.amount, currency: order.currency };
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      return { success: false, error: error.message };
    }
  });

// Create a server function to generate a dynamic UPI QR Code
export const createRazorpayQR = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      amount: z.number().positive(), // in INR
      name: z.string().min(1),
      description: z.string().optional(),
      bookingId: z.string().optional(),
      salonId: z.string().optional(),
      fallbackUpiId: z.string().optional(), // For direct UPI fallback
    }),
  )
  .handler(async ({ data }) => {
    try {
      // If credentials aren't set, return the direct UPI fallback immediately
      const { keyId, keySecret } = getKeys();
      if (!keyId || !keySecret) {
        if (data.fallbackUpiId) {
          const upiString = `upi://pay?pa=${data.fallbackUpiId}&pn=${encodeURIComponent(data.name)}&am=${data.amount}&cu=INR`;
          // Use a public QR code generator API to return a renderable image url
          const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
          return {
            success: true,
            isFallback: true,
            upiString,
            imageUrl,
            qrCodeId: "fallback_" + Math.random().toString(36).substring(2),
          };
        }
        throw new Error(
          "Razorpay credentials are not configured and no fallback UPI ID is available.",
        );
      }

      const auth = getAuthHeader();
      const payload = {
        type: "upi_qr",
        name: data.name.substring(0, 40), // Razorpay limit
        usage: "single_use",
        fixed_amount: true,
        payment_amount: Math.round(data.amount * 100), // paise
        description: (data.description || "Salon Payment").substring(0, 40),
        notes: {
          booking_id: data.bookingId || "",
          salon_id: data.salonId || "",
        },
      };

      const response = await fetch("https://api.razorpay.com/v1/qr_codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        // If Razorpay API fails, try direct UPI fallback if available
        if (data.fallbackUpiId) {
          const upiString = `upi://pay?pa=${data.fallbackUpiId}&pn=${encodeURIComponent(data.name)}&am=${data.amount}&cu=INR`;
          const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
          return {
            success: true,
            isFallback: true,
            upiString,
            imageUrl,
            qrCodeId: "fallback_" + Math.random().toString(36).substring(2),
          };
        }
        throw new Error(`Razorpay QR Error: ${response.statusText} - ${errText}`);
      }

      const qr = await response.json();
      return {
        success: true,
        isFallback: false,
        qrCodeId: qr.id,
        imageUrl: qr.image_url,
        upiString: qr.upi_qr?.upi_string || "",
      };
    } catch (error: any) {
      console.error("Error creating Razorpay QR code:", error);
      // Fallback
      if (data.fallbackUpiId) {
        const upiString = `upi://pay?pa=${data.fallbackUpiId}&pn=${encodeURIComponent(data.name)}&am=${data.amount}&cu=INR`;
        const imageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;
        return {
          success: true,
          isFallback: true,
          upiString,
          imageUrl,
          qrCodeId: "fallback_" + Math.random().toString(36).substring(2),
        };
      }
      return { success: false, error: error.message };
    }
  });

// Create a server function to check the payment status of a dynamic UPI QR Code
export const checkRazorpayPaymentStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      qrCodeId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    try {
      // If fallback, skip calling Razorpay
      if (data.qrCodeId.startsWith("fallback_")) {
        return { success: true, paid: false, isFallback: true };
      }

      const auth = getAuthHeader();
      const response = await fetch(
        `https://api.razorpay.com/v1/qr_codes/${data.qrCodeId}/payments`,
        {
          method: "GET",
          headers: {
            Authorization: auth,
          },
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Razorpay QR Query Error: ${response.statusText} - ${errText}`);
      }

      const payments = await response.json();
      // Check if there is any payment that is authorized/captured
      const successfulPayment = (payments.items || []).find(
        (p: any) => p.status === "captured" || p.status === "authorized",
      );

      if (successfulPayment) {
        return {
          success: true,
          paid: true,
          paymentId: successfulPayment.id,
          paymentMethod: successfulPayment.method,
          amount: successfulPayment.amount / 100, // back to INR
        };
      }

      return { success: true, paid: false };
    } catch (error: any) {
      console.error("Error checking Razorpay payment status:", error);
      return { success: false, error: error.message };
    }
  });
