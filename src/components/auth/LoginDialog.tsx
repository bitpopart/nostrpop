// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useState } from 'react';
import { Shield, Smartphone, KeyRound, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useLoginActions } from '@/hooks/useLoginActions';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup?: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ isOpen, onClose, onLogin, onSignup }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [bunkerUri, setBunkerUri] = useState('');
  const login = useLoginActions();

  const handleExtensionLogin = async () => {
    setIsLoading(true);
    try {
      if (!('nostr' in window)) {
        throw new Error('Nostr extension not found. Please install a NIP-07 extension.');
      }
      await login.extension();
      onLogin();
      onClose();
    } catch (error) {
      console.error('Extension login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBunkerLogin = () => {
    if (!bunkerUri.trim() || !bunkerUri.startsWith('bunker://')) return;
    setIsLoading(true);
    
    try {
      login.bunker(bunkerUri);
      onLogin();
      onClose();
    } catch (error) {
      console.error('Bunker login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupClick = () => {
    onClose();
    if (onSignup) {
      onSignup();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md p-0 overflow-hidden rounded-2xl'>
        <DialogHeader className='px-6 pt-6 pb-0 relative'>
          <DialogTitle className='text-xl font-semibold text-center'>Log in with Nostr</DialogTitle>
          <DialogDescription className='text-center text-muted-foreground mt-2'>
            Use a secure signer — your private key never leaves your device
          </DialogDescription>
        </DialogHeader>

        <div className='px-6 py-6 space-y-5'>

          {/* Safety notice */}
          <div className='flex items-start gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3'>
            <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0' />
            <p className='text-xs text-amber-800 dark:text-amber-300 leading-relaxed'>
              <strong>We don't support nsec login</strong> — pasting your private key anywhere is unsafe.
              Use a remote signer or browser extension to keep your key secure.
            </p>
          </div>

          <Tabs defaultValue={'nostr' in window ? 'extension' : 'remote'} className='w-full'>
            <TabsList className='grid grid-cols-2 mb-5'>
              <TabsTrigger value='extension'>
                <Shield className='h-3.5 w-3.5 mr-1.5' />
                Extension
              </TabsTrigger>
              <TabsTrigger value='remote'>
                <Smartphone className='h-3.5 w-3.5 mr-1.5' />
                Remote Signer
              </TabsTrigger>
            </TabsList>

            {/* ── Browser Extension tab ── */}
            <TabsContent value='extension' className='space-y-4'>
              <div className='text-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60'>
                <Shield className='w-12 h-12 mx-auto mb-3 text-primary' />
                <p className='text-sm text-gray-600 dark:text-gray-300 mb-1 font-medium'>
                  Login with one click
                </p>
                <p className='text-xs text-muted-foreground mb-4'>
                  Use a NIP-07 browser extension — your key stays in the extension, never exposed.
                </p>
                <Button
                  className='w-full rounded-full py-6'
                  onClick={handleExtensionLogin}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in…' : 'Login with Extension'}
                </Button>
              </div>
              <div className='text-center'>
                <p className='text-xs text-muted-foreground'>
                  Popular extensions:{' '}
                  <a href='https://getalby.com' target='_blank' rel='noopener noreferrer' className='underline hover:text-foreground'>
                    Alby
                  </a>
                  {' · '}
                  <a href='https://www.getflamingo.org' target='_blank' rel='noopener noreferrer' className='underline hover:text-foreground'>
                    Flamingo
                  </a>
                  {' · '}
                  <a href='https://github.com/fiatjaf/nos2x' target='_blank' rel='noopener noreferrer' className='underline hover:text-foreground'>
                    nos2x
                  </a>
                </p>
              </div>
            </TabsContent>

            {/* ── Remote Signer tab ── */}
            <TabsContent value='remote' className='space-y-4'>
              <div className='rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 space-y-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <Smartphone className='h-4 w-4 text-primary' />
                  <p className='text-sm font-medium'>Use your phone as a signer</p>
                </div>
                <p className='text-xs text-muted-foreground leading-relaxed'>
                  Remote signing keeps your private key safely on your mobile device.
                  Scan or paste the connection URI from your signer app.
                </p>

                {/* App recommendations */}
                <div className='grid grid-cols-2 gap-2 pt-1'>
                  <a
                    href='https://github.com/greenart7c3/Amber'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs hover:bg-white dark:hover:bg-gray-700 transition-colors'
                  >
                    <span className='text-base'>🤖</span>
                    <div>
                      <p className='font-semibold'>Amber</p>
                      <p className='text-muted-foreground'>Android</p>
                    </div>
                    <ExternalLink className='h-3 w-3 ml-auto text-muted-foreground' />
                  </a>
                  <a
                    href='https://www.getclave.io'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs hover:bg-white dark:hover:bg-gray-700 transition-colors'
                  >
                    <span className='text-base'>🍎</span>
                    <div>
                      <p className='font-semibold'>Clave</p>
                      <p className='text-muted-foreground'>iOS</p>
                    </div>
                    <ExternalLink className='h-3 w-3 ml-auto text-muted-foreground' />
                  </a>
                </div>
              </div>

              {/* Bunker URI input */}
              <div className='space-y-2'>
                <label htmlFor='bunkerUri' className='text-sm font-medium text-gray-700 dark:text-gray-400 flex items-center gap-1.5'>
                  <KeyRound className='h-3.5 w-3.5' />
                  Bunker URI
                </label>
                <Input
                  id='bunkerUri'
                  value={bunkerUri}
                  onChange={(e) => setBunkerUri(e.target.value)}
                  className='rounded-lg border-gray-300 dark:border-gray-700 focus-visible:ring-primary'
                  placeholder='bunker://'
                />
                {bunkerUri && !bunkerUri.startsWith('bunker://') && (
                  <p className='text-red-500 text-xs'>URI must start with bunker://</p>
                )}
              </div>

              <Button
                className='w-full rounded-full py-6'
                onClick={handleBunkerLogin}
                disabled={isLoading || !bunkerUri.trim() || !bunkerUri.startsWith('bunker://')}
              >
                {isLoading ? 'Connecting…' : 'Connect Remote Signer'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className='text-center text-sm'>
            <p className='text-gray-600 dark:text-gray-400'>
              Don't have an account?{' '}
              <button
                onClick={handleSignupClick}
                className='text-primary hover:underline font-medium'
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
