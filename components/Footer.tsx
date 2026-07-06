import Link from "next/link";
import { Mail } from "lucide-react";
import {
  FaLinkedinIn, FaXTwitter, FaYoutube, FaInstagram, FaFacebookF,
  FaTiktok, FaDiscord, FaGithub, FaRedditAlien,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const CONTACT_EMAIL = "vince.ceccarelli@gmail.com";

/**
 * The 9 primary social channels. An icon is rendered ONLY when its URL is
 * filled in — linking customers to platform homepages (or to accounts that
 * don't exist yet) reads as a broken site. Create the profile, paste the
 * URL here, and the icon appears automatically.
 */
const socialLinks: { icon: IconType; label: string; href: string }[] = [
  { icon: FaLinkedinIn, label: "LinkedIn", href: "" },
  { icon: FaXTwitter, label: "X", href: "" },
  { icon: FaYoutube, label: "YouTube", href: "" },
  { icon: FaInstagram, label: "Instagram", href: "" },
  { icon: FaFacebookF, label: "Facebook", href: "" },
  { icon: FaTiktok, label: "TikTok", href: "" },
  { icon: FaDiscord, label: "Discord", href: "" },
  { icon: FaGithub, label: "GitHub", href: "https://github.com/iceccarelli" },
  { icon: FaRedditAlien, label: "Reddit", href: "" },
];

export default function Footer() {
  const activeSocials = socialLinks.filter((s) => s.href);

  return (
    <footer className="bg-primary text-primary-foreground border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
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
              <li><Link href="/simulator" className="hover:text-white transition">3D Simulator</Link></li>
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

          {/* Connect */}
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
              {activeSocials.map((social) => {
                const Icon = social.icon;
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition inline-flex items-center gap-2"
                    >
                      <Icon size={14} /> {social.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Social icon bar + legal strip — AWS-style bottom band */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {activeSocials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors p-1"
                  aria-label={social.label}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
          <div className="text-xs text-white/50 text-center md:text-right max-w-xl">
            FloorForge is in active development. Pricing, specifications, and features
            described on this site are design targets and subject to change.
          </div>
        </div>
      </div>
    </footer>
  );
}
