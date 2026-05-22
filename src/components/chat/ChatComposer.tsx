import { FileText, MessageSquarePlus, Plus, Send, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface AIModelOption<T extends string = string> {
  id: T;
  name: string;
  description: string;
}

interface ChatComposerProps<T extends string> {
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onSendMessage: () => void;
  onOpenUploadModal: () => void;
  pendingFile: File | null;
  onClearPendingFile: () => void;
  selectedModel: T;
  onSelectedModelChange: (value: T) => void;
  models: readonly AIModelOption<T>[];
  activeModelDescription: string;
  isThreadModelLocked: boolean;
  onStartNewThread: () => void;
}

export function ChatComposer<T extends string>({
  inputValue,
  onInputValueChange,
  onSendMessage,
  onOpenUploadModal,
  pendingFile,
  onClearPendingFile,
  selectedModel,
  onSelectedModelChange,
  models,
  activeModelDescription,
  isThreadModelLocked,
  onStartNewThread,
}: ChatComposerProps<T>) {
  return (
    <div className="border-t border-border p-4 flex-shrink-0 bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-5xl mx-auto">
        {pendingFile && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
              <span className="truncate text-sm text-foreground">{pendingFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 rounded-full"
              onClick={onClearPendingFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={onOpenUploadModal}
          >
            <Plus className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(event) => onInputValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onSendMessage();
                }
              }}
              placeholder="Ask the AI Tutor anything..."
              className="rounded-full pr-24  border-2 border-blue-500/30 focus:border-blue-500/50 glow-blue-purple"
            />
          </div>

          <Button
            size="icon"
            className="rounded-full flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={onSendMessage}
            disabled={!inputValue.trim() && !pendingFile}
          >
            <Send className="w-5 h-5" />
          </Button>

          <Select
            value={selectedModel}
            onValueChange={(value) => onSelectedModelChange(value as T)}
            disabled={isThreadModelLocked}
          >
            <SelectTrigger
              className="chat-model-select-trigger h-10 w-40 max-w-[42vw] flex-shrink-0 rounded-full px-4 text-sm shadow-sm transition focus:ring-2"
              aria-label="AI model"
              title={isThreadModelLocked ? 'Start a new chat to switch models' : activeModelDescription}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="chat-model-select-content rounded-xl p-1 shadow-xl backdrop-blur-xl">
              {models.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="chat-model-select-item rounded-lg px-3 py-2 text-sm transition"
                >
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={onStartNewThread}
            title="Start new chat"
            aria-label="Start new chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
