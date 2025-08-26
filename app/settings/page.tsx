"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { updateProfile, updatePassword, deleteUser } from "firebase/auth"
import { deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  User,
  Settings,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  Save,
  Camera,
  Lock,
  Globe,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/layout/app-layout"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    budgetAlerts: boolean
    goalReminders: boolean
  }
  preferences: {
    currency: string
    theme: string
    language: string
    dateFormat: string
  }
  privacy: {
    dataSharing: boolean
    analytics: boolean
    marketing: boolean
  }
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [connectionError, setConnectionError] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      budgetAlerts: true,
      goalReminders: true,
    },
    preferences: {
      currency: "INR",
      theme: "dark",
      language: "en",
      dateFormat: "DD/MM/YYYY",
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false,
    },
  })

  const updateDisplayName = async () => {
    if (!user || !displayName.trim()) return

    setLoading(true)
    try {
      await updateProfile(user, { displayName: displayName.trim() })
      toast.success("Profile updated successfully!")
      setConnectionError(false)
    } catch (error) {
      setConnectionError(true)
      toast.error("Unable to update profile. Database connection failed.")
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (!user || !newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      await updatePassword(user, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully!")
      setConnectionError(false)
    } catch (error) {
      setConnectionError(true)
      toast.error("Unable to update password. Database connection failed.")
      console.error("Error updating password:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [expensesSnapshot, goalsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "expenses"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "savingsGoals"), where("userId", "==", user.uid))),
      ])

      const expenses = expensesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      const goals = goalsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      const exportData = {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
        expenses,
        goals,
        settings,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `financeai-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Data exported successfully!")
      setConnectionError(false)
    } catch (error) {
      setConnectionError(true)
      toast.error("Unable to export data. Database connection failed.")
      console.error("Error exporting data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.",
    )

    if (!confirmed) return

    setLoading(true)
    try {
      const [expensesSnapshot, goalsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "expenses"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "savingsGoals"), where("userId", "==", user.uid))),
      ])

      const deletePromises = [
        ...expensesSnapshot.docs.map((doc) => deleteDoc(doc.ref)),
        ...goalsSnapshot.docs.map((doc) => deleteDoc(doc.ref)),
      ]

      await Promise.all(deletePromises)
      await deleteUser(user)

      toast.success("Account deleted successfully")
    } catch (error) {
      setConnectionError(true)
      toast.error("Unable to delete account. Database connection failed.")
      console.error("Error deleting account:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-serif font-black text-foreground">Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">Manage your account and preferences</p>
        </motion.div>

        {connectionError && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-red-500/10 border border-red-500/20 rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-red-600 dark:text-red-400 font-medium">Database Connection Error</p>
                    <p className="text-red-600 dark:text-red-400 text-sm opacity-80">
                      Unable to connect to the database. Some features may not work properly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <Button variant="outline" size="sm" className="glass border-border/50 bg-transparent">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-foreground">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="glass border-border/30 text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input value={user?.email || ""} disabled className="glass border-border/30 text-muted-foreground" />
                </div>

                <Button
                  onClick={updateDisplayName}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass border-border/30 text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass border-border/30 text-foreground"
                  />
                </div>

                <Button onClick={changePassword} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>

                <Separator className="bg-border" />

                <div className="space-y-2">
                  <Label className="text-foreground">Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Add an extra layer of security</span>
                    <Badge variant="secondary" className="glass border-border/50">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Email Notifications</Label>
                    <p className="text-muted-foreground text-sm">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSettings("notifications", "email", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Push Notifications</Label>
                    <p className="text-muted-foreground text-sm">Browser notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateSettings("notifications", "push", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Budget Alerts</Label>
                    <p className="text-muted-foreground text-sm">Notify when approaching limits</p>
                  </div>
                  <Switch
                    checked={settings.notifications.budgetAlerts}
                    onCheckedChange={(checked) => updateSettings("notifications", "budgetAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Goal Reminders</Label>
                    <p className="text-muted-foreground text-sm">Reminders for savings goals</p>
                  </div>
                  <Switch
                    checked={settings.notifications.goalReminders}
                    onCheckedChange={(checked) => updateSettings("notifications", "goalReminders", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-strong border-border/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                  <Globe className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Currency</Label>
                  <Select
                    value={settings.preferences.currency}
                    onValueChange={(value) => updateSettings("preferences", "currency", value)}
                  >
                    <SelectTrigger className="glass border-border/30 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Theme</Label>
                  <Select
                    value={settings.preferences.theme}
                    onValueChange={(value) => updateSettings("preferences", "theme", value)}
                  >
                    <SelectTrigger className="glass border-border/30 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Date Format</Label>
                  <Select
                    value={settings.preferences.dateFormat}
                    onValueChange={(value) => updateSettings("preferences", "dateFormat", value)}
                  >
                    <SelectTrigger className="glass border-border/30 text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass-strong border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-serif">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={exportData}
                  disabled={loading}
                  variant="outline"
                  className="glass border-border/50 bg-transparent"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>

                <Button disabled variant="outline" className="glass border-border/50 bg-transparent opacity-50">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data (Coming Soon)
                </Button>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Data Sharing</Label>
                    <p className="text-muted-foreground text-sm">Share anonymized data for research</p>
                  </div>
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onCheckedChange={(checked) => updateSettings("privacy", "dataSharing", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Analytics</Label>
                    <p className="text-muted-foreground text-sm">Help improve the app</p>
                  </div>
                  <Switch
                    checked={settings.privacy.analytics}
                    onCheckedChange={(checked) => updateSettings("privacy", "analytics", checked)}
                  />
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <Button onClick={signOut} variant="outline" className="w-full glass border-border/50 bg-transparent">
                  Sign Out
                </Button>

                <Button
                  onClick={deleteAccount}
                  disabled={loading}
                  variant="destructive"
                  className="w-full bg-destructive hover:bg-destructive/90"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}
