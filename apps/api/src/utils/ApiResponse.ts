class ApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: unknown;

  constructor(statusCode: number, message: string, data: unknown = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}
export default ApiResponse;
