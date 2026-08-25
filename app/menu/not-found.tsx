export default function MenuNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#171613] px-6 text-[#f3f1eb]">
      <div className="max-w-md text-center">
        <p className="font-brand text-5xl italic">Ay&apos;la</p>
        <h1 className="mt-6 text-xl">Geçersiz masa QR kodu</h1>
        <p className="mt-3 text-sm text-white/45">
          Lütfen masanızdaki QR kodu tekrar okutun veya garsondan yardım isteyin.
        </p>
      </div>
    </div>
  );
}
