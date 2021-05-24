import { RequestHandler } from 'express';

export function checkAuth(token: string): RequestHandler {
    return (req, res, next) => {
        if (req.headers.authorization !== token) {
            res.send(401);
            return;
        }
        next();
    };
}
