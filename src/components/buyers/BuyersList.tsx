import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Eye, Edit, Plus, Download, Upload, Search } from 'lucide-react';
import { BuyerImportExport } from './BuyerImportExport';
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

const PAGE_SIZE = 10;

export const BuyersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [buyers, setBuyers] = useState<DatabaseBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showImportExport, setShowImportExport] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get current filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('search') || '';
  const cityFilter = searchParams.get('city') || '';
  const propertyTypeFilter = searchParams.get('propertyType') || '';
  const statusFilter = searchParams.get('status') || '';
  const timelineFilter = searchParams.get('timeline') || '';

  // Debounced search
  const [searchInput, setSearchInput] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateFilters({ search: searchInput, page: '1' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery]);

  const updateFilters = (newFilters: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    setSearchParams(newSearchParams);
  };

  const fetchBuyers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('buyers')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      // Apply other filters
      if (cityFilter) {
        query = query.eq('city', cityFilter as any);
      }
      if (propertyTypeFilter) {
        query = query.eq('property_type', propertyTypeFilter as any);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter as any);
      }
      if (timelineFilter) {
        query = query.eq('timeline', timelineFilter as any);
      }

      // Apply pagination
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setBuyers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, [user, searchParams]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return '-';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `₹${min.toLocaleString()}+`;
    if (max) return `Up to ₹${max.toLocaleString()}`;
    return '-';
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading buyer leads...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Buyer Leads</h1>
          <p className="text-muted-foreground">Manage and track your buyer leads</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowImportExport(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import/Export
          </Button>
          <Button asChild>
            <Link to="/buyers/new">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={cityFilter || undefined} onValueChange={(value) => updateFilters({ city: value || '', page: '1' })}>
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                <SelectItem value="Mohali">Mohali</SelectItem>
                <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                <SelectItem value="Panchkula">Panchkula</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={propertyTypeFilter || undefined} onValueChange={(value) => updateFilters({ propertyType: value || '', page: '1' })}>
              <SelectTrigger>
                <SelectValue placeholder="All Property Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Plot">Plot</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter || undefined} onValueChange={(value) => updateFilters({ status: value || '', page: '1' })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
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

            <Select value={timelineFilter || undefined} onValueChange={(value) => updateFilters({ timeline: value || '', page: '1' })}>
              <SelectTrigger>
                <SelectValue placeholder="All Timelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-3m">0-3 months</SelectItem>
                <SelectItem value="3-6m">3-6 months</SelectItem>
                <SelectItem value=">6m">6+ months</SelectItem>
                <SelectItem value="Exploring">Exploring</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {buyers.length} of {totalCount} leads
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {buyers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No leads found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || cityFilter || propertyTypeFilter || statusFilter || timelineFilter
                    ? "Try adjusting your filters or search terms."
                    : "Get started by creating your first buyer lead."}
                </p>
              </div>
              {!searchQuery && !cityFilter && !propertyTypeFilter && !statusFilter && !timelineFilter && (
                <Button asChild>
                  <Link to="/buyers/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Lead
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="py-4 px-6 font-medium">Name</th>
                        <th className="py-4 px-6 font-medium">Phone</th>
                        <th className="py-4 px-6 font-medium">City</th>
                        <th className="py-4 px-6 font-medium">Property</th>
                        <th className="py-4 px-6 font-medium">Budget</th>
                        <th className="py-4 px-6 font-medium">Timeline</th>
                        <th className="py-4 px-6 font-medium">Status</th>
                        <th className="py-4 px-6 font-medium">Updated</th>
                        <th className="py-4 px-6 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyers.map((buyer) => (
                        <tr key={buyer.id} className="border-b hover:bg-muted/50">
                          <td className="py-4 px-6">
                            <div>
                              <div className="font-medium">{buyer.full_name}</div>
                              {buyer.email && (
                                <div className="text-sm text-muted-foreground">{buyer.email}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono">{buyer.phone}</td>
                          <td className="py-4 px-6">{buyer.city}</td>
                          <td className="py-4 px-6">
                            <div>
                              <div>{buyer.property_type}</div>
                              {buyer.bhk && (
                                <div className="text-sm text-muted-foreground">{buyer.bhk} BHK</div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            {formatBudget(buyer.budget_min, buyer.budget_max)}
                          </td>
                          <td className="py-4 px-6">{buyer.timeline}</td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(buyer.status)} variant="secondary">
                              {buyer.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(buyer.updated_at), { addSuffix: true })}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/buyers/${buyer.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/buyers/${buyer.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {buyers.map((buyer) => (
              <Card key={buyer.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium">{buyer.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{buyer.phone}</p>
                      {buyer.email && (
                        <p className="text-sm text-muted-foreground">{buyer.email}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(buyer.status)} variant="secondary">
                      {buyer.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <div>{buyer.city}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Property:</span>
                      <div>{buyer.property_type} {buyer.bhk && `(${buyer.bhk} BHK)`}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Budget:</span>
                      <div>{formatBudget(buyer.budget_min, buyer.budget_max)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timeline:</span>
                      <div>{buyer.timeline}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(buyer.updated_at), { addSuffix: true })}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/buyers/${buyer.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/buyers/${buyer.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => updateFilters({ page: Math.max(1, currentPage - 1).toString() })}
                      aria-disabled={currentPage <= 1}
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => updateFilters({ page: page.toString() })}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => updateFilters({ page: Math.min(totalPages, currentPage + 1).toString() })}
                      aria-disabled={currentPage >= totalPages}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExport && (
        <BuyerImportExport
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => {
            fetchBuyers();
            setShowImportExport(false);
          }}
          currentFilters={{
            search: searchQuery,
            city: cityFilter,
            propertyType: propertyTypeFilter,
            status: statusFilter,
            timeline: timelineFilter
          }}
        />
      )}
    </div>
  );
};