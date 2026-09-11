"use client";

import { useSearchParams } from "next/navigation";
import RegistrationForm from "../../components/RegistrationForm";
import BackButton from "../../components/BackButton";
import { Suspense } from "react";

function RegisterContent() {
  const searchParams = useSearchParams();
  const course = searchParams.get("course") || undefined;
  const mode = searchParams.get("mode") || undefined;
  const batchIdParam = searchParams.get("batchId");
  const batchId = batchIdParam ? parseInt(batchIdParam, 10) : undefined;

  return (
    <div className="w-full max-w-4xl">
      <RegistrationForm 
        selectedCourse={course} 
        selectedMode={mode} 
        selectedBatchId={batchId} 
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-8">
      <div className="w-full max-w-4xl mb-4">
        <BackButton fallbackPath="/" label="Back to Home" />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}