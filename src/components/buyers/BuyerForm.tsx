import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buyerSchema, type Buyer } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuyerFormProps {
  initialData?: Partial<Buyer> & { id?: string; updatedAt?: string };
  onSubmit: (data: Buyer) => Promise<void>;
  isEditing?: boolean;
}

export const BuyerForm = ({ initialData, onSubmit, isEditing = false }: BuyerFormProps) => {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<Buyer>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      city: initialData?.city || 'Chandigarh',
      propertyType: initialData?.propertyType || 'Apartment',
      bhk: initialData?.bhk,
      purpose: initialData?.purpose || 'Buy',
      budgetMin: initialData?.budgetMin,
      budgetMax: initialData?.budgetMax,
      timeline: initialData?.timeline || '0-3m',
      source: initialData?.source || 'Website',
      status: initialData?.status || 'New',
      notes: initialData?.notes || '',
      tags: initialData?.tags || [],
    }
  });

  const propertyType = watch('propertyType');

  useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      setTags(initialData.tags || []);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: Buyer) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, tags });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const requiresBhk = propertyType === 'Apartment' || propertyType === 'Villa';

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Buyer Lead' : 'Create New Buyer Lead'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update the buyer information below.' : 'Enter the buyer information below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
                {errors.fullName && (
                  <p id="fullName-error" className="text-sm text-destructive" role="alert">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="1234567890"
                  aria-invalid={errors.phone ? 'true' : 'false'}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="phone-error" className="text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select onValueChange={(value: any) => setValue('city', value)} defaultValue={watch('city')}>
                  <SelectTrigger id="city" aria-describedby={errors.city ? 'city-error' : undefined}>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                    <SelectItem value="Mohali">Mohali</SelectItem>
                    <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                    <SelectItem value="Panchkula">Panchkula</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.city && (
                  <p id="city-error" className="text-sm text-destructive" role="alert">
                    {errors.city.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Property Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select onValueChange={(value: any) => setValue('propertyType', value)} defaultValue={watch('propertyType')}>
                  <SelectTrigger id="propertyType" aria-describedby={errors.propertyType ? 'propertyType-error' : undefined}>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">Apartment</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Plot">Plot</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p id="propertyType-error" className="text-sm text-destructive" role="alert">
                    {errors.propertyType.message}
                  </p>
                )}
              </div>

              <div className={cn("space-y-2", !requiresBhk && "opacity-50")}>
                <Label htmlFor="bhk">
                  BHK {requiresBhk && '*'}
                  {requiresBhk && <span className="text-xs text-muted-foreground ml-1">(Required for Apartments/Villas)</span>}
                </Label>
                <Select 
                  onValueChange={(value: any) => setValue('bhk', value)} 
                  defaultValue={watch('bhk')}
                  disabled={!requiresBhk}
                >
                  <SelectTrigger id="bhk" aria-describedby={errors.bhk ? 'bhk-error' : undefined}>
                    <SelectValue placeholder="Select BHK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bhk && (
                  <p id="bhk-error" className="text-sm text-destructive" role="alert">
                    {errors.bhk.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Select onValueChange={(value: any) => setValue('purpose', value)} defaultValue={watch('purpose')}>
                  <SelectTrigger id="purpose" aria-describedby={errors.purpose ? 'purpose-error' : undefined}>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purpose && (
                  <p id="purpose-error" className="text-sm text-destructive" role="alert">
                    {errors.purpose.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget & Timeline</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Budget Min (₹)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  min="0"
                  {...register('budgetMin', { valueAsNumber: true })}
                  aria-invalid={errors.budgetMin ? 'true' : 'false'}
                  aria-describedby={errors.budgetMin ? 'budgetMin-error' : undefined}
                />
                {errors.budgetMin && (
                  <p id="budgetMin-error" className="text-sm text-destructive" role="alert">
                    {errors.budgetMin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetMax">Budget Max (₹)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  min="0"
                  {...register('budgetMax', { valueAsNumber: true })}
                  aria-invalid={errors.budgetMax ? 'true' : 'false'}
                  aria-describedby={errors.budgetMax ? 'budgetMax-error' : undefined}
                />
                {errors.budgetMax && (
                  <p id="budgetMax-error" className="text-sm text-destructive" role="alert">
                    {errors.budgetMax.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline *</Label>
                <Select onValueChange={(value: any) => setValue('timeline', value)} defaultValue={watch('timeline')}>
                  <SelectTrigger id="timeline" aria-describedby={errors.timeline ? 'timeline-error' : undefined}>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-3m">0-3 months</SelectItem>
                    <SelectItem value="3-6m">3-6 months</SelectItem>
                    <SelectItem value=">6m">6+ months</SelectItem>
                    <SelectItem value="Exploring">Just exploring</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeline && (
                  <p id="timeline-error" className="text-sm text-destructive" role="alert">
                    {errors.timeline.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Source & Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Source & Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Select onValueChange={(value: any) => setValue('source', value)} defaultValue={watch('source')}>
                  <SelectTrigger id="source" aria-describedby={errors.source ? 'source-error' : undefined}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.source && (
                  <p id="source-error" className="text-sm text-destructive" role="alert">
                    {errors.source.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select onValueChange={(value: any) => setValue('status', value)} defaultValue={watch('status')}>
                  <SelectTrigger id="status" aria-describedby={errors.status ? 'status-error' : undefined}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Visited">Visited</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p id="status-error" className="text-sm text-destructive" role="alert">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about the buyer..."
                rows={3}
                maxLength={1000}
                aria-invalid={errors.notes ? 'true' : 'false'}
                aria-describedby={errors.notes ? 'notes-error' : undefined}
              />
              {errors.notes && (
                <p id="notes-error" className="text-sm text-destructive" role="alert">
                  {errors.notes.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-input">Tags</Label>
              <div className="flex space-x-2">
                <Input
                  id="tag-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Enter tag and press Enter"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};