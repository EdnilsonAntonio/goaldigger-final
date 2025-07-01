"use client";

import { LoginLink, LogoutLink, RegisterLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";

export default function Navbar() {

    const { isAuthenticated } = useKindeBrowserClient();

    return (
        <nav className="bg-black p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-lg font-bold">MyApp</Link>
                <ul className="flex space-x-4">
                    {!isAuthenticated ? (
                        <>
                            <li><LoginLink className="text-white hover:text-gray-400">Login</LoginLink></li>
                            <li><RegisterLink className="text-white hover:text-gray-400">Register</RegisterLink></li>
                        </>
                    ) : (
                        <>
                            <li><Link href="/dashboard" className="text-white hover:text-gray-400">Dashboard</Link></li>
                            <li><LogoutLink className="text-white hover:text-gray-400">Logout</LogoutLink></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}