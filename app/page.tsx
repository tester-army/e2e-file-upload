import { Uploader } from "@/components/uploader";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center py-e2e-8">
      <div className="mx-auto grid w-full max-w-312 items-center gap-e2e-8 px-e2e-3 md:px-e2e-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-e2e-10">
        <div>
          <p className="type-caption text-e2e-mint">file upload example</p>
          <h1 className="mt-e2e-2 type-h1 text-e2e-off-white">
            file uploads,
            <br />
            tested end to end
          </h1>
          <p className="mt-e2e-3 max-w-120 type-body-l text-e2e-neutral-400">
            images go from your browser straight to Vercel Blob.
          </p>
        </div>

        <Uploader />
      </div>
    </main>
  );
}
