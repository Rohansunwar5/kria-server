declare namespace Express {
  export interface Request {
    // Player auth
    player: {
      _id: string;
    };
    // Organizer auth
    organizer: {
      _id: string;
      role: string;
    };
    access_token: string | null;
  }
}
