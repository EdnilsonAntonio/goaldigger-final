"use client";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table"
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Pencil, Trash, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertDialogDemo } from "./AlertDialog";
import { useUserPlan } from "./providers/UserProvider";
import jsPDF from "jspdf";


export default function TransactionsTable({ userId }: { userId: string }) {

    const userPlan = useUserPlan();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [newTransaction, setNewTransaction] = useState({
        title: "",
        amount: "",
        category: "",
        type: "income" as "income" | "expense",
        date: "",
        description: "",
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTransaction, setEditTransaction] = useState({
        title: "",
        amount: "",
        category: "",
        type: "income" as "income" | "expense",
        date: "",
        description: "",
    });
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const [currentMonth, setCurrentMonth] = useState<number | null>(null); // 0-11
    const [minYearMonth, setMinYearMonth] = useState<{ year: number; month: number } | null>(null);
    const [maxYearMonth, setMaxYearMonth] = useState<{ year: number; month: number } | null>(null);
    const [availableYearMonths, setAvailableYearMonths] = useState<{ year: number; month: number }[]>([]);
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    
    // Cash Flow Preferences
    const [cashFlowCurrency, setCashFlowCurrency] = useState("USD");
    const [cashFlowNumberFormat, setCashFlowNumberFormat] = useState("1,000.00");
    const [defaultCategories, setDefaultCategories] = useState<string[]>([]);
    const [showCustomCategory, setShowCustomCategory] = useState(false);
    const [showEditCustomCategory, setShowEditCustomCategory] = useState(false);

    interface Transaction {
        id: string;
        title: string;
        amount: number;
        description: string;
        type: "income" | "expense";
        category: string;
        date: Date;
    }

    // Get user transactions
    const getTransactions = async () => {
        const response = await fetch("/api/transactions", {
            method: "GET",
            headers: {
                "content-Type": "application/json",
                "userId": userId
            },
        })
        const data = await response.json();
        // API returns date as string; convert to Date before storing
        const normalized: Transaction[] = (data || []).map((t: any) => ({
            ...t,
            date: new Date(t.date),
        }));
        // Compute month limits and set the latest as current
        if (normalized.length > 0) {
            let min = { year: normalized[0].date.getFullYear(), month: normalized[0].date.getMonth() };
            let max = { year: normalized[0].date.getFullYear(), month: normalized[0].date.getMonth() };
            const seen: Record<string, boolean> = {};
            const yearMonths: { year: number; month: number }[] = [];
            for (const tr of normalized) {
                const y = tr.date.getFullYear();
                const m = tr.date.getMonth();
                if (y < min.year || (y === min.year && m < min.month)) min = { year: y, month: m };
                if (y > max.year || (y === max.year && m > max.month)) max = { year: y, month: m };
                const key = `${y}-${m}`;
                if (!seen[key]) { seen[key] = true; yearMonths.push({ year: y, month: m }); }
            }
            // Sort year/month
            yearMonths.sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year);
            setMinYearMonth(min);
            setMaxYearMonth(max);
            setCurrentYear(max.year);
            setCurrentMonth(max.month);
            setAvailableYearMonths(yearMonths);
        } else {
            setMinYearMonth(null);
            setMaxYearMonth(null);
            setCurrentYear(null);
            setCurrentMonth(null);
            setAvailableYearMonths([]);
        }
        setTransactions(normalized);
        return normalized;
    }

    // Load preferences
    const loadPreferences = async () => {
        try {
            const response = await fetch("/api/preferences");
            if (response.ok) {
                const data = await response.json();
                const prefs = data.preferences;
                if (prefs) {
                    setCashFlowCurrency(prefs.cashFlowDefaultCurrency || "USD");
                    setCashFlowNumberFormat(prefs.cashFlowNumberFormat || "1,000.00");
                    setDefaultCategories(prefs.cashFlowDefaultCategories || []);
                }
            }
        } catch (error) {
            console.error("Error loading preferences:", error);
        }
    };

    useEffect(() => {
        loadPreferences();
        
        // Listen for preference updates
        const handlePreferencesUpdate = () => {
            loadPreferences();
        };
        
        window.addEventListener("preferencesUpdated", handlePreferencesUpdate);
        return () => {
            window.removeEventListener("preferencesUpdated", handlePreferencesUpdate);
        };
    }, []);

    useEffect(() => {
        getTransactions();
    }, [])

    // Helper function to format currency based on preferences
    const formatCurrency = (amount: number): string => {
        // Determine locale based on number format
        const locale = cashFlowNumberFormat === "1.000,00" ? "de-DE" : "en-US";
        
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: cashFlowCurrency,
        }).format(amount);
    };

    // Add transaction
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!newTransaction.title || !newTransaction.amount || !newTransaction.type || !newTransaction.date) {
            setFormError("Fill the title, amount, type and date.");
            return;
        }
        const amountNumber = Number(newTransaction.amount);
        if (Number.isNaN(amountNumber)) {
            setFormError("Invalid ammount");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    userId,
                    title: newTransaction.title,
                    amount: amountNumber,
                    category: newTransaction.category || undefined,
                    type: newTransaction.type,
                    date: newTransaction.date,
                    description: newTransaction.description || undefined,
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || "Falha ao criar transação");
            }
            setNewTransaction({ title: "", amount: "", category: "", type: "income", date: "", description: "" });
            setShowAddForm(false);
            setShowCustomCategory(false);
            await getTransactions();
        } catch (err: any) {
            setFormError(err?.message || "Unexpected error");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Delete transaction
    const handleDelete = async (transactionId: string) => {

        if (!transactionId) {
            toast.error("Transaction ID is required");
            console.error("transactionId is required");
            return;
        }

        try {
            await fetch("/api/transactions", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ transactionId })
            });
            getTransactions();
            toast.success("Transaction deleted Successfully");
        } catch (error) {
            toast.error("Error deleting the transaction")
            console.error("Error: " + error);
        }

    }

    // Open edit form with prefilled data
    const openEditForm = (t: Transaction) => {
        setShowAddForm(false);
        setEditingId(t.id);
        setFormError(null);
        const category = t.category || "";
        // Verificar se a categoria atual está nas categorias padrão
        const isDefaultCategory = defaultCategories.length > 0 && defaultCategories.includes(category);
        setShowEditCustomCategory(!isDefaultCategory && category.trim() !== "");
        setEditTransaction({
            title: t.title,
            amount: String(t.amount),
            category: category,
            type: t.type,
            date: new Date(t.date).toISOString().slice(0, 10),
            description: t.description || "",
        });
    }

    // Submit edit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        setFormError(null);
        if (!editTransaction.title || !editTransaction.amount || !editTransaction.type || !editTransaction.date) {
            setFormError("Fill the title, amount, type and date.");
            return;
        }
        const amountNumber = Number(editTransaction.amount);
        if (Number.isNaN(amountNumber)) {
            setFormError("Invalid ammount");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/transactions", {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    transactionId: editingId,
                    title: editTransaction.title,
                    amount: amountNumber,
                    category: editTransaction.category || undefined,
                    type: editTransaction.type,
                    date: editTransaction.date,
                    description: editTransaction.description || undefined,
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.message || "Falha ao atualizar transação");
            }
            setEditingId(null);
            setShowEditCustomCategory(false);
            await getTransactions();
            toast.success("Transaction updated Successfully");
        } catch (err: any) {
            setFormError(err?.message || "Unexpected error");
        } finally {
            setIsSubmitting(false);
        }
    }

    const filteredTransactions = transactions.filter(t => {
        if (currentYear === null || currentMonth === null) return true;
        return t.date.getFullYear() === currentYear && t.date.getMonth() === currentMonth;
    });

    const monthIncome = filteredTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
    const monthExpensesAbs = filteredTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    const monthNet = monthIncome - monthExpensesAbs;

    const prevBalance = (() => {
        if (currentYear === null || currentMonth === null) return 0;
        const monthStart = new Date(currentYear, currentMonth, 1);
        return transactions
            .filter(t => t.date < monthStart)
            .reduce((sum, t) => sum + (t.type === "expense" ? -t.amount : t.amount), 0);
    })();

    const currentWithPrev = prevBalance + monthNet;

    const availableYears = Array.from(new Set(availableYearMonths.map(x => x.year)));
    const availableMonthsForYear = (year: number | null) => {
        if (year === null) return [] as number[];
        return availableYearMonths.filter(x => x.year === year).map(x => x.month);
    };

    const maxExportMonths = userPlan === "pro" ? 12 : userPlan === "plus" ? 2 : 0;

    const handleExportPDF = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        const start = new Date(exportStartDate);
        const end = new Date(exportEndDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            toast.error("Start date must be before end date");
            return;
        }

        const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        if (monthsDiff > maxExportMonths) {
            toast.error(`Your plan allows exporting up to ${maxExportMonths} months. Please select a shorter period.`);
            return;
        }

        const filtered = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= start && d <= end;
        });

        if (filtered.length === 0) {
            toast.error("No transactions found in the selected period");
            return;
        }

        setIsExporting(true);

        try {
            const doc = new jsPDF();
            let yPos = 20;

            // Load and add logo
            const logoPath = "/branding/Transparent Colored Symbol.png";
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            await new Promise<void>((resolve, reject) => {
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const imgData = canvas.toDataURL("image/png");
                            // Add logo at top right, 15mm height
                            const logoHeight = 15;
                            const logoWidth = (img.width / img.height) * logoHeight;
                            doc.addImage(imgData, "PNG", 190 - logoWidth - 14, 10, logoWidth, logoHeight);
                        }
                        resolve();
                    } catch (error) {
                        console.warn("Could not add logo to PDF:", error);
                        resolve(); // Continue without logo
                    }
                };
                img.onerror = () => {
                    console.warn("Could not load logo image");
                    resolve(); // Continue without logo
                };
                img.src = logoPath;
            });

            doc.setFontSize(18);
            doc.text("Transaction Report", 14, yPos);
            yPos += 10;

            doc.setFontSize(10);
            doc.text(`Period: ${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`, 14, yPos);
            yPos += 8;

            const income = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
            const expenses = filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
            const net = income - expenses;

            doc.setFontSize(12);
            doc.text("Summary", 14, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.text(`Income: ${formatCurrency(income)}`, 14, yPos);
            yPos += 6;
            doc.text(`Expenses: ${formatCurrency(expenses)}`, 14, yPos);
            yPos += 6;
            doc.text(`Net: ${formatCurrency(net)}`, 14, yPos);
            yPos += 10;

            doc.setFontSize(12);
            doc.text("Transactions", 14, yPos);
            yPos += 7;

            doc.setFontSize(9);
            const headers = ["Date", "Title", "Category", "Type", "Amount"];
            const colWidths = [30, 60, 40, 25, 35];
            let xPos = 14;

            headers.forEach((header, i) => {
                doc.text(header, xPos, yPos);
                xPos += colWidths[i];
            });
            yPos += 5;

            doc.setLineWidth(0.1);
            doc.line(14, yPos, 190, yPos);
            yPos += 5;

            filtered.sort((a, b) => a.date.getTime() - b.date.getTime()).forEach((t) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                const dateStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(t.date);
                const amountStr = formatCurrency(t.type === "expense" ? -t.amount : t.amount);

                xPos = 14;
                doc.text(dateStr, xPos, yPos);
                xPos += colWidths[0];
                doc.text(t.title.length > 25 ? t.title.substring(0, 22) + "..." : t.title, xPos, yPos);
                xPos += colWidths[1];
                doc.text(t.category || "-", xPos, yPos);
                xPos += colWidths[2];
                doc.text(t.type, xPos, yPos);
                xPos += colWidths[3];
                doc.text(amountStr, xPos, yPos);
                yPos += 6;
            });

            const fileName = `transaction-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success("PDF exported successfully");
            setShowExportDialog(false);
            setExportStartDate("");
            setExportEndDate("");
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Transactions</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-md border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
                            onClick={() => {
                                if (currentYear === null || currentMonth === null || !minYearMonth) return;
                                let y = currentYear, m = currentMonth - 1;
                                if (m < 0) { m = 11; y = y - 1; }
                                if (y < minYearMonth.year || (y === minYearMonth.year && m < minYearMonth.month)) return;
                                setCurrentYear(y); setCurrentMonth(m);
                            }}
                            disabled={currentYear === null || currentMonth === null || (!!minYearMonth && currentYear === minYearMonth.year && currentMonth === minYearMonth.month)}
                        >
                            <ChevronLeft />
                        </Button>
                        <span className="text-sm text-neutral-300 min-w-[8rem] text-center">
                            {currentYear !== null && currentMonth !== null ? new Date(currentYear, currentMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-md border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
                            onClick={() => {
                                if (currentYear === null || currentMonth === null || !maxYearMonth) return;
                                let y = currentYear, m = currentMonth + 1;
                                if (m > 11) { m = 0; y = y + 1; }
                                if (y > maxYearMonth.year || (y === maxYearMonth.year && m > maxYearMonth.month)) return;
                                setCurrentYear(y); setCurrentMonth(m);
                            }}
                            disabled={currentYear === null || currentMonth === null || (!!maxYearMonth && currentYear === maxYearMonth.year && currentMonth === maxYearMonth.month)}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                    <div className="hidden md:flex items-center gap-2 ml-2">
                        <select
                            className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={currentYear ?? ''}
                            onChange={(e) => {
                                const y = e.target.value ? Number(e.target.value) : null;
                                if (y === null) return;
                                const months = availableMonthsForYear(y);
                                let m = currentMonth;
                                if (m === null || !months.includes(m)) {
                                    m = months.length ? months[0] : 0;
                                }
                                setCurrentYear(y);
                                setCurrentMonth(m);
                            }}
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <select
                            className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={currentMonth ?? ''}
                            onChange={(e) => {
                                const m = e.target.value ? Number(e.target.value) : null;
                                if (m === null) return;
                                setCurrentMonth(m);
                            }}
                        >
                            {availableMonthsForYear(currentYear).map(m => (
                                <option key={m} value={m}>{new Date(2000, m, 1).toLocaleDateString("en-US", { month: "long" })}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowExportDialog(true)} variant="outline" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700">
                        <FileText size={18} />
                        <span className="hidden sm:inline">Export PDF</span>
                    </Button>
                    <Button onClick={() => setShowAddForm((v) => !v)} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all duration-200 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
                        {showAddForm ? "Cancel" : "Add transaction"}
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-4">
                    <div className="text-xs text-neutral-400">Previous balance</div>
                    <div className="text-lg font-semibold">{formatCurrency(prevBalance)}</div>
                </div>
                <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-4">
                    <div className="text-xs text-neutral-400">Income</div>
                    <div className="text-lg font-semibold text-green-400">{formatCurrency(monthIncome)}</div>
                </div>
                <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-4">
                    <div className="text-xs text-neutral-400">Expenses</div>
                    <div className="text-lg font-semibold text-red-400">{formatCurrency(monthExpensesAbs)}</div>
                </div>
                <div className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-4">
                    <div className="text-xs text-neutral-400">Month balance (incl. previous)</div>
                    <div className="text-lg font-semibold">{formatCurrency(currentWithPrev)}</div>
                </div>
            </div>
            {showAddForm && !editingId && (
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-6 p-4 rounded-xl border border-neutral-700 bg-neutral-800/50">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="title">Title</Label>
                        <input id="title" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={newTransaction.title} onChange={(e) => setNewTransaction({ ...newTransaction, title: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="category">Category</Label>
                        {!showCustomCategory && defaultCategories.length > 0 ? (
                            <select
                                id="category"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={newTransaction.category || ""}
                                onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                        setShowCustomCategory(true);
                                        setNewTransaction({ ...newTransaction, category: "" });
                                    } else {
                                        setNewTransaction({ ...newTransaction, category: e.target.value });
                                    }
                                }}
                            >
                                <option value="">Select a category</option>
                                {defaultCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="__custom__">+ Custom Category</option>
                            </select>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {defaultCategories.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowCustomCategory(false);
                                            setNewTransaction({ ...newTransaction, category: "" });
                                        }}
                                        className="whitespace-nowrap self-start"
                                    >
                                        Use Default
                                    </Button>
                                )}
                                <input
                                    id="category"
                                    className="w-full px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Enter category"
                                    value={newTransaction.category}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="type">Type</Label>
                        <select id="type" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={newTransaction.type} onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as "income" | "expense" })}>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <input id="amount" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="number" step="0.01" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="date">Date</Label>
                        <input id="date" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="date" value={newTransaction.date} onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-6">
                        <Label htmlFor="description">Description</Label>
                        <input id="description" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Optional" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} />
                    </div>
                    {formError && <span className="text-red-600 text-sm md:col-span-6">{formError}</span>}
                    <div className="md:col-span-6">
                        <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving..." : "Save"}</Button>
                    </div>
                </form>
            )}
            {editingId && (
                <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-6 p-4 rounded-xl border border-neutral-700 bg-neutral-800/50">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <input id="edit-title" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={editTransaction.title} onChange={(e) => setEditTransaction({ ...editTransaction, title: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-category">Category</Label>
                        {!showEditCustomCategory && defaultCategories.length > 0 ? (
                            <select
                                id="edit-category"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                value={editTransaction.category || ""}
                                onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                        setShowEditCustomCategory(true);
                                        setEditTransaction({ ...editTransaction, category: "" });
                                    } else {
                                        setEditTransaction({ ...editTransaction, category: e.target.value });
                                    }
                                }}
                            >
                                <option value="">Select a category</option>
                                {defaultCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="__custom__">+ Custom Category</option>
                            </select>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {defaultCategories.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowEditCustomCategory(false);
                                            setEditTransaction({ ...editTransaction, category: "" });
                                        }}
                                        className="whitespace-nowrap self-start"
                                    >
                                        Use Default
                                    </Button>
                                )}
                                <input
                                    id="edit-category"
                                    className="w-full px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="Enter category"
                                    value={editTransaction.category}
                                    onChange={(e) => setEditTransaction({ ...editTransaction, category: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-type">Type</Label>
                        <select id="edit-type" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" value={editTransaction.type} onChange={(e) => setEditTransaction({ ...editTransaction, type: e.target.value as "income" | "expense" })}>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-amount">Amount</Label>
                        <input id="edit-amount" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="number" step="0.01" value={editTransaction.amount} onChange={(e) => setEditTransaction({ ...editTransaction, amount: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="edit-date">Date</Label>
                        <input id="edit-date" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" type="date" value={editTransaction.date} onChange={(e) => setEditTransaction({ ...editTransaction, date: e.target.value })} />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-6">
                        <Label htmlFor="edit-description">Description</Label>
                        <input id="edit-description" className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Optional" value={editTransaction.description} onChange={(e) => setEditTransaction({ ...editTransaction, description: e.target.value })} />
                    </div>
                    {formError && <span className="text-red-600 text-sm md:col-span-6">{formError}</span>}
                    <div className="flex items-center gap-2 md:col-span-6">
                        <Button disabled={isSubmitting} type="submit">{isSubmitting ? "Saving..." : "Save changes"}</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditingId(null);
                                setShowEditCustomCategory(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}
            {showExportDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-white mb-4">Export Transaction Report</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="export-start">Start Date</Label>
                                <input
                                    id="export-start"
                                    type="date"
                                    className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={exportStartDate}
                                    onChange={(e) => setExportStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="export-end">End Date</Label>
                                <input
                                    id="export-end"
                                    type="date"
                                    className="px-3 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={exportEndDate}
                                    onChange={(e) => setExportEndDate(e.target.value)}
                                />
                            </div>
                            <div className="text-xs text-neutral-400">
                                {maxExportMonths > 0 ? `Your plan allows exporting up to ${maxExportMonths} months.` : "Please upgrade your plan to export reports."}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowExportDialog(false);
                                        setExportStartDate("");
                                        setExportEndDate("");
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleExportPDF}
                                    disabled={isExporting || maxExportMonths === 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {isExporting ? "Exporting..." : "Export PDF"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Table className="table-fixed w-full">
                <TableCaption>List of your recent transactions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[28%] whitespace-nowrap">Transaction</TableHead>
                        <TableHead className="w-[12%] whitespace-nowrap">Date</TableHead>
                        <TableHead className="w-[14%] whitespace-nowrap">Category</TableHead>
                        <TableHead className="w-[10%] whitespace-nowrap">Type</TableHead>
                        <TableHead className="w-[14%] whitespace-nowrap">Ammount</TableHead>
                        <TableHead className="w-[14%] whitespace-nowrap">Description</TableHead>
                        <TableHead className="w-[8%] whitespace-nowrap text-right pr-2">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="font-medium max-w-[0] sm:max-w-[10rem] md:max-w-[16rem] truncate">{transaction.title}</TableCell>
                            <TableCell className="whitespace-nowrap">{new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(transaction.date)}</TableCell>
                            <TableCell className="truncate max-w-[0] sm:max-w-[8rem]">{transaction.category}</TableCell>
                            <TableCell className="whitespace-nowrap">{transaction.type}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatCurrency(transaction.type === "expense" ? -transaction.amount : transaction.amount)}</TableCell>
                            <TableCell className="truncate max-w-[0] sm:max-w-[10rem] md:max-w-[14rem]">{transaction.description}</TableCell>
                            <TableCell className="flex gap-2 justify-end pr-2">
                                <Button onClick={() => openEditForm(transaction)} variant="outline" size="icon" className="rounded-md border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700">
                                    <Pencil />
                                </Button>
                                <AlertDialogDemo
                                    contentClassName="sm:max-w-[425px]"
                                    trigger={<Trash />}
                                    title="Are you sure?"
                                    description="You can always edit the transaction instead of deleting it."
                                    cancel="Cancel"
                                    proceed="Delete"
                                    onProceed={() => handleDelete(transaction.id)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="bg-neutral-900/60">
                    <TableRow>
                        <TableCell colSpan={7} className="p-0">
                            <div className="h-4 border-t border-neutral-700" />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={7} className="pt-2 pb-1 text-xs uppercase tracking-wide text-neutral-500">
                            Summary
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={6} className="text-neutral-400">Monthly subtotal</TableCell>
                        <TableCell className="text-right text-neutral-300">
                            {formatCurrency(monthNet)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={6} className="text-neutral-400">Previous balance</TableCell>
                        <TableCell className="text-right text-neutral-300">
                            {formatCurrency(prevBalance)}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={6} className="text-neutral-400">Month balance (incl. previous)</TableCell>
                        <TableCell className="text-right text-neutral-300">
                            {formatCurrency(currentWithPrev)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    )
}