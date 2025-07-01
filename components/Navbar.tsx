"use client";

import { LoginLink, LogoutLink, RegisterLink, useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
    const { isAuthenticated, getUser } = useKindeBrowserClient();
    const user = getUser();

    return (
        <nav className="backdrop-blur-lg bg-black/80 border-b border-neutral-800 shadow-sm sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center py-3 px-4">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image src="/globe.svg" alt="GoalDigger Logo" width={32} height={32} className="transition-transform group-hover:scale-110" />
                    <span className="text-white text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">GoalDigger</span>
                </Link>
                <ul className="flex items-center gap-2 md:gap-4">
                    {!isAuthenticated ? (
                        <>
                            <li>
                                <LoginLink>
                                    <Button variant="ghost" className="text-white hover:text-blue-400 px-4 py-2">Login</Button>
                                </LoginLink>
                            </li>
                            <li>
                                <RegisterLink>
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">Register</Button>
                                </RegisterLink>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/dashboard" className="text-white hover:text-blue-400 px-4 py-2 font-medium transition-colors">Dashboard</Link>
                            </li>
                            <li>
                                <LogoutLink>
                                    <Button variant="ghost" className="text-white hover:text-pink-400 px-4 py-2">Logout</Button>
                                </LogoutLink>
                            </li>
                            <li>
                                <div className="ml-2">
                                    <Avatar className="text-white bg-neutral-800">
                                        <AvatarImage src={user?.picture || undefined} alt={user?.given_name || "User"} />
                                        <AvatarFallback>{`${user?.given_name?.[0]}${user?.family_name?.[0]}`}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}