"use client";

import Link from "next/link";
import { CheckCircle2, Home, Mail, Clock } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">

      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">

        <CheckCircle2
          size={90}
          className="mx-auto text-green-600"
        />

        <h1 className="text-4xl font-bold text-[#004098] mt-6">
          Payment Submitted Successfully
        </h1>

        <p className="text-slate-600 mt-4 text-lg">
          Thank you for registering with
          <br />
          <span className="font-bold">
            Yokogawa Training Services
          </span>
        </p>

        <div className="mt-10 bg-blue-50 rounded-2xl p-6 text-left space-y-5">

          <div className="flex items-center gap-4">
            <Clock className="text-blue-700" />
            <div>
              <h3 className="font-bold">
                Payment Verification
              </h3>
              <p className="text-slate-600">
                Our finance team will verify your payment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Mail className="text-blue-700" />
            <div>
              <h3 className="font-bold">
                Email Notification
              </h3>
              <p className="text-slate-600">
                Login credentials and training details will be emailed after approval.
              </p>
            </div>
          </div>

        </div>

        <Link href="/">
          <button className="mt-10 w-full bg-[#004098] hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex justify-center items-center gap-3">
            <Home size={22} />
            Back to Home
          </button>
        </Link>

      </div>

    </div>
  );
}