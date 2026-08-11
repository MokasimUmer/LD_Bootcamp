import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-6">
        <Zap className="w-8 h-8 fill-current" />
      </div>
      <h1 className="text-4xl font-black text-white mb-2">404 - Page Not Found</h1>
      <p className="text-neutral-400 max-w-md mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="primary" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
