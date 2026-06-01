import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart2,
  Camera,
  Check,
  Download,
  FileText,
  Layers,
  ListChecks,
  Presentation,
  Share2,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import type { UploadedDocument } from '../../types/ChatTypes';
import { formatUserDate } from '../../utils/timezone';

interface FlashcardStats {
  total: number;
  known: number;
}

interface QuizStats {
  total: number;
  answered: number;
  correct: number;
}

interface ChatSidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadedDocs: UploadedDocument[];
  flashcardStats: FlashcardStats;
  quizStats: QuizStats;
  cardsToReview: number;
  focusScore: number;
  isFocusTrackingEnabled: boolean;
  isStrictMode: boolean;
  distractionCount: number;
  focusDriftCount: number;
  onToggleStrictMode: () => void;
  onCreateFlashcardsFromChat: () => void;
  onCreateQuizFromChat: () => void;
  onExportDeck: () => void;
  onShareDeck: () => void;
}

function UploadedDocuments({ uploadedDocs }: { uploadedDocs: UploadedDocument[] }) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Documents ({uploadedDocs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {uploadedDocs.length === 0 ? (
            <p className="text-sm text-secondary text-center py-8">No documents uploaded yet</p>
          ) : (
            uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg bg-card border border-border hover:border-blue-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {doc.type === 'pdf' && <FileText className="w-4 h-4 text-red-400" />}
                  {doc.type === 'Word' && <FileText className="w-4 h-4 text-blue-400" />}
                  {doc.type === 'ppt' && <Presentation className="w-4 h-4 text-orange-400" />}
                  {doc.type === 'image' && <Camera className="w-4 h-4 text-cyan-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-secondary">{formatUserDate(doc.uploadDate)}</p>
                  </div>
                  {doc.processed && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StrictModeCard({
  isStrictMode,
  distractionCount,
  focusDriftCount,
  onToggleStrictMode,
}: Pick<ChatSidePanelProps, 'isStrictMode' | 'distractionCount' | 'focusDriftCount' | 'onToggleStrictMode'>) {
  return (
    <Card className={`transition-all duration-300 ${isStrictMode ? 'border-amber-500/40 bg-amber-500/5' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isStrictMode ? 'text-amber-400' : 'text-slate-400'}`} />
          Strict Mode
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isStrictMode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
            {isStrictMode ? 'ON' : 'OFF'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-secondary leading-relaxed">
          {isStrictMode
            ? 'Distractions are blocked. Stay locked in and finish your session.'
            : 'Enable to block distractions and enforce deep focus during your session.'}
        </p>
        {isStrictMode && <p className="text-xs text-amber-400">Tab distractions blocked: {distractionCount}</p>}
        <p className="text-xs text-secondary">Focus drifts detected: {focusDriftCount}</p>
        <Button
          className={`w-full h-10 gap-2 font-medium transition-all ${isStrictMode
            ? 'bg-gradient-to-r from-amber-500/20 to-red-500/20 border-amber-500/40 hover:from-amber-500/30 hover:to-red-500/30 text-amber-400'
            : 'bg-gradient-to-r from-slate-500/10 to-slate-400/10 border-slate-400/30 hover:from-slate-500/20 hover:to-slate-400/20 text-slate-400'
          }`}
          variant="outline"
          onClick={onToggleStrictMode}
        >
          <ShieldAlert className="w-4 h-4" />
          {isStrictMode ? 'Disable Strict Mode' : 'Enable Strict Mode'}
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickActions({
  includeDeckActions,
  onCreateFlashcardsFromChat,
  onCreateQuizFromChat,
  onExportDeck,
  onShareDeck,
}: Pick<ChatSidePanelProps, 'onCreateFlashcardsFromChat' | 'onCreateQuizFromChat' | 'onExportDeck' | 'onShareDeck'> & {
  includeDeckActions: boolean;
}) {
  return (
    <div className="space-y-2">
      <Button
        className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
        variant="outline"
        onClick={onCreateFlashcardsFromChat}
      >
        <Layers className="w-4 h-4" />
        Create Flashcards from Chat
      </Button>

      <Button
        className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
        variant="outline"
        onClick={onCreateQuizFromChat}
      >
        <ListChecks className="w-4 h-4" />
        Create Quiz from Chat
      </Button>

      {includeDeckActions && (
        <>
          <Button
            className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
            variant="outline"
            onClick={onExportDeck}
          >
            <Download className="w-4 h-4" />
            Export Deck
          </Button>

          <Button
            className="w-full h-12 justify-start gap-2 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all"
            variant="outline"
            onClick={onShareDeck}
          >
            <Share2 className="w-4 h-4" />
            Share Deck
          </Button>
        </>
      )}
    </div>
  );
}

function SessionSummary({
  flashcardStats,
  quizStats,
  cardsToReview,
  focusScore,
  isFocusTrackingEnabled,
}: Pick<ChatSidePanelProps, 'flashcardStats' | 'quizStats' | 'cardsToReview' | 'focusScore' | 'isFocusTrackingEnabled'>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Session Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Total Cards:</span>
          <span>{flashcardStats.total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Known:</span>
          <span className="text-green-400">{flashcardStats.known}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">To Review:</span>
          <span className="text-yellow-400">{cardsToReview}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Quiz Questions:</span>
          <span>{quizStats.total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Answered:</span>
          <span className="text-blue-400">{quizStats.answered}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Correct:</span>
          <span className="text-green-400">{quizStats.correct}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-secondary">Current Focus:</span>
          <span className={isFocusTrackingEnabled ? 'gradient-text' : 'text-secondary'}>
            {isFocusTrackingEnabled ? `${focusScore}%` : 'Not tracking'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatSidePanel({
  open,
  onOpenChange,
  uploadedDocs,
  flashcardStats,
  quizStats,
  cardsToReview,
  focusScore,
  isFocusTrackingEnabled,
  isStrictMode,
  distractionCount,
  focusDriftCount,
  onToggleStrictMode,
  onCreateFlashcardsFromChat,
  onCreateQuizFromChat,
  onExportDeck,
  onShareDeck,
}: ChatSidePanelProps) {
  const closeAfter = (action: () => void) => () => {
    action();
    onOpenChange(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="hidden lg:flex w-80 border-l border-border p-6 flex-col gap-6 h-screen overflow-y-auto bg-white/98 dark:bg-[#10121A]/98 backdrop-blur-xl fixed lg:relative z-30 right-0"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg">Session Info</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <UploadedDocuments uploadedDocs={uploadedDocs} />
            <QuickActions
              includeDeckActions
              onCreateFlashcardsFromChat={closeAfter(onCreateFlashcardsFromChat)}
              onCreateQuizFromChat={closeAfter(onCreateQuizFromChat)}
              onExportDeck={onExportDeck}
              onShareDeck={onShareDeck}
            />
            <SessionSummary
              flashcardStats={flashcardStats}
              quizStats={quizStats}
              cardsToReview={cardsToReview}
              focusScore={focusScore}
              isFocusTrackingEnabled={isFocusTrackingEnabled}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-80 p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Session Info
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <StrictModeCard
              isStrictMode={isStrictMode}
              distractionCount={distractionCount}
              focusDriftCount={focusDriftCount}
              onToggleStrictMode={onToggleStrictMode}
            />
            <QuickActions
              includeDeckActions={false}
              onCreateFlashcardsFromChat={closeAfter(onCreateFlashcardsFromChat)}
              onCreateQuizFromChat={closeAfter(onCreateQuizFromChat)}
              onExportDeck={onExportDeck}
              onShareDeck={onShareDeck}
            />
            <SessionSummary
              flashcardStats={flashcardStats}
              quizStats={quizStats}
              cardsToReview={cardsToReview}
              focusScore={focusScore}
              isFocusTrackingEnabled={isFocusTrackingEnabled}
            />

            <div className="text-xs text-secondary text-center pt-4">
              Documents: {uploadedDocs.length}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
