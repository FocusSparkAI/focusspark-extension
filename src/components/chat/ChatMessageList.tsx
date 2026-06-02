import { type Dispatch, type RefObject, type SetStateAction } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  UserRound,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FormattedAIMessage } from '../shared/FormattedAIMessage';
import type { Message } from '../../types/ChatTypes';
import { formatUserTime } from '../../utils/timezone';

interface ChatMessageListProps {
  messages: Message[];
  isProcessing: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  currentFlashcardIndex: number;
  revealedFlashcardIds: Set<string>;
  quizAnswers: { [key: string]: number };
  onRevealFlashcard: (cardId: string) => void;
  onCurrentFlashcardIndexChange: Dispatch<SetStateAction<number>>;
  onQuizAnswersChange: Dispatch<SetStateAction<{ [key: string]: number }>>;
  onFlashcardKnown: (cardId: string, known: boolean) => void;
}

export function ChatMessageList({
  messages,
  isProcessing,
  chatEndRef,
  currentFlashcardIndex,
  revealedFlashcardIds,
  quizAnswers,
  onRevealFlashcard,
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
                        {formatUserTime(message.timestamp)}
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
                  {(() => {
                    const currentCard = message.flashcards[currentFlashcardIndex];
                    if (!currentCard) return null;

                    const isCurrentCardRevealed = revealedFlashcardIds.has(currentCard.id);

                    return (
                  <div className="chat-study-shell chat-study-shell-flashcard">
                    <div className="chat-study-header">
                      <div>
                        <p className="chat-study-eyebrow">Flashcards</p>
                        <p className="chat-study-message">{message.content}</p>
                      </div>
                      <Badge variant="secondary" className="chat-study-count">
                        {currentFlashcardIndex + 1} / {message.flashcards.length}
                      </Badge>
                    </div>

                    <div className="relative">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentFlashcardIndex}
                          initial={{ opacity: 0, rotateY: 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: -90 }}
                          transition={{ duration: 0.5 }}
                          className="chat-flashcard-stage"
                        >
                          <Card
                            className={`chat-flashcard-card ${isCurrentCardRevealed ? 'chat-flashcard-card-back' : ''}`}
                            role="button"
                            tabIndex={isCurrentCardRevealed ? -1 : 0}
                            aria-label={
                              isCurrentCardRevealed
                                ? `Answer revealed for ${currentCard.title}`
                                : `Reveal answer for ${currentCard.title}`
                            }
                            onClick={() => {
                              if (!isCurrentCardRevealed) {
                                onRevealFlashcard(currentCard.id);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (isCurrentCardRevealed) return;
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onRevealFlashcard(currentCard.id);
                              }
                            }}
                          >
                            <CardHeader className="chat-flashcard-card-header">
                              <div className="chat-flashcard-title-row">
                                <div className="min-w-0">
                                  <CardTitle className="chat-flashcard-title">
                                    {currentCard.title}
                                  </CardTitle>
                                  <div className="chat-flashcard-tags">
                                    {currentCard.topic && (
                                      <Badge variant="secondary" className="chat-study-pill">
                                        {currentCard.topic}
                                      </Badge>
                                    )}
                                    {currentCard.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="chat-study-pill">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="chat-flashcard-content">
                              {!isCurrentCardRevealed ? (
                                <div className="chat-flashcard-face">
                                  <p className="chat-flashcard-question">
                                    {currentCard.front}
                                  </p>
                                  <p className="chat-flashcard-hint">
                                    Click, Enter, or Space to reveal answer
                                  </p>
                                </div>
                              ) : (
                                <div className="chat-flashcard-answer-stack">
                                  <div className="chat-study-answer-card">
                                    <p className="chat-study-section-label">Answer</p>
                                    <p className="chat-study-answer-text">
                                      {currentCard.back}
                                    </p>
                                  </div>

                                  {currentCard.example && (
                                    <div className="chat-study-note chat-study-note-blue">
                                      <p className="chat-study-section-label">Example</p>
                                      <p>{currentCard.example}</p>
                                    </div>
                                  )}

                                  {currentCard.memoryTip && (
                                    <div className="chat-study-note chat-study-note-amber">
                                      <p className="chat-study-section-label">Memory Tip</p>
                                      <p>{currentCard.memoryTip}</p>
                                    </div>
                                  )}

                                  {currentCard.examShortcut && (
                                    <div className="chat-study-note chat-study-note-teal">
                                      <p className="chat-study-section-label">Exam Shortcut</p>
                                      <p className="font-mono">
                                        {currentCard.examShortcut}
                                      </p>
                                    </div>
                                  )}

                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </AnimatePresence>

                      <div className="chat-study-primary-action">
                        <Button
                          size="lg"
                          className="flashcard-know-btn"
                          disabled={isCurrentCardRevealed}
                          onClick={() => {
                            onFlashcardKnown(currentCard.id, true);
                            if (currentFlashcardIndex < message.flashcards!.length - 1) {
                              onCurrentFlashcardIndexChange((prev) => prev + 1);
                            }
                          }}
                        >
                          <Check className="w-5 h-5" />
                          I Know It
                        </Button>
                      </div>

                      <div className="chat-study-nav">
                        <Button
                          variant="outline"
                          size="icon"
                          className="chat-study-nav-button"
                          disabled={currentFlashcardIndex === 0}
                          onClick={() => {
                            onCurrentFlashcardIndexChange((prev) => prev - 1);
                          }}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <span className="chat-study-position">
                          {currentFlashcardIndex + 1} / {message.flashcards.length}
                        </span>

                        <Button
                          variant="outline"
                          size="icon"
                          className="chat-study-nav-button"
                          disabled={
                            currentFlashcardIndex === message.flashcards.length - 1 || !isCurrentCardRevealed
                          }
                          onClick={() => {
                            onCurrentFlashcardIndexChange((prev) => prev + 1);
                          }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                    );
                  })()}
                </div>
              )}

              {message.type === 'quiz' && message.quizData && (
                <div className="chat-study-shell chat-study-shell-quiz">
                  <div className="chat-study-header">
                    <div>
                      <p className="chat-study-eyebrow">Quiz</p>
                      <p className="chat-study-message">{message.content}</p>
                    </div>
                    <Badge variant="secondary" className="chat-study-count">
                      {Object.keys(quizAnswers).length} / {message.quizData.length}
                    </Badge>
                  </div>

                  <div className="chat-quiz-stack">
                    {message.quizData.map((question, qIndex) => {
                      const selectedAnswer = quizAnswers[question.id];
                      const hasSelectedAnswer = typeof selectedAnswer === 'number';

                      return (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: qIndex * 0.1 }}
                          className="chat-quiz-question-card"
                        >
                          <div className="chat-quiz-question-header">
                            <span className="chat-quiz-question-number">Q{qIndex + 1}</span>
                            <p className="chat-quiz-question-text">{question.question}</p>
                          </div>

                          <div className="chat-quiz-options">
                            {question.options.map((option, oIndex) => {
                              const isSelected = selectedAnswer === oIndex;
                              const isCorrect = question.correctAnswer === oIndex;
                              const optionClass = [
                                'chat-quiz-option',
                                !hasSelectedAnswer && isSelected ? 'chat-quiz-option-selected' : '',
                                hasSelectedAnswer && isCorrect ? 'chat-quiz-option-correct' : '',
                                hasSelectedAnswer && isSelected && !isCorrect ? 'chat-quiz-option-incorrect' : '',
                              ].filter(Boolean).join(' ');

                              return (
                                <Button
                                  key={oIndex}
                                  variant="outline"
                                  className={optionClass}
                                  disabled={hasSelectedAnswer}
                                  onClick={() => {
                                    if (hasSelectedAnswer) return;

                                    onQuizAnswersChange((prev) => ({
                                      ...prev,
                                      [question.id]: oIndex,
                                    }));
                                  }}
                                >
                                  <span className="chat-quiz-option-letter">{String.fromCharCode(65 + oIndex)}</span>
                                  <span className="chat-quiz-option-text">{option}</span>
                                  {hasSelectedAnswer && isCorrect && (
                                    <Check className="chat-quiz-option-check" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>

                          <AnimatePresence>
                            {hasSelectedAnswer && question.explanation && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="chat-quiz-feedback"
                              >
                                <p className="chat-quiz-feedback-title">Explanation:</p>
                                <p className="chat-quiz-feedback-text">{question.explanation}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                    {Object.keys(quizAnswers).length === message.quizData.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="chat-quiz-complete"
                      >
                        <p className="chat-quiz-complete-title">Quiz Complete!</p>
                        <p className="chat-quiz-complete-score">
                          Score: {message.quizData.filter((question) => quizAnswers[question.id] === question.correctAnswer).length} / {message.quizData.length}
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

        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
