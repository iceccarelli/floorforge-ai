import Link from "next/link";
import { Github, Mail } from "lucide-react";

const CONTACT_EMAIL = "vince.ceccarelli@gmail.com";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="font-bold text-lg tracking-[-1px]">FF</span>
              </div>
              <span className="font-semibold text-xl tracking-[-0.5px]">FloorForge</span>
            </div>
            <p className="text-sm text-white/60 max-w-[220px]">
              An operating system for autonomous hardwood floor refinishing.
              Early stage — pilot program forming.
            </p>
            <div className="mt-6 text-[10px] text-white/40">
              © {new Date().getFullYear()} FloorForge — a Grimaldi Engineering project.
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Product</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><Link href="/#features" className="hover:text-white transition">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition">How it Works</Link></li>
              <li><Link href="/#roi" className="hover:text-white transition">ROI Model</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition">Planned Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard Preview</Link></li>
            </ul>
          </div>

          {/* Pilot */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Pilot Program</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><Link href="/#waitlist" className="hover:text-white transition">Join the Waitlist</Link></li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Connect</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Mail size={14} /> Email
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/iceccarelli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition inline-flex items-center gap-2"
                >
                  <Github size={14} /> GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 text-xs text-white/50 text-center md:text-left">
          FloorForge is in active development. Pricing, specifications, and features
          described on this site are design targets and are subject to change.
        </div>
      </div>
    </footer>
  );
}
