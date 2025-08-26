"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const data = await res.json();
			if (!res.ok || !data.success) {
				throw new Error(data.message || "Login gagal");
			}
			window.location.href = "/admin";
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="login-wrapper">
			<div className="login-container">
				<div className="login-header">
					<div className="logos">
						<Image src="/images/polri.png" alt="Logo Polri" width={60} height={60} />
						<Image src="/images/Berau.png" alt="Logo Berau" width={60} height={60} />
					</div>
					<h2>Admin Login</h2>
					<p className="text-muted">Silakan masuk untuk mengelola konten.</p>
				</div>
				<form onSubmit={handleSubmit} noValidate>
					<div className="input-group mb-3">
						<span className="input-group-text"><i className="fas fa-user" /></span>
						<input
							type="text"
							name="username"
							className="form-control form-control-lg"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
					</div>
					<div className="input-group mb-4">
						<span className="input-group-text"><i className="fas fa-lock" /></span>
						<input
							type="password"
							name="password"
							className="form-control form-control-lg"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>
					<div className="d-grid">
						<button type="submit" className="btn btn-primary btn-lg btn-login" disabled={loading}>
							{loading ? "Memproses..." : "Login"}
						</button>
					</div>
					{error && <p className="text-danger mt-3 small text-center">{error}</p>}
				</form>
			</div>
			{/* Icons CSS should be loaded globally if needed */}
		</div>
	);
}