import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/userService";
import { Lock } from "lucide-react";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.newPassword.length < 6) {
            toast({
                title: "Validation Error",
                description: "Password must be at least 6 characters long",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Validation Error",
                description: "Passwords do not match",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await userService.resetPassword(formData.newPassword);

            toast({
                title: "Success",
                description: "Your password has been changed successfully. You will receive a confirmation email.",
            });

            // Clear form
            setFormData({ newPassword: "", confirmPassword: "" });

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to change password",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <CardTitle>Change Password</CardTitle>
                        </div>
                        <CardDescription>
                            Enter a new password for your account. We recommend choosing a strong, unique password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">New Password</label>
                                <Input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Confirm Password</label>
                                <Input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Changing Password..." : "Change Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default ResetPassword;
