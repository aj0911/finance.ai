"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  targetAmount: z
    .string()
    .min(1, "Target amount is required")
    .transform((val) => Number.parseFloat(val)),
  category: z.string().min(1, "Category is required"),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
});

type GoalFormData = z.infer<typeof goalSchema>;

const categories = [
  "Emergency",
  "Vacation",
  "Car",
  "House",
  "Education",
  "Investment",
  "Other",
];

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGoal: (goal: {
    title: string;
    targetAmount: number;
    deadline: Date;
    category: string;
  }) => void;
}

export function AddGoalDialog({
  open,
  onOpenChange,
  onAddGoal,
}: AddGoalDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      targetAmount: "" as any,
      category: "",
      deadline: undefined,
    },
  });

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    try {
      await onAddGoal(data);
      form.reset();
    } catch (error) {
      console.error("Error adding goal:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border/30 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            Create New Savings Goal
          </DialogTitle>
          <DialogDescription>
            Set a financial target and deadline to start saving towards your
            dreams.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Emergency Fund, Dream Vacation"
                      className="glass border-border/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="glass border-border/50"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="glass border-border/50">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
  control={form.control}
  name="deadline"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Deadline</FormLabel>
      <FormControl>
        <input
          type="datetime-local"
          className="glass border-border/50 bg-transparent px-3 py-2 rounded-md"
          value={
            field.value
              ? new Date(field.value).toISOString().slice(0, 16) // format to yyyy-MM-ddTHH:mm
              : ""
          }
          onChange={(e) => field.onChange(new Date(e.target.value))}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="glass border-border/50 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
