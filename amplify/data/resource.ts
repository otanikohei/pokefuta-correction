import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Photo: a
    .model({
      filename: a.string().required(),
      s3Key: a.string().required(),
      latitude: a.float().required(),
      longitude: a.float().required(),
      capturedAt: a.datetime().required(),
      uploadedAt: a.datetime().required(),
      thumbnailUrl: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});