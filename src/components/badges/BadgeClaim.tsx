import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import '@fontsource/bangers';

import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { usePublicBadgeCodes } from '@/hooks/useBadgeCodes';
import type { NIP58BadgeDefinition } from '@/hooks/useNIP58Badges';
import { getAdminPubkeyHex } from '@/lib/adminUtils';
import {
  buildClaimNote,
  claimProof,
  claimTags,
  formatBadgeCode,
  hashBadgeCode,
  normalizeBadgeCode,
  parsePubkey,
  CODE_LENGTH,
} from '@/lib/badgeClaims';

const OWNER = getAdminPubkeyHex();

/** Same look as "Verify my item" on /b: Bangers headings, orange buttons, hard shadows. */
const BANGERS = "font-['Bangers'] italic tracking-wide";
const FIELD =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-[#e87a30] focus:outline-none focus:ring-2 focus:ring-[#e87a30]/40';
const BTN_ORANGE =
  `${BANGERS} rounded-lg bg-[#e87a30] px-6 py-2.5 text-2xl leading-none text-white transition hover:bg-[#d96a20] disabled:cursor-not-allowed disabled:opacity-50`;
const BTN_BLACK =
  `${BANGERS} rounded-lg bg-black px-6 py-2.5 text-2xl leading-none text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50`;

function badgeImage(def: NIP58BadgeDefinition): string | undefined {
  return def.image ?? def.thumbs.find((t) => t.size === '512x512')?.url ?? def.thumbs[0]?.url;
}

export function BadgeClaim({ definitions }: { definitions: NIP58BadgeDefinition[] }) {
  const [params] = useSearchParams();
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isSigning } = useNostrPublish();
  const { data: codes, isLoading: codesLoading, refetch } = usePublicBadgeCodes();

  const [badgeId, setBadgeId] = useState(params.get('badge') ?? 'auto');
  const [code, setCode] = useState(params.get('code') ?? '');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState<{ badgeId: string; code: string } | null>(null);

  const [npub, setNpub] = useState('');
  const [proof, setProof] = useState('');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);

  const def = useMemo(
    () => (verified ? definitions.find((d) => d.id === verified.badgeId) ?? null : null),
    [definitions, verified],
  );
  const pubkeyHex = useMemo(() => parsePubkey(npub), [npub]);

  // Badges that have codes in circulation come first in the list.
  const options = useMemo(() => {
    const live = new Set(Object.keys(codes?.registry ?? {}));
    return [...definitions].sort((a, b) => Number(live.has(b.id)) - Number(live.has(a.id)));
  }, [definitions, codes]);

  const verify = useCallback(async () => {
    setError('');
    setMsg('');
    setSentId(null);
    setVerified(null);

    const norm = normalizeBadgeCode(code);
    if (norm.length !== CODE_LENGTH) {
      setError(`Codes have ${CODE_LENGTH} letters and numbers, like XXXX-XXXX-XXXX-XXXX.`);
      return;
    }

    setChecking(true);
    try {
      // Always check against the newest registry, so a code used a minute ago is already dead.
      const fresh = (await refetch()).data ?? codes;
      const registry = fresh?.registry ?? {};
      const ids = badgeId === 'auto' ? Object.keys(registry) : [badgeId];

      if (Object.keys(registry).length === 0) {
        setError('No claim codes are active right now. Ask BitPopArt for a code.');
        return;
      }

      for (const id of ids) {
        const hash = await hashBadgeCode(id, norm);
        if (registry[id]?.includes(hash)) {
          if (!definitions.some((d) => d.id === id)) {
            setError('That code is real, but its badge could not be loaded. Try again in a moment, or switch relay.');
            return;
          }
          setVerified({ badgeId: id, code: norm });
          return;
        }
      }
      setError(
        badgeId === 'auto'
          ? 'That code did not check out. Check for typos, or it may already have been used.'
          : 'That code does not match this badge. Check for typos, pick another badge, or it may already have been used.',
      );
    } finally {
      setChecking(false);
    }
  }, [code, badgeId, codes, definitions, refetch]);

  // A link like /badges?badge=...&code=... checks itself once the data is in.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (!params.get('code') || codesLoading || definitions.length === 0) return;
    autoRan.current = true;
    void verify();
  }, [params, codesLoading, definitions.length, verify]);

  // Logged in? Use that account.
  useEffect(() => {
    if (user && !npub) setNpub(nip19.npubEncode(user.pubkey));
  }, [user, npub]);

  // The proof is tied to the code AND this npub.
  useEffect(() => {
    let alive = true;
    setProof('');
    if (verified && pubkeyHex) {
      void claimProof(verified.badgeId, verified.code, pubkeyHex).then((p) => {
        if (alive) setProof(p);
      });
    }
    return () => {
      alive = false;
    };
  }, [verified, pubkeyHex]);

  const note = useMemo(() => {
    if (!def || !proof) return '';
    return buildClaimNote({ badgeName: def.name, badgeId: def.id, proof, ownerPubkey: OWNER });
  }, [def, proof]);

  const sign = () => {
    setMsg('');
    if (!def || !pubkeyHex || !proof) return;
    if (!user) {
      setMsg('Log in with your Nostr account first, or copy the note and post it from your Nostr app.');
      return;
    }
    if (user.pubkey !== pubkeyHex) {
      setMsg('You are logged in with a different account than the npub above. Switch accounts, or fix the npub.');
      return;
    }
    createEvent(
      { kind: 1, content: note, tags: claimTags(OWNER, def.id, proof) },
      {
        onSuccess: (ev) => setSentId(ev.id),
        onError: (e) => setMsg('Could not send your claim: ' + e.message),
      },
    );
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setMsg('Copied. Post it as a normal note from your own Nostr app.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMsg('Could not copy automatically. Select the note and copy it by hand.');
    }
  };

  const reset = () => {
    setVerified(null);
    setCode('');
    setError('');
    setMsg('');
    setSentId(null);
  };

  const npubProblem = npub.trim() !== '' && !pubkeyHex;

  return (
    <section
      id="claim"
      className="mx-auto mb-12 max-w-4xl scroll-mt-24 rounded-2xl border-[3px] border-black bg-white p-5 text-neutral-900 shadow-[8px_8px_0_#e87a30] sm:p-8"
    >
      <h2 className={`${BANGERS} text-4xl leading-none text-black sm:text-5xl`}>VERIFY MY BADGE</h2>
      <p className={`${BANGERS} mt-3 text-2xl leading-none text-[#e87a30] sm:text-3xl`}>CLAIM YOUR BADGE</p>
      <p className="mt-4 max-w-2xl text-neutral-600">
        Got a claim code from BitPopArt? Enter it below. If it checks out, you can claim your badge on Nostr and show it
        on your profile.
      </p>

      <form
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <select
          className={FIELD}
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
          aria-label="Badge"
        >
          <option value="auto">Find my badge</option>
          {options.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          className={`${FIELD} font-mono tracking-widest`}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="Claim code"
        />
        <button type="submit" className={BTN_ORANGE} disabled={checking || codesLoading || !code.trim()}>
          {checking ? 'CHECKING…' : 'VERIFY'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {verified && def && (
        <div className="mt-8 grid gap-6 border-t border-neutral-200 pt-8 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-2">
            {badgeImage(def) ? (
              <img
                src={badgeImage(def)}
                alt={def.name}
                className="h-44 w-44 object-contain"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                No image
              </div>
            )}
            <p className="text-center text-sm font-semibold">{def.name}</p>
          </div>

          <div className="min-w-0">
            <h3 className={`${BANGERS} text-3xl leading-none text-black sm:text-4xl`}>CODE CHECKS OUT.</h3>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-neutral-700">
              <li>Fill in your npub.</li>
              <li>Sign your claim with your Nostr account. Your signature is the proof that it is you.</li>
              <li>
                BitPopArt awards you the <b>{def.name}</b> badge. Accept it in your Nostr profile badges.
              </li>
            </ol>

            <label htmlFor="claim-npub" className="mt-5 block text-sm font-medium text-neutral-700">
              Your npub
            </label>
            <input
              id="claim-npub"
              className={`${FIELD} mt-1 font-mono text-sm`}
              type="text"
              value={npub}
              onChange={(e) => {
                setNpub(e.target.value);
                setMsg('');
              }}
              placeholder="npub1..."
              autoComplete="off"
              spellCheck={false}
            />
            <p className={`mt-1 text-xs ${npubProblem ? 'text-red-700' : 'text-neutral-500'}`}>
              {npubProblem
                ? 'That does not look like a valid npub. It starts with npub1.'
                : pubkeyHex
                  ? 'Looks good.'
                  : 'Log in below to fill this in for you.'}
            </p>

            <textarea
              readOnly
              rows={4}
              value={note || 'Enter your npub above and your claim note appears here.'}
              aria-label="Claim note"
              className="mt-3 w-full resize-y rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-neutral-800"
            />

            {sentId ? (
              <p role="status" className="mt-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
                Your claim is signed and sent. BitPopArt will award the badge to your npub, then you accept it in your
                Nostr profile badges.{' '}
                <a
                  className="font-semibold underline"
                  href={`https://njump.me/${nip19.noteEncode(sentId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View your note
                </a>
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={BTN_ORANGE}
                  onClick={sign}
                  disabled={!proof || !user || isSigning}
                >
                  {isSigning ? 'SIGNING…' : 'CLAIM MY BADGE'}
                </button>
                <button type="button" className={BTN_BLACK} onClick={copyNote} disabled={!note}>
                  {copied ? 'COPIED' : 'COPY NOTE'}
                </button>
                {!user && <LoginArea className="max-w-44" />}
              </div>
            )}

            {!user && !sentId && (
              <p className="mt-3 text-xs text-neutral-500">
                No signer here? Use COPY NOTE and post the note from your own Nostr app. It works the same.
              </p>
            )}
            {msg && (
              <p role="status" className="mt-3 text-sm text-neutral-700">
                {msg}
              </p>
            )}

            <button type="button" className="mt-5 text-sm text-neutral-500 underline" onClick={reset}>
              Check another code
            </button>
            <p className="mt-1 text-xs text-neutral-400">Code {formatBadgeCode(verified.code)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
