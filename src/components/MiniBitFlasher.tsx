import { useEffect, useRef, useState } from 'react';

const MANIFEST_URL = '/bitbot/minibit/firmware/manifest.json';

type Part = { path: string; offset: number };
type Manifest = { version: string; parts: Part[] };
type Phase = 'idle' | 'connecting' | 'flashing' | 'done' | 'error';

function isManifest(v: unknown): v is Manifest {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as { version?: unknown; parts?: unknown };
  return (
    typeof m.version === 'string' &&
    Array.isArray(m.parts) &&
    m.parts.length > 0 &&
    m.parts.every((p) => {
      const q = p as { path?: unknown; offset?: unknown };
      return typeof q.path === 'string' && typeof q.offset === 'number';
    })
  );
}

function parseOffset(text: string): number | null {
  const t = text.trim().toLowerCase();
  if (!/^(0x[0-9a-f]+|\d+)$/.test(t)) return null;
  const n = t.startsWith('0x') ? parseInt(t.slice(2), 16) : parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Web flasher for MiniBit (ESP32-S3). Uses the browser's Web Serial API
 * through esptool-js, so nothing is installed and nothing leaves the browser.
 */
export function MiniBitFlasher() {
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestChecked, setManifestChecked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [offsetText, setOffsetText] = useState('0x0');
  const [eraseAll, setEraseAll] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const ctl = new AbortController();
    fetch(MANIFEST_URL, { signal: ctl.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: unknown) => {
        if (isManifest(j)) setManifest(j);
      })
      .catch(() => undefined)
      .finally(() => setManifestChecked(true));
    return () => ctl.abort();
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const busy = phase === 'connecting' || phase === 'flashing';
  const addLog = (line: string) => setLog((l) => [...l.slice(-199), line]);

  const flash = async (
    parts: { data: Uint8Array; address: number }[],
    label: string,
  ) => {
    setLog([]);
    setProgress(0);
    setMessage('');
    setPhase('connecting');
    let transport: import('esptool-js').Transport | null = null;
    try {
      const { ESPLoader, Transport } = await import('esptool-js');
      const port = await navigator.serial.requestPort();
      transport = new Transport(port, false);
      const loader = new ESPLoader({
        transport,
        baudrate: 460800,
        terminal: {
          clean: () => setLog([]),
          writeLine: (d: string) => addLog(d),
          write: (d: string) => addLog(d),
        },
      });
      const chip = await loader.main();
      addLog(`Connected: ${chip}`);
      if (!/ESP32-S3/i.test(chip)) {
        throw new Error(`This is ${chip}. MiniBit uses an ESP32-S3, so nothing was written.`);
      }
      setPhase('flashing');
      addLog(`Writing ${label} ...`);
      await loader.writeFlash({
        fileArray: parts,
        flashMode: 'keep',
        flashFreq: 'keep',
        flashSize: 'keep',
        eraseAll,
        compress: true,
        reportProgress: (i, written, total) => {
          const done = (i + written / total) / parts.length;
          setProgress(Math.round(done * 100));
        },
      });
      await loader.after('hard_reset');
      setProgress(100);
      setPhase('done');
      setMessage('Done. MiniBit restarts with the new firmware. You can unplug it now.');
    } catch (e) {
      setPhase('error');
      const text = e instanceof Error ? e.message : String(e);
      setMessage(
        /No port selected|cancel/i.test(text)
          ? 'No device chosen. Pick MiniBit in the list to continue.'
          : `${text} If MiniBit is not found, hold the BOOT button while plugging in USB, then try again.`,
      );
    } finally {
      try {
        await transport?.disconnect();
      } catch {
        /* already closed */
      }
    }
  };

  const flashOfficial = async () => {
    if (!manifest) return;
    try {
      const parts = await Promise.all(
        manifest.parts.map(async (p) => {
          const r = await fetch(`/bitbot/minibit/firmware/${p.path}`);
          if (!r.ok) throw new Error(`Could not download ${p.path}.`);
          return { data: new Uint8Array(await r.arrayBuffer()), address: p.offset };
        }),
      );
      await flash(parts, `official firmware ${manifest.version}`);
    } catch (e) {
      setPhase('error');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const flashOwn = async () => {
    const address = parseOffset(offsetText);
    if (!file) return;
    if (address === null) {
      setPhase('error');
      setMessage('The offset must be a number like 0x0 or 0x10000.');
      return;
    }
    const data = new Uint8Array(await file.arrayBuffer());
    await flash([{ data, address }], file.name);
  };

  if (!supported) {
    return (
      <div className="flash">
        <p className="fnote">
          Flashing needs Chrome or Edge on a computer (Web Serial). This browser does not offer it. Open this page in
          Chrome or Edge, plug MiniBit in with USB-C and come back.
        </p>
      </div>
    );
  }

  return (
    <div className="flash">
      <ol className="fsteps">
        <li>Plug MiniBit into your computer with USB-C.</li>
        <li>Press a button below and choose MiniBit in the list that opens.</li>
        <li>Wait until it says Done. Do not unplug while it writes.</li>
      </ol>

      <div className="fbox">
        <div className="fh">Official firmware</div>
        {manifest ? (
          <>
            <div className="fd">Version {manifest.version}</div>
            <button className="fbtn" disabled={busy} onClick={flashOfficial}>
              Flash MiniBit
            </button>
          </>
        ) : (
          <div className="fd">
            {manifestChecked
              ? 'No official build is published yet. You can still flash your own file below.'
              : 'Checking for the latest build ...'}
          </div>
        )}
      </div>

      <div className="fbox">
        <div className="fh">Your own firmware</div>
        <div className="fd">
          Choose a .bin file. A merged image (for example firmware.factory.bin) goes to 0x0. For separate files, flash
          one at a time with its offset.
        </div>
        <div className="frow">
          <input
            type="file"
            accept=".bin,application/octet-stream"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={busy}
            aria-label="Firmware file"
          />
          <label className="foff">
            offset
            <input
              type="text"
              value={offsetText}
              onChange={(e) => setOffsetText(e.target.value)}
              disabled={busy}
              spellCheck={false}
              aria-label="Flash offset"
            />
          </label>
          <button className="fbtn" disabled={busy || !file} onClick={flashOwn}>
            Flash file
          </button>
        </div>
      </div>

      <label className="fchk">
        <input type="checkbox" checked={eraseAll} onChange={(e) => setEraseAll(e.target.checked)} disabled={busy} />
        Erase all flash first (wipes saved settings)
      </label>

      {phase !== 'idle' && (
        <div className="fstat" role="status" aria-live="polite">
          <div className="fbar">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className={`fmsg ${phase}`}>
            {phase === 'connecting' && 'Connecting ...'}
            {phase === 'flashing' && `Writing ${progress}%`}
            {(phase === 'done' || phase === 'error') && message}
          </div>
          {log.length > 0 && <pre ref={logRef}>{log.join('\n')}</pre>}
        </div>
      )}
    </div>
  );
}
