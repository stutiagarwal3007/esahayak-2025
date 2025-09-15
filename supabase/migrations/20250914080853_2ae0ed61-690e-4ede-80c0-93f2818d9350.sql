-- Fix security issue: Restrict buyer data access to owners only
-- Remove the overly permissive policy that allows anyone to read all buyers
DROP POLICY "Anyone can read buyers" ON public.buyers;

-- Create a secure policy that only allows users to read their own buyers
CREATE POLICY "Users can read own buyers" ON public.buyers
    FOR SELECT TO authenticated 
    USING (auth.uid() = owner_id);

-- Update buyer_history policy to be more restrictive as well
-- Users should only see history for buyers they own
DROP POLICY "Users can read buyer history" ON public.buyer_history;

CREATE POLICY "Users can read own buyer history" ON public.buyer_history
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM public.buyers 
        WHERE buyers.id = buyer_history.buyer_id 
        AND buyers.owner_id = auth.uid()
    ));