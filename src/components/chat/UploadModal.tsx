import { type ChangeEvent, type RefObject } from 'react';
import { FileText, Presentation } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  fileAccept: string;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: (accept: string) => void;
}

export function UploadModal({
  open,
  onOpenChange,
  fileInputRef,
  fileAccept,
  onFileUpload,
  onOpenFilePicker,
}: UploadModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload PDFs, PowerPoints, Ms Word, or text files for AI analysis and flashcard generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            onChange={onFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onOpenFilePicker('.pdf')}
            >
              <FileText className="w-8 h-8 text-red-400" />
              <span className="text-sm">PDF</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onOpenFilePicker('.ppt,.pptx')}
            >
              <Presentation className="w-8 h-8 text-orange-400" />
              <span className="text-sm">PowerPoint</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onOpenFilePicker('.doc,.docx')}
            >
              <FileText className="w-8 h-8 text-blue-400" />
              <span className="text-sm">Ms Word</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 flex flex-col gap-2"
              onClick={() => onOpenFilePicker('.txt')}
            >
              <FileText className="w-8 h-8 text-green-400" />
              <span className="text-sm">Text File</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
