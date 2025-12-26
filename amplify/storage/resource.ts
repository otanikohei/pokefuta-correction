import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'pokefutaPhotos',
  access: (allow) => ({
    'public/photos/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public/thumbnails/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});