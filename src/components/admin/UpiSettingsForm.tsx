"use client";

import { useActionState, useRef, useState } from "react";
import { requestUpiQrUpload, updateUpiSettings } from "@/lib/actions/site-settings";
import { uploadFile } from "@/components/admin/uploadFile";
import type { SiteSettings } from "@/lib/content-types";

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

// The temple's UPI details, shown to devotees when they book a paid seva.
export default function UpiSettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(updateUpiSettings, undefined);
  const [qrUrl, setQrUrl] = useState(settings.upiQrUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      let publicUrl = "";
      await uploadFile(
        "gallery",
        async (type) => {
          const r = await requestUpiQrUpload(type);
          publicUrl = ("publicUrl" in r ? r.publicUrl : "") ?? "";
          return r;
        },
        file,
      );
      setQrUrl(publicUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="max-w-2xl rounded-2xl border border-ink/10 bg-black/[0.03] p-5 sm:p-6">
      <p className="font-medium text-ink">UPI payment details</p>
      <p className="text-xs text-ink/50">
        Devotees see these when they book a paid seva. They pay from any UPI app, upload the payment screenshot and get their
        ticket straight away; check each screenshot in the log below. Leave everything empty to take payment only at the counter.
      </p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        <div className="shrink-0 text-center">
          <p className="text-left text-sm font-medium text-ink/70">QR code</p>
          <div className="mt-1.5 flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink/20 bg-white">
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview
              <img src={qrUrl} alt="UPI QR code" className="h-full w-full object-contain p-1.5" />
            ) : (
              <span className="px-3 text-xs text-ink/40">No QR uploaded</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadQr} className="hidden" />
          <input type="hidden" name="upiQrUrl" value={qrUrl} />
          <div className="mt-2 flex justify-center gap-3 text-xs font-semibold">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="text-maroon hover:underline disabled:opacity-50">
              {uploading ? "Uploading…" : qrUrl ? "Replace" : "Upload QR"}
            </button>
            {qrUrl ? (
              <button type="button" onClick={() => setQrUrl("")} className="text-ink/50 hover:underline">
                Remove
              </button>
            ) : null}
          </div>
          {uploadError ? <p className="mt-1 text-xs text-red-600">{uploadError}</p> : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="upiId">
              UPI ID
            </label>
            <input id="upiId" name="upiId" defaultValue={settings.upiId} placeholder="templename@okaxis" autoComplete="off" className={`${input} font-mono`} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="upiNumber">
              UPI mobile number
            </label>
            <input id="upiNumber" name="upiNumber" type="tel" defaultValue={settings.upiNumber} placeholder="98XXXXXXXX" className={`${input} font-mono`} />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/70" htmlFor="upiPayeeName">
              Account name shown to devotees
            </label>
            <input id="upiPayeeName" name="upiPayeeName" defaultValue={settings.upiPayeeName} placeholder="Sri Varadaraja Swamy Devasthanam" className={input} />
            <p className="mt-1 text-xs text-ink/45">As it appears in UPI apps, so devotees can check they&apos;re paying the temple.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || uploading}
          className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save UPI details"}
        </button>
        {state?.success ? <span className="text-sm text-green-700">Saved.</span> : null}
        {state?.error ? <span className="text-sm text-red-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
