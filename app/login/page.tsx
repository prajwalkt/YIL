import { headers } from 'next/headers';
import LoginForm from './LoginForm';
import { Suspense } from 'react';
export default async function LoginPage() {
  const nonce = (await headers()).get('x-nonce') || '';
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#004098] flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"/></div>}>
      <LoginForm nonce={nonce} />
    </Suspense>
  );
}
