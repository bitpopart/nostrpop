import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/useToast';
import {
  Download,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface DigitalDownloadProps {
  product: {
    id: string;
    name: string;
    digital_files?: string[];
    digital_file_names?: string[];
    price: number;
    currency: string;
  };
  paymentConfirmed: boolean;
  onDownloadComplete?: () => void;
}

export function DigitalDownload({ product, paymentConfirmed, onDownloadComplete }: DigitalDownloadProps) {
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);
  const { toast } = useToast();

  // Create file objects with URLs and names
  const digitalFiles = (() => {
    // Check if we have actual digital files with proper data
    const hasDigitalFiles = product.digital_files &&
                           Array.isArray(product.digital_files) &&
                           product.digital_files.length > 0 &&
                           product.digital_files.some(file => file && file.trim() !== '');

    if (hasDigitalFiles) {
      return product.digital_files!.map((url, index) => ({
        name: product.digital_file_names?.[index] || `file-${index + 1}.${url.split('.').pop() || 'bin'}`,
        url: url
      }));
    }

    // Fallback for demo purposes - only when no real files exist
    return [
      {
        name: `${product.name.replace(/\s+/g, '_')}_Digital_Edition.pdf`,
        url: ''
      },
      {
        name: `${product.name.replace(/\s+/g, '_')}_Bonus_Content.zip`,
        url: ''
      }
    ];
  })();

  const getFileSize = (fileName: string): string => {
    // Mock file sizes based on file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '2.5 MB';
      case 'epub': return '1.8 MB';
      case 'zip': case 'rar': return '15.2 MB';
      case '7z': return '12.8 MB';
      case 'mp4': case 'mov': case 'avi': return '125 MB';
      case 'mp3': return '4.2 MB';
      case 'wav': case 'flac': return '28 MB';
      case 'png': case 'jpg': case 'jpeg': return '850 KB';
      case 'gif': case 'webp': return '420 KB';
      case 'svg': return '45 KB';
      case 'txt': case 'md': case 'rtf': return '12 KB';
      case 'doc': case 'docx': return '1.1 MB';
      case 'ppt': case 'pptx': return '3.8 MB';
      case 'xls': case 'xlsx': return '890 KB';
      case 'csv': return '156 KB';
      case 'json': case 'xml': return '24 KB';
      case 'html': case 'css': return '18 KB';
      case 'js': case 'ts': case 'py': case 'java': case 'cpp': case 'c': case 'h': return '35 KB';
      default: return '1.2 MB';
    }
  };

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'PDF Document';
      case 'epub': return 'EPUB eBook';
      case 'zip': case 'rar': case '7z': return 'Archive File';
      case 'mp4': case 'mov': case 'avi': return 'Video File';
      case 'mp3': case 'wav': case 'flac': case 'm4a': return 'Audio File';
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return 'Image File';
      case 'svg': return 'SVG Vector Image';
      case 'txt': case 'md': case 'rtf': return 'Text File';
      case 'doc': case 'docx': return 'Word Document';
      case 'ppt': case 'pptx': return 'PowerPoint Presentation';
      case 'xls': case 'xlsx': case 'csv': return 'Spreadsheet';
      case 'json': case 'xml': case 'html': case 'css': return 'Web File';
      case 'js': case 'ts': case 'py': case 'java': case 'cpp': case 'c': case 'h': return 'Code File';
      default: return 'Digital File';
    }
  };

  const handleDownload = async (file: { name: string; url: string }) => {
    if (!paymentConfirmed) {
      toast({
        title: "Payment Required",
        description: "Please complete payment before downloading files.",
        variant: "destructive"
      });
      return;
    }

    setDownloadingFiles(prev => [...prev, file.name]);

    try {
      // Simulate download process with realistic timing
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (file.url) {
        // If we have a real URL, download it
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.target = '_blank'; // Open in new tab as fallback
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Mock download - create a sample file with better content
        const fileType = getFileType(file.name);
        const content = `Digital Product: ${product.name}

Thank you for your purchase!

This is a sample ${fileType.toLowerCase()} for demonstration purposes.
In a real implementation, this would be the actual product file.

Product Details:
- Product ID: ${product.id}
- File Name: ${file.name}
- File Type: ${fileType}
- Downloaded: ${new Date().toLocaleString()}
- Order Total: ${product.price} ${product.currency}

For support, please contact us with your order ID.

Thank you for choosing our digital marketplace!`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setDownloadedFiles(prev => [...prev, file.name]);

      toast({
        title: "Download Complete! 📥",
        description: `${file.name} has been downloaded successfully.`,
      });

      if (onDownloadComplete) {
        onDownloadComplete();
      }

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingFiles(prev => prev.filter(f => f !== file.name));
    }
  };

  const isFileDownloaded = (fileName: string) => downloadedFiles.includes(fileName);
  const isFileDownloading = (fileName: string) => downloadingFiles.includes(fileName);

  if (!paymentConfirmed) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="space-y-2">
            <p className="font-medium">⏳ Waiting for Payment Confirmation</p>
            <p className="text-sm">
              Digital files will be available for download after your payment is confirmed.
              Payment detection is automatic - no action needed from you.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
          <Download className="h-5 w-5 text-green-600" />
          <span>Digital Downloads Ready!</span>
        </CardTitle>
        <CardDescription className="text-green-600 dark:text-green-400">
          Your payment has been confirmed. Download your digital files below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Instructions */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Payment confirmed! You now have access to download your digital files.
            Downloads are available for 30 days from purchase date.
          </AlertDescription>
        </Alert>

        {/* File List */}
        <div className="space-y-3">
          <h4 className="font-medium">Available Files ({digitalFiles.length}):</h4>
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {digitalFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getFileType(file.name)} • {getFileSize(file.name)} • Ready for download
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isFileDownloaded(file.name) && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Downloaded
                    </Badge>
                  )}

                  <Button
                    onClick={() => handleDownload(file)}
                    disabled={isFileDownloading(file.name)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isFileDownloading(file.name) ? (
                      <>
                        <Download className="w-4 h-4 mr-2 animate-bounce" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Summary */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {downloadedFiles.length} of {digitalFiles.length} files downloaded
            </span>
            <span>
              Downloads expire in 30 days
            </span>
          </div>
        </div>

        {/* Support Info */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Having trouble downloading? Contact support with your order ID: {product.id}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}