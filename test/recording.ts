import { gunzipSync } from 'zlib';
import { last } from 'lodash';

import {
  Recording,
  RecordingEntry,
  setupRecording,
  SetupRecordingInput,
} from '@jupiterone/integration-sdk-testing';
import { config, DEFAULT_ORG_NAME } from './config';

export { Recording };

export function setupAzureRecording(
  input: Omit<SetupRecordingInput, 'mutateEntry'>,
): Recording {
  return setupRecording({
    ...input,
    mutateEntry: mutateRecordingEntry,
  });
}

function mutateRecordingEntry(entry: RecordingEntry): void {
  let responseText = entry.response.content.text;
  if (!responseText) {
    return;
  }

  // Set orgUrl property to the default for matching in ci
  entry.request.url = entry.request.url.replace(
    last(config.orgUrl.split('/')),
    DEFAULT_ORG_NAME,
  );

  const contentEncoding = entry.response.headers.find(
    (e) => e.name === 'content-encoding',
  );
  const transferEncoding = entry.response.headers.find(
    (e) => e.name === 'transfer-encoding',
  );

  if (contentEncoding && contentEncoding.value === 'gzip') {
    const chunkBuffers: Buffer[] = [];
    const hexChunks = JSON.parse(responseText) as string[];
    hexChunks.forEach((chunk) => {
      const chunkBuffer = Buffer.from(chunk, 'hex');
      chunkBuffers.push(chunkBuffer);
    });

    responseText = gunzipSync(Buffer.concat(chunkBuffers)).toString('utf-8');

    // Remove encoding/chunking since content is now unzipped
    entry.response.headers = entry.response.headers.filter(
      (e) => e && e !== contentEncoding && e !== transferEncoding,
    );
    // Remove recording binary marker
    delete (entry.response.content as any)._isBinary;
    entry.response.content.text = responseText;
  }

  const responseJson = JSON.parse(responseText);

  const DEFAULT_REDACT = '[REDACTED]';
  const keysToRedactMap = new Map();

  keysToRedactMap.set('emailAddress', 'redacted@email.com');
  keysToRedactMap.set('userPrincipalName', DEFAULT_REDACT);
  /**
   * Because of the way the Azure DevOps sdk inexplicably makes an api call to get the urls for other api calls,
   * I need to crawl the responses of api calls to replace the .env configured url with the DEFAULT_ORG_NAME in
   * order to get matching to work in ci
   */
  keysToRedactMap.set('locationUrl', (val) =>
    val.replace(last(config.orgUrl.split('/')), DEFAULT_ORG_NAME),
  );
  keysToRedactMap.set('url', (val) =>
    val.replace(last(config.orgUrl.split('/')), DEFAULT_ORG_NAME),
  );

  if (responseJson?.value?.forEach) {
    responseJson.value.forEach((responseValue, index) => {
      keysToRedactMap.forEach((redaction, keyToRedact) => {
        if (responseValue[keyToRedact]) {
          const redactionValue =
            typeof redaction === 'function'
              ? redaction(responseValue[keyToRedact])
              : redaction;
          responseJson.value[index][keyToRedact] = redactionValue;
        }
      });
    });
    entry.response.content.text = JSON.stringify(responseJson);
  }

  if (/login/.exec(entry.request.url) && entry.request.postData) {
    // Redact request body with secrets for authentication
    entry.request.postData.text = '[REDACTED]';

    // Redact authentication response token
    if (responseJson.access_token) {
      entry.response.content.text = JSON.stringify(
        {
          ...responseJson,
          access_token: '[REDACTED]',
        },
        null,
        0,
      );
    }
  }
}
