"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/utils/supabase";
import { useMasterPassword } from "@/context/MasterPasswordContext";
import { encryptDiary } from "@/utils/crypto";
import { encryptPixelsECB, encryptPixelsSecure } from "@/utils/imageCipher";

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DemoResult {
  orig: ImageData;
  ecb: ImageData;
  safe: ImageData;
  width: number;
  height: number;
}

export default function CryptoLabPage() {
  const { masterPassword, requestMasterPassword } = useMasterPassword();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingCanvas, setIsProcessingCanvas] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [demoResults, setDemoResults] = useState<DemoResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const origCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ecbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const safeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pemrosesan Piksel Gambar dengan Canvas HTML5
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPG, PNG, WEBP, etc.).");
      return;
    }

    setSelectedFile(file);
    setDemoResults(null);
    setIsProcessingCanvas(true);

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        // Skala gambar agar demonstrasi responsif dan dimensi piksel kelipatan 4
        let w = img.width;
        let h = img.height;
        const maxDim = 320;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        w = Math.max(4, Math.floor(w / 4) * 4);
        h = Math.max(4, h);

        const hiddenCanvas = document.createElement("canvas");
        hiddenCanvas.width = w;
        hiddenCanvas.height = h;
        const ctx = hiddenCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Failed to initialize 2D canvas context.");

        ctx.drawImage(img, 0, 0, w, h);
        const origImageData = ctx.getImageData(0, 0, w, h);

        // 1. Mode ECB: Enkripsi array piksel menggunakan AES-128-ECB
        const ecbClamped = encryptPixelsECB(origImageData.data);
        const ecbImageData = ctx.createImageData(w, h);
        ecbImageData.data.set(ecbClamped);

        // 2. Mode GCM/CBC: Enkripsi array piksel menggunakan mode aman ber-IV/Nonce
        const safeClamped = encryptPixelsSecure(origImageData.data);
        const safeImageData = ctx.createImageData(w, h);
        safeImageData.data.set(safeClamped);

        setDemoResults({
          orig: origImageData,
          ecb: ecbImageData,
          safe: safeImageData,
          width: w,
          height: h,
        });
      } catch (err: any) {
        console.error("Gagal memproses visualisasi piksel:", err);
        alert("Failed to process encryption demonstration: " + err.message);
      } finally {
        setIsProcessingCanvas(false);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      setIsProcessingCanvas(false);
      URL.revokeObjectURL(objectUrl);
      alert("Failed to read image file.");
    };

    img.src = objectUrl;
  };

  // Render hasil ImageData ke ketiga canvas saat data siap
  useEffect(() => {
    if (demoResults) {
      const { orig, ecb, safe, width, height } = demoResults;

      if (origCanvasRef.current) {
        origCanvasRef.current.width = width;
        origCanvasRef.current.height = height;
        const ctx = origCanvasRef.current.getContext("2d");
        ctx?.putImageData(orig, 0, 0);
      }

      if (ecbCanvasRef.current) {
        ecbCanvasRef.current.width = width;
        ecbCanvasRef.current.height = height;
        const ctx = ecbCanvasRef.current.getContext("2d");
        ctx?.putImageData(ecb, 0, 0);
      }

      if (safeCanvasRef.current) {
        safeCanvasRef.current.width = width;
        safeCanvasRef.current.height = height;
        const ctx = safeCanvasRef.current.getContext("2d");
        ctx?.putImageData(safe, 0, 0);
      }
    }
  }, [demoResults]);

  // Simpan hasil gambar dengan enkripsi AES-256-GCM penuh ke vault
  const handleSaveSecure = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Session not found. Please sign in first.");
        return;
      }

      let pwd = masterPassword;
      if (!pwd) {
        pwd = await requestMasterPassword();
      }
      if (!pwd) {
        return;
      }

      const fileBuffer = await selectedFile.arrayBuffer();
      const { ciphertext, salt, nonce } = await encryptDiary(fileBuffer, pwd);

      const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const encryptedBlob = new Blob([ciphertext as any], {
        type: "application/octet-stream",
      });

      const { error: uploadError } = await supabase.storage
        .from("diary-files")
        .upload(filePath, encryptedBlob, {
          contentType: "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload ciphertext to Storage: ${uploadError.message}`);
      }

      const { error: insertError } = await supabase.from("encrypted_files").insert([
        {
          user_id: user.id,
          original_filename: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type || "image/png",
          storage_path: filePath,
          is_encrypted: true,
          algorithm: "AES-256-GCM",
          salt,
          nonce,
        },
      ]);

      if (insertError) {
        await supabase.storage.from("diary-files").remove([filePath]);
        throw new Error(`Failed to save file metadata: ${insertError.message}`);
      }

      alert(
        `Success! Image "${selectedFile.name}" was fully encrypted with Secure Mode (AES-256-GCM) and saved to your private vault.`
      );
    } catch (err: any) {
      console.error("Gagal menyimpan gambar:", err);
      alert("Failed to save image: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Crypto Lab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Cryptography Lab"
        />

        <div className="self-start md:self-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="crypto-lab-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-moya-primary hover:bg-moya-primarydark text-white rounded-xl text-sm font-medium transition-colors shadow-card flex items-center gap-2 cursor-pointer"
          >
            <span>🔬</span>
            <span>{selectedFile ? "Change Image" : "Choose Image to Test"}</span>
          </button>
        </div>
      </div>

      {/* File Status Info */}
      {selectedFile && (
        <div className="p-3.5 bg-moya-surface border border-moya-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span>🖼️</span>
            <span className="font-medium text-moya-text truncate break-words">{selectedFile.name}</span>
            <span className="text-moya-muted shrink-0">({formatFileSize(selectedFile.size)})</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] self-start sm:self-auto">
            Loaded in Memory
          </span>
        </div>
      )}

      {/* Loading Indicator */}
      {isProcessingCanvas && (
        <div className="py-16 text-center space-y-3 border border-dashed border-moya-border rounded-xl2 bg-moya-surface">
          <div className="w-8 h-8 border-3 border-moya-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-moya-muted font-medium">
            Extracting RGBA pixel array and processing AES-ECB vs Secure Mode comparison...
          </p>
        </div>
      )}

      {/* 3 Canvas Column Visualization */}
      {!demoResults && !isProcessingCanvas ? (
        <div className="py-20 text-center border border-dashed border-moya-border rounded-xl2 bg-moya-surface space-y-4">
          <div className="text-4xl">🧪</div>
          <div className="space-y-1">
            <h3 className="font-display text-lg text-moya-text">
              No Image Selected Yet
            </h3>
            <p className="text-xs text-moya-muted max-w-md mx-auto leading-relaxed">
              Click the <strong>&quot;Choose Image to Test&quot;</strong> button above to load a digital image and visually see the pattern leakage of ECB mode compared to the true randomness of secure GCM mode.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Plaintext */}
            <div className="rounded-xl2 border border-moya-border bg-moya-surface p-4 flex flex-col space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-moya-text">
                  1. Original Image (Plaintext)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-moya-soft text-moya-muted rounded-full">
                  Original
                </span>
              </div>
              <div className="flex-1 min-h-[200px] flex items-center justify-center bg-moya-bg rounded-xl border border-moya-border overflow-hidden p-2">
                <canvas
                  ref={origCanvasRef}
                  className="max-h-56 max-w-full object-contain rounded"
                />
              </div>
              <p className="text-[11px] text-moya-muted leading-relaxed">
                Raw RGBA pixels extracted directly via HTML5 Canvas API before cryptography is applied.
              </p>
            </div>

            {/* Column 2: AES-ECB */}
            <div className="rounded-xl2 border border-red-200 bg-red-50/20 p-4 flex flex-col space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-900">
                  2. ECB Mode Result (Weak)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full border border-red-200">
                  ⚠️ Silhouette Visible
                </span>
              </div>
              <div className="flex-1 min-h-[200px] flex items-center justify-center bg-black/90 rounded-xl border border-red-200 overflow-hidden p-2">
                <canvas
                  ref={ecbCanvasRef}
                  className="max-h-56 max-w-full object-contain rounded"
                />
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">
                <strong>Electronic Codebook (ECB)</strong>: Identical 16-byte pixel blocks produce identical ciphertext blocks, causing visual patterns and silhouettes of the original image to leak.
              </p>
            </div>

            {/* Column 3: Secure Mode */}
            <div className="rounded-xl2 border border-green-200 bg-green-50/20 p-4 flex flex-col space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-green-900">
                  3. Secure Mode Result (GCM / CBC)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full border border-green-200">
                  🛡️ Pure Random Static Noise
                </span>
              </div>
              <div className="flex-1 min-h-[200px] flex items-center justify-center bg-black/90 rounded-xl border border-green-200 overflow-hidden p-2">
                <canvas
                  ref={safeCanvasRef}
                  className="max-h-56 max-w-full object-contain rounded"
                />
              </div>
              <p className="text-[11px] text-green-800 leading-relaxed">
                <strong>Secure Mode (GCM / CBC)</strong>: Uses a unique random Initialization Vector (IV) / Nonce per encryption, producing true *white noise* with zero discernible patterns.
              </p>
            </div>
          </div>

          {/* Educational & Theoretical Explanation */}
          <div className="p-4 bg-moya-surface border border-moya-border rounded-xl2 space-y-2">
            <h4 className="font-semibold text-xs text-moya-primarydark flex items-center gap-1.5">
              <span>💡</span> Why Does MOYA Use AES-256-GCM?
            </h4>
            <p className="text-xs text-moya-muted leading-relaxed">
              ECB mode is never used in MOYA&apos;s vault system because it leaks data patterns. MOYA implements authenticated <strong>AES-256-GCM</strong> (Authenticated Encryption with Associated Data / AEAD) with a 12-byte Nonce and PBKDF2 key derivation (600,000 iterations) to guarantee both confidentiality and cryptographic integrity.
            </p>
          </div>

          {/* Save to Vault Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-moya-border">
            <p className="text-xs text-moya-muted">
              Want to store this image in your private vault with encryption?
            </p>

            <button
              type="button"
              onClick={handleSaveSecure}
              disabled={isSaving || isProcessingCanvas}
              className="px-5 py-2.5 bg-moya-primary hover:bg-moya-primarydark disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-card flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Encrypting & Saving...</span>
                </>
              ) : (
                <>
                  <span>Save to Vault </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
