import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BuyerForm } from '@/components/buyers/BuyerForm';
import { Navigation } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Buyer } from '@/lib/validations';

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

const EditBuyer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyer, setBuyer] = useState<DatabaseBuyer | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (data: Buyer) => {
    if (!buyer || !user) return;

    try {
      const { error } = await supabase
        .from('buyers')
        .update({
          full_name: data.fullName,
          email: data.email || null,
          phone: data.phone,
          city: data.city,
          property_type: data.propertyType,
          bhk: data.bhk || null,
          purpose: data.purpose,
          budget_min: data.budgetMin || null,
          budget_max: data.budgetMax || null,
          timeline: data.timeline,
          source: data.source,
          status: data.status,
          notes: data.notes || null,
          tags: data.tags || [],
        })
        .eq('id', buyer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Buyer lead updated successfully!",
      });

      navigate(`/buyers/${buyer.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

  // Convert database format to form format
  const initialData = {
    fullName: buyer.full_name,
    email: buyer.email || '',
    phone: buyer.phone,
    city: buyer.city as "Chandigarh" | "Mohali" | "Zirakpur" | "Panchkula" | "Other",
    propertyType: buyer.property_type as "Apartment" | "Villa" | "Plot" | "Office" | "Retail",
    bhk: buyer.bhk as "1" | "2" | "3" | "4" | "Studio" | undefined,
    purpose: buyer.purpose as "Buy" | "Rent",
    budgetMin: buyer.budget_min || undefined,
    budgetMax: buyer.budget_max || undefined,
    timeline: buyer.timeline as "0-3m" | "3-6m" | ">6m" | "Exploring",
    source: buyer.source as "Website" | "Referral" | "Walk-in" | "Call" | "Other",
    status: buyer.status as "New" | "Qualified" | "Contacted" | "Visited" | "Negotiation" | "Converted" | "Dropped",
    notes: buyer.notes || '',
    tags: buyer.tags || [],
    id: buyer.id,
    updatedAt: buyer.updated_at,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/buyers/${buyer.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Details
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Buyer Lead</h1>
            <p className="text-muted-foreground">Update {buyer.full_name}'s information</p>
          </div>
        </div>

        <BuyerForm 
          initialData={initialData}
          onSubmit={handleSubmit} 
          isEditing={true}
        />
      </div>
    </div>
  );
};

export default EditBuyer;