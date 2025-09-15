-- Create enums for the buyers table
CREATE TYPE public.city_type AS ENUM ('Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other');
CREATE TYPE public.property_type AS ENUM ('Apartment', 'Villa', 'Plot', 'Office', 'Retail');
CREATE TYPE public.bhk_type AS ENUM ('1', '2', '3', '4', 'Studio');
CREATE TYPE public.purpose_type AS ENUM ('Buy', 'Rent');
CREATE TYPE public.timeline_type AS ENUM ('0-3m', '3-6m', '>6m', 'Exploring');
CREATE TYPE public.source_type AS ENUM ('Website', 'Referral', 'Walk-in', 'Call', 'Other');
CREATE TYPE public.status_type AS ENUM ('New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped');

-- Create buyers table
CREATE TABLE public.buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 80),
    email TEXT CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10,15}$'),
    city public.city_type NOT NULL,
    property_type public.property_type NOT NULL,
    bhk public.bhk_type,
    purpose public.purpose_type NOT NULL,
    budget_min INTEGER CHECK (budget_min IS NULL OR budget_min >= 0),
    budget_max INTEGER CHECK (budget_max IS NULL OR budget_max >= 0),
    timeline public.timeline_type NOT NULL,
    source public.source_type NOT NULL,
    status public.status_type NOT NULL DEFAULT 'New',
    notes TEXT CHECK (notes IS NULL OR length(notes) <= 1000),
    tags TEXT[],
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    
    -- Budget constraint: budget_max must be >= budget_min if both are present
    CONSTRAINT budget_range_check CHECK (
        budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min
    ),
    
    -- BHK constraint: required for Apartment/Villa, optional for others
    CONSTRAINT bhk_requirement_check CHECK (
        (property_type IN ('Apartment', 'Villa') AND bhk IS NOT NULL) OR 
        (property_type NOT IN ('Apartment', 'Villa'))
    )
);

-- Create buyer_history table for audit trail
CREATE TABLE public.buyer_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    diff JSONB NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buyers table
-- Anyone authenticated can read all buyers
CREATE POLICY "Anyone can read buyers" ON public.buyers
    FOR SELECT TO authenticated USING (true);

-- Users can insert their own buyers
CREATE POLICY "Users can create buyers" ON public.buyers
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = owner_id);

-- Users can update their own buyers
CREATE POLICY "Users can update own buyers" ON public.buyers
    FOR UPDATE TO authenticated 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own buyers
CREATE POLICY "Users can delete own buyers" ON public.buyers
    FOR DELETE TO authenticated 
    USING (auth.uid() = owner_id);

-- RLS Policies for buyer_history table
-- Users can read history for buyers they can see
CREATE POLICY "Users can read buyer history" ON public.buyer_history
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.buyers 
        WHERE buyers.id = buyer_history.buyer_id
    ));

-- Only system can insert history (via triggers)
CREATE POLICY "System can insert history" ON public.buyer_history
    FOR INSERT TO authenticated 
    WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on buyers
CREATE TRIGGER update_buyers_updated_at
    BEFORE UPDATE ON public.buyers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to track changes in buyer_history
CREATE OR REPLACE FUNCTION public.track_buyer_changes()
RETURNS TRIGGER AS $$
DECLARE
    changes JSONB := '{}';
    old_val TEXT;
    new_val TEXT;
BEGIN
    -- Compare each field and build diff
    IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
        changes := changes || jsonb_build_object('full_name', jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name));
    END IF;
    
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        changes := changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email));
    END IF;
    
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
        changes := changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
    END IF;
    
    IF OLD.city IS DISTINCT FROM NEW.city THEN
        changes := changes || jsonb_build_object('city', jsonb_build_object('old', OLD.city::TEXT, 'new', NEW.city::TEXT));
    END IF;
    
    IF OLD.property_type IS DISTINCT FROM NEW.property_type THEN
        changes := changes || jsonb_build_object('property_type', jsonb_build_object('old', OLD.property_type::TEXT, 'new', NEW.property_type::TEXT));
    END IF;
    
    IF OLD.bhk IS DISTINCT FROM NEW.bhk THEN
        changes := changes || jsonb_build_object('bhk', jsonb_build_object('old', OLD.bhk::TEXT, 'new', NEW.bhk::TEXT));
    END IF;
    
    IF OLD.purpose IS DISTINCT FROM NEW.purpose THEN
        changes := changes || jsonb_build_object('purpose', jsonb_build_object('old', OLD.purpose::TEXT, 'new', NEW.purpose::TEXT));
    END IF;
    
    IF OLD.budget_min IS DISTINCT FROM NEW.budget_min THEN
        changes := changes || jsonb_build_object('budget_min', jsonb_build_object('old', OLD.budget_min, 'new', NEW.budget_min));
    END IF;
    
    IF OLD.budget_max IS DISTINCT FROM NEW.budget_max THEN
        changes := changes || jsonb_build_object('budget_max', jsonb_build_object('old', OLD.budget_max, 'new', NEW.budget_max));
    END IF;
    
    IF OLD.timeline IS DISTINCT FROM NEW.timeline THEN
        changes := changes || jsonb_build_object('timeline', jsonb_build_object('old', OLD.timeline::TEXT, 'new', NEW.timeline::TEXT));
    END IF;
    
    IF OLD.source IS DISTINCT FROM NEW.source THEN
        changes := changes || jsonb_build_object('source', jsonb_build_object('old', OLD.source::TEXT, 'new', NEW.source::TEXT));
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        changes := changes || jsonb_build_object('status', jsonb_build_object('old', OLD.status::TEXT, 'new', NEW.status::TEXT));
    END IF;
    
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
        changes := changes || jsonb_build_object('notes', jsonb_build_object('old', OLD.notes, 'new', NEW.notes));
    END IF;
    
    IF OLD.tags IS DISTINCT FROM NEW.tags THEN
        changes := changes || jsonb_build_object('tags', jsonb_build_object('old', OLD.tags, 'new', NEW.tags));
    END IF;
    
    -- Only insert history if there are actual changes
    IF changes != '{}' THEN
        INSERT INTO public.buyer_history (buyer_id, changed_by, diff)
        VALUES (NEW.id, auth.uid(), changes);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track changes
CREATE TRIGGER track_buyer_changes_trigger
    AFTER UPDATE ON public.buyers
    FOR EACH ROW
    EXECUTE FUNCTION public.track_buyer_changes();

-- Create function to log buyer creation
CREATE OR REPLACE FUNCTION public.log_buyer_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.buyer_history (buyer_id, changed_by, diff)
    VALUES (NEW.id, auth.uid(), jsonb_build_object('action', 'created'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log creation
CREATE TRIGGER log_buyer_creation_trigger
    AFTER INSERT ON public.buyers
    FOR EACH ROW
    EXECUTE FUNCTION public.log_buyer_creation();

-- Create indexes for better performance
CREATE INDEX idx_buyers_owner_id ON public.buyers(owner_id);
CREATE INDEX idx_buyers_updated_at ON public.buyers(updated_at DESC);
CREATE INDEX idx_buyers_city ON public.buyers(city);
CREATE INDEX idx_buyers_property_type ON public.buyers(property_type);
CREATE INDEX idx_buyers_status ON public.buyers(status);
CREATE INDEX idx_buyers_timeline ON public.buyers(timeline);
CREATE INDEX idx_buyers_search ON public.buyers USING gin(to_tsvector('english', full_name || ' ' || COALESCE(email, '') || ' ' || phone || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_buyer_history_buyer_id ON public.buyer_history(buyer_id, changed_at DESC);