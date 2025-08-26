"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Plus, Filter, Download, Calendar, DollarSign, TrendingDown, AlertCircle } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"
import { useAuth } from "@/hooks/use-auth"
import { collection, query, where, orderBy, onSnapshot, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: Date
  userId: string
}

const categoryColors = {
  Housing: "var(--chart-1)",
  Food: "var(--chart-2)",
  Transportation: "var(--chart-3)",
  Entertainment: "var(--chart-4)",
  Utilities: "var(--chart-5)",
  Healthcare: "var(--primary)",
  Shopping: "var(--accent)",
  Other: "var(--muted-foreground)",
}

const mockExpenses: Expense[] = [
  {
    id: "1",
    amount: 1200,
    category: "Housing",
    description: "Monthly rent payment",
    date: new Date(2024, 0, 1),
    userId: "mock-user",
  },
  {
    id: "2",
    amount: 85,
    category: "Food",
    description: "Grocery shopping",
    date: new Date(2024, 0, 3),
    userId: "mock-user",
  },
  {
    id: "3",
    amount: 45,
    category: "Transportation",
    description: "Gas station",
    date: new Date(2024, 0, 5),
    userId: "mock-user",
  },
  {
    id: "4",
    amount: 25,
    category: "Entertainment",
    description: "Movie tickets",
    date: new Date(2024, 0, 7),
    userId: "mock-user",
  },
  {
    id: "5",
    amount: 120,
    category: "Utilities",
    description: "Electricity bill",
    date: new Date(2024, 0, 10),
    userId: "mock-user",
  },
]

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return;
  
    try {
      const expensesQuery = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid),
        orderBy("date", "desc")
      );
  
      const unsubscribe = onSnapshot(
        expensesQuery,
        (snapshot) => {
          const expensesData = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(),
            } as Expense;
          });
          console.log(expensesData)
  
          setExpenses(expensesData);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Firebase error:", error.code, error.message);
          setError("Unable to fetch from database, showing mock data.");
          setExpenses(mockExpenses);
          setLoading(false);
        }
      );
  
      return () => unsubscribe();
    } catch (err) {
      console.error("Query setup error:", err);
    }
  }, [user]);

  // Add new expense
  const handleAddExpense = async (expenseData: {
    amount: number
    category: string
    description: string
    date: Date
  }) => {
    if (!user) return

    try {
      await addDoc(collection(db, "expenses"), {
        ...expenseData,
        userId: user.uid,
        date: Timestamp.fromDate(expenseData.date),
        createdAt: Timestamp.now(),
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding expense:", error)
      const newExpense: Expense = {
        id: Date.now().toString(),
        ...expenseData,
        userId: user.uid,
      }
      setExpenses((prev) => [newExpense, ...prev])
      setIsAddDialogOpen(false)
    }
  }

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = expenses.filter((expense) => expense.date.getMonth() === new Date().getMonth())
  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Prepare chart data
  const categoryData = Object.entries(
    expenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([category, amount]) => ({
    category,
    amount,
    color: categoryColors[category as keyof typeof categoryColors] || categoryColors.Other,
  }))

  // Monthly trend data
  const monthlyData = expenses.reduce(
    (acc, expense) => {
      const monthKey = expense.date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      acc[monthKey] = (acc[monthKey] || 0) + expense.amount
      return acc
    },
    {} as Record<string, number>,
  )

  const monthlyTrendData = Object.entries(monthlyData)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }))

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-serif font-black text-foreground">Expense Tracker</h1>
            <p className="text-muted-foreground">Monitor and categorize your spending patterns</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Total Expenses",
              value: `$${totalExpenses.toLocaleString()}`,
              icon: DollarSign,
              change: "All time",
              delay: 0.1,
            },
            {
              title: "This Month",
              value: `$${thisMonthTotal.toLocaleString()}`,
              icon: Calendar,
              change: `${thisMonthExpenses.length} transactions`,
              delay: 0.2,
            },
            {
              title: "Average per Day",
              value: `$${(thisMonthTotal / new Date().getDate()).toFixed(2)}`,
              icon: TrendingDown,
              change: "This month",
              delay: 0.3,
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.5 }}
            >
              <Card className="glass-strong border-border/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Monthly Trend</CardTitle>
                <CardDescription>Your spending over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Category Breakdown</CardTitle>
                <CardDescription>Where your money goes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-sm text-muted-foreground">{category.category}</span>
                      <span className="text-sm font-medium text-foreground ml-auto">${category.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Expenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="glass-strong border-border/30">
            <CardHeader>
              <CardTitle className="text-xl font-serif font-bold text-foreground">Recent Transactions</CardTitle>
              <CardDescription>Your latest expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 10).map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground">{expense.date.toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="glass border-border/50"
                          style={{
                            backgroundColor: `${
                              categoryColors[expense.category as keyof typeof categoryColors] || categoryColors.Other
                            }20`,
                          }}
                        >
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-chart-4">
                        -${expense.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {expenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded yet. Add your first expense to get started!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Expense Dialog */}
        <AddExpenseDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddExpense={handleAddExpense} />
      </div>
    </AppLayout>
  )
}
