"use client";

import RegistrationForm from "../../components/RegistrationForm";
import BackButton from "../../components/BackButton";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl mb-4">
        <BackButton fallbackPath="/" label="Back to Home" />
      </div>
      <RegistrationForm />
    </div>
  );
}