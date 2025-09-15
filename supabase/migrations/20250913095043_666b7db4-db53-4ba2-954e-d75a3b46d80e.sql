-- Fix security warnings by setting search_path for functions

-- Update function to fix search path security warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update function to fix search path security warning  
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update function to fix search path security warning
CREATE OR REPLACE FUNCTION public.log_buyer_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.buyer_history (buyer_id, changed_by, diff)
    VALUES (NEW.id, auth.uid(), jsonb_build_object('action', 'created'));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;