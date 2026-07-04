import Link from "next/link";
import { 
  Linkedin, Twitter, Youtube, Instagram, Facebook, 
  MessageCircle, Github, Users 
} from "lucide-react"; // Using available lucide icons; TikTok approximated with MessageCircle for demo. Reddit with Users.

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Twitter, href: "https://x.com", label: "X" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: MessageCircle, href: "https://tiktok.com", label: "TikTok" },
  { icon: MessageCircle, href: "https://discord.com", label: "Discord" },
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Users, href: "https://reddit.com", label: "Reddit" },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="font-bold text-lg tracking-[-1px]">FF</span>
              </div>
              <span className="font-semibold text-xl tracking-[-0.5px]">FloorForge</span>
            </div>
            <p className="text-sm text-white/60 max-w-[200px]">
              The operating system for autonomous hardwood floor refinishing.
            </p>
            <div className="mt-6 text-[10px] text-white/40">© {new Date().getFullYear()} InteriorFinish Technologies, Inc.</div>
          </div>

          {/* Product */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Product</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">Features</button></li>
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">How it Works</button></li>
              <li><button onClick={() => document.getElementById('roi')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition">ROI Calculator</button></li>
              <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Solutions</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><span className="hover:text-white transition cursor-pointer">Residential Refinishing</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Commercial Projects</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Historic Restoration</span></li>
              <li><span className="hover:text-white transition cursor-pointer">High-Traffic Floors</span></li>
              <li><Link href="https://dryforge.ai" className="hover:text-white transition" target="_blank">DryForge (Walls)</Link></li>
              <li><Link href="https://paintforge.ai" className="hover:text-white transition" target="_blank">PaintForge (Ceilings)</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Resources</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><Link href="#resources" className="hover:text-white transition">Documentation</Link></li>
              <li><span className="hover:text-white transition cursor-pointer">Case Studies</span></li>
              <li><span className="hover:text-white transition cursor-pointer">API Reference</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Webinars</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Community</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Status</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="font-semibold mb-4 text-sm tracking-wider uppercase text-white/70">Company</div>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li><span className="hover:text-white transition cursor-pointer">About Us</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Careers</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Contact Sales</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Partners</span></li>
              <li><span className="hover:text-white transition cursor-pointer">Trust &amp; Security</span></li>
            </ul>
          </div>
        </div>

        {/* Social Icons - 9 icons exactly as specified */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
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
          
          <div className="text-xs text-white/50 text-center md:text-right">
            Part of the InteriorFinish OS platform • DryForge • PaintForge • FloorForge<br className="md:hidden" /> 
            Enterprise-grade autonomy for the built environment.
          </div>
        </div>
      </div>
    </footer>
  );
}
