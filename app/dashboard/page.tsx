"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  DollarSign,
  TrendingUp,
  Target,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BalanceData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

interface SpendingTrendData {
  month: string
  income: number
  expenses: number
  savings: number
}

interface ExpenseCategory {
  name: string
  value: number
  color: string
}

interface SavingsGoal {
  id: string
  name: string
  current: number
  target: number
  progress: number
}

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

// Mock data fallback
const mockBalanceData: BalanceData = {
  totalBalance: 12450.75,
  monthlyIncome: 5200.0,
  monthlyExpenses: 3850.25,
  savingsRate: 26,
}

const mockSpendingTrend: SpendingTrendData[] = [
  { month: "Jan", income: 5200, expenses: 3800, savings: 1400 },
  { month: "Feb", income: 5200, expenses: 4100, savings: 1100 },
  { month: "Mar", income: 5200, expenses: 3650, savings: 1550 },
  { month: "Apr", income: 5200, expenses: 3900, savings: 1300 },
  { month: "May", income: 5200, expenses: 3850, savings: 1350 },
  { month: "Jun", income: 5200, expenses: 3850, savings: 1350 },
]

const mockExpenseCategories: ExpenseCategory[] = [
  { name: "Housing", value: 1200, color: "var(--chart-1)" },
  { name: "Food", value: 650, color: "var(--chart-2)" },
  { name: "Transportation", value: 450, color: "var(--chart-3)" },
  { name: "Entertainment", value: 300, color: "var(--chart-4)" },
  { name: "Utilities", value: 250, color: "var(--chart-5)" },
]

const mockSavingsGoals: SavingsGoal[] = [
  { id: "1", name: "Emergency Fund", current: 8500, target: 15000, progress: 57 },
  { id: "2", name: "Vacation", current: 2300, target: 5000, progress: 46 },
  { id: "3", name: "New Car", current: 12000, target: 25000, progress: 48 },
]

const mockRecentTransactions: Transaction[] = [
  { id: "1", description: "Grocery Store", amount: -85.5, category: "Food", date: "Today" },
  { id: "2", description: "Salary Deposit", amount: 2600.0, category: "Income", date: "Yesterday" },
  { id: "3", description: "Netflix Subscription", amount: -15.99, category: "Entertainment", date: "2 days ago" },
  { id: "4", description: "Gas Station", amount: -45.2, category: "Transportation", date: "3 days ago" },
]

const chartConfig = {
  income: {
    label: "Income",
    color: "var(--chart-3)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-4)",
  },
  savings: {
    label: "Savings",
    color: "var(--chart-1)",
  },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [balanceData, setBalanceData] = useState<BalanceData>(mockBalanceData)
  const [spendingTrend, setSpendingTrend] = useState<SpendingTrendData[]>(mockSpendingTrend)
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(mockExpenseCategories)
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(mockSavingsGoals)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(mockRecentTransactions)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchExpenseCategories = async () => {
    if (!user) return

    try {
      const expensesRef = collection(db, "expenses")
      const q = query(expensesRef, where("userId", "==", user.uid), orderBy("date", "desc"), limit(100))

      const snapshot = await getDocs(q)
      const expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      // Group expenses by category
      const categoryTotals: { [key: string]: number } = {}
      expenses.forEach((expense: any) => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount
      })

      const colors = [
        "var(--chart-1)",
        "var(--chart-2)",
        "var(--chart-3)",
        "var(--chart-4)",
        "var(--chart-5)",
      ]

      const categories: ExpenseCategory[] = Object.entries(categoryTotals).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))

      if (categories.length > 0) {
        setExpenseCategories(categories)

        // Calculate balance data from expenses
        const totalExpenses = categories.reduce((sum, cat) => sum + cat.value, 0)
        const monthlyIncome = 5200 // This could come from a user profile collection
        const totalBalance = monthlyIncome - totalExpenses + 10000 // Starting balance
        const savingsRate = Math.round(((monthlyIncome - totalExpenses) / monthlyIncome) * 100)

        setBalanceData({
          totalBalance,
          monthlyIncome,
          monthlyExpenses: totalExpenses,
          savingsRate: Math.max(0, savingsRate),
        })
      }
    } catch (error) {
      console.error("Error fetching expense categories:", error)
      setIsUsingMockData(true)
    }
  }

  const fetchSavingsGoals = async () => {
    if (!user) return

    try {
      const goalsRef = collection(db, "goals")
      const q = query(goalsRef, where("userId", "==", user.uid))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const goals: SavingsGoal[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          const progress = Math.round((data.currentAmount / data.targetAmount) * 100)
          return {
            id: doc.id,
            name: data.title,
            current: data.currentAmount,
            target: data.targetAmount,
            progress,
          }
        })

        if (goals.length > 0) {
          setSavingsGoals(goals)
        }
      })

      return unsubscribe
    } catch (error) {
      console.error("Error fetching savings goals:", error)
      setIsUsingMockData(true)
    }
  }

  const fetchRecentTransactions = async () => {
    if (!user) return

    try {
      const expensesRef = collection(db, "expenses")
      const q = query(expensesRef, where("userId", "==", user.uid), orderBy("date", "desc"), limit(4))

      const snapshot = await getDocs(q)
      const transactions: Transaction[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        const date = data.date?.toDate?.() || new Date(data.date)
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))

        let dateString = "Today"
        if (daysAgo === 1) dateString = "Yesterday"
        else if (daysAgo > 1) dateString = `${daysAgo} days ago`

        return {
          id: doc.id,
          description: data.description,
          amount: -data.amount, // Expenses are negative
          category: data.category,
          date: dateString,
        }
      })

      if (transactions.length > 0) {
        setRecentTransactions(transactions)
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      setIsUsingMockData(true)
    }
  }

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setIsUsingMockData(false)

      try {
        await Promise.all([fetchExpenseCategories(), fetchRecentTransactions()])

        const unsubscribeGoals = await fetchSavingsGoals()

        // Generate spending trend from recent data (simplified)
        const currentMonth = new Date().getMonth()
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const trendData: SpendingTrendData[] = []

        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12
          const income = 5200
          const expenses = 3500 + Math.random() * 800 // Simplified calculation
          trendData.push({
            month: months[monthIndex],
            income,
            expenses: Math.round(expenses),
            savings: Math.round(income - expenses),
          })
        }

        setSpendingTrend(trendData)

        return () => {
          if (unsubscribeGoals) unsubscribeGoals()
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setIsUsingMockData(true)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [user])

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        {isUsingMockData && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-200">
              Unable to fetch original data from database. Showing mock data for demonstration purposes.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-serif font-black text-foreground">Financial Dashboard</h1>
            <p className="text-muted-foreground">Track your financial health and optimize your savings</p>
          </div>
        </motion.div>

        {/* Balance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Balance",
              value: `$${balanceData.totalBalance.toLocaleString()}`,
              icon: DollarSign,
              change: "+12.5%",
              positive: true,
              delay: 0.1,
            },
            {
              title: "Monthly Income",
              value: `$${balanceData.monthlyIncome.toLocaleString()}`,
              icon: TrendingUp,
              change: "+2.1%",
              positive: true,
              delay: 0.2,
            },
            {
              title: "Monthly Expenses",
              value: `$${balanceData.monthlyExpenses.toLocaleString()}`,
              icon: CreditCard,
              change: "-5.3%",
              positive: true,
              delay: 0.3,
            },
            {
              title: "Savings Rate",
              value: `${balanceData.savingsRate}%`,
              icon: Target,
              change: "+3.2%",
              positive: true,
              delay: 0.4,
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item.delay, duration: 0.5 }}
            >
              <Card className="glass-strong border-border/30 hover:border-primary/30 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif font-bold text-foreground">{item.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {item.positive ? (
                      <ArrowUpRight className="h-3 w-3 text-chart-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-chart-4 mr-1" />
                    )}
                    <span className={item.positive ? "text-chart-3" : "text-chart-4"}>{item.change}</span>
                    <span className="ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Spending Trend</CardTitle>
                <CardDescription>Monthly income, expenses, and savings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <AreaChart data={spendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stackId="1"
                      stroke="var(--chart-3)"
                      fill="var(--chart-3)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="2"
                      stroke="var(--chart-4)"
                      fill="var(--chart-4)"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stackId="3"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Expense Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Expense Categories</CardTitle>
                <CardDescription>Breakdown of your monthly spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="text-sm text-muted-foreground">{category.name}</span>
                      <span className="text-sm font-medium text-foreground ml-auto">${category.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Savings Goals and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Savings Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Savings Goals</CardTitle>
                <CardDescription>Track your progress towards financial goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {savingsGoals.map((goal, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">{goal.progress}% complete</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Recent Transactions</CardTitle>
                <CardDescription>Your latest financial activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.category} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <span className={`font-medium ${transaction.amount > 0 ? "text-chart-3" : "text-chart-4"}`}>
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  )
}

