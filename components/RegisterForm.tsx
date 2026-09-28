"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/utils/supabase";

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Aturan Validasi Kekuatan Kata Sandi:
  // 1. Wajib minimal 8 karakter
  // 2. Minimal 1 angka
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasNumber;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isPasswordValid) {
      setErrorMsg("Password must be at least 8 characters and include at least 1 number.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Register account with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      const user = data.user;
      if (!user) {
        throw new Error("Failed to get user data after registration.");
      }

      // 2. Check Session Status:
      // On Supabase with Email Confirmation enabled, data.user exists but data.session === null
      if (!data.session) {
        const verifyNotice =
          "Registration successful! A verification link has been sent. Please check your inbox or spam folder to activate your account.";
        alert(verifyNotice);
        setSuccessMsg(verifyNotice);
        return;
      }

      // 3. If session exists immediately:
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          username: username.trim(),
        },
      ]);

      if (profileError) {
        console.warn("Warning inserting into profiles table:", profileError.message);
      }

      alert("Registration successful! Welcome to MOYA.");

      // 4. Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Register Error:", err);
      setErrorMsg(err.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 sm:p-8 bg-moya-surface border border-moya-border rounded-xl2 shadow-soft space-y-6">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-full bg-moya-soft flex items-center justify-center text-2xl mx-auto mb-2">
          ✨
        </div>
        <h2 className="font-display text-2xl text-moya-text">Create an Account</h2>
        <p className="text-xs text-moya-muted">
          Sign up to start managing your notes and encrypted files
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg ? (
        <div className="p-5 bg-green-50 border border-green-200 text-green-900 rounded-xl space-y-3 text-center animate-in fade-in">
          <div className="text-3xl">📬</div>
          <h3 className="font-semibold text-sm text-green-950">
            Email Verification Required
          </h3>
          <p className="text-xs text-green-800 leading-relaxed">
            {successMsg}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-block px-4 py-2 bg-moya-primary hover:bg-moya-primarydark text-white text-xs font-medium rounded-xl transition-colors shadow-card"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. rophile"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 8 characters & 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
            />
            {/* Real-time Password Strength Feedback */}
            {password.length > 0 ? (
              isPasswordValid ? (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                  <span>✓</span> Strong password (meets requirements)
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                  <span>⚠️</span> Password must be at least 8 characters{!hasNumber ? " and include at least 1 number" : ""}
                </p>
              )
            ) : (
              <p className="text-xs text-moya-muted mt-1.5">
                Minimum 8 characters and at least 1 number
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isPasswordValid}
            className="w-full py-3 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-moya-border text-xs text-moya-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-moya-primarydark hover:underline font-medium"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
