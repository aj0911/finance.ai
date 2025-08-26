"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, Calendar, DollarSign, TrendingUp, Trash2, AlertCircle } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { AddGoalDialog } from "@/components/goals/add-goal-dialog"
import { AddMoneyDialog } from "@/components/goals/add-money-dialog"
import { useAuth } from "@/hooks/use-auth"
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

interface SavingsGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: string
  userId: string
  createdAt: Date
}

const goalCategories = {
  Emergency: { color: "hsl(var(--chart-1))", icon: "🛡️" },
  Vacation: { color: "hsl(var(--chart-2))", icon: "✈️" },
  Car: { color: "hsl(var(--chart-3))", icon: "🚗" },
  House: { color: "hsl(var(--chart-4))", icon: "🏠" },
  Education: { color: "hsl(var(--chart-5))", icon: "🎓" },
  Investment: { color: "hsl(var(--primary))", icon: "📈" },
  Other: { color: "hsl(var(--muted-foreground))", icon: "🎯" },
}

const mockGoals: SavingsGoal[] = [
  {
    id: "1",
    title: "Emergency Fund",
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: new Date(2024, 11, 31),
    category: "Emergency",
    userId: "mock-user",
    createdAt: new Date(2024, 0, 1),
  },
  {
    id: "2",
    title: "Vacation to Europe",
    targetAmount: 5000,
    currentAmount: 2800,
    deadline: new Date(2024, 6, 15),
    category: "Vacation",
    userId: "mock-user",
    createdAt: new Date(2024, 0, 15),
  },
  {
    id: "3",
    title: "New Car Down Payment",
    targetAmount: 8000,
    currentAmount: 3200,
    deadline: new Date(2024, 8, 30),
    category: "Car",
    userId: "mock-user",
    createdAt: new Date(2024, 1, 1),
  },
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch goals from Firestore
  useEffect(() => {
    if (!user) return

    const goalsQuery = query(
      collection(db, "savingsGoals"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const goalsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          deadline: doc.data().deadline.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as SavingsGoal[]

        setGoals(goalsData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error("Firebase error:", error)
        setError("Unable to fetch original data from database, showing mock data for demonstration.")
        setGoals(mockGoals)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  // Add new goal
  const handleAddGoal = async (goalData: {
    title: string
    targetAmount: number
    deadline: Date
    category: string
  }) => {
    if (!user) return

    try {
      await addDoc(collection(db, "savingsGoals"), {
        ...goalData,
        currentAmount: 0,
        userId: user.uid,
        deadline: Timestamp.fromDate(goalData.deadline),
        createdAt: Timestamp.now(),
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding goal:", error)
      const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        ...goalData,
        currentAmount: 0,
        userId: user.uid,
        createdAt: new Date(),
      }
      setGoals((prev) => [newGoal, ...prev])
      setIsAddDialogOpen(false)
    }
  }

  // Add money to goal
  const handleAddMoney = async (goalId: string, amount: number) => {
    try {
      const goal = goals.find((g) => g.id === goalId)
      if (!goal) return

      await updateDoc(doc(db, "savingsGoals", goalId), {
        currentAmount: goal.currentAmount + amount,
      })
      setIsAddMoneyDialogOpen(false)
      setSelectedGoal(null)
    } catch (error) {
      console.error("Error adding money to goal:", error)
    }
  }

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteDoc(doc(db, "savingsGoals", goalId))
    } catch (error) {
      console.error("Error deleting goal:", error)
    }
  }

  // Calculate statistics
  const totalGoals = goals.length
  const completedGoals = goals.filter((goal) => goal.currentAmount >= goal.targetAmount).length
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0

  // Get days until deadline
  const getDaysUntilDeadline = (deadline: Date) => {
    const today = new Date()
    const diffTime = deadline.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get progress percentage
  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

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
            <h1 className="text-3xl font-serif font-black text-foreground">Savings Goals</h1>
            <p className="text-muted-foreground">Track your progress towards financial milestones</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: "Total Goals",
              value: totalGoals.toString(),
              icon: Target,
              change: `${completedGoals} completed`,
              delay: 0.1,
            },
            {
              title: "Overall Progress",
              value: `${overallProgress.toFixed(1)}%`,
              icon: TrendingUp,
              change: "Across all goals",
              delay: 0.2,
            },
            {
              title: "Total Target",
              value: `$${totalTargetAmount.toLocaleString()}`,
              icon: DollarSign,
              change: "Combined target",
              delay: 0.3,
            },
            {
              title: "Total Saved",
              value: `$${totalCurrentAmount.toLocaleString()}`,
              icon: Calendar,
              change: "Current progress",
              delay: 0.4,
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

        {/* Overall Progress */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="text-xl font-serif font-bold text-foreground">Overall Progress</CardTitle>
                <CardDescription>Combined progress across all your savings goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Progress</span>
                    <span className="text-sm font-medium text-foreground">
                      ${totalCurrentAmount.toLocaleString()} / ${totalTargetAmount.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                  <div className="text-xs text-muted-foreground text-right">{overallProgress.toFixed(1)}% complete</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Goals Grid */}
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => {
              const progress = getProgress(goal.currentAmount, goal.targetAmount)
              const daysLeft = getDaysUntilDeadline(goal.deadline)
              const isCompleted = goal.currentAmount >= goal.targetAmount
              const isOverdue = daysLeft < 0 && !isCompleted
              const categoryInfo = goalCategories[goal.category as keyof typeof goalCategories] || goalCategories.Other

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                >
                  <Card className="glass-strong border-border/30 hover:border-primary/30 transition-all duration-300 h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <div>
                            <CardTitle className="text-lg font-serif font-bold text-foreground">{goal.title}</CardTitle>
                            <CardDescription>{goal.category}</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedGoal(goal)
                              setIsAddMoneyDialogOpen(true)
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Progress</span>
                          <span className="text-sm font-medium text-foreground">
                            ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% complete</div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Deadline</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{goal.deadline.toLocaleDateString()}</span>
                          <Badge
                            variant={isCompleted ? "default" : isOverdue ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {isCompleted ? "Completed" : isOverdue ? "Overdue" : `${daysLeft} days left`}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={() => {
                            setSelectedGoal(goal)
                            setIsAddMoneyDialogOpen(true)
                          }}
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={isCompleted}
                        >
                          {isCompleted ? "Goal Completed!" : "Add Money"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card className="glass-strong border-border/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">No Savings Goals Yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Start your financial journey by creating your first savings goal. Set targets, track progress, and
                  achieve your dreams!
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dialogs */}
        <AddGoalDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddGoal={handleAddGoal} />
        <AddMoneyDialog
          open={isAddMoneyDialogOpen}
          onOpenChange={setIsAddMoneyDialogOpen}
          goal={selectedGoal}
          onAddMoney={handleAddMoney}
        />
      </div>
    </AppLayout>
  )
}
