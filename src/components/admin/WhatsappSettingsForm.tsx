"use client";

import { useActionState, useState, useTransition } from "react";
import { sendWhatsappTest, updateWhatsappSettings } from "@/lib/actions/whatsapp-settings";

const input =
  "mt-1.5 w-full rounded-xl border border-ink/15 bg-black/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-gold";

// The priest's WhatsApp alerts (CallMeBot): the phone that gets a message
// for every booking and accepted payment, and its CallMeBot key. The saved
// key is never sent back to the browser — only its last 4 characters.
export default function WhatsappSettingsForm({ phone, keyHint }: { phone: string; keyHint: string | null }) {
  const [state, formAction, pending] = useActionState(updateWhatsappSettings, undefined);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, startTest] = useTransition();

  return (
    <form action={formAction} className="max-w-2xl rounded-2xl border border-ink/10 bg-black/[0.03] p-5 sm:p-6">
      <p className="font-medium text-ink">WhatsApp alerts to the priest (CallMeBot)</p>
      <p className="text-xs text-ink/50">
        A Kannada WhatsApp message for every new booking and every accepted payment. To get the key, the receiving phone saves
        CallMeBot&apos;s number (see callmebot.com) and WhatsApps it exactly <em>I allow callmebot to send me messages</em> — the
        reply contains the APIKEY.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink/70">
          WhatsApp number
          <input name="phone" defaultValue={phone} inputMode="tel" placeholder="917019106741" className={input} />
          <span className="mt-1 block text-xs font-normal text-ink/45">With country code (91 for India).</span>
        </label>
        <label className="block text-sm font-medium text-ink/70">
          CallMeBot API key
          <input name="apikey" autoComplete="off" placeholder={keyHint ? `Saved (…${keyHint}) — type to replace` : "e.g. 1234567"} className={input} />
          <span className="mt-1 block text-xs font-normal text-ink/45">
            {keyHint ? "Leave empty to keep the saved key." : "No key saved yet — WhatsApp alerts are off."}
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={testing || !keyHint}
          onClick={() => startTest(async () => setTest(await sendWhatsappTest()))}
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-maroon hover:bg-black/[0.03] disabled:opacity-40"
        >
          {testing ? "Sending…" : "Send test message"}
        </button>
        {keyHint ? (
          <button type="submit" name="clearKey" value="1" className="text-xs font-semibold text-ink/50 hover:text-red-700 hover:underline">
            Remove key
          </button>
        ) : null}
        {state?.success ? <span className="text-sm text-green-700">{state.success}</span> : null}
        {state?.error ? <span className="text-sm text-red-600">{state.error}</span> : null}
      </div>
      {test ? <p className={`mt-3 text-sm ${test.ok ? "text-green-700" : "text-red-600"}`}>{test.message}</p> : null}
    </form>
  );
}
