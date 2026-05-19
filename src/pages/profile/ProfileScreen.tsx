import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Home,
  Edit2,
  Check,
  X,
  PlayCircle,
  Trash2,
  Download,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileScreenProps {
  onNavigate: (page: string) => void;
  onReplayOnboarding?: () => void;
}

export function ProfileScreen({ onNavigate, onReplayOnboarding }: ProfileScreenProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);

  // User data
  const [name, setName] = useState('Alex Chen');
  const [tempName, setTempName] = useState('Alex Chen');
  const [academicFocus, setAcademicFocus] = useState('Computer Science');
  const [bio, setBio] = useState(
    'Machine Learning enthusiast focused on deep learning and neural networks. Preparing for grad school applications.'
  );
  const [tempBio, setTempBio] = useState(bio);
  const [avatarUrl] = useState('');

  const handleSaveName = () => {
    setName(tempName);
    setIsEditingName(false);
    toast.success('✅ Name updated successfully!');
  };

  const handleSaveBio = () => {
    setBio(tempBio);
    setIsEditingBio(false);
    toast.success('✅ Bio updated successfully!');
  };

  const handleReplayOnboarding = () => {
    toast.success('🎯 Starting onboarding tour...');
    setTimeout(() => {
      if (onReplayOnboarding) {
        onReplayOnboarding();
      } else {
        onNavigate('onboarding');
      }
    }, 500);
  };

  const handleClearData = () => {
    setShowClearDataDialog(false);
    toast.success('🗑️ Local data cleared successfully!');
  };

  const handleExportData = () => {
    toast.success('📦 Exporting your account data...');
    setTimeout(() => {
      toast.success('✅ Data exported! Check your downloads.');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
    } else {
      setShowDeleteAccountDialog(false);
      setDeleteConfirmStep(1);
      toast.error('❌ Account deleted. Redirecting to homepage...');
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    }
  };

  const handleAvatarUpload = () => {
    toast.success('📷 Avatar upload coming soon!');
  };

  return (
    <div className="min-h-screen gradient-wave">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-accent"
              >
                <Home className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="gradient-text">My Profile</h1>
                <p className="text-sm text-secondary">
                  Master of consistency 💪 — keep your focus sharp!
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => onNavigate('settings')}
            >
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 ring-4 ring-blue-500/30 ring-offset-4 ring-offset-background">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarUpload}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-secondary mb-1">Profile Picture</p>
                  <p className="text-xs text-secondary">
                    Click to upload a new avatar with gradient glow effect
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-sm text-secondary mb-2 block">Full Name</label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="icon" onClick={handleSaveName} className="bg-green-500 hover:bg-green-600">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setTempName(name);
                        setIsEditingName(false);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="flex-1">{name}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setTempName(name);
                        setIsEditingName(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Academic Focus */}
              <div>
                <label className="text-sm text-secondary mb-2 block">Academic Focus</label>
                <Select value={academicFocus} onValueChange={setAcademicFocus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Medicine">Medicine</SelectItem>
                    <SelectItem value="Law">Law</SelectItem>
                    <SelectItem value="Liberal Arts">Liberal Arts</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm text-secondary mb-2 block">Bio</label>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempBio}
                      onChange={(e) => setTempBio(e.target.value)}
                      rows={4}
                      className="resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={handleSaveBio} className="bg-green-500 hover:bg-green-600">
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTempBio(bio);
                          setIsEditingBio(false);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors relative group"
                    onClick={() => {
                      setTempBio(bio);
                      setIsEditingBio(true);
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{bio}</p>
                    <Edit2 className="w-4 h-4 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleReplayOnboarding}
              >
                <PlayCircle className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p>Replay Onboarding Tour</p>
                  <p className="text-xs text-secondary">Guided walkthrough of FocusSpark features</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleExportData}
              >
                <Download className="w-5 h-5 text-green-400" />
                <div className="text-left">
                  <p>Export Account Data</p>
                  <p className="text-xs text-secondary">Download your data as CSV or JSON</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => setShowClearDataDialog(true)}
              >
                <Trash2 className="w-5 h-5 text-yellow-400" />
                <div className="text-left">
                  <p>Clear Local Data</p>
                  <p className="text-xs text-secondary">Remove cached files and temporary data</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-red-500/50 hover:bg-red-500/10 text-red-400"
                onClick={() => {
                  setDeleteConfirmStep(1);
                  setShowDeleteAccountDialog(true);
                }}
              >
                <AlertTriangle className="w-5 h-5" />
                <div className="text-left">
                  <p>Delete Account</p>
                  <p className="text-xs text-secondary">Permanently remove your account and data</p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Clear Local Data?</DialogTitle>
            <DialogDescription>
              This will remove all cached files and temporary data from your device. Your account data will remain safe on the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleClearData} className="bg-yellow-500 hover:bg-yellow-600">
              Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="glass-card border-2 border-red-500/30">
          <motion.div
            animate={deleteConfirmStep === 2 ? { x: [0, -5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {deleteConfirmStep === 1 ? 'Delete Account?' : 'Are you absolutely sure?'}
              </DialogTitle>
              <DialogDescription>
                {deleteConfirmStep === 1 ? (
                  <>
                    Deleting your account will permanently remove all stored data including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>All flashcards and decks</li>
                      <li>Quiz history and progress</li>
                      <li>Achievements and badges</li>
                      <li>Focus session records</li>
                      <li>AI chat history</li>
                    </ul>
                    <p className="mt-3 font-semibold text-red-400">This action cannot be undone.</p>
                  </>
                ) : (
                  <p className="text-red-400 font-semibold">
                    This is your final confirmation. All your data will be permanently deleted. There is no way to recover it.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteAccountDialog(false);
                  setDeleteConfirmStep(1);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600"
              >
                {deleteConfirmStep === 1 ? 'Continue' : 'Delete Forever'}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
