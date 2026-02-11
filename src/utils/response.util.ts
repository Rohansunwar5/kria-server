/**
 * Success response wrapper for consistent API responses
 */
export class SuccessResponse<T> {
    public success = true;
    public message: string;
    public data?: T;

    constructor(message: string, data?: T) {
        this.message = message;
        this.data = data;
    }
}

/**
 * Helper function to create success response
 */
export const successResponse = <T>(message: string, data?: T) => {
    return new SuccessResponse(message, data);
};
