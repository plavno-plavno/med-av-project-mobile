import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReAuth } from '..';
import { IPostMediaRequest, IPostMediaResponse } from './types';

export const mediaApi = createApi({
  baseQuery: baseQueryWithReAuth,
  reducerPath: 'mediaApi',
  endpoints: (builder) => ({
    mediaUpload: builder.mutation<IPostMediaResponse, IPostMediaRequest>({
      query: ({ files, prefix, postfix, tag }) => {
        const formData = new FormData();

        formData.append('files', files);
        formData.append('prefix', prefix);
        formData.append('postfix', postfix);

        if (tag) formData.append('tag', tag);

        return {
          url: 'media/upload',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const { useMediaUploadMutation } = mediaApi;