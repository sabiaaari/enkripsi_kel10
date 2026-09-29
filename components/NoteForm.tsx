"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { encryptDiary } from "@/utils/crypto";
import { useMasterPassword } from "@/context/MasterPasswordContext";

interface NoteFormProps {
  isPrivate?: boolean;
  onSuccess?: () => void;
}

export default function NoteForm({ isPrivate = false, onSuccess }: NoteFormProps) {
  const router = useRouter();
  const { masterPassword, requestMasterPassword } = useMasterPassword();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!content.trim()) {
      alert("Note content cannot be empty!");
      return;
    }

    let pwd = masterPassword;
    if (isPrivate && !pwd) {
      pwd = await requestMasterPassword();
      if (!pwd) return;
    }

    setIsProcessing(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Session not found. Please sign in first.");
      }

      const plainText = title.trim()
        ? `[${title.trim()}]\n\n${content.trim()}`
        : content.trim();

      let payload: any;

      if (isPrivate) {
        const encrypted = await encryptDiary(plainText, pwd!);
        payload = {
          user_id: user.id,
          content: encrypted.content,
          is_encrypted: true,
          algorithm: encrypted.algorithm || "AES-256-GCM",
          salt: encrypted.salt,
          nonce: encrypted.nonce || encrypted.iv,
          auth_tag: encrypted.authTag,
        };
      } else {
        payload = {
          user_id: user.id,
          content: plainText,
          is_encrypted: false,
          category: category,
          algorithm: null,
          salt: null,
          nonce: null,
          auth_tag: null,
        };
      }

      let { data, error } = await supabase
        .from("diary_notes")
        .insert(payload)
        .select()
        .single();

      if (
        error &&
        (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("category"))
      ) {
        const { category: _omitted, ...safePayload } = payload;
        const retry = await supabase
          .from("diary_notes")
          .insert(safePayload)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(isPrivate ? "/private/notes" : "/notes");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan catatan:", err);
      const msg = err.message || "Failed to save note to Supabase database.";
      setErrorMessage(msg);
      alert("Failed to save note: " + msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 animate-in fade-in">
          <p className="font-semibold text-red-900 flex items-center gap-1.5">
            <span>⚠️</span> An Error Occurred
          </p>
          <p className="font-mono text-[11px] text-red-700">{errorMessage}</p>
        </div>
      )}

      {isPrivate ? (
        <div>
          <label className="block text-xs font-medium text-moya-text mb-1.5">
            Note Title
          </label>
          <input
            type="text"
            placeholder="e.g., Financial Notes, Project Secrets..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
            required
          />
        </div>
      ) : (
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Note Title
            </label>
            <input
              type="text"
              placeholder="e.g., College Project, Personal Thoughts, Ideas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-moya-text mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text focus-ring"
            >
              <option value="Personal">📁 Personal</option>
              <option value="College">📁 College</option>
              <option value="Work">📁 Work</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-moya-text mb-1.5">
          Note Content
        </label>
        <textarea
          rows={6}
          placeholder="Write your thoughts, secrets, or important plans here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full px-4 py-3 bg-moya-bg border border-moya-border rounded-xl text-sm text-moya-text placeholder:text-moya-muted focus-ring leading-relaxed"
          required
        />
      </div>

      <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push(isPrivate ? "/private/notes" : "/notes")}
          className="px-5 py-2.5 border border-moya-border hover:bg-moya-soft text-moya-text text-sm font-medium rounded-xl transition-colors text-center"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-6 py-2.5 bg-moya-primary hover:bg-moya-primarydark text-white font-medium rounded-xl text-sm transition-colors shadow-card focus-ring disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving to Supabase...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>{isPrivate ? "Save Private Note" : "Save Public Note"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
