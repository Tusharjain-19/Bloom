# 🌸 Bloom - Bangalore's Luxury Salon Booking Platform

> A full-stack, real-time salon discovery and booking ecosystem built for the modern luxury wellness industry.

**Built by [Tushar Jain](https://tusharjain.in) · Hackathon Project**

---

## ✨ What is Bloom?

Bloom is an end-to-end luxury salon management and booking platform for Bangalore. It brings together a curated discovery experience for clients, a powerful operations dashboard for salon owners, an in-salon Point of Sale system, and a super-admin headquarters panel — all under one roof.

---

## 🏗️ Architecture & Portals

| Portal                            | Description                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **🛍️ Client Discovery & Booking** | Browse verified luxury salons, pick services, and book via AI Concierge or direct slot selection |
| **🏢 Salon Owner Admin**          | Manage services, hours, holidays, bookings, revenue analytics, and POS billing                   |
| **🖨️ Point of Sale (POS)**        | Walk-in register with Razorpay integration and luxury thermal receipt printing                   |
| **⚙️ HQ Super Admin**             | Approve salons, moderate ownership claims, and manage platform settings                          |

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Row Level Security + Edge Functions)
- **Payments:** Razorpay (Test Mode)
- **AI:** Groq LLM (AI Concierge booking flow)
- **Build:** Vite + TanStack Start

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Tusharjain-19/Bloom.git
cd Bloom
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example file and fill in your own keys:

```bash
cp .env.example .env
```

You will need:

- **Supabase** project URL and anon key → [supabase.com](https://supabase.com)
- **Groq** API key → [console.groq.com](https://console.groq.com)
- **Razorpay** test keys → [dashboard.razorpay.com](https://dashboard.razorpay.com)

### 4. Run the Development Server

```bash
npm run dev
```

### 5. Database Setup

Run the migration SQL files in `/supabase/migrations/` in your Supabase SQL Editor to set up the schema, views, and RLS policies.

---

## 💳 Testing Razorpay Payments

Bloom integrates Razorpay in **Test Mode**. Use the following test card to simulate payments in the POS or booking checkout:

| Field           | Value                          |
| --------------- | ------------------------------ |
| **Card Number** | `4100 2800 0000 1007`          |
| **Expiry Date** | Any future date (e.g. `12/29`) |
| **CVV**         | Any 3 digits (e.g. `123`)      |
| **Name**        | Any name                       |

---

## 🔑 Key Features

- ✅ Real-time booking with slot availability checks
- ✅ Guest booking (no login required)
- ✅ AI-powered booking concierge (Groq LLM)
- ✅ Razorpay payment integration (Test Mode)
- ✅ Salon Owner admin panel with analytics
- ✅ In-salon POS with thermal receipt printing
- ✅ HQ Super Admin with approval workflows
- ✅ Responsive across all device sizes
- ✅ Guided onboarding tour for first-time visitors
- ⏳ Google Authentication (coming soon)

---

## 📸 Hackathon Demo Notes

> **Judges:** A guided tour will appear on your first visit to walk you through all features.

To explore the admin panels, sign up with an email and request salon ownership, or contact the creator for a demo admin account.

---

## 👤 Creator

**Tushar Jain** · [tusharjain.in](https://tusharjain.in)
