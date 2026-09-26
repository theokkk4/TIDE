import { IdentifyFlow } from "@/components/identify/identify-flow";
import { buildDemoScanRecord, getDemoScan } from "@/lib/data/demo";
import { buildSavedScan, getSample } from "@/lib/data/samples";

export const metadata = {
  title: "Identify — TIDE",
};

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; mode?: string; sample?: string }>;
}) {
  const params = await searchParams;
  const demo = params.demo ? getDemoScan(params.demo) : null;
  const demoScan = demo ? buildDemoScanRecord(demo) : null;
  const sample = getSample(params.sample);

  return (
    <IdentifyFlow
      demoScan={demoScan}
      autoOpenPicker={params.mode === "upload"}
      sample={sample ? { photo: sample.photo, saved: buildSavedScan(sample) } : null}
    />
  );
}
