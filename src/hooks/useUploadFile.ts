import { useMutation } from "@tanstack/react-query";
import { BlossomUploader } from '@nostrify/nostrify/uploaders';

import { useCurrentUser } from "./useCurrentUser";
import { BLOSSOM_SERVERS } from "@/lib/relayHealth";

export function useUploadFile() {
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) {
        throw new Error('Must be logged in to upload files');
      }

      const uploader = new BlossomUploader({
        servers: BLOSSOM_SERVERS,
        signer: user.signer,
      });

      const tags = await uploader.upload(file);
      return tags;
    },
  });
}
