"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Progress } from "@/components/ui/progress"

const addMoneySchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .transform((val) => Number.parseFloat(val))
    .refine((val) => val > 0, "Amount must be greater than 0"),
})

type AddMoneyFormData = z.infer<typeof addMoneySchema>

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

interface AddMoneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal | null
  onAddMoney: (goalId: string, amount: number) => void
}

export function AddMoneyDialog({ open, onOpenChange, goal, onAddMoney }: AddMoneyDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<AddMoneyFormData>({
    resolver: zodResolver(addMoneySchema),
    defaultValues: {
      amount: "" as any,
    },
  })

  const onSubmit = async (data: AddMoneyFormData) => {
    if (!goal) return

    setLoading(true)
    try {
      await onAddMoney(goal.id, data.amount)
      form.reset()
    } catch (error) {
      console.error("Error adding money:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!goal) return null

  const currentProgress = (goal.currentAmount / goal.targetAmount) * 100
  const watchedAmount = form.watch("amount")
  const newAmount = goal.currentAmount + (Number(watchedAmount) || 0)
  const newProgress = Math.min((newAmount / goal.targetAmount) * 100, 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/30 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">Add Money to Goal</DialogTitle>
          <DialogDescription>Contribute to your "{goal.title}" savings goal.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Progress</span>
              <span className="text-sm font-medium text-foreground">
                ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={currentProgress} className="h-2" />
            <div className="text-xs text-muted-foreground text-right">{currentProgress.toFixed(1)}% complete</div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Add</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="glass border-border/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview Progress */}
              {watchedAmount && Number(watchedAmount) > 0 && (
                <div className="space-y-2 p-4 glass rounded-lg border border-border/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Progress</span>
                    <span className="text-sm font-medium text-foreground">
                      ${newAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={newProgress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">{newProgress.toFixed(1)}% complete</div>
                  {newAmount >= goal.targetAmount && (
                    <div className="text-sm text-chart-3 font-medium text-center">🎉 Goal will be completed!</div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="glass border-border/50 bg-transparent"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                  {loading ? "Adding..." : "Add Money"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
