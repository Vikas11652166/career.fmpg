'use client';

import dynamic from 'next/dynamic';
import "react-toastify/dist/ReactToastify.css";

const ToastContainer = dynamic(
  () => import('react-toastify').then((mod) => mod.ToastContainer),
  { ssr: false }
);

export default function ToastProvider() {
  return (
    <ToastContainer 
      position="bottom-right"
      theme="light"
      toastClassName="!rounded-3xl !p-6 !shadow-2xl border border-gray-100"
    />
  );
}
