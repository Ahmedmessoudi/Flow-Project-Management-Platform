import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });

      // Navigate based on user role
      // We need to get the user from localStorage since state may not be updated yet
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const role = userData.role;
        if (role === 'CLIENT') {
          navigate('/client/overview');
        } else if (role === 'TEAM_MEMBER') {
          navigate('/team-member/tasks');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/dashboard');
      }
    } else {
      toast({
        title: 'Login failed',
        description: result.message ?? 'Invalid email or password',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/favicon.ico"
              alt="Flow Logo"
              className="w-16 h-16 rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold">Flow</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-semibold mb-2">Test Credentials:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>Super Admin:</strong> super_admin@flow.local / super_admin123</p>
                <p><strong>Org Admin:</strong> org_admin@flow.local / org_admin123</p>
                <p><strong>Project Manager:</strong> project_manager@flow.local / project_manager123</p>
                <p><strong>Team Member:</strong> team_member@flow.local / team_member123</p>
                <p><strong>Client:</strong> client@flow.local / client123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
