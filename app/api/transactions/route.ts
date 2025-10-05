
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/db/prisma";

// Obter todas as transações do usuário (GET)
export async function GET(req: NextRequest) {
    const userId = req.headers.get("userId");

    if (!userId) {
        return NextResponse.json({message: "userId is required"}, {status: 401});
    }

    try {
        const transactions = await prisma.transaction.findMany({ where: {userId: userId} })

        if (!transactions) {
            return NextResponse.json({message: "No transactions found"}, {status: 404});
        }

        return NextResponse.json(transactions, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}

// Criar uma transação (POST)
export async function POST(req: NextRequest) {
    const {userId, title, amount, category, type, date, description} = await req.json();

    if (!userId || !title || !amount || !type || !date) {
        return NextResponse.json({message: "userId, title, amount, type and date are required"}, {status: 400});
    }

    try {
        const transaction = await prisma.transaction.create({
            data: {
                title,
                amount,
                category,
                type,
                date: new Date(date),
                description,
                user: { connect: { id: userId } }
            },
        });
        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}

// Atualizar uma transação (PUT)
export async function PUT(req: NextRequest) {
    const {transactionId, title, amount, category, type, date, description} = await req.json();

    if (!transactionId) {
        return NextResponse.json({message: "transactionId is required"}, {status: 400});
    }

    const transaction = await prisma.transaction.findUnique({where: {id: transactionId}});

    if (!transaction) {
        return NextResponse.json({message: "Transaction not found"}, {status: 404});
    }
    
    try {
        await prisma.transaction.update({where: {id: transactionId}, data: {title, amount, category, type, date: new Date(date), description}});
        return NextResponse.json({message: "Transaction updated successfully"}, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}

// Apagar uma transação (DELETE)
export async function DELETE(req: NextRequest) {
    const {transactionId} = await req.json();

    if (!transactionId) {
        return NextResponse.json({message: "transactionId is required"}, {status: 400});
    }

    const transaction = await prisma.transaction.findUnique({where: {id: transactionId}});

    if (!transaction) {
        return NextResponse.json({message: "Transaction not found"}, {status: 404});
    }

    try {
        await prisma.transaction.delete({where: {id: transactionId}});
        return NextResponse.json({message: "Transaction deleted successfully"}, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({message: "Internal server error"}, {status: 500});
    }
}