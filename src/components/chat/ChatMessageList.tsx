import { type Dispatch, type RefObject, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Upload,
  UserRound,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { FormattedAIMessage } from '../shared/FormattedAIMessage';
import type { Message } from '../../pages/chat/types/ChatTypes';

interface ChatMessageListProps {
  messages: Message[];
  isProcessing: boolean;
  uploadProgress: number;
  chatEndRef: RefObject<HTMLDivElement | null>;
  currentFlashcardIndex: number;
  showFlashcardBack: boolean;
  quizAnswers: { [key: string]: number };
  onShowFlashcardBackChange: (value: boolean) => void;
  onCurrentFlashcardIndexChange: Dispatch<SetStateAction<number>>;
  onQuizAnswersChange: Dispatch<SetStateAction<{ [key: string]: number }>>;
  onFlashcardKnown: (cardId: string, known: boolean) => void;
}

export function ChatMessageList({
  messages,
  isProcessing,
  uploadProgress,
  chatEndRef,
  currentFlashcardIndex,
  showFlashcardBack,
  quizAnswers,
  onShowFlashcardBackChange,
  onCurrentFlashcardIndexChange,
  onQuizAnswersChange,
  onFlashcardKnown,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 chatbot-messages-scroll">
      <div className="max-w-5xl mx-auto space-y-6 pb-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'user' && (
                <div className="max-w-2xl rounded-3xl px-5 py-4 bg-card dark:bg-gray-900/70 backdrop-blur-md border border-blue-500/30 dark:border-gray-700 shadow-lg">
                  <div className="flex flex-row-reverse items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserRound className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3 text-right">
                      {message.content && (
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      )}
                      {message.attachmentName && (
                        <div className="ml-auto flex max-w-full items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-left">
                          <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                          <span className="truncate text-sm font-medium text-foreground">{message.attachmentName}</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {message.type === 'ai' && (
                <FormattedAIMessage content={message.content} timestamp={message.timestamp} />
              )}

              {message.type === 'system' && (
                <div className="w-full rounded-2xl px-6 py-4 border border-teal-500/30 bg-card dark:bg-gray-900/70 backdrop-blur-md shadow-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-teal-400" />
                    <p className="text-foreground">{message.content}</p>
                  </div>
                </div>
              )}

              {message.type === 'flashcard' && message.flashcards && (
                <div className="w-full space-y-4">
                  <div className="rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
                    <p className="mb-4 text-foreground">{message.content}</p>

                    <div className="relative">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentFlashcardIndex}
                          initial={{ opacity: 0, rotateY: 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: -90 }}
                          transition={{ duration: 0.5 }}
                          className="min-h-[300px]"
                        >
                          <Card
                            className="cursor-pointer hover:shadow-2xl transition-shadow border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-600/10"
                            onClick={() => onShowFlashcardBackChange(!showFlashcardBack)}
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="gradient-text mb-2">
                                    {message.flashcards[currentFlashcardIndex].title}
                                  </CardTitle>
                                  <div className="flex flex-wrap gap-2">
                                    {message.flashcards[currentFlashcardIndex].topic && (
                                      <Badge variant="secondary" className="text-xs">
                                        {message.flashcards[currentFlashcardIndex].topic}
                                      </Badge>
                                    )}
                                    {message.flashcards[currentFlashcardIndex].tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {!showFlashcardBack ? (
                                <div>
                                  <p className="text-lg mb-4 text-foreground">
                                    {message.flashcards[currentFlashcardIndex].front}
                                  </p>
                                  <p className="text-sm text-muted-foreground text-center">
                                    Click to reveal answer
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="p-4 rounded-xl bg-card border border-border">
                                    <p className="text-lg text-foreground">
                                      {message.flashcards[currentFlashcardIndex].back}
                                    </p>
                                  </div>

                                  {message.flashcards[currentFlashcardIndex].example && (
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                      <p className="text-sm text-muted-foreground mb-1">Example:</p>
                                      <p className="text-foreground">{message.flashcards[currentFlashcardIndex].example}</p>
                                    </div>
                                  )}

                                  {message.flashcards[currentFlashcardIndex].memoryTip && (
                                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                                      <p className="text-sm text-muted-foreground mb-1">Memory Tip:</p>
                                      <p className="text-foreground">{message.flashcards[currentFlashcardIndex].memoryTip}</p>
                                    </div>
                                  )}

                                  {message.flashcards[currentFlashcardIndex].examShortcut && (
                                    <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
                                      <p className="text-sm text-muted-foreground mb-1">Exam Shortcut:</p>
                                      <p className="font-mono text-foreground">
                                        {message.flashcards[currentFlashcardIndex].examShortcut}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Button
                          size="lg"
                          className="flashcard-know-btn"
                          disabled={showFlashcardBack}
                          onClick={() => {
                            onFlashcardKnown(message.flashcards![currentFlashcardIndex].id, true);
                            if (currentFlashcardIndex < message.flashcards!.length - 1) {
                              onCurrentFlashcardIndexChange((prev) => prev + 1);
                            }
                            onShowFlashcardBackChange(false);
                          }}
                        >
                          <Check className="w-5 h-5" />
                          I Know It
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={currentFlashcardIndex === 0}
                          onClick={() => {
                            onCurrentFlashcardIndexChange((prev) => prev - 1);
                            onShowFlashcardBackChange(false);
                          }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <span className="text-sm text-muted-foreground">
                          {currentFlashcardIndex + 1} / {message.flashcards.length}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          disabled={
                            currentFlashcardIndex === message.flashcards.length - 1 || !showFlashcardBack
                          }
                          onClick={() => {
                            onCurrentFlashcardIndexChange((prev) => prev + 1);
                            onShowFlashcardBackChange(false);
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {message.type === 'quiz' && message.quizData && (
                <div className="w-full rounded-2xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
                  <p className="mb-6 text-foreground">{message.content}</p>

                  <div className="space-y-6">
                    {message.quizData.map((question, qIndex) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: qIndex * 0.1 }}
                        className="p-6 rounded-xl bg-card border border-border"
                      >
                        <p className="mb-4 text-foreground">
                          <span className="text-blue-400 mr-2">Q{qIndex + 1}.</span>
                          {question.question}
                        </p>

                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <Button
                              key={oIndex}
                              variant="outline"
                              className={`w-full justify-start text-left ${quizAnswers[question.id] === oIndex ? 'border-blue-500 bg-blue-500/10' : ''
                                }`}
                              onClick={() => {
                                onQuizAnswersChange((prev) => ({
                                  ...prev,
                                  [question.id]: oIndex,
                                }));
                              }}
                            >
                              <span className="mr-3 text-muted-foreground">{String.fromCharCode(65 + oIndex)}.</span>
                              {option}
                              {quizAnswers[question.id] === oIndex && (
                                <Check className="w-4 h-4 ml-auto text-blue-400" />
                              )}
                            </Button>
                          ))}
                        </div>

                      </motion.div>
                    ))}

                    {Object.keys(quizAnswers).length === message.quizData.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30"
                      >
                        <p className="text-2xl mb-2 text-foreground">Quiz Complete!</p>
                        <p className="text-muted-foreground">
                          Score: {Object.values(quizAnswers).filter((answer, idx) => answer === message.quizData![idx].correctAnswer).length} / {message.quizData.length}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="rounded-3xl px-6 py-4 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full typing-dot"></div>
                </div>
                <span className="text-sm text-muted-foreground">Tutor is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 bg-white/95 dark:bg-[#1C1F2A]/95 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <Upload className="w-5 h-5 text-blue-400" />
              <p className="text-foreground">Uploading and processing document...</p>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
