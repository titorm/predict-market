export class SefazIngestionError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 422) {
    super(message);
    this.name = 'SefazIngestionError';
    this.statusCode = statusCode;
  }
}
