'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`
          upload-zone relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'dragging scale-[1.02]' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-chart-2/5 rounded-full blur-2xl" />
        </div>

        <div className="relative">
          {isUploading ? (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full gradient-secondary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Processing your leads...</p>
                <p className="text-sm text-muted-foreground">This may take a moment</p>
              </div>
              <div className="w-64">
                <Progress value={66} className="h-2 bg-secondary">
                  <div className="h-full progress-gradient rounded-full transition-all" style={{ width: '66%' }} />
                </Progress>
              </div>
            </div>
          ) : uploadResult ? (
            uploadResult.success ? (
              <div className="flex flex-col items-center gap-6 animate-scale-in">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl gradient-success flex items-center justify-center glow-success">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 animate-bounce-subtle">
                    <Badge className="badge-gradient shadow-lg">
                      +{uploadResult.totalLeads}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold text-green-600">Upload Successful!</p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{uploadResult.totalLeads}</span> leads imported and ready for ranking
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadResult(null);
                    }}
                    className="group"
                  >
                    <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Upload Another
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 animate-scale-in">
                <div className="w-20 h-20 rounded-2xl gradient-danger flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-bold text-destructive">Upload Failed</p>
                  <p className="text-sm text-muted-foreground max-w-xs">{uploadResult.error}</p>
                </div>
                <Button
                  variant="outline"
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
                <div className="flex flex-col items-center gap-6 animate-scale-in">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-bounce-subtle glow-primary">
                    <FileText className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-bold text-primary">Drop your CSV file</p>
                    <p className="text-sm text-muted-foreground">Release to upload</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-secondary/80 flex items-center justify-center group-hover:bg-secondary transition-colors">
                      <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-xl font-semibold">Drag & drop your CSV file here</p>
                    <p className="text-muted-foreground">or click to browse files</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Supports .csv files</span>
                  </div>
                </div>
              )}
            </>
          )}

          {acceptedFiles.length > 0 && !uploadResult && !isUploading && (
            <div className="mt-6 flex items-center justify-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="font-medium">{acceptedFiles[0].name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">Ready to upload</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Expected Columns */}
      <div className="p-4 rounded-xl bg-secondary/30 border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
            <FileText className="h-3 w-3 text-white" />
          </div>
          <span className="font-medium text-sm">Expected CSV Columns</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['account_name', 'lead_first_name', 'lead_last_name', 'lead_job_title', 'account_domain', 'account_employee_range', 'account_industry'].map((col) => (
            <Badge key={col} variant="secondary" className="font-mono text-xs">
              {col}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
