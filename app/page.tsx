import { Uploader } from "@/components/uploader";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
      <div className="mx-auto flex w-full max-w-160 flex-col items-center gap-10">
        <div className="text-center">
          <h1 className="type-h1 text-e2e-text-primary">
            File uploads,
            <br />
            tested end to end
          </h1>
          <p className="mt-4 type-body text-e2e-text-secondary">Images go from your browser straight to Vercel Blob.</p>
        </div>

        <div className="w-full max-w-120">
          <Uploader />
        </div>
      </div>
    </main>
  );
}
