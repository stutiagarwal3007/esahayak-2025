import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Plus, List, Users, TrendingUp } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold">Buyer Lead Management</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Efficiently capture, organize, and manage your real estate buyer leads with powerful filtering and export capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Manage Leads</CardTitle>
              <CardDescription>View and filter all buyer leads</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/buyers">
                  <List className="w-4 h-4 mr-2" />
                  View All Leads
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">New Lead</CardTitle>
              <CardDescription>Add a new buyer lead</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/buyers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Analytics</CardTitle>
              <CardDescription>Track lead performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/buyers">
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="w-8 h-8 mx-auto mb-2 text-primary flex items-center justify-center">📊</div>
              <CardTitle className="text-lg">Import/Export</CardTitle>
              <CardDescription>Bulk data operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/buyers">
                  Manage Data
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Welcome back, {user.email}! Ready to manage your buyer leads?
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;