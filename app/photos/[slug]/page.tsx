
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedIssues } from "@/lib/live-content";

export const dynamic = "force-dynamic";

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Load the published issues and photographs from Supabase.
  const issues = await getPublishedIssues();

  let match:
    | {
        photo: (typeof issues)[number]["photos"][number];
        issue: (typeof issues)[number];
      }
    | undefined;

  for (const issue of issues) {
    const photo = issue.photos.find(
      (item) => item.slug === slug
    );

    if (photo) {
      match = { photo, issue };
      break;
    }
  }

  if (!match) {
    notFound();
  }

  const { photo, issue } = match;

  const technicalNotes = [
    ["Camera", photo.camera],
    ["Lens", photo.lens],
    ["Aperture", photo.aperture],
    ["Shutter speed", photo.shutter],
    ["ISO", photo.iso],
    ["Focal length", photo.focalLength],
  ].filter(([, value]) => Boolean(value));

  return (
    <main className="container-site py-16">
      <Link
        href={"/issues/" + issue.slug}
        className="text-xs tracking-widest"
      >
        ← ISSUE {issue.number}
      </Link>

      <p className="eyebrow mt-16 mb-4">
        {[photo.location, photo.date]
          .filter(Boolean)
          .join(" / ")}
      </p>

      <h1 className="text-5xl md:text-7xl mb-12">
        {photo.title}
      </h1>

      
<div className="flex w-full items-center justify-center bg-neutral-100 p-3 md:p-6">
  <img
    src={photo.image}
    alt={photo.title}
    className="block h-auto w-auto max-w-full object-contain"
    style={{ maxHeight: "65vh" }}
  />
</div>


      <div className="grid md:grid-cols-2 gap-12 mt-16">
        <section>
          <p className="eyebrow mb-4">
            Behind the frame
          </p>

          <p className="text-lg leading-8">
            {photo.story}
          </p>

          {photo.idea && (
            <>
              <h2 className="text-2xl mt-12 mb-4">
                The idea
              </h2>

              <p className="text-neutral-600 leading-8">
                {photo.idea}
              </p>
            </>
          )}
        </section>

        <section>
          <p className="eyebrow mb-6">
            Technical notes
          </p>

          <dl className="divide-y divide-black/15">
            {technicalNotes.map(([label, value]) => (
              <div
                className="flex justify-between gap-6 py-4"
                key={label}
              >
                <dt className="text-neutral-500">
                  {label}
                </dt>

                <dd className="text-right">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
