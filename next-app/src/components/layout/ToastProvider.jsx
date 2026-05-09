'use client';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer 
      position="bottom-right"
      theme="light"
      toastClassName="!rounded-3xl !p-6 !shadow-2xl border border-gray-100"
    />
  );
}
