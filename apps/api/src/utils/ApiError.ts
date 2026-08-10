class ApiError extends Error {
  success: boolean;
  statusCode: number;
  data: unknown;

  constructor(statusCode: number, message: string, data: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.data = data;
  }
}

export default ApiError;
