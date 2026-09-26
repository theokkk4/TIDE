import { IdentifyFlow } from "@/components/identify/identify-flow";
import { buildDemoScanRecord, getDemoScan } from "@/lib/data/demo";

export const metadata = {
  title: "Identify — TIDE",
};

export default async function IdentifyPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const demo = params.demo ? getDemoScan(params.demo) : null;
  const demoScan = demo ? buildDemoScanRecord(demo) : null;

  return <IdentifyFlow demoScan={demoScan} autoOpenPicker={params.mode === "upload"} />;
}
