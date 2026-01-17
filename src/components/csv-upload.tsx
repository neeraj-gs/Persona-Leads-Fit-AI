'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CSVUploadProps {
  onUpload: (file: File) => Promise<{ batchId: string; totalLeads: number } | null>;
  onUploadComplete?: (batchId: string, totalLeads: number) => void;
}

export function CSVUpload({ onUpload, onUploadComplete }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    batchId?: string;
    totalLeads?: number;
    error?: string;
  } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const result = await onUpload(file);

    if (result) {
      setUploadResult({
        success: true,
        batchId: result.batchId,
        totalLeads: result.totalLeads,
      });
      onUploadComplete?.(result.batchId, result.totalLeads);
    } else {
      setUploadResult({
        success: false,
        error: 'Failed to upload file',
      });
    }

    setIsUploading(false);
  }, [onUpload, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Leads CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file with lead data to start ranking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading and processing...</p>
              <Progress value={50} className="w-48" />
            </div>
          ) : uploadResult ? (
            uploadResult.success ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <div>
                  <p className="font-medium text-green-600">Upload Successful!</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadResult.totalLeads} leads imported
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadResult(null);
                  }}
                >
                  Upload Another
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">{uploadResult.error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadResult(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )
          ) : (
            <>
              {isDragActive ? (
                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <p className="font-medium">Drop your CSV file here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drag & drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </>
          )}

          {acceptedFiles.length > 0 && !uploadResult && !isUploading && (
            <div className="mt-4 text-sm text-muted-foreground">
              Selected: {acceptedFiles[0].name}
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Expected CSV columns:</p>
          <p>account_name, lead_first_name, lead_last_name, lead_job_title, account_domain, account_employee_range, account_industry</p>
        </div>
      </CardContent>
    </Card>
  );
}
