import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { csvBuyerSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';

interface ImportError {
  row: number;
  field?: string;
  message: string;
}

interface BuyerImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  currentFilters: Record<string, string>;
}

export const BuyerImportExport = ({ isOpen, onClose, onImportComplete, currentFilters }: BuyerImportExportProps) => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState<number>(0);
  const [csvData, setCsvData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const csvHeaders = [
    'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 
    'purpose', 'budgetMin', 'budgetMax', 'timeline', 'source', 
    'notes', 'tags', 'status'
  ];

  const sampleCsvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,7000000,0-3m,Website,"Looking for 2BHK","urgent,family",New
Jane Smith,jane@example.com,9876543211,Mohali,Villa,3,Buy,10000000,15000000,3-6m,Referral,"Prefers corner plot","luxury,investment",Qualified`;

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'buyer_leads_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setImportErrors([]);
    setImportSuccess(0);
    setCsvData([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 200) {
          toast({
            title: "Error",
            description: "CSV file cannot contain more than 200 rows",
            variant: "destructive",
          });
          return;
        }
        setCsvData(results.data);
      },
      error: (error) => {
        toast({
          title: "Error",
          description: `Failed to parse CSV: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  const validateAndImportData = async () => {
    if (!user || csvData.length === 0) return;

    setImporting(true);
    setImportProgress(0);
    setImportErrors([]);
    setImportSuccess(0);

    const errors: ImportError[] = [];
    const validRows: any[] = [];

    // Validate each row
    csvData.forEach((row, index) => {
      try {
        const validated = csvBuyerSchema.parse(row);
        validRows.push({
          ...validated,
          owner_id: user.id
        });
      } catch (error: any) {
        if (error.errors) {
          error.errors.forEach((err: any) => {
            errors.push({
              row: index + 1,
              field: err.path.join('.'),
              message: err.message
            });
          });
        } else {
          errors.push({
            row: index + 1,
            message: 'Unknown validation error'
          });
        }
      }
    });

    setImportErrors(errors);

    if (validRows.length === 0) {
      setImporting(false);
      toast({
        title: "Import Failed",
        description: "No valid rows found to import",
        variant: "destructive",
      });
      return;
    }

    // Import valid rows in batches
    try {
      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < validRows.length; i += batchSize) {
        const batch = validRows.slice(i, i + batchSize);
        
        // Transform to database format
        const dbRows = batch.map(row => ({
          full_name: row.fullName,
          email: row.email || null,
          phone: row.phone,
          city: row.city,
          property_type: row.propertyType,
          bhk: row.bhk || null,
          purpose: row.purpose,
          budget_min: row.budgetMin || null,
          budget_max: row.budgetMax || null,
          timeline: row.timeline,
          source: row.source,
          status: row.status || 'New',
          notes: row.notes || null,
          tags: row.tags || [],
          owner_id: row.owner_id
        }));

        const { error } = await supabase
          .from('buyers')
          .insert(dbRows);

        if (error) throw error;

        imported += batch.length;
        setImportSuccess(imported);
        setImportProgress((imported / validRows.length) * 100);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${imported} buyer leads`,
      });

      if (errors.length === 0) {
        setTimeout(() => {
          onImportComplete();
        }, 1500);
      }

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      let query = supabase
        .from('buyers')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply current filters
      if (currentFilters.search) {
        query = query.or(`full_name.ilike.%${currentFilters.search}%,phone.ilike.%${currentFilters.search}%,email.ilike.%${currentFilters.search}%`);
      }
      if (currentFilters.city) {
        query = query.eq('city', currentFilters.city as any);
      }
      if (currentFilters.propertyType) {
        query = query.eq('property_type', currentFilters.propertyType as any);
      }
      if (currentFilters.status) {
        query = query.eq('status', currentFilters.status as any);
      }
      if (currentFilters.timeline) {
        query = query.eq('timeline', currentFilters.timeline as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No buyer leads found to export",
          variant: "destructive",
        });
        return;
      }

      // Transform to CSV format
      const csvRows = data.map(row => ({
        fullName: row.full_name,
        email: row.email || '',
        phone: row.phone,
        city: row.city,
        propertyType: row.property_type,
        bhk: row.bhk || '',
        purpose: row.purpose,
        budgetMin: row.budget_min || '',
        budgetMax: row.budget_max || '',
        timeline: row.timeline,
        source: row.source,
        notes: row.notes || '',
        tags: (row.tags || []).join(','),
        status: row.status
      }));

      const csv = Papa.unparse(csvRows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buyer_leads_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data.length} buyer leads`,
      });

    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import & Export Buyer Leads</DialogTitle>
          <DialogDescription>
            Import leads from CSV or export current leads to CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Import CSV</span>
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with buyer leads (max 200 rows)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </Button>
                  <Button onClick={downloadSampleCsv} variant="ghost">
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {csvData.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Loaded {csvData.length} rows from CSV file
                    </AlertDescription>
                  </Alert>
                )}

                {csvData.length > 0 && (
                  <Button 
                    onClick={validateAndImportData} 
                    disabled={importing}
                    className="w-full"
                  >
                    {importing ? 'Importing...' : 'Validate & Import Data'}
                  </Button>
                )}

                {importing && (
                  <div className="space-y-2">
                    <Progress value={importProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center">
                      Importing... {Math.round(importProgress)}% complete
                    </p>
                  </div>
                )}

                {importSuccess > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription>
                      Successfully imported {importSuccess} buyer leads
                    </AlertDescription>
                  </Alert>
                )}

                {importErrors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Import Errors ({importErrors.length})</h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {importErrors.map((error, index) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">Row {error.row}:</span>
                            {error.field && <span className="text-muted-foreground"> {error.field} -</span>}
                            <span> {error.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CSV Format Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your CSV file must include these columns in exact order:
                </p>
                <div className="flex flex-wrap gap-1">
                  {csvHeaders.map((header) => (
                    <Badge key={header} variant="secondary" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 mt-4">
                  <li>• <strong>fullName:</strong> 2-80 characters</li>
                  <li>• <strong>phone:</strong> 10-15 digits only</li>
                  <li>• <strong>email:</strong> Valid email format (optional)</li>
                  <li>• <strong>bhk:</strong> Required for Apartment/Villa types</li>
                  <li>• <strong>budgetMin/Max:</strong> Numbers only (optional)</li>
                  <li>• <strong>tags:</strong> Comma-separated values</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Export CSV</span>
                </CardTitle>
                <CardDescription>
                  Export buyer leads based on current filters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(currentFilters).some(key => currentFilters[key]) && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Export will include only the leads matching your current filters:
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(currentFilters).map(([key, value]) => 
                          value && (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          )
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={exportData} 
                  disabled={exporting}
                  className="w-full"
                >
                  {exporting ? 'Exporting...' : 'Export to CSV'}
                </Button>

                <p className="text-sm text-muted-foreground">
                  The exported CSV will include all buyer lead data in the same format required for import.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};