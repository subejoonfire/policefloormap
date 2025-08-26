"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Force a hard navigation to /admin to ensure cookies are properly set
        window.location.href = "/admin";
      } else {
        alert(
          data.message || "Username atau password yang Anda masukkan salah."
        );
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="login-container bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="login-header text-center mb-8">
          <div className="logos flex justify-center items-center gap-4 mb-4">
            <div className="w-[80px] h-[80px] relative">
              <Image
                src="/images/polri.png"
                alt="Logo Polri"
                fill
                priority
                className="object-contain"
              />
            </div>
            <div className="w-[80px] h-[80px] relative">
              <Image
                src="/images/Berau.png"
                alt="Logo Berau"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Admin Login</h2>
          <p className="text-gray-600">Silakan masuk untuk mengelola konten.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
