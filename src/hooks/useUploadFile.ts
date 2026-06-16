import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';
import { toast } from 'sonner';

import { useCurrentUser } from "./useCurrentUser";

export function useUploadFile() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      // Warn users with Alby that a signing popup may appear blank — they need to click
      // the Alby extension icon in the browser toolbar to approve it.
      const signerType = (user.signer as { type?: string }).type;
      if (signerType === 'nip07' || typeof (window as Window & { alby?: unknown }).alby !== 'undefined') {
        toast.info('A signing request will pop up. If the Alby window appears blank, click the Alby icon in your browser toolbar to approve.', {
          id: 'alby-signing-hint',
          duration: 8000,
        });
      }

      const uploader = new BlossomUploader({
        servers: [
          'https://blossom.primal.net/',
        ],
        signer: user.signer,
      });

      const tags = await uploader.upload(file);
      return tags;
    },
  });
}
