"use client";

import { AlarmClockCheck, ArrowLeft, ArrowRight, BanknoteArrowUp, Bug, ChevronsUpDown, CreditCard, Goal, House, LifeBuoy, ListTodo, Loader, LogOut, Mail, MailCheck, MessageSquareMore, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

export default function Sidebar() {

    const { getUser, isLoading } = useKindeBrowserClient();
    const user = getUser();

    // Sidebar opening config
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    }

    const pathname = usePathname();

    // Navigation items
    const navigationItems = useMemo(() => [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: House,
        },
        {
            name: "Tasks",
            href: "/tasks",
            icon: ListTodo,
        },
        {
            name: "Pomodoro",
            href: "/pomodoro",
            icon: AlarmClockCheck,
        },
        {
            name: "Goals",
            href: "/goals",
            icon: Goal,
        },
        {
            name: "Cash Flow",
            href: "/cashflow",
            icon: BanknoteArrowUp,
        },
        {
            name: "Email Checker",
            href: "/email-checker",
            icon: MailCheck,
        },
    ], []);

    // Support Items
    const supportItems = useMemo(() => [
        {
            name: "Report Bug",
            href: "/report-bug",
            icon: Bug,
        },
        {
            name: "Support",
            href: "/support",
            icon: LifeBuoy,
        },
        {
            name: "Rate us",
            href: "/review",
            icon: MessageSquareMore,
        },
    ], []);

    // User items
    const userItems = useMemo(() => [
        {
            name: "Profile",
            href: "/profile",
            icon: User
        },
        {
            name: "Billing",
            href: "/billing",
            icon: CreditCard
        },
        {
            name: "Settings",
            href: "/settings",
            icon: Settings
        },
        {
            name: "Logout",
            href: "/api/auth/logout",
            icon: LogOut
        },
    ], [])

    return (
        <div className={`bg-neutral-800 border-r border-neutral-700 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col h-full`}>
            {/*Sidebar header*/}
            <div className="p-3 border-b border-neutral-700">
                <div className={`flex items-center justify-between ${!sidebarOpen ? "justify-center" : ""}`}>
                    {sidebarOpen && (
                        <h1 className="text-xl font-bold text-white">GoalDigger</h1>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all duration-200"
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {sidebarOpen ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
            {/*Navigation*/}
            <nav className="p-3 space-y-2 border-b border-neutral-700">
                <ul className="flex flex-col gap-3">
                    {navigationItems.map((nav) => {
                        const Icon = nav.icon;
                        const isActive = pathname === nav.href;
                        return (
                            <Link
                                key={nav.name}
                                href={nav.href}
                                className={`flex items-center ${!sidebarOpen ? "justify-center" : ""} gap-3 p-2 rounded-lg transition-all duration-200 group ${isActive
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                    : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                                    }`}
                                title={sidebarOpen ? nav.name : undefined}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="text-sm truncate">{nav.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </ul>
            </nav>
            {/*Support*/}
            <nav className="flex-1 p-3 space-y-2">
                <ul className="flex flex-col gap-3">
                    {supportItems.map((nav) => {
                        const Icon = nav.icon;
                        const isActive = pathname === nav.name;
                        return (
                            <Link
                                key={nav.name}
                                href={nav.href}
                                className={`flex items-center ${!sidebarOpen ? "justify-center" : ""} gap-3 p-2 rounded-lg transition-all duration-200 group ${isActive
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                    : "text-neutral-400 hover:text-white hover:bg-neutral-700/50"
                                    }`}
                                title={sidebarOpen ? nav.name : undefined}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="text-sm truncate">{nav.name}</span>
                                )}
                            </Link>
                        );
                    })}
                </ul>
            </nav>
            {/*User*/}
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="text-white p-2 m-2 outline-0 drop-shadow-xl cursor-pointer rounded-sm hover:bg-gray-500">
                    {
                        !isLoading ? (
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Avatar>
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    {sidebarOpen && (
                                        <span className="text-start">
                                            <h3 className="font-bold">{`${user?.given_name} ${user?.family_name}`}</h3>
                                            <p className="text-xs">Premium Plan</p>
                                        </span>
                                    )}
                                </div>
                                <ChevronsUpDown size={"20"} />
                            </div>
                        ) : (
                            <Loader className="animate-spin" />
                        )
                    }
                </DropdownMenuTrigger>
                <DropdownMenuContent side={sidebarOpen ? "top" : "right"} className={`bg-white ${sidebarOpen && "w-60"}`}>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem className="text-xs flex items-center gap-2 p-2"><Mail size={"15"} /> {user?.email}</DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-500" />
                    <nav className="flex-1 p-3 space-y-2">
                        <ul className="flex flex-col gap-3">
                            {userItems.map((nav) => {
                                const Icon = nav.icon;
                                const isLogout = nav.name === "Logout"
                                return (
                                    <Link
                                        key={nav.name}
                                        href={nav.href}
                                        className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group 
                                            text-neutral-400 hover:text-white hover:bg-neutral-700/50 ${isLogout && (
                                                "hover:bg-red-400"
                                            )}`}
                                        title={sidebarOpen ? nav.name : undefined}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="text-sm truncate">{nav.name}</span>
                                    </Link>
                                );
                            })}
                        </ul>
                    </nav>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}