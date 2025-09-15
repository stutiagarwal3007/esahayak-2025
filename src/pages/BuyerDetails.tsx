import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface DatabaseBuyer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  city: string;
  property_type: string;
  bhk: string | null;
  purpose: string;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string;
  source: string;
  status: string;
  notes: string | null;
  tags: string[] | null;
  owner_id: string;
  updated_at: string;
  created_at: string;
}

const BuyerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyer, setBuyer] = useState<DatabaseBuyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    
    fetchBuyer();
  }, [id, user]);

  const fetchBuyer = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBuyer(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      navigate('/buyers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!buyer || !user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', buyer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Buyer lead deleted successfully!",
      });

      navigate('/buyers');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `₹${min.toLocaleString()}+`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return 'Not specified';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'New': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Visited': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Converted': 'bg-emerald-100 text-emerald-800',
      'Dropped': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading buyer details...</div>
        </div>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Buyer not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/buyers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{buyer.full_name}</h1>
              <p className="text-muted-foreground">Lead Details</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link to={`/buyers/${buyer.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the buyer lead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg">{buyer.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-lg font-mono">{buyer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{buyer.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="text-lg">{buyer.city}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Requirements</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Property Type</label>
                  <p className="text-lg">{buyer.property_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">BHK</label>
                  <p className="text-lg">{buyer.bhk ? `${buyer.bhk} BHK` : 'Not applicable'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                  <p className="text-lg">{buyer.purpose}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Budget</label>
                  <p className="text-lg">{formatBudget(buyer.budget_min, buyer.budget_max)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Timeline</label>
                  <p className="text-lg">{buyer.timeline}</p>
                </div>
              </CardContent>
            </Card>

            {buyer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{buyer.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status & Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(buyer.status)} variant="secondary">
                      {buyer.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="text-lg">{buyer.source}</p>
                </div>
              </CardContent>
            </Card>

            {buyer.tags && buyer.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {buyer.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{formatDistanceToNow(new Date(buyer.created_at), { addSuffix: true })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>{formatDistanceToNow(new Date(buyer.updated_at), { addSuffix: true })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDetails;