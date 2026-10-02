"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import BackButton from "../../components/BackButton";

export default function PaymentPage() {
  const router = useRouter();

  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Demo Values
  // Later these will come from Registration Page
 const [country, setCountry] = useState("");
const [course, setCourse] = useState("");
const [trainingMode, setTrainingMode] = useState("");
  const [registrationId, setRegistrationId] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("registrationData");

    if (!data) return;

    const registration = JSON.parse(data);
    setCountry(registration.country);
    setCourse(registration.course);
    setTrainingMode(registration.trainingMode);
    setRegistrationId(registration.registrationId);
  }, []);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload payment proof.");
      return;
    }

    if (!transactionId.trim()) {
      alert("Please enter Transaction ID.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("registrationId", registrationId);
      formData.append("transactionId", transactionId);
      formData.append("paymentProof", file);

      const res = await fetch("/api/payment", { credentials: 'include',
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        router.push("/payment-success");
      } else {
        alert("Payment submission failed: " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting payment proof.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-5">

      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <BackButton fallbackPath="/register" label="Back to Registration" className="mb-6" />

        <h1 className="text-4xl font-bold text-[#004098]">
          Payment Portal
        </h1>

        <p className="text-slate-500 mt-2">
          Complete your training registration payment.
        </p>

        {/* Course Summary */}

        <div className="mt-10 rounded-2xl bg-blue-50 border p-6">

          <h2 className="text-2xl font-bold mb-6">
            Course Summary
          </h2>

          <div className="grid md:grid-cols-2 gap-6">

            <div>
              <p className="text-slate-500">
                Course
              </p>

              <p className="font-bold text-lg">
                {course}
              </p>
            </div>

            <div>
              <p className="text-slate-500">
                Training Mode
              </p>

              <p className="font-bold text-lg">
                {trainingMode}
              </p>
            </div>

          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8"
        >
          {/* Payment Section */}

          {country.trim().toLowerCase() === "india" ? (

            <div className="bg-green-50 border border-green-300 rounded-2xl p-8">

              <h2 className="text-2xl font-bold text-[#004098]">
                🇮🇳 Payment for India
              </h2>

              <p className="text-slate-600 mt-2">
                Scan the QR Code below or make payment using UPI.
              </p>

              <div className="flex justify-center mt-8">

                <img
                  src="/payment/upi.png"
                  alt="UPI QR"
                  className="w-72 rounded-xl border shadow"
                />

              </div>

              <p className="mt-8 font-semibold text-slate-800">
                Payment Proof
              </p>

              <div className="flex items-center gap-4 mt-3">
                <label 
                  htmlFor="paymentProof" 
                  className="cursor-pointer bg-[#004098] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  Choose File
                </label>
                <span className="text-slate-700 font-medium">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>

              <input
                type="file"
                id="paymentProof"
                name="paymentProof"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  } else {
                    setFile(null);
                  }
                }}
              />

            </div>

          ) : (

            <div className="bg-blue-50 border border-blue-300 rounded-2xl p-8">

              <h2 className="text-2xl font-bold text-[#004098]">
                🌍 International Payment
              </h2>

              <p className="text-slate-600 mt-2">
                Upload your Wire Transfer / Bank Transfer document.
              </p>

              <div className="flex items-center gap-4 mt-6">
                <label 
                  htmlFor="paymentProofInternational" 
                  className="cursor-pointer bg-[#004098] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all"
                >
                  Choose File
                </label>
                <span className="text-slate-700 font-medium">
                  {file ? file.name : "No file chosen"}
                </span>
              </div>

              <input
                type="file"
                id="paymentProofInternational"
                name="paymentProof"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  } else {
                    setFile(null);
                  }
                }}
              />

            </div>

          )}

          {/* Transaction */}

          <div className="mt-6">

            <label className="font-bold text-lg text-slate-800">
              Transaction ID
            </label>

            <input
              type="text"
              value={transactionId}
              onChange={(e) =>
                setTransactionId(e.target.value)
              }
              placeholder="Enter Transaction ID"
              className="w-full mt-3 border border-slate-300 rounded-xl p-4 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#004098] hover:bg-blue-700 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
          >
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Upload size={22} />
                Submit Payment
                <ArrowRight size={22} />
              </>
            )}
          </button>

          <div className="bg-slate-50 border rounded-2xl p-6">

            <h3 className="font-bold text-lg flex items-center gap-2">

              <FileCheck size={22} />

              Important

            </h3>

            <ul className="mt-4 space-y-2 text-slate-600 list-disc ml-6">

              <li>
                Upload a clear payment proof.
              </li>

              <li>
                Transaction ID is mandatory.
              </li>

              <li>
                Your payment will be verified by Yokogawa Finance Team.
              </li>

              <li>
                Login credentials will be emailed after approval.
              </li>

            </ul>

          </div>

        </form>

      </div>

    </div>

  );

}