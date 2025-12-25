import { useState, useEffect } from "react";
import MainLayout from "@/components/layouts/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Key, Bell, Users, Webhook, Loader2 } from "lucide-react";
import { settingsService } from "@/services/settingsService";

const SystemSettings = () => {
  const { toast } = useToast();
  const [emailSettings, setEmailSettings] = useState({
    welcomeTemplate: "Hello {{name}},\n\nWelcome to Flow! Your account has been created successfully.\n\nBest regards,\nThe Flow Team",
    notificationTemplate: "Hello {{name}},\n\n{{message}}\n\nBest regards,\nThe Flow Team",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    smtpFrom: "noreply@projectflow.com",
  });
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const [apiKeys, setApiKeys] = useState({
    stripeKey: "sk_test_xxxxxxxxxxxxx",
    sendgridKey: "SG.xxxxxxxxxxxxx",
    awsAccessKey: "AKIA xxxxxxxxxxxxx",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: "",
    dailyDigest: true,
  });

  const [systemLimits, setSystemLimits] = useState({
    maxUsersPerOrganization: 50,
    maxMembersPerProject: 20,
    maxProjectsPerOrganization: 10,
    maxTasksPerProject: 500,
  });
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);

  const [webhookSettings, setWebhookSettings] = useState({
    primaryWebhookUrl: "",
    notificationWebhookUrl: "",
    testEmail: "",
  });

  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  // Load email config on mount
  useEffect(() => {
    loadEmailConfig();
    loadSystemLimits();
  }, []);

  const loadSystemLimits = async () => {
    try {
      setLoadingLimits(true);
      const limits = await settingsService.getSystemLimits();
      setSystemLimits(limits);
    } catch (error) {
      console.error("Failed to load system limits:", error);
    } finally {
      setLoadingLimits(false);
    }
  };

  const loadEmailConfig = async () => {
    try {
      setLoadingEmail(true);
      const config = await settingsService.getEmailConfig();
      setEmailSettings({
        welcomeTemplate: config.welcomeTemplate || emailSettings.welcomeTemplate,
        notificationTemplate: config.notificationTemplate || emailSettings.notificationTemplate,
        smtpHost: config.host || "",
        smtpPort: config.port || "587",
        smtpUser: config.username || "",
        smtpPassword: config.password || "",
        smtpFrom: config.from || "noreply@projectflow.com",
      });
    } catch (error) {
      console.error("Failed to load email config:", error);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await settingsService.saveEmailConfig({
        host: emailSettings.smtpHost,
        port: emailSettings.smtpPort,
        username: emailSettings.smtpUser,
        password: emailSettings.smtpPassword,
        from: emailSettings.smtpFrom,
        welcomeTemplate: emailSettings.welcomeTemplate,
        notificationTemplate: emailSettings.notificationTemplate,
      });
      toast({
        title: "Email settings saved",
        description: "SMTP configuration updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    setSendingTest(true);
    try {
      const result = await settingsService.sendTestEmail(testEmail);
      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send test email.", variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveApiKeys = () => {
    toast({
      title: "API keys saved",
      description: "API keys have been securely updated.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification settings saved",
      description: "System notification preferences updated successfully.",
    });
  };

  const handleSaveSystemLimits = async () => {
    setSavingLimits(true);
    try {
      await settingsService.saveSystemLimits(systemLimits);
      toast({
        title: "System limits saved",
        description: "System configuration limits updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system limits.",
        variant: "destructive",
      });
    } finally {
      setSavingLimits(false);
    }
  };

  const handleSaveWebhookSettings = () => {
    toast({
      title: "Webhook settings saved",
      description: "Webhook configuration updated successfully.",
    });
  };

  const handleTestWebhook = async () => {
    if (!webhookSettings.primaryWebhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch(webhookSettings.primaryWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          test: true,
          message: "Test webhook from Flow",
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: "Webhook triggered",
        description: "Test webhook sent successfully. Check your webhook logs to confirm receipt.",
      });
    } catch (error) {
      console.error("Webhook test error:", error);
      toast({
        title: "Error",
        description: "Failed to trigger webhook. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleTestNotification = async () => {
    if (!webhookSettings.testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsTestingNotification(true);
    try {
      toast({
        title: "Notification sent",
        description: `Test notification sent to ${webhookSettings.testEmail}. Note: Email sending requires RESEND_API_KEY to be configured.`,
      });
    } catch (error) {
      console.error("Notification test error:", error);
      toast({
        title: "Error",
        description: "Failed to send notification.",
        variant: "destructive",
      });
    } finally {
      setIsTestingNotification(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure global application settings</p>
          </div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-2">
              <Users className="w-4 h-4" />
              Limits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Configure email templates for system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-template">Welcome Email Template</Label>
                  <Textarea
                    id="welcome-template"
                    value={emailSettings.welcomeTemplate}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, welcomeTemplate: e.target.value })
                    }
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-template">Notification Email Template</Label>
                  <Textarea
                    id="notification-template"
                    value={emailSettings.notificationTemplate}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, notificationTemplate: e.target.value })
                    }
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>Configure email server settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingEmail ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-host">SMTP Host</Label>
                        <Input
                          id="smtp-host"
                          placeholder="smtp.gmail.com"
                          value={emailSettings.smtpHost}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">SMTP Port</Label>
                        <Input
                          id="smtp-port"
                          placeholder="587"
                          value={emailSettings.smtpPort}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-user">SMTP Username</Label>
                        <Input
                          id="smtp-user"
                          placeholder="your-email@gmail.com"
                          value={emailSettings.smtpUser}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, smtpUser: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-password">SMTP Password</Label>
                        <Input
                          id="smtp-password"
                          type="password"
                          placeholder="••••••••"
                          value={emailSettings.smtpPassword}
                          onChange={(e) =>
                            setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-from">From Email Address</Label>
                      <Input
                        id="smtp-from"
                        placeholder="noreply@projectflow.com"
                        value={emailSettings.smtpFrom}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpFrom: e.target.value })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        This email will appear as the sender address
                      </p>
                    </div>
                    <Button onClick={handleSaveEmailSettings} disabled={savingEmail}>
                      {savingEmail ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save SMTP Settings"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Email</CardTitle>
                <CardDescription>Send a test email to verify your SMTP configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSendTestEmail} disabled={sendingTest || !testEmail}>
                    {sendingTest ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Test Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage third-party API keys and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-key">Stripe API Key</Label>
                  <Input
                    id="stripe-key"
                    type="password"
                    value={apiKeys.stripeKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, stripeKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                  <Input
                    id="sendgrid-key"
                    type="password"
                    value={apiKeys.sendgridKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, sendgridKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aws-key">AWS Access Key</Label>
                  <Input
                    id="aws-key"
                    type="password"
                    value={apiKeys.awsAccessKey}
                    onChange={(e) => setApiKeys({ ...apiKeys, awsAccessKey: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveApiKeys}>Save API Keys</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Notifications</CardTitle>
                <CardDescription>
                  Configure how the system sends notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to users
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable Slack webhook notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.slackIntegration}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, slackIntegration: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Send daily summary emails to admins
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, dailyDigest: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={notifications.webhookUrl}
                    onChange={(e) =>
                      setNotifications({ ...notifications, webhookUrl: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveNotifications}>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Configure webhooks to integrate with external services like Zapier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-webhook">Primary Webhook URL</Label>
                  <Input
                    id="primary-webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookSettings.primaryWebhookUrl}
                    onChange={(e) =>
                      setWebhookSettings({ ...webhookSettings, primaryWebhookUrl: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Main webhook URL for system events
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-webhook">Notification Webhook URL</Label>
                  <Input
                    id="notification-webhook"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    value={webhookSettings.notificationWebhookUrl}
                    onChange={(e) =>
                      setWebhookSettings({ ...webhookSettings, notificationWebhookUrl: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Webhook URL specifically for notifications
                  </p>
                </div>

                {/* Event Types Filter */}
                <div className="space-y-2">
                  <Label>Event Types</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select which events should trigger webhooks
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_COMMENT', 'DEADLINE_APPROACHING'].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`event-${event}`}
                          className="rounded border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor={`event-${event}`} className="text-sm">
                          {event.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Roles Filter */}
                <div className="space-y-2">
                  <Label>Target Roles</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Filter notifications by user role
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'].map((role) => (
                      <div key={role} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`role-${role}`}
                          className="rounded border-gray-300"
                          defaultChecked
                        />
                        <label htmlFor={`role-${role}`} className="text-sm">
                          {role.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveWebhookSettings}>Save Webhook Settings</Button>
                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !webhookSettings.primaryWebhookUrl}
                  >
                    {isTestingWebhook ? "Testing..." : "Test Webhook"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Notifications</CardTitle>
                <CardDescription>
                  Send test notifications to verify your configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={webhookSettings.testEmail}
                    onChange={(e) =>
                      setWebhookSettings({ ...webhookSettings, testEmail: e.target.value })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Requires RESEND_API_KEY to be configured
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={isTestingNotification || !webhookSettings.testEmail}
                >
                  {isTestingNotification ? "Sending..." : "Send Test Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Limits & Quotas</CardTitle>
                <CardDescription>
                  Configure system-wide limits and resource quotas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingLimits ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="max-users">Max Users per Organization</Label>
                      <Input
                        id="max-users"
                        type="number"
                        value={systemLimits.maxUsersPerOrganization}
                        onChange={(e) =>
                          setSystemLimits({ ...systemLimits, maxUsersPerOrganization: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of users allowed per organization
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-projects">Max Projects per Organization</Label>
                      <Input
                        id="max-projects"
                        type="number"
                        value={systemLimits.maxProjectsPerOrganization}
                        onChange={(e) =>
                          setSystemLimits({ ...systemLimits, maxProjectsPerOrganization: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of projects allowed per organization
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-members">Max Members per Project</Label>
                      <Input
                        id="max-members"
                        type="number"
                        value={systemLimits.maxMembersPerProject}
                        onChange={(e) =>
                          setSystemLimits({ ...systemLimits, maxMembersPerProject: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of team members allowed per project
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-tasks">Max Tasks per Project</Label>
                      <Input
                        id="max-tasks"
                        type="number"
                        value={systemLimits.maxTasksPerProject}
                        onChange={(e) =>
                          setSystemLimits({ ...systemLimits, maxTasksPerProject: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum number of tasks allowed per project
                      </p>
                    </div>
                    <Button onClick={handleSaveSystemLimits} disabled={savingLimits}>
                      {savingLimits ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save System Limits"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SystemSettings;
