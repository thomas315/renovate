import { getS3Client, parseS3Url } from './s3';

describe('util/s3', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('parses S3 URLs', () => {
    expect(parseS3Url('s3://bucket/key/path')).toEqual({
      Bucket: 'bucket',
      Key: 'key/path',
    });
  });

  it('returns null for non-S3 URLs', () => {
    expect(parseS3Url(new URL('http://example.com/key/path'))).toBeNull();
  });

  it('returns null for invalid URLs', () => {
    expect(parseS3Url('thisisnotaurl')).toBeNull();
  });

  it('returns a singleton S3 client instance', () => {
    const client1 = getS3Client();
    const client2 = getS3Client();
    expect(client1).toBe(client2);
  });

  it('uses user-configured s3 values', async () => {
    const s3 = await import('./s3.js');
    const globalConfig = await import('../config/global.js');
    globalConfig.GlobalConfig.set({
      s3Endpoint: 'https://minio.domain.test',
      s3PathStyle: true,
    });
    const client1 = s3.getS3Client();
    const client2 = getS3Client();
    expect(client1).not.toBe(client2);
    expect(await client1.config.endpoint?.()).toStrictEqual({
      hostname: 'minio.domain.test',
      path: '/',
      port: undefined,
      protocol: 'https:',
      query: undefined,
    });
    expect(client1.config.forcePathStyle).toBeTrue();
  });

  it('uses s3 values from globalConfig instead of GlobalConfig class', async () => {
    const s3 = await import('./s3.js');
    const client1 = s3.getS3Client('https://minio.domain.test', true);
    const client2 = getS3Client('https://minio.domain.test', true);
    expect(client1).not.toBe(client2);
    expect(await client1.config.endpoint?.()).toStrictEqual({
      hostname: 'minio.domain.test',
      path: '/',
      port: undefined,
      protocol: 'https:',
      query: undefined,
    });
    expect(client1.config.forcePathStyle).toBeTrue();
  });

  it('parses S3 URLs with credentials', () => {
    expect(
      parseS3Url('s3://AKIA123:SECRET456@bucket-name/some/key.json'),
    ).toEqual({
      Bucket: 'bucket-name',
      Key: 'some/key.json',
      accessKeyId: 'AKIA123',
      secretAccessKey: 'SECRET456',
    });
  });

  it('parses S3 URLs with url-encoded credentials', () => {
    expect(parseS3Url('s3://AKIA%2B123:SECRET%2F456@bucket/key')).toEqual({
      Bucket: 'bucket',
      Key: 'key',
      accessKeyId: 'AKIA+123',
      secretAccessKey: 'SECRET/456',
    });
  });

  it('creates a new S3 client if credentials are provided', () => {
    const client1 = getS3Client();
    const client2 = getS3Client(undefined, undefined, 'ak', 'sk');
    expect(client2).not.toBe(client1);
  });

  it('parses S3 URLs with only accessKeyId', () => {
    expect(parseS3Url('s3://AKIA123@bucket-name/some/key.json')).toEqual({
      Bucket: 'bucket-name',
      Key: 'some/key.json',
      accessKeyId: 'AKIA123',
    });
  });

  it('parses S3 URLs with only secretAccessKey (should not set accessKeyId)', () => {
    expect(parseS3Url('s3://:SECRET456@bucket-name/some/key.json')).toEqual({
      Bucket: 'bucket-name',
      Key: 'some/key.json',
      secretAccessKey: 'SECRET456',
    });
  });

  it('returns null for S3 URLs with missing bucket', () => {
    expect(parseS3Url('s3:///some/key.json')).toEqual({
      Bucket: '',
      Key: 'some/key.json',
    });
  });

  it('creates a new S3 client if only one credential is provided', () => {
    const client1 = getS3Client();
    const client2 = getS3Client(undefined, undefined, 'ak', undefined);
    expect(client2).not.toBe(client1);
    const client3 = getS3Client(undefined, undefined, undefined, 'sk');
    expect(client3).not.toBe(client1);
  });

  it('returns singleton if credentials are not provided', () => {
    const client1 = getS3Client();
    const client2 = getS3Client();
    expect(client1).toBe(client2);
  });

  it('creates a new S3 client if credentials differ from previous', () => {
    const client1 = getS3Client(undefined, undefined, 'ak1', 'sk1');
    const client2 = getS3Client(undefined, undefined, 'ak2', 'sk2');
    expect(client1).not.toBe(client2);
  });
});
