export default function PBASTv2App() {
  const React = window.React;
  const { useMemo, useState } = React;

  const PRIMES = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
    31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  ];

  const [plaintext, setPlaintext] = useState('Kamsis 1');
  const [ciphertext, setCiphertext] = useState('3565E128FA19F3B1');
  const [key, setKey] = useState('carlos');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const removeSpaces = (value) => value.replace(/\s+/g, '');

  const sumKeyASCII = (keyStr) => {
    let sum = 0;
    for (let i = 0; i < keyStr.length; i++) {
      sum += keyStr.charCodeAt(i) & 0xff;
    }
    return sum;
  };

  const reverseBytes = (arr) => [...arr].reverse();

  const bytesToHex = (bytes) =>
    bytes
      .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
      .join('');

  const hexToBytes = (hex) => {
    const cleaned = removeSpaces(hex);
    if (cleaned.length === 0) throw new Error('Ciphertext HEX tidak boleh kosong.');
    if (cleaned.length % 2 !== 0) throw new Error('Panjang HEX harus genap.');
    if (!/^[0-9A-Fa-f]+$/.test(cleaned)) {
      throw new Error('Ciphertext harus berisi karakter HEX valid (0-9, A-F).');
    }
    const result = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      result.push(parseInt(cleaned.slice(i, i + 2), 16));
    }
    return result;
  };

  const encryptPBASTv2 = (plain, keyStr) => {
    if (!keyStr) throw new Error('Key tidak boleh kosong.');
    const bytes = [];
    const keyLen = keyStr.length;
    let state = sumKeyASCII(keyStr) % 256;

    for (let i = 0; i < plain.length; i++) {
      const position = i + 1;
      const p = plain.charCodeAt(i) & 0xff;
      const primeVal = PRIMES[i % PRIMES.length];
      const keyVal = keyStr.charCodeAt(i % keyLen) & 0xff;
      const shift = (primeVal + keyVal + position + state) % 256;

      let temp;
      if (position % 2 === 1) {
        temp = (p + shift) % 256;
      } else {
        temp = (p - shift + 256) % 256;
      }

      const c = temp ^ state;
      bytes.push(c);
      state = (c + keyVal + primeVal + position) % 256;
    }

    return bytesToHex(reverseBytes(bytes));
  };

  const decryptPBASTv2 = (cipherHex, keyStr) => {
    if (!keyStr) throw new Error('Key tidak boleh kosong.');
    const cipherBytes = reverseBytes(hexToBytes(cipherHex));
    const keyLen = keyStr.length;
    let state = sumKeyASCII(keyStr) % 256;
    const chars = [];

    for (let i = 0; i < cipherBytes.length; i++) {
      const position = i + 1;
      const c = cipherBytes[i];
      const primeVal = PRIMES[i % PRIMES.length];
      const keyVal = keyStr.charCodeAt(i % keyLen) & 0xff;
      const shift = (primeVal + keyVal + position + state) % 256;
      const temp = c ^ state;

      let p;
      if (position % 2 === 1) {
        p = (temp - shift + 256) % 256;
      } else {
        p = (temp + shift) % 256;
      }

      chars.push(String.fromCharCode(p));
      state = (c + keyVal + primeVal + position) % 256;
    }

    return chars.join('');
  };

  const statePreview = useMemo(() => {
    if (!key) return 'Key kosong';
    return `${sumKeyASCII(key)} mod 256 = ${sumKeyASCII(key) % 256}`;
  }, [key]);

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('Gagal menyalin');
      setTimeout(() => setCopied(''), 1600);
    }
  };

  const handleEncrypt = () => {
    try {
      setError('');
      const result = encryptPBASTv2(plaintext, key);
      setCiphertext(result);
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan saat enkripsi.');
    }
  };

  const handleDecrypt = () => {
    try {
      setError('');
      const result = decryptPBASTv2(ciphertext, key);
      setPlaintext(result);
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan saat dekripsi.');
    }
  };

  const handleSwap = () => {
    const temp = plaintext;
    setPlaintext(ciphertext);
    setCiphertext(temp);
  };

  const handleReset = () => {
    setPlaintext('Kamsis 1');
    setCiphertext('3565E128FA19F3B1');
    setKey('carlos');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
              PBAST v2 Encryptor / Decryptor
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Website Enkripsi & Dekripsi PBAST v2
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              Antarmuka sederhana untuk mengenkripsi plaintext menjadi ciphertext HEX dan mendekripsi ciphertext HEX kembali ke plaintext menggunakan algoritma Prime-Based Avalanche Shift Transformation v2.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 md:w-auto">
            <button
              onClick={handleEncrypt}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Encrypt
            </button>
            <button
              onClick={handleDecrypt}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Decrypt
            </button>
            <button
              onClick={handleReset}
              className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Input & Output</h2>
                <button
                  onClick={handleSwap}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
                >
                  Tukar kolom
                </button>
              </div>

              <div className="grid gap-5">
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-slate-200">Plaintext</div>
                  <textarea
                    value={plaintext}
                    onChange={(e) => setPlaintext(e.target.value)}
                    rows={7}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Masukkan plaintext di sini"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{plaintext.length} karakter</span>
                    <button onClick={() => copyText(plaintext, 'Plaintext disalin')} className="hover:text-white">
                      Salin plaintext
                    </button>
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 text-sm font-medium text-slate-200">Ciphertext (HEX)</div>
                  <textarea
                    value={ciphertext}
                    onChange={(e) => setCiphertext(removeSpaces(e.target.value).toUpperCase())}
                    rows={7}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Masukkan ciphertext HEX di sini"
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>{removeSpaces(ciphertext).length} digit HEX</span>
                    <button onClick={() => copyText(ciphertext, 'Ciphertext disalin')} className="hover:text-white">
                      Salin ciphertext
                    </button>
                  </div>
                </label>

                <label className="block">
                  <div className="mb-2 text-sm font-medium text-slate-200">Key</div>
                  <input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                    placeholder="Masukkan key"
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    State awal: <span className="font-medium text-slate-200">{statePreview}</span>
                  </div>
                </label>
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              {copied ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {copied}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h2 className="text-lg font-semibold">Cara Pakai</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p>1. Masukkan <span className="font-semibold text-white">plaintext</span> dan <span className="font-semibold text-white">key</span>, lalu klik <span className="font-semibold text-cyan-300">Encrypt</span>.</p>
                <p>2. Masukkan <span className="font-semibold text-white">ciphertext HEX</span> dan <span className="font-semibold text-white">key</span>, lalu klik <span className="font-semibold text-cyan-300">Decrypt</span>.</p>
                <p>3. Ciphertext selalu ditampilkan dalam format HEX tanpa spasi agar rapi dan mudah dipakai kembali.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h2 className="text-lg font-semibold">Ringkasan Algoritma</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <p><span className="font-semibold text-white">Prime-based:</span> memakai deret bilangan prima sebagai komponen shift.</p>
                <p><span className="font-semibold text-white">Avalanche state:</span> setiap karakter memengaruhi state berikutnya.</p>
                <p><span className="font-semibold text-white">Bidirectional shift:</span> posisi ganjil menambah shift, posisi genap mengurangi shift.</p>
                <p><span className="font-semibold text-white">Output profesional:</span> hasil akhir dibalik lalu dikonversi ke HEX.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h2 className="text-lg font-semibold">Contoh Cepat</h2>
              <div className="mt-4 rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">
                <p><span className="font-semibold text-white">Plaintext:</span> Kamsis 1</p>
                <p><span className="font-semibold text-white">Key:</span> carlos</p>
                <p><span className="font-semibold text-white">Ciphertext:</span> 3565E128FA19F3B1</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-xs text-slate-400 shadow-xl">
          Dibuat untuk demonstrasi algoritma kriptografi PBAST v2. Cocok untuk deployment ke Netlify.
        </div>
      </div>
    </div>
  );
}
