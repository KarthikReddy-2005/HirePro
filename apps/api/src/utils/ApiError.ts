class ApiError extends Error {
  success: boolean;
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
  }
}

export default ApiError;
