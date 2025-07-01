import Link from "next/link";
import Image from "next/image";
import { FaTwitter, FaLinkedin, FaGithub, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-t border-neutral-800 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/globe.svg" alt="GoalDigger Logo" width={36} height={36} className="transition-transform group-hover:scale-110" />
            <span className="text-white text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">GoalDigger</span>
          </Link>
          <span className="text-xs text-gray-400 mt-1">Achieve your goals, beautifully.</span>
        </div>
        {/* Navigation Links */}
        <nav className="flex flex-col md:flex-row gap-4 md:gap-8 items-center">
          <Link href="/" className="text-gray-300 hover:text-blue-400 transition">Home</Link>
          <Link href="#features" className="text-gray-300 hover:text-blue-400 transition">Features</Link>
          <Link href="#pricing" className="text-gray-300 hover:text-blue-400 transition">Pricing</Link>
          <Link href="/support" className="text-gray-300 hover:text-blue-400 transition">Support</Link>
        </nav>
        {/* Social Icons */}
        <div className="flex gap-4 items-center">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition text-xl"><FaTwitter /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition text-xl"><FaInstagram /></a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition text-xl"><FaLinkedin /></a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition text-xl"><FaGithub /></a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 border-t border-neutral-800 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <span>&copy; {new Date().getFullYear()} GoalDigger. All rights reserved.</span>
        <span>
          <Link href="/terms" className="hover:text-blue-400 transition">Terms</Link> &middot;{' '}
          <Link href="/support" className="hover:text-blue-400 transition">Support</Link>
        </span>
      </div>
    </footer>
  );
} 