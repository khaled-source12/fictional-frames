
import { createClient } from "@supabase/supabase-js";
import { issues as sampleIssues, type Issue } from "./content";

export async function getPublishedIssues(): Promise<Issue[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return sampleIssues;

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("issues")
    .select(`
      id, slug, title, description, cover_url, created_at,
      photos (
        title, image_url, description, story,
        location, camera, lens, aperture,
        shutter_speed, iso, sort_order, created_at
      )
    `)
    .eq("published", true)
    .eq("photos.published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase content error:", error.message);
    return sampleIssues;
  }

  if (!data?.length) return sampleIssues;

  return data.map((issue, index) => {
    const date = new Date(issue.created_at);
    const photos = [...(issue.photos || [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((photo, photoIndex) => ({
        slug: `${issue.slug}-photo-${photoIndex + 1}`,
        title: photo.title,
        image: photo.image_url,
        location: photo.location || "",
        date: date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        story: photo.story || "",
        idea: photo.description || "",
        camera: photo.camera || "",
        lens: photo.lens || "",
        aperture: photo.aperture || "",
        shutter: photo.shutter_speed || "",
        iso: photo.iso?.toString() || "",
        focalLength: "",
      }));

    return {
      slug: issue.slug,
      number: String(data.length - index).padStart(3, "0"),
      title: issue.title,
      month: date.toLocaleDateString("en-US", {
        month: "long",
      }),
      year: date.getFullYear(),
      subtitle: issue.description || "A photographic journal",
      introduction: issue.description || "",
      cover: issue.cover_url || photos[0]?.image || "",
      photos,
    };
  });
}
