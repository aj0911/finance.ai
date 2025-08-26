"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Send,
  Bot,
  User,
  TrendingUp,
  Target,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/app-layout";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface FinancialData {
  totalExpenses: number;
  totalSavings: number;
  expensesByCategory: Record<string, number>;
  recentExpenses: any[];
  savingsGoals: any[];
}

const mockFinancialData: FinancialData = {
  totalExpenses: 45000,
  totalSavings: 25000,
  expensesByCategory: {
    Food: 15000,
    Transportation: 8000,
    Entertainment: 5000,
    Shopping: 7000,
    Bills: 10000,
  },
  recentExpenses: [
    {
      id: "1",
      amount: 500,
      category: "Food",
      description: "Lunch",
      date: new Date(),
    },
    {
      id: "2",
      amount: 1200,
      category: "Transportation",
      description: "Fuel",
      date: new Date(),
    },
    {
      id: "3",
      amount: 800,
      category: "Entertainment",
      description: "Movie",
      date: new Date(),
    },
  ],
  savingsGoals: [
    {
      id: "1",
      title: "Emergency Fund",
      targetAmount: 50000,
      currentAmount: 15000,
    },
    { id: "2", title: "Vacation", targetAmount: 30000, currentAmount: 10000 },
  ],
};

export default function AIOptimizerPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null
  );
  const [usingMockData, setUsingMockData] = useState(false);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      const expensesQuery = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        limit(50)
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expenses = expensesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const goalsQuery = query(
        collection(db, "savingsGoals"),
        where("userId", "==", user.uid)
      );
      const goalsSnapshot = await getDocs(goalsQuery);
      const goals = goalsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const totalSavings = goals.reduce(
        (sum, goal) => sum + (goal.currentAmount || 0),
        0
      );

      const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      setFinancialData({
        totalExpenses,
        totalSavings,
        expensesByCategory,
        recentExpenses: expenses.slice(0, 10),
        savingsGoals: goals,
      });
      setUsingMockData(false);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      setFinancialData(mockFinancialData);
      setUsingMockData(true);
      toast.error(
        "Unable to fetch original data from database. Showing mock data for demonstration."
      );
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || !financialData) return;
  
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  
    // Temporary AI loader message
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(true);
  
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
      // Financial context
      const financialContext = `
  User's Financial Data:
  - Total Monthly Expenses: ₹${financialData.totalExpenses.toLocaleString()}
  - Total Savings: ₹${financialData.totalSavings.toLocaleString()}
  - Active Savings Goals: ${financialData.savingsGoals.length}
  
  Expense Breakdown by Category:
  ${Object.entries(financialData.expensesByCategory)
    .map(([category, amount]) => `- ${category}: ₹${amount.toLocaleString()}`)
    .join("\n")}
  
  Recent Expenses (last 10):
  ${financialData.recentExpenses
    .map(
      (expense) =>
        `- ${expense.category}: ₹${expense.amount} (${
          expense.description || "No description"
        })`
    )
    .join("\n")}
  
  Savings Goals:
  ${financialData.savingsGoals
    .map(
      (goal) =>
        `- ${goal.title}: ₹${goal.currentAmount || 0} / ₹${
          goal.targetAmount
        } (${Math.round(
          ((goal.currentAmount || 0) / goal.targetAmount) * 100
        )}% complete)`
    )
    .join("\n")}
  `;
  
      const prompt = `
  You are a professional financial advisor AI assistant. Analyze the user's financial data and provide personalized, actionable advice.
  
  ${financialContext}
  
  User's Question: ${input}
  
  Please provide:
  1. Specific, actionable advice based on their actual spending patterns
  2. Concrete savings suggestions with estimated amounts
  3. Budget optimization recommendations
  4. Goal-oriented financial strategies
  
  Keep your response conversational, encouraging, and practical. Use Indian Rupees (₹) for all amounts.
  Focus on realistic, achievable improvements rather than drastic changes.
  `;
  
      // STREAM RESPONSE
      const streamResult = await model.generateContentStream(prompt);
  
      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessage.id
                ? { ...msg, content: msg.content + text }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error streaming message:", error);
      toast.error("Failed to get AI response. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "How can I save more money this month?",
    "Analyze my spending patterns",
    "What's my biggest expense category?",
    "Help me optimize my budget",
  ];

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-black text-foreground">
              AI Savings Optimizer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Get personalized financial advice powered by AI
          </p>
        </motion.div>

        {usingMockData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      Using Demo Data
                    </p>
                    <p className="text-amber-600 dark:text-amber-400 text-sm opacity-80">
                      Unable to fetch your original data from the database.
                      Showing mock data for demonstration purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {financialData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Card className="glass-strong border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Total Expenses
                    </p>
                    <p className="text-2xl font-serif font-bold text-foreground">
                      ₹{financialData.totalExpenses.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Total Savings
                    </p>
                    <p className="text-2xl font-serif font-bold text-foreground">
                      ₹{financialData.totalSavings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-strong border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-muted-foreground text-sm">
                      Active Goals
                    </p>
                    <p className="text-2xl font-serif font-bold text-foreground">
                      {financialData.savingsGoals.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-strong border-border/30">
            <CardHeader>
              <CardTitle className="text-foreground font-serif">
                Chat with AI Financial Advisor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 overflow-y-auto space-y-4 p-4 glass rounded-lg border border-border/30">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p>Ask me anything about your finances!</p>
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        message.isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-full ${
                          message.isUser
                            ? "bg-primary"
                            : "glass border-border/30"
                        }`}
                      >
                        {message.isUser ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-foreground" />
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          message.isUser
                            ? "bg-primary text-primary-foreground"
                            : "glass border-border/30 text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="p-2 rounded-full glass border-border/30">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="p-3 rounded-lg glass border-border/30">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Quick prompts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors glass border-border/30"
                        onClick={() => setInput(prompt)}
                      >
                        {prompt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your finances..."
                  className="glass border-border/30 text-foreground placeholder:text-muted-foreground"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
