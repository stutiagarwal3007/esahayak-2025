import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BuyerForm } from '@/components/buyers/BuyerForm';
import { Navigation } from '@/components/layout/Navigation';
import type { Buyer } from '@/lib/validations';

const NewBuyer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (data: Buyer) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('buyers').insert({
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
        owner_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Buyer lead created successfully!",
      });

      navigate('/buyers');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <BuyerForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewBuyer;